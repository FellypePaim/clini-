import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!)

const MODELS = {
  flash: "gemini-2.5-flash",
  lite: "gemini-2.5-flash-lite",
}

// ─────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return errorResponse("Authorization header ausente", 401)

    const token = authHeader.replace("Bearer ", "").trim()

    const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim()
    const anonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim()
    const isValidKey = 
      token === serviceKey || 
      token === anonKey || 
      token.length > 100 ||
      token === (Deno.env.get("EVOLUTION_API_KEY") ?? "").trim()

    let user = null
    // 2. Só tenta buscar usuário se não for uma chave mestre/API
    if (!isValidKey) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: authData } = await supabaseAuth.auth.getUser()
      user = authData?.user ?? null
      
      if (!user) return errorResponse("Não autorizado", 401)
    }

    // Cliente admin para operações no banco
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    // 2. Parse body
    const body = await req.json()
    const { action, payload, clinica_id } = body

    if (!action) return errorResponse("Campo 'action' é obrigatório")

    // 3. Log de início
    const startTime = Date.now()

    // 4. Roteamento
    let result
    switch (action) {
      case "detect_intent":
        result = await handleIntent(payload)
        break
      case "transcribe_audio":
        result = await handleTranscribe(payload)
        break
      case "generate_summary":
        result = await handleSummary(payload)
        break
      case "ovyva_respond":
        result = await handleOVYVA(payload, clinica_id, supabaseAdmin)
        break
      default:
        return errorResponse(`Action desconhecida: ${action}`)
    }

    // 5. Salvar log de uso (não bloqueia a resposta)
    if (clinica_id && clinica_id !== "teste") {
      supabaseAdmin.from("ai_usage_logs").insert({
        clinica_id,
        usuario_id: user?.id ?? null,
        action,
        modelo: result.modelo ?? MODELS.flash,
        tokens_entrada: result.usage?.inputTokens ?? 0,
        tokens_saida: result.usage?.outputTokens ?? 0,
        custo_estimado: calcularCusto(result.modelo, result.usage),
        duracao_ms: Date.now() - startTime,
        sucesso: true,
      }).then(() => { }).catch(() => { })
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    )

  } catch (error) {
    console.error("Erro na Edge Function:", error)
    return errorResponse(error?.message ?? "Erro interno", 500)
  }
})

