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
      .select("data_hora_inicio, data_hora_fim, duracao_minutos, profissional_id, status")
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
      .eq("role", "profissional")
      .eq("ativo", true)
  ])

  const clinicaData = clinicaRes.data
  const procedimentos = procedimentosRes.data || []
  const agendaOcupada = consultasRes.data || []
  const ausenciasData = ausenciasRes.data || []
  const profissionais = profissionaisRes.data || []

  const ovyvaConfig = clinicaData?.configuracoes?.ovyva ?? {}
  const config = {
    nome_assistente: ovyvaConfig.nome_assistente ?? "Sofia",
    tom_voz: ovyvaConfig.tom_voz ?? "cordial",
    nome_clinica: clinicaData?.nome ?? "Clínica",
    base_conhecimento: ovyvaConfig.base_conhecimento ?? "",
    horario_inicio: ovyvaConfig.horario_inicio ?? "08:00",
    horario_fim: ovyvaConfig.horario_fim ?? "18:00",
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
    const dur = c.duracao_minutos ?? duracaoPadrao
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

  for (let offset = 0; diasVerificados < 7 && offset < 14; offset++) {
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
      slotsLivres.push(`${nomeDia} (${dataFormatada}): ${livresNoDia.join(', ')}`)
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

  const systemPrompt = `
    Você é ${config.nome_assistente}, secretária virtual da clínica "${config.nome_clinica}".
    Tom de atendimento: ${tom[config.tom_voz] ?? "cordial e profissional"}.
    Você está conversando com: ${nomeContato}.
    ${perfilPaciente?.e_paciente_cadastrado ? `Este paciente é cadastrado na clínica.` : ""}
    Data e hora atuais: ${nowBR.toLocaleString("pt-BR")}.

    INFORMAÇÕES DA CLÍNICA:
    ${config.base_conhecimento || "Clínica médica e estética."}

    HORÁRIO DE FUNCIONAMENTO: ${config.horario_inicio} às ${config.horario_fim} (segunda a sábado)

    PROFISSIONAIS DA CLÍNICA:
    ${profissionais.length > 0 ? profissionais.map((p: any) => `- ${p.nome_completo}${p.especialidade ? ` (${p.especialidade})` : ''}`).join('\n') : "Nenhum profissional cadastrado."}

    PROCEDIMENTOS DISPONÍVEIS:
    ${procedimentos.length > 0 ? procedimentos.map((p: any) => `- ${p.nome}: R$ ${p.valor_particular ?? 0} (${p.duracao_minutos ?? 30} min)`).join('\n') : "Nenhum procedimento cadastrado ainda."}

    HORÁRIOS DISPONÍVEIS PARA AGENDAMENTO (próximos dias):
    ${slotsLivres.length > 0 ? slotsLivres.join('\n') : "Nenhum horário disponível nos próximos 7 dias úteis."}
    ${ausenciasFormatadas ? `\nPROFISSIONAIS AUSENTES:\n${ausenciasFormatadas}` : ''}

    REGRAS OBRIGATÓRIAS:
    1. Responda SEMPRE em português brasileiro
    2. Nunca invente procedimentos, valores ou horários que não estejam listados acima
    3. Se não souber algo, diga "vou verificar com nossa equipe e te retorno"
    4. Em emergências médicas, oriente: ligue para SAMU (192)
    5. Seja objetiva — máximo 2-3 frases por resposta, direto ao ponto
    6. ${profissionais.length > 1 ? 'IMPORTANTE: Se o paciente quiser agendar e a clínica tem mais de 1 profissional, PRIMEIRO pergunte com qual profissional ele deseja ser atendido. Liste os nomes dos profissionais disponíveis.' : ''}
    7. Quando o paciente quiser agendar, pergunte qual dia/horário é melhor para ele. Depois VERIFIQUE se está na lista de disponíveis acima. Se não estiver, sugira os 2-3 horários livres mais próximos do que ele pediu.
    8. NUNCA sugira horários que NÃO estão na lista de disponíveis acima
    9. Se o paciente quiser DESMARCAR: use ação "cancelar"
    10. Se o paciente quiser MUDAR DATA/HORA: use ação "reagendar"
    11. CRÍTICO: Quando o paciente CONFIRMAR o agendamento (disser "sim", "pode marcar", "confirmo", "ok", "quero"), use OBRIGATORIAMENTE acao_sugerida="agendar" com data, hora, profissional_nome e procedimento preenchidos. SEM ISSO O AGENDAMENTO NÃO SERÁ CRIADO.
    12. PRIORIDADE: Se o nome for "paciente" (desconhecido), PRIMEIRO pergunte o nome
    13. Se receber imagem, analise e descreva brevemente

    Responda APENAS com JSON válido:
    {
      "resposta": "texto para enviar ao paciente via WhatsApp",
      "intencao_detectada": "agendamento|cancelamento|reagendamento|informacao|reclamacao|emergencia|outro",
      "acao_sugerida": "agendar|cancelar|reagendar|transferir_humano|aguardar|nenhuma",
      "dados_agendamento": {
        "data": "YYYY-MM-DD ou null",
        "hora": "HH:MM ou null",
        "profissional_nome": "nome do profissional ou null",
        "procedimento": "nome do procedimento ou null"
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

      console.log(`[OVYVA] Criando consulta: ${dataHoraInicio} prof=${profissionalId} proced=${(matchProced as any)?.id}`)

      const { error: insertErr } = await supabase.from("consultas").insert({
        clinica_id,
        paciente_id: conversa.paciente_id || null,
        profissional_id: profissionalId,
        procedimento_id: (matchProced as any)?.id || null,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracao,
        status: "agendado",
        observacoes: `[AGENDAMENTO OVYVA] ${conversa.contato_nome || "Contato WhatsApp"} — via WhatsApp.`,
      })
      if (insertErr) console.error("Erro ao criar agendamento:", insertErr)
      else {
        console.log("[OVYVA] Agendamento criado com sucesso!")
        // Notificar profissional via WhatsApp
        await notificarProfissional(supabase, clinica_id, profissionalId, "agendamento",
          `Nova consulta agendada via WhatsApp:\n` +
          `Paciente: ${conversa.contato_nome || "Novo contato"}\n` +
          `Data: ${dataAg?.split("-").reverse().join("/")} as ${horaAg}\n` +
          `Procedimento: ${(matchProced as any)?.nome || "Avaliacao"}`
        )
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
      const { data: currentLead } = await supabase.from("leads")
        .select("estagio, id")
        .eq("conversa_id", conversa.id)
        .single()

      if (currentLead) {
        const currentIdx = stageOrder.indexOf(currentLead.estagio || "")
        const newIdx = stageOrder.indexOf(novoEstagio)
        if (newIdx > currentIdx) {
          leadUpdate.estagio = novoEstagio
          // Atualizar metadata da conversa com o estágio do CRM
          await supabase.from("ovyva_conversas").update({
            metadata: { ...(conversa.metadata ?? {}), lead_stage: novoEstagio, intent: resposta.intencao_detectada },
          }).eq("id", conversa.id)
          // Registrar mudança no histórico
          await supabase.from("leads_historico").insert({
            lead_id: currentLead.id,
            estagio_anterior: currentLead.estagio,
            estagio_novo: novoEstagio,
            anotacao: `[OVYVA IA] Intenção: ${resposta.intencao_detectada}`,
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
        .update({ status: "cancelado", observacoes: "[CANCELADO POR OVYVA] Paciente solicitou cancelamento via WhatsApp." })
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

// ─────────────────────────────────────────
// HELPER: NOTIFICAR PROFISSIONAL VIA WHATSAPP
// ─────────────────────────────────────────
async function notificarProfissional(supabase: any, clinica_id: string, profissional_id: string | null, tipo: string, mensagem: string) {
  if (!profissional_id) return
  try {
    const { data: prof } = await supabase.from("profiles")
      .select("telefone, nome_completo")
      .eq("id", profissional_id)
      .single()
    if (!prof?.telefone) {
      console.log(`[notif] Profissional ${profissional_id} sem telefone cadastrado`)
      return
    }
    // Enfileirar na fila de notificações
    await supabase.from("notificacoes_fila").insert({
      clinica_id,
      tipo: `profissional_${tipo}`,
      canal: "whatsapp",
      destinatario_telefone: prof.telefone,
      destinatario_nome: prof.nome_completo,
      mensagem: `[${clinica_id ? "Clínica" : ""}] ${mensagem}`,
      agendar_para: new Date().toISOString(),
    })
    console.log(`[notif] Profissional ${prof.nome_completo} notificado: ${tipo}`)
  } catch (e: any) {
    console.error("[notif] Erro ao notificar profissional:", e.message)
  }
}