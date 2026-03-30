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
      case "lyra_respond":
        result = await handleLYRA(payload, clinica_id, supabaseAdmin)
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
// HANDLER: LYRA RESPOND
// ─────────────────────────────────────────
async function handleLYRA(payload: any, clinica_id: string, supabase: any) {
  const { numero_whatsapp, mensagem_atual, image_base64, mime_type } = payload

  if (!numero_whatsapp || !mensagem_atual) {
    throw new Error("Campos 'numero_whatsapp' e 'mensagem_atual' são obrigatórios para lyra_respond")
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

    await supabase.from("lyra_conversas").update({
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
      await supabase.from("lyra_conversas")
        .update({ paciente_id: pacientes[0].id })
        .eq("id", conversa.id)
    }

    // Criar/atualizar lead no Nexus
    await supabase.from("leads").upsert({
      clinica_id,
      nome,
      telefone: numero_whatsapp,
      origem: "lyra",
      estagio: "perguntou_valor",
      conversa_id: conversa.id,
    }, { onConflict: "clinica_id,telefone" })

    conversa = { ...conversa, contato_nome: nome, metadata: {} }
  }

  // 3. Buscar histórico da conversa (últimas 20 mensagens)
  const { data: historico } = await supabase
    .from("lyra_mensagens")
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

  // 5. Buscar configuração da clínica, procedimentos, profissionais e agenda
  // Usar timezone BR para todas as datas
  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const todayBR = nowBR.toISOString().split('T')[0] // YYYY-MM-DD em horário BR

  const [clinicaRes, procedimentosRes, consultasRes, ausenciasRes, profissionaisRes] = await Promise.all([
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
      .select("data_hora_inicio, data_hora_fim, profissional_id, status")
      .eq("clinica_id", clinica_id)
      .gte("data_hora_inicio", `${todayBR}T00:00:00`)
      .in("status", ["agendado", "confirmado", "pendente"])
      .order("data_hora_inicio")
      .limit(200),
    supabase
      .from("profissional_ausencias")
      .select("profissional_id, data_inicio, data_fim")
      .eq("clinica_id", clinica_id)
      .gte("data_fim", todayBR),
    supabase
      .from("profiles")
      .select("id, nome_completo, especialidade, telefone")
      .eq("clinica_id", clinica_id)
      .in("role", ["profissional", "administrador"])
      .eq("ativo", true)
  ])

  const clinicaData = clinicaRes.data
  const procedimentos = procedimentosRes.data || []
  const agendaOcupada = consultasRes.data || []
  const ausenciasData = ausenciasRes.data || []
  const profissionais = profissionaisRes.data || []

  const lyraConfig = clinicaData?.configuracoes?.lyra ?? {}
  const config = {
    nome_assistente: lyraConfig.nome_assistente ?? "Sofia",
    tom_voz: lyraConfig.tom_voz ?? "cordial",
    nome_clinica: clinicaData?.nome ?? "Clínica",
    base_conhecimento: lyraConfig.base_conhecimento ?? "",
    horario_inicio: lyraConfig.horario_inicio ?? "08:00",
    horario_fim: lyraConfig.horario_fim ?? "18:00",
  }

  // 6. Calcular SLOTS LIVRES reais para os próximos 7 dias úteis
  const duracaoPadrao = 30 // minutos
  const [hIni, mIni] = config.horario_inicio.split(':').map(Number)
  const [hFim, mFim] = config.horario_fim.split(':').map(Number)

  // Criar set de slots ocupados (chave: "YYYY-MM-DD HH:MM")
  const ocupados = new Set<string>()
  for (const c of agendaOcupada) {
    if (!c.data_hora_inicio) continue
    const inicio = new Date(c.data_hora_inicio)
    // Calcular duração a partir de início/fim (coluna duracao_minutos não existe)
    const dur = c.data_hora_fim && c.data_hora_inicio
      ? Math.round((new Date(c.data_hora_fim).getTime() - new Date(c.data_hora_inicio).getTime()) / 60000)
      : duracaoPadrao
    // Marcar cada bloco de 30min como ocupado
    for (let m = 0; m < dur; m += duracaoPadrao) {
      const slot = new Date(inicio.getTime() + m * 60000)
      const key = `${slot.toISOString().split('T')[0]} ${String(slot.getHours()).padStart(2,'0')}:${String(slot.getMinutes()).padStart(2,'0')}`
      ocupados.add(key)
    }
  }

  // Criar set de dias com ausências
  const diasAusencia = new Set<string>()
  for (const a of ausenciasData) {
    const start = new Date(a.data_inicio)
    const end = new Date(a.data_fim)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      diasAusencia.add(d.toISOString().split('T')[0])
    }
  }

  // Gerar slots livres dos próximos 7 dias úteis
  const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
  const slotsLivres: string[] = []
  let diasVerificados = 0

  for (let offset = 0; diasVerificados < 3 && offset < 7; offset++) {
    const dia = new Date(nowBR)
    dia.setDate(dia.getDate() + offset)
    const diaStr = dia.toISOString().split('T')[0]
    const diaSemana = dia.getDay()

    // Pular domingos
    if (diaSemana === 0) continue
    // Pular dias com ausência total
    if (diasAusencia.has(diaStr)) continue

    diasVerificados++
    const livresNoDia: string[] = []

    for (let h = hIni; h < hFim; h++) {
      for (let m = (h === hIni ? mIni : 0); m < 60; m += duracaoPadrao) {
        if (h === hFim - 1 && m + duracaoPadrao > (mFim || 60)) break
        const horaStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
        const key = `${diaStr} ${horaStr}`

        // Se é hoje, pular horários que já passaram
        if (offset === 0) {
          const slotTime = h * 60 + m
          const nowTime = nowBR.getHours() * 60 + nowBR.getMinutes()
          if (slotTime <= nowTime + 30) continue // margem de 30min
        }

        if (!ocupados.has(key)) {
          livresNoDia.push(horaStr)
        }
      }
    }

    if (livresNoDia.length > 0) {
      const nomeDia = diasSemana[diaSemana]
      const dataFormatada = dia.toLocaleDateString('pt-BR')
      // Limitar a 6 slots por dia para não estourar o prompt
      const display = livresNoDia.length > 6
        ? livresNoDia.slice(0, 3).join(', ') + ' ... ' + livresNoDia.slice(-3).join(', ')
        : livresNoDia.join(', ')
      slotsLivres.push(`${nomeDia} (${dataFormatada}): ${display}`)
    }
  }

  // 7. Montar system prompt
  const tom: Record<string, string> = {
    informal: "descontraída, use linguagem simples e emojis ocasionais",
    cordial: "cordial e profissional, mas acessível",
    atenciosa: "atenciosa e empática, demonstre cuidado genuíno",
    formal: "formal e objetiva",
  }

  const nomeContato = perfilPaciente?.nome ?? "paciente"

  const ausenciasFormatadas = ausenciasData.map((a: any) =>
    `- Profissional ausente de ${a.data_inicio} a ${a.data_fim}`
  ).join('\n')

  // Buscar consultas futuras DESTE CONTATO para contexto
  let consultasDoContato: string[] = []
  if (conversa.paciente_id) {
    const { data: consultasPac } = await supabase.from("consultas")
      .select("data_hora_inicio, status, procedimento_id")
      .eq("clinica_id", clinica_id)
      .eq("paciente_id", conversa.paciente_id)
      .in("status", ["agendado", "confirmado"])
      .gte("data_hora_inicio", `${todayBR}T00:00:00`)
      .order("data_hora_inicio")
    consultasDoContato = (consultasPac ?? []).map((c: any) => {
      const dt = c.data_hora_inicio?.split("T") ?? []
      return `- ${dt[0]?.split("-").reverse().join("/") ?? "?"} as ${dt[1]?.substring(0,5) ?? "?"} (${c.status})`
    })
  } else {
    // Buscar por observações da LYRA (contatos não cadastrados)
    const { data: consultasLyra } = await supabase.from("consultas")
      .select("data_hora_inicio, status, observacoes")
      .eq("clinica_id", clinica_id)
      .ilike("observacoes", `%${conversa.contato_nome || conversa.contato_telefone}%`)
      .in("status", ["agendado", "confirmado"])
      .gte("data_hora_inicio", `${todayBR}T00:00:00`)
      .order("data_hora_inicio")
    consultasDoContato = (consultasLyra ?? []).map((c: any) => {
      const dt = c.data_hora_inicio?.split("T") ?? []
      return `- ${dt[0]?.split("-").reverse().join("/") ?? "?"} as ${dt[1]?.substring(0,5) ?? "?"} (${c.status})`
    })
  }

  const profissionalDefault = profissionais.length === 1 ? profissionais[0].nome_completo : null

  const systemPrompt = `Você é ${config.nome_assistente}, secretária virtual da ${config.nome_clinica}. ${tom[config.tom_voz] ?? "Seja cordial."}
Conversando com: ${nomeContato}. ${conversa.paciente_id ? "Paciente cadastrado." : "Contato novo — pergunte nome completo naturalmente."}
Agora: ${nowBR.toLocaleString("pt-BR")}. Horário: ${config.horario_inicio}-${config.horario_fim}, seg-sáb.
${config.base_conhecimento ? `Info: ${config.base_conhecimento}` : ""}

Profissionais: ${profissionais.map((p: any) => p.nome_completo).join(', ') || "nenhum"}
Procedimentos: ${procedimentos.map((p: any) => `${p.nome} R$${p.valor_particular ?? 0}`).join(', ') || "nenhum"}
Consultas deste contato: ${consultasDoContato.join('; ') || "nenhuma"}
Horários livres: ${slotsLivres.join(' | ') || "nenhum"}
${ausenciasFormatadas ? `Ausências: ${ausenciasFormatadas}` : ""}

REGRAS:
- Respostas curtas (2-3 frases). Português BR.
- Só sugira horários da lista acima.${profissionais.length > 1 ? ' Se >1 profissional, pergunte qual.' : ''}
- Se contato novo, pergunte nome completo. Se ignorar, atenda e pergunte depois.
- QUANDO O PACIENTE CONFIRMAR AGENDAMENTO (sim/ok/pode/quero/confirmo): USE acao_sugerida="agendar" COM data (YYYY-MM-DD), hora (HH:MM), profissional_nome${profissionalDefault ? ` (use "${profissionalDefault}")` : ''} e procedimento PREENCHIDOS. Sem isso o agendamento NÃO é criado.
- Cancelar: acao_sugerida="cancelar". Reagendar: acao_sugerida="reagendar" com dados NOVOS.

JSON obrigatório:
{"resposta":"texto","intencao_detectada":"agendamento|cancelamento|reagendamento|informacao|outro","acao_sugerida":"agendar|cancelar|reagendar|transferir_humano|nenhuma","dados_agendamento":{"data":"YYYY-MM-DD ou null","hora":"HH:MM ou null","profissional_nome":"nome ou null","procedimento":"nome ou null"},"nome_completo":"Nome Sobrenome ou null","confianca":0.9}`

  // 7. Chamar Gemini com histórico
  const model = genAI.getGenerativeModel({
    model: MODELS.flash,
  })

  // Limitar histórico a últimas 20 mensagens para evitar timeout
  const recentHistory = (historico ?? []).slice(-20)
  const chatHistory = recentHistory.map((m: any) => ({
    role: m.remetente === "paciente" ? "user" : "model",
    parts: [{ text: m.conteudo }],
  }))

  const chat = model.startChat({
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    history: chatHistory.slice(0, -1),
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

  console.log(`[LYRA] Chamando Gemini. Historico: ${chatHistory.length} msgs. Slots: ${slotsLivres.length} dias.`)

  let result, usage, resposta
  try {
    result = await chat.sendMessage(userContent)
    usage = result.response.usageMetadata
    console.log(`[LYRA] Gemini respondeu. Tokens: ${usage?.promptTokenCount}/${usage?.candidatesTokenCount}`)
    let rawText = result.response.text()
    console.log("[LYRA] Raw response:", rawText?.substring(0, 300))

    // Limpar markdown code blocks se houver
    rawText = rawText?.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim() || ''

    try {
      resposta = JSON.parse(rawText)
    } catch {
      // Tentar extrair JSON de dentro do texto
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { resposta = JSON.parse(jsonMatch[0]) } catch { /* ignore */ }
      }

      if (!resposta) {
        console.error("[LYRA] JSON parse falhou, usando texto como resposta")
        resposta = {
          resposta: rawText || "Desculpe, tive um problema. Pode repetir?",
          intencao_detectada: "outro",
          acao_sugerida: "nenhuma",
          dados_agendamento: { data: null, hora: null, profissional_nome: null, procedimento: null },
          confianca: 0.5,
        }
      }
    }
  } catch (geminiErr: any) {
    console.error("[LYRA] Gemini error:", geminiErr.message)
    return {
      data: {
        resposta: "Desculpe, estou com dificuldade para processar. Pode repetir sua mensagem?",
        intencao_detectada: "outro",
        acao_sugerida: "nenhuma",
      },
      modelo: MODELS.flash,
      usage: { inputTokens: 0, outputTokens: 0 },
    }
  }

  // 8. Auto-cadastro de paciente se IA coletou nome completo e contato não é paciente
  if (resposta.nome_completo && !conversa.paciente_id) {
    const nomeCompleto = resposta.nome_completo.trim()
    // Verificar se tem pelo menos nome + sobrenome (2 palavras)
    if (nomeCompleto.split(/\s+/).length >= 2) {
      try {
        // Verificar se já existe paciente com esse telefone nesta clínica
        const { data: existente } = await supabase.from("pacientes")
          .select("id")
          .eq("clinica_id", clinica_id)
          .or(`telefone.eq.${conversa.contato_telefone},whatsapp.eq.${conversa.contato_telefone}`)
          .limit(1)
          .single()

        if (existente) {
          // Paciente já existe — vincular à conversa
          await supabase.from("lyra_conversas").update({
            paciente_id: existente.id,
            contato_nome: nomeCompleto,
          }).eq("id", conversa.id)
          conversa.paciente_id = existente.id
          console.log(`[LYRA] Paciente existente vinculado: ${existente.id}`)
        } else {
          // Criar novo paciente
          const { data: novoPaciente } = await supabase.from("pacientes").insert({
            clinica_id,
            nome_completo: nomeCompleto,
            telefone: conversa.contato_telefone,
            whatsapp: conversa.contato_telefone,
            como_conheceu: "WhatsApp LYRA",
            ativo: true,
          }).select("id").single()

          if (novoPaciente) {
            await supabase.from("lyra_conversas").update({
              paciente_id: novoPaciente.id,
              contato_nome: nomeCompleto,
            }).eq("id", conversa.id)
            conversa.paciente_id = novoPaciente.id
            console.log(`[LYRA] Paciente auto-cadastrado: ${nomeCompleto} (${novoPaciente.id})`)
          }
        }
      } catch (e: any) {
        console.error("[LYRA] Erro no auto-cadastro:", e.message)
      }
    }
  }

  // Atualizar nome do contato se IA informou
  if (resposta.nome_completo && conversa.contato_nome !== resposta.nome_completo) {
    await supabase.from("lyra_conversas").update({
      contato_nome: resposta.nome_completo,
    }).eq("id", conversa.id)
  }

  // 8b. Atualizar ultimo_contato + intent
  await supabase.from("lyra_conversas").update({
    ultimo_contato: new Date().toISOString(),
    total_mensagens: (conversa.total_mensagens ?? 0) + 2,
    metadata: {
      ...(conversa.metadata ?? {}),
      intent: resposta.intencao_detectada || (conversa.metadata as any)?.intent || null,
    },
  }).eq("id", conversa.id)

  // 9. Processar ação sugerida
  if (resposta.acao_sugerida === "transferir_humano") {
    await supabase.from("lyra_conversas")
      .update({ status: "aguardando_humano" })
      .eq("id", conversa.id)
  }

  // Helper: buscar procedimento por nome
  const procedNome = (resposta.dados_agendamento?.procedimento || "").toLowerCase().trim()
  const matchProced = procedNome ? procedimentos.find((p: any) => p.nome.toLowerCase().includes(procedNome) || procedNome.includes(p.nome.toLowerCase())) : null

  let dataAg = resposta.dados_agendamento?.data
  let horaAg = resposta.dados_agendamento?.hora

  // Normalizar "null" string para null
  if (dataAg === "null" || dataAg === "undefined") dataAg = null
  if (horaAg === "null" || horaAg === "undefined") horaAg = null

  // Converter data BR (28/03/2026) para ISO (2026-03-28) se necessário
  if (dataAg && dataAg.includes('/')) {
    const parts = dataAg.split('/')
    if (parts.length === 3) dataAg = `${parts[2]}-${parts[1]}-${parts[0]}`
  }

  // Normalizar hora (15h → 15:00, 15:0 → 15:00)
  if (horaAg) {
    horaAg = horaAg.replace(/h/gi, ':00').replace(/:(\d)$/, ':0$1')
    if (!horaAg.includes(':')) horaAg = `${horaAg}:00`
  }

  console.log(`[LYRA] RESPOSTA COMPLETA:`, JSON.stringify(resposta).substring(0, 500))
  console.log(`[LYRA] Ação: ${resposta.acao_sugerida}, Data: ${dataAg}, Hora: ${horaAg}, Prof: ${resposta.dados_agendamento?.profissional_nome}, Proced: ${resposta.dados_agendamento?.procedimento}`)

  // ── AÇÃO: AGENDAR ──
  if ((resposta.acao_sugerida === "agendar" || resposta.acao_sugerida === "reagendar") && conversa.id) {
    // Atualizar lead
    const updatePayload: any = { estagio: "agendado", updated_at: new Date().toISOString() }
    if (matchProced) updatePayload.procedimento_interesse = matchProced.nome
    else if (resposta.dados_agendamento?.procedimento) updatePayload.procedimento_interesse = resposta.dados_agendamento.procedimento

    await supabase.from("leads").update(updatePayload).eq("conversa_id", conversa.id)

    // Se reagendamento, cancelar consulta anterior
    if (resposta.acao_sugerida === "reagendar") {
      let cancelQuery = supabase.from("consultas")
        .select("id, profissional_id, data_hora_inicio")
        .eq("clinica_id", clinica_id)
        .in("status", ["agendado", "confirmado"])
        .gte("data_hora_inicio", `${todayBR}T00:00:00`)
        .order("data_hora_inicio", { ascending: true })
        .limit(1)

      if (conversa.paciente_id) {
        cancelQuery = cancelQuery.eq("paciente_id", conversa.paciente_id)
      } else {
        cancelQuery = cancelQuery.ilike("observacoes", `%${conversa.contato_nome || conversa.contato_telefone}%`)
      }

      const { data: consultaAnterior } = await cancelQuery.single()
      if (consultaAnterior) {
        await supabase.from("consultas")
          .update({ status: "cancelado", observacoes: "[REAGENDADO POR LYRA] Paciente solicitou nova data via WhatsApp." })
          .eq("id", consultaAnterior.id)

        // Notificar profissional do cancelamento
        const dtOld = consultaAnterior.data_hora_inicio?.split("T")
        await notificarProfissional(supabase, clinica_id, consultaAnterior.profissional_id, "reagendamento",
          `Consulta REAGENDADA via WhatsApp:\nPaciente: ${conversa.contato_nome || "Contato"}\nAnterior: ${dtOld?.[0]?.split("-").reverse().join("/") ?? "?"} as ${dtOld?.[1]?.substring(0, 5) ?? "?"}\nNova: ${dataAg?.split("-").reverse().join("/")} as ${horaAg}`
        )
        console.log(`[LYRA] Reagendamento: cancelou consulta ${consultaAnterior.id}`)
      }
    }

    // Criar pré-agendamento se tiver data/hora (aceita pacientes vinculados OU não)
    console.log(`[LYRA] Verificando se pode criar consulta: dataAg="${dataAg}" horaAg="${horaAg}" (truthy: ${!!dataAg && !!horaAg})`)
    if (dataAg && horaAg) {
      // Adicionar timezone BR (-03:00) para Supabase salvar corretamente
      const dataHoraInicio = `${dataAg}T${horaAg}:00-03:00`
      const duracao = (matchProced as any)?.duracao_minutos ?? 30
      const endMinutes = horaAg.split(":").map(Number).reduce((h: number, m: number) => h * 60 + m) + duracao
      const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
      const endM = String(endMinutes % 60).padStart(2, "0")
      const dataHoraFim = `${dataAg}T${endH}:${endM}:00-03:00`

      // Buscar profissional pelo nome retornado pela IA
      const profNome = (resposta.dados_agendamento?.profissional_nome || "").toLowerCase().trim()
      let profissionalId = null
      if (profNome && profissionais.length > 0) {
        const matchProf = profissionais.find((p: any) =>
          p.nome_completo.toLowerCase().includes(profNome) || profNome.includes(p.nome_completo.toLowerCase().split(' ')[0])
        )
        profissionalId = matchProf?.id || null
      }
      // Fallback: se não encontrou, usar o primeiro profissional da clínica
      if (!profissionalId && profissionais.length > 0) {
        profissionalId = profissionais[0].id
      }

      console.log(`[LYRA] Criando consulta: ${dataHoraInicio} prof=${profissionalId} proced=${(matchProced as any)?.id}`)

      // paciente_id e profissional_id são obrigatórios na tabela consultas
      if (!conversa.paciente_id) {
        console.error("[LYRA] Não é possível agendar: paciente_id é null (contato não cadastrado)")
      }
      if (!profissionalId) {
        console.error("[LYRA] Não é possível agendar: profissional_id é null")
      }

      const insertPayload: any = {
        clinica_id,
        paciente_id: conversa.paciente_id,
        profissional_id: profissionalId,
        procedimento_id: (matchProced as any)?.id || null,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        status: "agendado",
        observacoes: `[AGENDAMENTO LYRA] ${conversa.contato_nome || "Contato WhatsApp"} — via WhatsApp.`,
      }

      // Só inserir se tem os campos obrigatórios
      if (!conversa.paciente_id || !profissionalId) {
        console.error("[LYRA] Insert abortado: campos obrigatórios faltando")
      } else {
        // Verificar duplicata: mesma data/hora + mesmo paciente
        const { count: existing } = await supabase.from("consultas")
          .select("id", { count: "exact", head: true })
          .eq("clinica_id", clinica_id)
          .eq("paciente_id", conversa.paciente_id)
          .eq("data_hora_inicio", dataHoraInicio)
          .in("status", ["agendado", "confirmado"])
        if ((existing ?? 0) > 0) {
          console.log("[LYRA] Consulta duplicada detectada, pulando insert")
        } else {
        const { error: insertErr } = await supabase.from("consultas").insert(insertPayload)
        if (insertErr) {
          console.error("[LYRA] Erro ao criar agendamento:", JSON.stringify(insertErr))
        } else {
          console.log("[LYRA] CONSULTA CRIADA COM SUCESSO!")
          await notificarProfissional(supabase, clinica_id, profissionalId, "agendamento",
            `Nova consulta agendada via WhatsApp:\nPaciente: ${conversa.contato_nome || "Novo contato"}\nData: ${dataAg?.split("-").reverse().join("/")} as ${horaAg}\nProcedimento: ${(matchProced as any)?.nome || "Avaliacao"}`
          )
        }
        } // fecha else da duplicata
      }
    }
  }

  // ── ATUALIZAR CRM AUTOMATICAMENTE BASEADO NA INTENÇÃO ──
  // Mapear intenção da IA → estágio do lead no CRM
  const intentToStage: Record<string, string> = {
    "informacao": "perguntou_valor",
    "agendamento": "demonstrou_interesse",
    "reagendamento": "demonstrou_interesse",
    "reclamacao": "perguntou_valor",
  }

  if (resposta.intencao_detectada && conversa.id) {
    const novoEstagio = resposta.acao_sugerida === "agendar" ? "agendado"
      : intentToStage[resposta.intencao_detectada] || null

    if (novoEstagio) {
      const leadUpdate: any = {
        ultimo_contato: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Só avançar o estágio (nunca regredir)
      const stageOrder = ["perguntou_valor", "demonstrou_interesse", "quase_fechando", "agendado"]
      let { data: currentLead } = await supabase.from("leads")
        .select("estagio, id")
        .eq("conversa_id", conversa.id)
        .single()

      // Se lead não existe, criar agora (fallback para conversas antigas)
      if (!currentLead) {
        const { data: newLead } = await supabase.from("leads").insert({
          clinica_id,
          nome: conversa.contato_nome || `Contato ${conversa.contato_telefone}`,
          telefone: conversa.contato_telefone,
          estagio: novoEstagio,
          origem: "WhatsApp LYRA",
          conversa_id: conversa.id,
          ultimo_contato: new Date().toISOString(),
        }).select("estagio, id").single()
        if (newLead) {
          currentLead = newLead
          console.log(`[LYRA] Lead criado via ai-gateway fallback: ${newLead.id}`)
        }
      }

      if (currentLead) {
        const currentIdx = stageOrder.indexOf(currentLead.estagio || "")
        const newIdx = stageOrder.indexOf(novoEstagio)
        if (newIdx > currentIdx) {
          leadUpdate.estagio = novoEstagio
          // Atualizar metadata da conversa com o estágio do CRM
          await supabase.from("lyra_conversas").update({
            metadata: { ...(conversa.metadata ?? {}), lead_stage: novoEstagio, intent: resposta.intencao_detectada },
          }).eq("id", conversa.id)
          // Registrar mudança no histórico
          await supabase.from("leads_historico").insert({
            lead_id: currentLead.id,
            estagio_anterior: currentLead.estagio,
            estagio_novo: novoEstagio,
            anotacao: `[LYRA IA] Intenção: ${resposta.intencao_detectada}`,
          }).catch(() => {})
        }
        if (resposta.dados_agendamento?.procedimento) {
          leadUpdate.procedimento_interesse = resposta.dados_agendamento.procedimento
        }
        await supabase.from("leads").update(leadUpdate).eq("id", currentLead.id)
      }
    }
  }

  // ── AÇÃO: CANCELAR ──
  if (resposta.acao_sugerida === "cancelar") {
    // Buscar consulta futura (com ou sem paciente_id — pode ser contato não cadastrado)
    let cancelQuery = supabase.from("consultas")
      .select("id, profissional_id, data_hora_inicio")
      .eq("clinica_id", clinica_id)
      .in("status", ["agendado", "confirmado"])
      .gte("data_hora_inicio", todayBR)
      .order("data_hora_inicio", { ascending: true })
      .limit(1)

    if (conversa.paciente_id) {
      cancelQuery = cancelQuery.eq("paciente_id", conversa.paciente_id)
    }

    const { data: consultaCancel } = await cancelQuery.single()
    if (consultaCancel) {
      await supabase.from("consultas")
        .update({ status: "cancelado", observacoes: "[CANCELADO POR LYRA] Paciente solicitou cancelamento via WhatsApp." })
        .eq("id", consultaCancel.id)

      // Notificar profissional
      const dtCancel = consultaCancel.data_hora_inicio?.split("T")
      await notificarProfissional(supabase, clinica_id, consultaCancel.profissional_id, "cancelamento",
        `Consulta CANCELADA via WhatsApp:\n` +
        `Paciente: ${conversa.contato_nome || "Contato"}\n` +
        `Data: ${dtCancel?.[0]?.split("-").reverse().join("/") ?? "?"} as ${dtCancel?.[1]?.substring(0, 5) ?? "?"}`
      )

      // Atualizar lead para "perdido"
      await supabase.from("leads").update({ estagio: "perdido" }).eq("conversa_id", conversa.id)
    }
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

  const hoje = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).toISOString().split("T")[0]
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
    .from("lyra_conversas")
    .select("*")
    .eq("clinica_id", clinica_id)
    .eq("contato_telefone", numero_whatsapp)
    .single()

  if (existente) return existente

  // Criar nova conversa (primeiro contato)
  const { data: nova, error } = await supabase
    .from("lyra_conversas")
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

// ─────────────────────────────────────────
// HELPER: NOTIFICAR PROFISSIONAL VIA WHATSAPP
// ─────────────────────────────────────────
async function notificarProfissional(supabase: any, clinica_id: string, profissional_id: string | null, tipo: string, mensagem: string) {
  if (!profissional_id) {
    console.log(`[notif] Sem profissional_id, pulando notificação`)
    return
  }
  try {
    const { data: prof } = await supabase.from("profiles")
      .select("telefone, nome_completo")
      .eq("id", profissional_id)
      .single()
    if (!prof?.telefone) {
      console.log(`[notif] Profissional ${profissional_id} sem telefone cadastrado`)
      return
    }

    // Enviar DIRETO via whatsapp-send (não esperar CRON)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({
          numero: prof.telefone,
          texto: mensagem,
          tipo: "texto",
          clinica_id,
        }),
      })
      if (resp.ok) {
        console.log(`[notif] WhatsApp enviado para ${prof.nome_completo} (${tipo})`)
      } else {
        const errText = await resp.text().catch(() => "")
        console.error(`[notif] Falha ao enviar WhatsApp: ${resp.status} ${errText}`)
      }
    } catch (sendErr: any) {
      console.error(`[notif] Erro no envio direto: ${sendErr.message}`)
    }

    // Também salvar na fila para histórico
    await supabase.from("notificacoes_fila").insert({
      clinica_id,
      tipo: `profissional_${tipo}`,
      canal: "whatsapp",
      status: "enviado",
      destinatario_telefone: prof.telefone,
      destinatario_nome: prof.nome_completo,
      mensagem,
      agendar_para: new Date().toISOString(),
      enviado_em: new Date().toISOString(),
    }).catch(() => {})
  } catch (e: any) {
    console.error("[notif] Erro ao notificar profissional:", e.message)
  }
}