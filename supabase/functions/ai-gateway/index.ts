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
  const [clinicaRes, procedimentosRes, consultasRes, ausenciasRes] = await Promise.all([
    supabase
      .from("clinicas")
      .select("nome, configuracoes")
      .eq("id", clinica_id)
      .single(),
    supabase
      .from("procedimentos")
      .select("id, nome, valor_particular, duracao_minutos")
      .eq("clinica_id", clinica_id)
      .eq("ativo", true),
    supabase
      .from("consultas")
      .select("data_hora_inicio, duracao_minutos, profissional_id, status")
      .eq("clinica_id", clinica_id)
      .gte("data_hora_inicio", new Date().toISOString().split('T')[0])
      .in("status", ["agendado", "confirmado"])
      .limit(100),
    supabase
      .from("profissional_ausencias")
      .select("profissional_id, data_inicio, data_fim")
      .eq("clinica_id", clinica_id)
      .gte("data_fim", new Date().toISOString().split('T')[0])
  ])

  const clinicaData = clinicaRes.data
  const procedimentos = procedimentosRes.data || []
  const agendaOcupada = consultasRes.data || []

  const ovyvaConfig = clinicaData?.configuracoes?.ovyva ?? {}
  const config = {
    nome_assistente: ovyvaConfig.nome_assistente ?? "Sofia",
    tom_voz: ovyvaConfig.tom_voz ?? "cordial",
    nome_clinica: clinicaData?.nome ?? "Clínica",
    base_conhecimento: ovyvaConfig.base_conhecimento ?? "",
    horario_inicio: ovyvaConfig.horario_inicio ?? "08:00",
    horario_fim: ovyvaConfig.horario_fim ?? "18:00",
  }

  // 6. Montar system prompt
  const tom: Record<string, string> = {
    informal: "descontraída, use linguagem simples e emojis ocasionais 😊",
    cordial: "cordial e profissional, mas acessível",
    atenciosa: "atenciosa e empática, demonstre cuidado genuíno",
    formal: "formal e objetiva",
  }

  const nomeContato = perfilPaciente?.nome ?? "paciente"

  // Formatar agenda ocupada de forma legível
  const agendaFormatada = agendaOcupada.map((c: any) => {
    const dt = c.data_hora_inicio?.split("T") ?? []
    return `- ${dt[0] ?? "?"} às ${dt[1]?.substring(0,5) ?? "?"} (${c.duracao_minutos ?? 30}min)`
  }).join('\n')

  const ausenciasData = ausenciasRes.data || []
  const ausenciasFormatadas = ausenciasData.map((a: any) =>
    `- Profissional ausente de ${a.data_inicio} a ${a.data_fim}`
  ).join('\n')

  const systemPrompt = `
    Você é ${config.nome_assistente}, secretária virtual da clínica "${config.nome_clinica}".
    Tom de atendimento: ${tom[config.tom_voz] ?? "cordial e profissional"}.
    Você está conversando com: ${nomeContato}.
    ${perfilPaciente?.e_paciente_cadastrado ? `Este paciente é cadastrado na clínica.` : ""}
    Data e hora atuais: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.

    INFORMAÇÕES DA CLÍNICA:
    ${config.base_conhecimento || "Clínica médica e estética."}

    HORÁRIO DE FUNCIONAMENTO: ${config.horario_inicio} às ${config.horario_fim} (segunda a sábado)

    PROCEDIMENTOS DISPONÍVEIS:
    ${procedimentos.length > 0 ? procedimentos.map((p: any) => `- ${p.nome}: R$ ${p.valor_particular ?? 0} (${p.duracao_minutos} min)`).join('\n') : "Nenhum procedimento cadastrado ainda."}

    HORÁRIOS JÁ OCUPADOS (NÃO sugerir estes):
    ${agendaFormatada || "Nenhum agendamento encontrado — agenda livre."}
    ${ausenciasFormatadas ? `\n\nPROFISSIONAIS AUSENTES (NÃO agende nesses dias):\n${ausenciasFormatadas}` : ''}

    REGRAS OBRIGATÓRIAS:
    1. Responda SEMPRE em português brasileiro
    2. Nunca invente procedimentos, valores ou horários que não estejam listados acima
    3. Se não souber algo, diga "vou verificar com nossa equipe e te retorno"
    4. Em emergências médicas, oriente: ligue para SAMU (192)
    5. Seja objetiva — máximo 2-3 frases por resposta, direto ao ponto
    6. Sugira apenas horários DENTRO do horário de funcionamento e que NÃO estejam na lista de ocupados
    7. Se o paciente quiser DESMARCAR: use ação "cancelar"
    8. Se o paciente quiser MUDAR DATA/HORA: use ação "reagendar" (cancela a atual e agenda a nova)
    9. Se o paciente quiser AGENDAR: use ação "agendar" com data, hora e procedimento
    10. VISÃO: Se receber imagem, analise e descreva brevemente
    11. PRIORIDADE: Se o nome for "paciente" (desconhecido), PRIMEIRO pergunte o nome. Não agende sem saber quem é.

    Responda APENAS com JSON válido:
    {
      "resposta": "texto para enviar ao paciente via WhatsApp",
      "intencao_detectada": "agendamento|cancelamento|reagendamento|informacao|reclamacao|emergencia|outro",
      "acao_sugerida": "agendar|cancelar|reagendar|transferir_humano|aguardar|nenhuma",
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

  // Helper: buscar procedimento por nome
  const procedNome = (resposta.dados_agendamento?.procedimento || "").toLowerCase().trim()
  const matchProced = procedNome ? procedimentos.find((p: any) => p.nome.toLowerCase().includes(procedNome) || procedNome.includes(p.nome.toLowerCase())) : null

  const dataAg = resposta.dados_agendamento?.data
  const horaAg = resposta.dados_agendamento?.hora

  // ── AÇÃO: AGENDAR ──
  if ((resposta.acao_sugerida === "agendar" || resposta.acao_sugerida === "reagendar") && conversa.id) {
    // Atualizar lead
    const updatePayload: any = { estagio: "agendado", updated_at: new Date().toISOString() }
    if (matchProced) updatePayload.procedimento_interesse = matchProced.nome
    else if (resposta.dados_agendamento?.procedimento) updatePayload.procedimento_interesse = resposta.dados_agendamento.procedimento

    await supabase.from("leads").update(updatePayload).eq("conversa_id", conversa.id)

    // Se reagendamento, cancelar consultas futuras deste paciente primeiro
    if (resposta.acao_sugerida === "reagendar" && conversa.paciente_id) {
      await supabase.from("consultas")
        .update({ status: "cancelado", observacoes: "[REAGENDADO POR OVYVA] Paciente solicitou nova data via WhatsApp." })
        .eq("clinica_id", clinica_id)
        .eq("paciente_id", conversa.paciente_id)
        .in("status", ["agendado", "confirmado"])
        .gte("data_hora_inicio", new Date().toISOString().split("T")[0])
        .limit(1)
    }

    // Criar pré-agendamento se tiver data/hora (aceita pacientes vinculados OU não)
    if (dataAg && horaAg) {
      const dataHoraInicio = `${dataAg}T${horaAg}:00`
      const duracao = (matchProced as any)?.duracao_minutos ?? 30
      const endMinutes = horaAg.split(":").map(Number).reduce((h: number, m: number) => h * 60 + m) + duracao
      const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
      const endM = String(endMinutes % 60).padStart(2, "0")
      const dataHoraFim = `${dataAg}T${endH}:${endM}:00`

      await supabase.from("consultas").insert({
        clinica_id,
        paciente_id: conversa.paciente_id || null,
        profissional_id: agendaOcupada[0]?.profissional_id || null,
        procedimento_id: (matchProced as any)?.id || null,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracao,
        status: "agendado",
        observacoes: `[PRÉ-AGENDAMENTO OVYVA] ${conversa.contato_nome || "Contato WhatsApp"} — via WhatsApp. Aguardando aprovação.`,
      }).then(() => { }).catch((e: unknown) => console.error("Erro ao criar pré-agendamento:", e))
    }
  }

  // Se detectou interesse em procedimento mas não agendou, apenas atualiza interesse no lead
  if (resposta.dados_agendamento?.procedimento && !["agendar", "reagendar"].includes(resposta.acao_sugerida)) {
    await supabase.from("leads")
      .update({ procedimento_interesse: resposta.dados_agendamento.procedimento })
      .eq("conversa_id", conversa.id)
  }

  // ── AÇÃO: CANCELAR ──
  if (resposta.acao_sugerida === "cancelar" && conversa.paciente_id) {
    await supabase.from("consultas")
      .update({ status: "cancelado", observacoes: "[CANCELADO POR OVYVA] Paciente solicitou cancelamento via WhatsApp." })
      .eq("clinica_id", clinica_id)
      .eq("paciente_id", conversa.paciente_id)
      .in("status", ["agendado", "confirmado"])
      .gte("data_hora_inicio", new Date().toISOString().split("T")[0])
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