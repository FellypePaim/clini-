import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { numero, texto, tipo, clinica_id, url_midia } = await req.json()

    if (!numero || !clinica_id) {
       throw new Error("Campos 'numero' e 'clinica_id' são obrigatórios.")
    }

    const apiUrl = Deno.env.get("EVOLUTION_API_URL")
    const apiKey = Deno.env.get("EVOLUTION_API_KEY")
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "prontuario-verde"

    if (!apiUrl || !apiKey) {
      throw new Error("Configurações da Evolution API não encontradas nos Secrets.")
    }

    let endpoint = ""
    let body: any = {
      number: numero.replace(/\D/g, ""), // Limpa fone
      options: { delay: 1200, presence: "composing" }
    }

    // Identificar tipo e configurar o payload para a Evolution API
    switch (tipo) {
      case "imagem":
        endpoint = "sendMedia"
        body.mediaMessage = {
          media: url_midia || "",
          caption: texto || "",
          mediaType: "image"
        }
        break
      case "pdf":
      case "documento":
        endpoint = "sendMedia"
        body.mediaMessage = {
          media: url_midia || "",
          caption: texto || "",
          mediaType: "document"
        }
        break
      case "texto":
      default:
        endpoint = "sendText"
        body.textMessage = { text: texto || "" }
        break
    }

    const fullUrl = `${apiUrl}/message/${endpoint}/${instance}`
    console.log(`Sending to Evolution API: ${fullUrl}`)

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    console.log("Evolution API Response:", JSON.stringify(data, null, 2))

    if (!response.ok) {
       throw new Error(`Erro na Evolution API: ${data.message || response.statusText}`)
    }

    return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("whatsapp-send Error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
