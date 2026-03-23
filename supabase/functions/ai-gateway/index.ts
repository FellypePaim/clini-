import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
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
    const evolutionKey = (Deno.env.get("EVOLUTION_API_KEY") ?? "").trim()
    const isServiceKey =
      token === serviceKey ||
      token === anonKey ||
      (evolutionKey && token === evolutionKey)

    let user = null
    // 2. Se não for chave de serviço, validar JWT do usuário
    if (!isServiceKey) {
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
      case "dashboard_insights":
        result = await handleDashboardInsights(clinica_id, supabaseAdmin)
        break
      default:
        return errorResponse(`Action desconhecida: ${action}`)
    }

    // 5. Salvar log de uso (não bloqueia a resposta)
    if (clinica_id) {
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
      }).then(() => { }).catch((e: unknown) => { console.error("Erro ao salvar log de uso:", e) })
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
  let data
  try { data = JSON.parse(result.response.text()) } catch { throw new Error("Resposta inválida da IA (JSON malformado)") }

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
  let resumo
  try { resumo = JSON.parse(result.response.text()) } catch { throw new Error("Resposta inválida da IA (JSON malformado)") }

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
  const { numero_whatsapp, mensagem_atual, image_base64, mime_type } = payload

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

  // 5. Buscar configuração da clínica, procedimentos e agenda básica
  const [clinicaRes, procedimentosRes, consultasRes] = await Promise.all([
    supabase
      .from("clinicas")
      .select("nome, configuracoes")
      .eq("id", clinica_id)
      .single(),
    supabase
      .from("procedimentos")
      .select("nome, preco_base, duracao_minutos")
      .eq("clinica_id", clinica_id)
      .eq("ativo", true),
    supabase
      .from("consultas")
      .select("data_consulta, hora_consulta, duracao_minutos")
      .eq("clinica_id", clinica_id)
      .gte("data_consulta", new Date().toISOString().split('T')[0])
      .neq("status", "cancelado")
      .limit(50)
  ])

  const clinicaData = clinicaRes.data
  const procedimentos = procedimentosRes.data || []
  const agendaOcupada = consultasRes.data || []

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

    TABELA DE PROCEDIMENTOS DISPONÍVEIS:
    ${procedimentos.map(p => `- ${p.nome}: R$ ${p.preco_base} (${p.duracao_minutos} min)`).join('\n')}

    HORÁRIOS JÁ OCUPADOS (NÃO sugerir estes):
    ${agendaOcupada.map(c => `- ${c.data_consulta} às ${c.hora_consulta}`).join('\n')}

    REGRAS OBRIGATÓRIAS:
    - Responda SEMPRE em português brasileiro
    - Nunca invente informações sobre procedimentos ou valores
    - Se não souber algo, diga "vou verificar com nossa equipe e te retorno"
    - Em emergências médicas, oriente: ligue para SAMU (192)
    - Seja objetiva — máximo 3 perguntas por mensagem
    - VISÃO: Você consegue ver imagens e documentos enviados. Se receber uma foto de receita ou exame, analise e descreva os pontos principais ou anote no agendamento.
    - CANCELAMENTO/REAGENDAMENTO: Se o paciente quiser desmarcar ou mudar a data, use a ação "cancelar" ou "agendar" (com a nova data) no JSON.
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

  // Montar conteúdo com imagem se houver
  const userContent: any[] = []
  if (image_base64) {
    userContent.push({
      inlineData: {
        data: image_base64,
        mimeType: mime_type || "image/jpeg"
      }
    })
  }
  userContent.push({ text: mensagem_atual })

  const result = await chat.sendMessage(userContent)
  const usage = result.response.usageMetadata
  let resposta
  try { resposta = JSON.parse(result.response.text()) } catch { throw new Error("Resposta inválida da IA (JSON malformado)") }

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
    const updatePayload: any = { 
      estagio: "agendado", 
      updated_at: new Date().toISOString() 
    }
    
    const procedNome = (resposta.dados_agendamento?.procedimento || "").toLowerCase().trim()
    const matchProced = procedNome ? procedimentos.find(p => p.nome.toLowerCase().includes(procedNome) || procedNome.includes(p.nome.toLowerCase())) : null

    if (matchProced) {
      updatePayload.procedimento_interesse = matchProced.nome
    } else if (resposta.dados_agendamento?.procedimento) {
      updatePayload.procedimento_interesse = resposta.dados_agendamento.procedimento
    }

    // Criar pre-agendamento real se tiver data/hora
    const dataAg = resposta.dados_agendamento?.data
    const horaAg = resposta.dados_agendamento?.hora

    if (dataAg && horaAg && conversa.paciente_id) {
       await supabase.from("consultas").insert({
          clinica_id,
          paciente_id: conversa.paciente_id,
          profissional_id: resposta.dados_agendamento?.profissional_id || agendaOcupada[0]?.profissional_id || null, // tenta inferir
          procedimento_id: (matchProced as any)?.id || null,
          data_consulta: dataAg,
          hora_consulta: horaAg,
          status: 'pendente',
          observacoes: `[PRÉ-AGENDAMENTO OVYVA] Gerado via WhatsApp. Aguardando aprovação humana.`
       }).then(() => { }).catch((e: unknown) => console.error("Erro ao criar pré-agendamento:", e))
    }

    await supabase.from("leads")
      .update(updatePayload)
      .eq("conversa_id", conversa.id)
  }

  // Se detectou interesse em procedimento mas não agendou, apenas atualiza interesse no lead
  if (resposta.dados_agendamento?.procedimento && !resposta.acao_sugerida.includes("agendar")) {
     await supabase.from("leads")
      .update({ procedimento_interesse: resposta.dados_agendamento.procedimento })
      .eq("conversa_id", conversa.id)
  }

  if (resposta.acao_sugerida === "cancelar" && conversa.paciente_id) {
     await supabase
        .from("consultas")
        .update({ status: 'cancelado', observacoes: `[CANCELADO POR OVYVA] Solicitação via WhatsApp.` })
        .eq("clinica_id", clinica_id)
        .eq("paciente_id", conversa.paciente_id)
        .eq("status", "confirmado")
        .gte("data_consulta", new Date().toISOString().split('T')[0])
        .limit(1)
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
// HANDLER: DASHBOARD INSIGHTS
// ─────────────────────────────────────────
async function handleDashboardInsights(clinica_id: string, supabase: any) {
  if (!clinica_id) throw new Error("clinica_id é obrigatório para dashboard_insights")

  const hoje = new Date().toISOString().split("T")[0]
  const inicioMes = hoje.substring(0, 7) + "-01"

  const [consultasHoje, receitaMes, pacientesNovos, leadsAtivos, clinicaRes] = await Promise.all([
    supabase.from("consultas").select("id, status", { count: "exact" })
      .eq("clinica_id", clinica_id).gte("data_hora_inicio", hoje).lt("data_hora_inicio", hoje + "T23:59:59"),
    supabase.from("lancamentos").select("valor")
      .eq("clinica_id", clinica_id).eq("tipo", "receita")
      .gte("data", inicioMes).eq("status", "pago"),
    supabase.from("pacientes").select("id", { count: "exact" })
      .eq("clinica_id", clinica_id).gte("created_at", inicioMes),
    supabase.from("leads").select("id", { count: "exact" })
      .eq("clinica_id", clinica_id).neq("estagio", "fechado"),
    supabase.from("clinicas").select("nome").eq("id", clinica_id).single(),
  ])

  const totalConsultasHoje = consultasHoje.count ?? 0
  const confirmadas = (consultasHoje.data ?? []).filter((c: any) => c.status === "confirmado").length
  const receitaTotal = (receitaMes.data ?? []).reduce((s: number, l: any) => s + (l.valor ?? 0), 0)
  const totalPacientesNovos = pacientesNovos.count ?? 0
  const totalLeads = leadsAtivos.count ?? 0
  const nomeClinica = clinicaRes.data?.nome ?? "Clínica"

  const model = genAI.getGenerativeModel({ model: MODELS.lite })

  const result = await model.generateContent(`
    Você é um consultor de gestão para clínicas médicas e estéticas brasileiras.
    Analise os dados abaixo da clínica "${nomeClinica}" e gere 3-4 insights práticos e acionáveis.

    DADOS DE HOJE (${hoje}):
    - Consultas agendadas: ${totalConsultasHoje}
    - Consultas confirmadas: ${confirmadas}
    - Taxa de confirmação: ${totalConsultasHoje > 0 ? Math.round((confirmadas / totalConsultasHoje) * 100) : 0}%

    DADOS DO MÊS ATUAL:
    - Receita realizada: R$ ${receitaTotal.toFixed(2)}
    - Novos pacientes: ${totalPacientesNovos}
    - Leads ativos no funil: ${totalLeads}

    Gere insights concisos, em português, com sugestões práticas baseadas nesses números.
    Formato: bullet points (•), máximo 4 pontos, linguagem direta e objetiva.
    Não use markdown, apenas texto simples.
  `)

  const usage = result.response.usageMetadata
  const insights = result.response.text().trim()

  return {
    data: { insights },
    modelo: MODELS.lite,
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