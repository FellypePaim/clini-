import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    // Autenticação via JWT do usuário
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return json({ error: "Não autorizado" }, 401)
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    )
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (userError || !user) {
      return json({ error: "Usuário inválido" }, 401)
    }

    // Buscar clinica_id do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinica_id, role")
      .eq("id", user.id)
      .single()

    const clinicaId = profile?.clinica_id
    if (!clinicaId) {
      return json({ error: "Clínica não encontrada" }, 400)
    }

    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL")!
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY")!
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!

    const { action, payload } = await req.json()

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: CRIAR INSTÂNCIA
    // ─────────────────────────────────────────────────────────────
    if (action === "criar_instancia") {
      // Gerar nome único para a instância: slug da clínica + random
      const { data: clinica, error: clinicaErr } = await supabase
        .from("clinicas")
        .select("nome")
        .eq("id", clinicaId)
        .single()
      if (clinicaErr) console.error("Erro ao buscar clínica:", clinicaErr.message)

      const slug = (clinica?.nome ?? "clinica")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 20)

      const nomeInstancia = `${slug}-${Date.now().toString(36)}`

      // Criação na Evolution API
      const evResp = await fetch(`${evolutionUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolutionKey,
        },
        body: JSON.stringify({
          instanceName: nomeInstancia,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })

      if (!evResp.ok) {
        const err = await evResp.text()
        throw new Error(`Evolution API erro: ${err}`)
      }

      const evData = await evResp.json()
      const qrCode = evData.qrcode?.base64 ?? null

      // Salvar no banco
      const { data: instancia, error: dbErr } = await supabase
        .from("whatsapp_instancias")
        .insert({
          clinica_id: clinicaId,
          nome_instancia: nomeInstancia,
          status: qrCode ? "qr_pending" : "connecting",
          qr_code_base64: qrCode,
        })
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)

      // Configurar webhook automaticamente
      const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`
      await fetch(`${evolutionUrl}/webhook/set/${nomeInstancia}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": evolutionKey },
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
        }),
      })

      await supabase
        .from("whatsapp_instancias")
        .update({ webhook_configurado: true })
        .eq("id", instancia.id)

      return json({ success: true, instancia, qr_code: qrCode })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: OBTER QR CODE ATUALIZADO
    // ─────────────────────────────────────────────────────────────
    if (action === "obter_qrcode") {
      const { instancia_id } = payload

      const { data: instancia, error: instErr } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("clinica_id", clinicaId)
        .single()

      if (instErr || !instancia) return json({ error: "Instância não encontrada" }, 404)

      const evResp = await fetch(
        `${evolutionUrl}/instance/connect/${instancia.nome_instancia}`,
        { headers: { "apikey": evolutionKey } }
      )

      if (!evResp.ok) {
        return json({ error: "Erro ao buscar QR Code" }, 500)
      }

      const evData = await evResp.json()
      const qrCode = evData.base64 ?? evData.qrcode?.base64 ?? null

      if (qrCode) {
        await supabase
          .from("whatsapp_instancias")
          .update({ qr_code_base64: qrCode, status: "qr_pending" })
          .eq("id", instancia_id)
      }

      return json({ qr_code: qrCode, status: instancia.status })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: VERIFICAR STATUS
    // ─────────────────────────────────────────────────────────────
    if (action === "verificar_status") {
      const { instancia_id } = payload

      const { data: instancia, error: instErr } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("clinica_id", clinicaId)
        .single()

      if (instErr || !instancia) return json({ error: "Instância não encontrada" }, 404)

      const evResp = await fetch(
        `${evolutionUrl}/instance/connectionState/${instancia.nome_instancia}`,
        { headers: { "apikey": evolutionKey } }
      )

      if (!evResp.ok) return json({ status: instancia.status })

      const evData = await evResp.json()
      const evStatus = evData.instance?.state ?? evData.state ?? "disconnected"

      // Mapear status Evolution → nosso status
      const statusMap: Record<string, string> = {
        "open": "connected",
        "close": "disconnected",
        "connecting": "connecting",
        "qr": "qr_pending",
      }

      const novoStatus = statusMap[evStatus] ?? "disconnected"
      const numeroConectado = evData.instance?.profilePictureUrl ? null : null

      // Buscar número conectado se conectado
      let numero = instancia.numero_conectado
      if (novoStatus === "connected" && !instancia.numero_conectado) {
        const profileResp = await fetch(
          `${evolutionUrl}/instance/fetchInstances`,
          { headers: { "apikey": evolutionKey } }
        )
        if (profileResp.ok) {
          const instances = await profileResp.json()
          const thisInstance = (instances as any[]).find(
            (i: any) => i.name === instancia.nome_instancia
          )
          numero = thisInstance?.instance?.owner?.split("@")[0] ?? null
        }
      }

      await supabase
        .from("whatsapp_instancias")
        .update({
          status: novoStatus,
          numero_conectado: numero,
          qr_code_base64: novoStatus === "connected" ? null : instancia.qr_code_base64,
          updated_at: new Date().toISOString(),
        })
        .eq("id", instancia_id)

      return json({ status: novoStatus, numero_conectado: numero })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: DESCONECTAR / DELETAR INSTÂNCIA
    // ─────────────────────────────────────────────────────────────
    if (action === "desconectar") {
      const { instancia_id } = payload

      const { data: instancia, error: instErr } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("clinica_id", clinicaId)
        .single()

      if (instErr || !instancia) return json({ error: "Instância não encontrada" }, 404)

      // Desconectar na Evolution API
      await fetch(`${evolutionUrl}/instance/logout/${instancia.nome_instancia}`, {
        method: "DELETE",
        headers: { "apikey": evolutionKey },
      }).catch(() => {}) // Não falhar se a Evolution não responder

      await supabase
        .from("whatsapp_instancias")
        .update({ status: "disconnected", numero_conectado: null })
        .eq("id", instancia_id)

      return json({ success: true })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: EXCLUIR INSTÂNCIA (desconecta + remove do banco)
    // ─────────────────────────────────────────────────────────────
    if (action === "excluir_instancia") {
      const { instancia_id } = payload

      const { data: instancia, error: instErr } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("clinica_id", clinicaId)
        .single()

      if (instErr || !instancia) return json({ error: "Instância não encontrada" }, 404)

      // Desconectar e deletar na Evolution API
      try {
        await fetch(`${evolutionUrl}/instance/logout/${instancia.nome_instancia}`, {
          method: "DELETE",
          headers: { "apikey": evolutionKey },
        })
        await fetch(`${evolutionUrl}/instance/delete/${instancia.nome_instancia}`, {
          method: "DELETE",
          headers: { "apikey": evolutionKey },
        })
      } catch { /* Evolution pode já não ter a instância */ }

      // Remover do banco
      await supabase.from("whatsapp_instancias").delete().eq("id", instancia_id)

      return json({ success: true })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: RECONECTAR INSTÂNCIA (gera novo QR code)
    // ─────────────────────────────────────────────────────────────
    if (action === "reconectar") {
      const { instancia_id } = payload

      const { data: instancia, error: instErr } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("clinica_id", clinicaId)
        .single()

      if (instErr || !instancia) return json({ error: "Instância não encontrada" }, 404)

      // Tentar restart na Evolution API
      try {
        await fetch(`${evolutionUrl}/instance/restart/${instancia.nome_instancia}`, {
          method: "PUT",
          headers: { "apikey": evolutionKey },
        })
      } catch { /* ignore */ }

      // Buscar novo QR code
      const qrResp = await fetch(
        `${evolutionUrl}/instance/connect/${instancia.nome_instancia}`,
        { headers: { "apikey": evolutionKey } }
      )
      let qrCode = null
      if (qrResp.ok) {
        const qrData = await qrResp.json()
        qrCode = qrData.base64 ?? qrData.code ?? null
      }

      await supabase
        .from("whatsapp_instancias")
        .update({
          status: qrCode ? "qr_pending" : "connecting",
          qr_code_base64: qrCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", instancia_id)

      return json({ success: true, qr_code: qrCode, status: qrCode ? "qr_pending" : "connecting" })
    }

    // ─────────────────────────────────────────────────────────────
    // AÇÃO: LISTAR INSTÂNCIAS DA CLÍNICA
    // ─────────────────────────────────────────────────────────────
    if (action === "listar") {
      const { data: instancias } = await supabase
        .from("whatsapp_instancias")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      return json({ instancias: instancias ?? [] })
    }

    return json({ error: "Ação inválida" }, 400)

  } catch (error: any) {
    console.error("whatsapp-manager error:", error)
    return json({ error: error.message }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  })
}
