import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Autenticação (Webhooks externos da Evolution API)
    const apiKey = req.headers.get("apikey") ?? 
                   req.headers.get("x-api-key") ??
                   req.headers.get("authorization")?.replace("Bearer ", "")

    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY") ?? ""

    if (apiKey && apiKey !== evolutionKey && apiKey.length < 100) {
      return new Response("Unauthorized", { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    const payload = await req.json()
    console.log("Webhook received:", JSON.stringify(payload, null, 2))

    // ── Identificar instância e clínica ──────────────────────────────────────
    const instanceName = payload.instance ?? payload.instanceName ?? ""

    // Tratar evento de atualização de conexão (sincronizar status)
    if (payload.event === "connection.update" || payload.event === "CONNECTION_UPDATE") {
      const state = payload.data?.state ?? payload.data?.connection ?? ""
      const statusMap: Record<string, string> = {
        open: "connected", close: "disconnected", connecting: "connecting"
      }
      const novoStatus = statusMap[state.toLowerCase()] ?? "disconnected"
      if (instanceName) {
        await supabase
          .from("whatsapp_instancias")
          .update({ status: novoStatus, updated_at: new Date().toISOString() })
          .eq("nome_instancia", instanceName)
      }
      return new Response(JSON.stringify({ ok: true, status_sync: novoStatus }), { headers: { "Content-Type": "application/json" } })
    }

    // Validar evento de mensagem
    if (payload.event !== "messages.upsert") {
      return new Response(JSON.stringify({ skipped: true, reason: "Not messages.upsert" }), { headers: { "Content-Type": "application/json" } })
    }

    const msgData = payload.data
    const message = msgData.message
    const key = msgData.key
    const remoteJid = key.remoteJid
    const fromMe = key.fromMe

    // Ignorar mensagens enviadas pela própria clínica para evitar loop
    if (fromMe) {
      return new Response(JSON.stringify({ skipped: true, reason: "fromMe: true" }), { headers: { "Content-Type": "application/json" } })
    }

    // Ignorar mensagens de grupos (contém @g.us)
    if (remoteJid.includes("@g.us")) {
      return new Response(JSON.stringify({ skipped: true, reason: "Group message" }), 
        { headers: { "Content-Type": "application/json" } })
    }

    const whatsappNumber = remoteJid.split("@")[0]

    // Extrair texto da mensagem
    const textContent = message.conversation || 
                       message.extendedTextMessage?.text || 
                       message.imageMessage?.caption || 
                       message.videoMessage?.caption || 
                       ""

    if (!textContent && !message.audioMessage) {
      return new Response(JSON.stringify({ skipped: true, reason: "No text content" }), { headers: { "Content-Type": "application/json" } })
    }

    console.log("1. Número extraído:", whatsappNumber)
    console.log("2. Texto da mensagem:", textContent)
    console.log("2b. Instância:", instanceName)

    // ─── Rotear para a clínica correta via nome da instância ─────────────────
    let clinica_id: string | null = null

    if (instanceName) {
      // Multi-tenant: buscar clínica pela instância cadastrada
      const { data: instancia } = await supabase
        .from("whatsapp_instancias")
        .select("clinica_id")
        .eq("nome_instancia", instanceName)
        .eq("ativo", true)
        .single()
      clinica_id = instancia?.clinica_id ?? null
    }

    // Fallback: env var CLINICA_ID para ambiente de dev/testes
    if (!clinica_id) {
      clinica_id = Deno.env.get("CLINICA_ID") ?? null
    }

    // Último fallback: primeira clínica (dev)
    if (!clinica_id) {
      const { data: prim } = await supabase.from("clinicas").select("id").limit(1).single()
      clinica_id = prim?.id ?? null
    }

    if (!clinica_id) {
      console.error("Nenhuma clínica mapeada para a instância:", instanceName)
      return new Response(JSON.stringify({ error: "clinica_id not found" }), { status: 400, headers: { "Content-Type": "application/json" } })
    }

    console.log("3. Clinica ID:", clinica_id)

    // -------------------------------------------------------------------------
    // 3. RECUPERAR/CRIAR CONVERSA E SALVAR MENSAGEM DO PACIENTE (CONTEXTO)
    // -------------------------------------------------------------------------
    const conversaId = await getOuCriarConversaId(supabase, clinica_id, whatsappNumber)
    
    await supabase.from("ovyva_mensagens").insert({
      conversa_id: conversaId,
      remetente: "paciente",
      conteudo: textContent,
      tipo: "texto"
    })

    // -------------------------------------------------------------------------
    // 4. CHAMAR AI GATEWAY (OVYVA_RESPOND)
    // -------------------------------------------------------------------------
    console.log("4. Chamando ai-gateway...")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const gatewayUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`
    const gatewayResp = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        action: "ovyva_respond",
        clinica_id,
        payload: {
          numero_whatsapp: whatsappNumber,
          mensagem_atual: textContent || "[Áudio/Mídia não processado]"
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!gatewayResp.ok) {
       const err = await gatewayResp.text()
       throw new Error(`AI Gateway error: ${err}`)
    }

    const { data: aiData } = await gatewayResp.json()
    console.log("5. Resposta ai-gateway:", JSON.stringify(aiData))
    const { resposta: textoResposta } = aiData

    // -------------------------------------------------------------------------
    // 6. ENVIAR RESPOSTA DIVIDIDA VIA EVOLUTION API
    // -------------------------------------------------------------------------
    // Dividir mensagens longas ou com quebras de linha duplas (\n\n) em várias mensagens
    const partesMensagem = textoResposta.split(/\n\n+/).filter((m: string) => m.trim().length > 0)
    
    console.log("6. Enviando para Evolution:", whatsappNumber, `(${partesMensagem.length} partes)`)
    
    const evolutionUrl = `${Deno.env.get("EVOLUTION_API_URL")}/message/sendText/${Deno.env.get("EVOLUTION_INSTANCE") || "prontuario-verde"}`
    
    for (const parte of partesMensagem) {
        // Enviar via Evolution API
        const evolutionResp = await fetch(evolutionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": Deno.env.get("EVOLUTION_API_KEY")!
            },
            body: JSON.stringify({
                number: whatsappNumber,
                text: parte,
                options: { delay: 1000, presence: "composing" }
            })
        })

        if (evolutionResp.ok) {
            // Salvar cada parte no banco como mensagem da IA
            await supabase.from("ovyva_mensagens").insert({
                conversa_id: conversaId,
                remetente: "ia",
                conteudo: parte,
                tipo: "texto"
            })
            console.log("7. Parte enviada com sucesso:", evolutionResp.status)
        } else {
            const err = await evolutionResp.text()
            console.error("Erro ao enviar parte para Evolution:", err)
        }
        
        // Pequeno delay entre partes para naturalidade
        if (partesMensagem.length > 1) await new Promise(r => setTimeout(r, 1500))
    }

    console.log("8. Fluxo completo concluído!")
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })

  } catch (error) {
    console.error("Webhook Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})

async function getOuCriarConversaId(supabase: any, clinica_id: string, phone: string) {
    // Busca existente
    const { data } = await supabase.from("ovyva_conversas")
      .select("id")
      .eq("clinica_id", clinica_id)
      .eq("contato_telefone", phone)
      .single()
    
    if (data?.id) return data.id

    // Cria nova se não existir
    const { data: nova, error } = await supabase.from("ovyva_conversas").insert({
        clinica_id,
        contato_telefone: phone,
        status: "ia_ativa"
    }).select("id").single()

    if (error) {
        console.error("Erro ao criar conversa:", error)
        throw error
    }
    return nova.id
}