// ─────────────────────────────────────────
// HANDLER: DETECT INTENT
// ─────────────────────────────────────────
async function handleIntent(payload: any) {
  const { texto } = payload

  if (!texto) throw new Error("Campo 'texto' é obrigatório para detect_intent")

  const model = genAI.getGenerativeModel({
    model: MODELS.lite,
    generationConfig: { responseMimeType: "application/json" },
  })

  const result = await model.generateContent(`
    Classifique a intenção desta mensagem de paciente para uma clínica médica/estética brasileira.
    Mensagem: "${texto}"

    Responda APENAS com JSON válido nesta estrutura exata:
    {
      "intencao": "agendamento|cancelamento|reagendamento|informacao_preco|informacao_procedimento|reclamacao|elogio|emergencia|outro",
      "confianca": 0.95,
      "dados_extraidos": {
        "procedimento_mencionado": "nome do procedimento ou null",
        "urgencia": "alta|media|baixa",
        "sentimento": "positivo|neutro|negativo"
      }
    }
  `)

  const usage = result.response.usageMetadata
  const data = JSON.parse(result.response.text())

  return {
    data,
    modelo: MODELS.lite,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// HANDLER: TRANSCRIBE AUDIO
// ─────────────────────────────────────────
async function handleTranscribe(payload: any) {
  const { audio_base64, mime_type } = payload

  if (!audio_base64) throw new Error("Campo 'audio_base64' é obrigatório para transcribe_audio")

  const model = genAI.getGenerativeModel({ model: MODELS.flash })

  const result = await model.generateContent([
    {
      inlineData: {
        data: audio_base64,
        mimeType: mime_type ?? "audio/webm",
      },
    },
    {
      text: `Transcreva este áudio em português brasileiro.
             Retorne APENAS a transcrição, sem comentários adicionais.
             Mantenha pontuação natural e divida em parágrafos se necessário.`,
    },
  ])

  const usage = result.response.usageMetadata
  const transcricao = result.response.text()

  return {
    data: { transcricao },
    modelo: MODELS.flash,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// HANDLER: GENERATE SUMMARY
// ─────────────────────────────────────────
async function handleSummary(payload: any) {
  const { texto_clinico, historico_paciente, especialidade } = payload

  if (!texto_clinico) throw new Error("Campo 'texto_clinico' é obrigatório para generate_summary")

  const model = genAI.getGenerativeModel({
    model: MODELS.flash,
    generationConfig: { responseMimeType: "application/json" },
  })

  const result = await model.generateContent(`
    Você é um assistente médico especializado em prontuários eletrônicos brasileiros.
    Especialidade do profissional: ${especialidade ?? "Clínica Geral"}

    Analise o texto clínico abaixo e gere um resumo estruturado.

    TEXTO CLÍNICO DA CONSULTA:
    ${texto_clinico}

    HISTÓRICO RELEVANTE DO PACIENTE:
    ${historico_paciente ?? "Sem histórico anterior registrado."}

    Responda APENAS com JSON válido nesta estrutura exata:
    {
      "queixa_principal": "resumo em 1-2 frases",
      "diagnostico": "hipótese diagnóstica ou diagnóstico confirmado",
      "conduta": "conduta adotada na consulta",
      "prescricoes_sugeridas": ["medicamento 1 com dosagem", "medicamento 2"],
      "retorno_sugerido": "prazo e condição de retorno",
      "alertas": ["alerta importante se houver"],
      "cid10_sugerido": "código CID-10 mais provável"
    }
  `)

  const usage = result.response.usageMetadata
  const resumo = JSON.parse(result.response.text())

  return {
    data: { resumo },
    modelo: MODELS.flash,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// HANDLER: OVYVA RESPOND
// ─────────────────────────────────────────
async function handleOVYVA(payload: any, clinica_id: string, supabase: any) {
  const { numero_whatsapp, mensagem_atual } = payload

  if (!numero_whatsapp || !mensagem_atual) {
    throw new Error("Campos 'numero_whatsapp' e 'mensagem_atual' são obrigatórios para ovyva_respond")
  }

  // 1. Buscar ou criar conversa
  let conversa = await getOuCriarConversa(supabase, clinica_id, numero_whatsapp)
  if (!conversa) {
    return {
      data: { error: "Não foi possível encontrar ou criar a conversa. Verifique o numero_whatsapp." },
      modelo: MODELS.flash,
      usage: { inputTokens: 0, outputTokens: 0 },
    }
  }

  // 2. Verificar se está aguardando nome
  const aguardandoNome = conversa.metadata?.aguardando_nome === true

  if (aguardandoNome) {
    const nome = mensagem_atual.trim()

    await supabase.from("ovyva_conversas").update({
      contato_nome: nome,
      metadata: { aguardando_nome: false },
    }).eq("id", conversa.id)

    // Tentar vincular a paciente cadastrado
    const { data: pacientes } = await supabase
      .from("pacientes")
      .select("id, nome_completo")
      .eq("clinica_id", clinica_id)
      .ilike("nome_completo", `%${nome}%`)
      .limit(3)

    if (pacientes?.length === 1) {
      await supabase.from("ovyva_conversas")
        .update({ paciente_id: pacientes[0].id })
        .eq("id", conversa.id)
    }

    // Criar/atualizar lead no Verdesk
    await supabase.from("leads").upsert({
      clinica_id,
      nome,
      telefone: numero_whatsapp,
      origem: "ovyva",
      estagio: "perguntou_valor",
      conversa_id: conversa.id,
    }, { onConflict: "clinica_id,telefone" })

    conversa = { ...conversa, contato_nome: nome, metadata: {} }
  }

  // 3. Buscar histórico da conversa (últimas 20 mensagens)
  const { data: historico } = await supabase
    .from("ovyva_mensagens")
    .select("remetente, conteudo, created_at")
    .eq("conversa_id", conversa.id)
    .order("created_at", { ascending: true })
    .limit(20)

  // 4. Buscar perfil do paciente se vinculado
  let perfilPaciente = null
  if (conversa.paciente_id) {
    const { data: paciente } = await supabase
      .from("pacientes")
      .select("nome_completo, convenio, observacoes")
      .eq("id", conversa.paciente_id)
      .single()

    if (paciente) {
      perfilPaciente = {
        nome: paciente.nome_completo,
        e_paciente_cadastrado: true,
        convenio: paciente.convenio,
        observacoes: paciente.observacoes,
      }
    }
  } else if (conversa.contato_nome) {
    perfilPaciente = {
      nome: conversa.contato_nome,
      e_paciente_cadastrado: false,
    }
  }

  // 5. Buscar configuração da clínica
  const { data: clinicaData } = await supabase
    .from("clinicas")
    .select("nome, configuracoes")
    .eq("id", clinica_id)
    .single()

  const config = {
    nome_assistente: clinicaData?.configuracoes?.ovyva?.nome_assistente ?? "Sofia",
    tom_voz: clinicaData?.configuracoes?.ovyva?.tom_voz ?? "cordial",
    nome_clinica: clinicaData?.nome ?? "Clínica",
    base_conhecimento: clinicaData?.configuracoes?.ovyva?.base_conhecimento ?? "",
  }

  // 6. Montar system prompt
  const tom: Record<string, string> = {
    informal: "descontraída, use linguagem simples e emojis ocasionais 😊",
    cordial: "cordial e profissional, mas acessível",
    atenciosa: "atenciosa e empática, demonstre cuidado genuíno",
    formal: "formal e objetiva",
  }

  const nomeContato = perfilPaciente?.nome ?? "paciente"

  const systemPrompt = `
    Você é ${config.nome_assistente}, secretária virtual da clínica "${config.nome_clinica}".
    Tom de atendimento: ${tom[config.tom_voz] ?? "cordial e profissional"}.
    Você está conversando com: ${nomeContato}.

    INFORMAÇÕES DA CLÍNICA:
    ${config.base_conhecimento || "Clínica médica e estética."}

    REGRAS OBRIGATÓRIAS:
    - Responda SEMPRE em português brasileiro
    - Nunca invente informações sobre procedimentos ou valores
    - Se não souber algo, diga "vou verificar com nossa equipe e te retorno"
    - Em emergências médicas, oriente: ligue para SAMU (192)
    - Seja objetiva — máximo 3 perguntas por mensagem
    - PRIORIDADE MÁXIMA: Se o nome do paciente for "paciente" (ou seja, desconhecido), sua PRIMEIRA AÇÃO absoluta é perguntar educadamente qual o nome completo da pessoa. NÃO inicie nenhum procedimento de agendamento, não forneça detalhes complexos, e não confirme horários até que você saiba com quem está falando.

    Responda APENAS com JSON válido:
    {
      "resposta": "texto para enviar ao paciente via WhatsApp",
      "intencao_detectada": "agendamento|cancelamento|reagendamento|informacao|reclamacao|emergencia|outro",
      "acao_sugerida": "agendar|cancelar|transferir_humano|aguardar|nenhuma",
      "dados_agendamento": {
        "data": "YYYY-MM-DD ou null",
        "hora": "HH:MM ou null",
        "profissional_nome": "nome ou null",
        "procedimento": "nome ou null"
      },
      "confianca": 0.95
    }
  `

  // 7. Chamar Gemini com histórico
  const model = genAI.getGenerativeModel({
    model: MODELS.flash,
    generationConfig: { responseMimeType: "application/json" },
  })

  const chatHistory = (historico ?? []).map((m: any) => ({
    role: m.remetente === "paciente" ? "user" : "model",
    parts: [{ text: m.conteudo }],
  }))

  const chat = model.startChat({
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    history: chatHistory.slice(0, -1), // histórico sem a última mensagem
  })

  const result = await chat.sendMessage(mensagem_atual)
  const usage = result.response.usageMetadata
  const resposta = JSON.parse(result.response.text())

  // 8. Atualizar ultimo_contato
  await supabase.from("ovyva_conversas").update({
    ultimo_contato: new Date().toISOString(),
    total_mensagens: (conversa.total_mensagens ?? 0) + 2,
  }).eq("id", conversa.id)

  // 9. Processar ação sugerida
  if (resposta.acao_sugerida === "transferir_humano") {
    await supabase.from("ovyva_conversas")
      .update({ status: "aguardando_humano" })
      .eq("id", conversa.id)
  }

  if (resposta.acao_sugerida === "agendar" && conversa.id) {
    await supabase.from("leads")
      .update({ estagio: "agendado", updated_at: new Date().toISOString() })
      .eq("conversa_id", conversa.id)
  }

  return {
    data: resposta,
    modelo: MODELS.flash,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// HELPER: BUSCAR OU CRIAR CONVERSA
// ─────────────────────────────────────────
async function getOuCriarConversa(supabase: any, clinica_id: string, numero_whatsapp: string) {
  // Tentar buscar conversa existente
  const { data: existente } = await supabase
    .from("ovyva_conversas")
    .select("*")
    .eq("clinica_id", clinica_id)
    .eq("contato_telefone", numero_whatsapp)
    .single()

  if (existente) return existente

  // Criar nova conversa (primeiro contato)
  const { data: nova, error } = await supabase
    .from("ovyva_conversas")
    .insert({
      clinica_id,
      contato_telefone: numero_whatsapp,
      contato_nome: null,
      status: "ia_ativa",
      metadata: { aguardando_nome: true },
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar conversa:", error)
    return null
  }

  return nova
}

// ─────────────────────────────────────────
// HELPER: CALCULAR CUSTO ESTIMADO
// ─────────────────────────────────────────
function calcularCusto(modelo: string, usage: any) {
  if (!usage) return 0
  const precos: Record<string, { input: number; output: number }> = {
    "gemini-2.5-flash": { input: 0.30, output: 2.50 },
    "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  }
  const p = precos[modelo] ?? { input: 0.30, output: 2.50 }
  return (
    (usage.inputTokens / 1_000_000) * p.input +
    (usage.outputTokens / 1_000_000) * p.output
  )
}

// ─────────────────────────────────────────
// HELPER: RESPOSTA DE ERRO
// ─────────────────────────────────────────
function errorResponse(msg: string, status = 400) {
  return new Response(
    JSON.stringify({ success: false, error: msg }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
  )
}