import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { numero, texto, tipo, clinica_id, url_midia } = await req.json()
    if (!numero || !clinica_id) throw new Error("Campos 'numero' e 'clinica_id' obrigatórios.")

    const apiUrl = Deno.env.get("EVOLUTION_API_URL")
    const apiKey = Deno.env.get("EVOLUTION_API_KEY")
    if (!apiUrl || !apiKey) throw new Error("Evolution API não configurada nos Secrets.")

    // Buscar instância ativa da clínica no banco (dinâmica, não hardcoded)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: inst } = await supabase
      .from("whatsapp_instancias")
      .select("nome_instancia")
      .eq("clinica_id", clinica_id)
      .eq("status", "connected")
      .limit(1)
      .single()

    // Fallback para EVOLUTION_INSTANCE se não encontrar no banco
    const instanceName = inst?.nome_instancia || Deno.env.get("EVOLUTION_INSTANCE")
    if (!instanceName) throw new Error("Nenhuma instância WhatsApp conectada para esta clínica.")

    const cleanNumber = numero.replace(/\D/g, "")
    let endpoint = ""
    let body: any = {
      number: cleanNumber,
      options: { delay: 1200, presence: "composing" }
    }

    switch (tipo) {
      case "imagem":
        endpoint = "sendMedia"
        body.mediaMessage = { media: url_midia || "", caption: texto || "", mediaType: "image" }
        break
      case "pdf":
      case "documento":
        endpoint = "sendMedia"
        body.mediaMessage = { media: url_midia || "", caption: texto || "", mediaType: "document" }
        break
      case "texto":
      default:
        endpoint = "sendText"
        body.textMessage = { text: texto || "" }
        break
    }

    const fullUrl = `${apiUrl}/message/${endpoint}/${instanceName}`
    console.log(`[whatsapp-send] ${endpoint} → ${instanceName} → ${cleanNumber}`)

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`Evolution API: ${data.message || response.statusText}`)

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("whatsapp-send Error:", error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
