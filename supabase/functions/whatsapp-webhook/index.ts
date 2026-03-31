import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const apiKey = req.headers.get("apikey") ?? 
                   req.headers.get("x-api-key") ??
                   req.headers.get("authorization")?.replace("Bearer ", "")

    const evolutionKey = (Deno.env.get("EVOLUTION_API_KEY") ?? "").trim()
    if (!evolutionKey || !apiKey || apiKey !== evolutionKey) {
      return new Response("Unauthorized", { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    const payload = await req.json()
    const instanceName = payload.instance ?? payload.instanceName ?? ""

    if (payload.event === "connection.update" || payload.event === "CONNECTION_UPDATE") {
      const state = payload.data?.state ?? payload.data?.connection ?? ""
      const novoStatus = state === "open" ? "connected" : "disconnected"
      if (instanceName) {
        await supabase.from("whatsapp_instancias").update({ status: novoStatus }).eq("nome_instancia", instanceName)
      }
      return new Response("ok")
    }

    if (payload.event !== "messages.upsert") return new Response("skipped")

    const msgData = payload.data
    const message = msgData.message
    const key = msgData.key
    const remoteJid = key.remoteJid
    const fromMe = key.fromMe

    if (fromMe || remoteJid.includes("@g.us")) return new Response("skipped")

    const messageId = key.id  // ID único da mensagem na Evolution
    const whatsappNumber = remoteJid.split("@")[0]
    const pushName = msgData.pushName || payload.data?.pushName || null
    let textContent = message.conversation || message.extendedTextMessage?.text ||
                      message.imageMessage?.caption || message.videoMessage?.caption || ""

    let mediaBase64 = null
    let mediaMimeType = null

    // 1. Identificar Clínica
    const { data: inst, error: instErr } = await supabase.from("whatsapp_instancias").select("clinica_id").eq("nome_instancia", instanceName).single()
    if (instErr || !inst?.clinica_id) {
      console.error("Instância não encontrada para:", instanceName, instErr?.message)
      return new Response("clinica not found", { status: 404 })
    }
    const clinica_id = inst.clinica_id

    // 2. Tratar Áudio ou Imagem
    if (!textContent && message.audioMessage) {
        mediaBase64 = await downloadMedia(instanceName, key)
        mediaMimeType = message.audioMessage.mimetype || "audio/ogg"
        
        // Transcrever áudio imediatamente
        const transcribeResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
            body: JSON.stringify({ action: "transcribe_audio", clinica_id, payload: { audio_base64: mediaBase64, mime_type: mediaMimeType } })
        })
        if (transcribeResp.ok) {
            const { data: tData } = await transcribeResp.json()
            textContent = tData.transcricao
        }
    } else if (message.imageMessage) {
        mediaBase64 = await downloadMedia(instanceName, key)
        mediaMimeType = message.imageMessage.mimetype || "image/jpeg"
    }

    if (!textContent && !mediaBase64) return new Response("empty")

    // 3. Registrar Mensagem e Conversa
    const conversaId = await getOuCriarConversaId(supabase, clinica_id, whatsappNumber, pushName)
    if (!conversaId) return new Response("Falha ao criar/buscar conversa", { status: 500 })

    // Atualizar nome do contato se temos pushName e ainda não tem
    if (pushName && conversaId) {
      await supabase.from("lyra_conversas")
        .update({ contato_nome: pushName, ultimo_contato: new Date().toISOString() })
        .eq("id", conversaId)
        .is("contato_nome", null)
    }

    // Deduplicação simples: mesma conversa + mesmo texto + últimos 60s
    const umMinutoAtras = new Date(Date.now() - 60000).toISOString()
    const { count: duplicateCount } = await supabase.from("lyra_mensagens")
      .select("id", { count: "exact", head: true })
      .eq("conversa_id", conversaId)
      .eq("remetente", "paciente")
      .eq("conteudo", textContent || "[Imagem enviada]")
      .gte("created_at", umMinutoAtras)

    if ((duplicateCount ?? 0) > 0) {
      console.log(`[webhook] Mensagem duplicada ignorada: "${textContent?.substring(0,30)}"`)
      return new Response(JSON.stringify({ success: true, duplicate: true }))
    }

    // Salvar mensagem
    await supabase.from("lyra_mensagens").insert({
      conversa_id: conversaId,
      remetente: "paciente",
      conteudo: textContent || "[Imagem enviada]",
      tipo: message.imageMessage ? "imagem" : "texto",
    })

    // 3.5 Verificar status da conversa
    const { data: conversa } = await supabase
      .from("lyra_conversas")
      .select("status")
      .eq("id", conversaId)
      .single()

    // Se humano assumiu ou conversa resolvida, NÃO chamar IA
    if (conversa?.status === "atendido_humano" || conversa?.status === "resolvido") {
      console.log(`[webhook] IA pausada para conversa ${conversaId} (status: ${conversa.status})`)
      return new Response(JSON.stringify({ success: true, ia_skipped: true }))
    }

    // 4. Chamar Resposta da IA
    let textoResposta = ""
    try {
      const gatewayResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({
          action: "lyra_respond",
          clinica_id,
          payload: {
            numero_whatsapp: whatsappNumber,
            mensagem_atual: textContent || "[Análise de Imagem]",
            image_base64: message.imageMessage ? mediaBase64 : null,
            mime_type: mediaMimeType
          }
        })
      })

      if (!gatewayResp.ok) {
        const errBody = await gatewayResp.text().catch(() => "unknown")
        console.error(`[webhook] AI Gateway ${gatewayResp.status}: ${errBody}`)
        textoResposta = "Desculpe, estou com uma instabilidade momentânea. Pode repetir sua mensagem em alguns segundos?"
      } else {
        const { data: aiData } = await gatewayResp.json()
        textoResposta = aiData?.resposta || "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?"
      }
    } catch (aiErr: any) {
      console.error("[webhook] AI call error:", aiErr.message)
      textoResposta = "Desculpe, estou com uma instabilidade momentânea. Pode repetir sua mensagem em alguns segundos?"
    }

    // 5. Enviar Resposta (sempre envia algo, mesmo se IA falhou)
    const partes = textoResposta.split(/\n\n+/).filter((m: string) => m.trim().length > 0)
    const evolutionUrl = `${Deno.env.get("EVOLUTION_API_URL")}/message/sendText/${instanceName}`

    for (const parte of partes) {
        try {
          await fetch(evolutionUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", "apikey": evolutionKey },
              body: JSON.stringify({ number: whatsappNumber, text: parte, options: { delay: 1000, presence: "composing" } })
          })
        } catch (sendErr: any) {
          console.error("[webhook] Send error:", sendErr.message)
        }
        await supabase.from("lyra_mensagens").insert({ conversa_id: conversaId, remetente: "ia", conteudo: parte })
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })

  } catch (err: any) {
    console.error("[webhook] Fatal error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})

async function getOuCriarConversaId(supabase: any, clinica_id: string, phone: string, pushName?: string | null) {
    const { data } = await supabase.from("lyra_conversas").select("id").eq("clinica_id", clinica_id).eq("contato_telefone", phone).single()
    if (data?.id) return data.id

    // Criar conversa
    const { data: nova, error } = await supabase.from("lyra_conversas").insert({
      clinica_id, contato_telefone: phone, status: "ia_ativa",
      contato_nome: pushName || null,
    }).select("id").single()
    if (error || !nova) { console.error("Erro ao criar conversa:", error); return null }

    // Criar lead no CRM automaticamente (novo contato = lead)
    // Verificar se já existe lead com esse telefone nesta clínica
    const { data: leadExistente } = await supabase.from("leads")
      .select("id").eq("clinica_id", clinica_id).eq("telefone", phone).limit(1).single()

    if (!leadExistente) {
      const { error: leadErr } = await supabase.from("leads").insert({
        clinica_id,
        nome: pushName || `Contato ${phone}`,
        telefone: phone,
        estagio: "perguntou_valor",
        origem: "WhatsApp LYRA",
        conversa_id: nova.id,
        ultimo_contato: new Date().toISOString(),
      })
      if (leadErr) console.error("[webhook] Erro ao criar lead:", JSON.stringify(leadErr))
      else console.log(`[webhook] Lead criado para ${phone}`)
    } else {
      // Atualizar conversa_id do lead existente
      await supabase.from("leads").update({ conversa_id: nova.id }).eq("id", leadExistente.id)
      console.log(`[webhook] Lead existente vinculado: ${leadExistente.id}`)
    }

    return nova.id
}

async function downloadMedia(instanceName: string, messageKey: any) {
    const url = `${Deno.env.get("EVOLUTION_API_URL")}/message/getBase64FromMediaMessage/${instanceName}`
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": Deno.env.get("EVOLUTION_API_KEY")! },
        body: JSON.stringify({ message: { key: messageKey } })
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.base64 || null
}
