import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  const results = { enviados: 0, erros: 0, aniversarios: 0, cobrancas: 0 }

  try {
    // ═══════════════════════════════════════════
    // 1. PROCESSAR FILA DE NOTIFICAÇÕES PENDENTES
    // ═══════════════════════════════════════════
    const { data: pendentes } = await supabase
      .from("notificacoes_fila")
      .select("*")
      .eq("status", "pendente")
      .lte("agendar_para", new Date().toISOString())
      .order("agendar_para", { ascending: true })
      .limit(50)

    for (const notif of pendentes ?? []) {
      try {
        // Enviar via WhatsApp
        if (notif.canal === "whatsapp" && notif.destinatario_telefone) {
          const { error } = await supabase.functions.invoke("whatsapp-send", {
            body: {
              numero: notif.destinatario_telefone,
              texto: notif.mensagem,
              tipo: "texto",
              clinica_id: notif.clinica_id,
            },
          })

          if (error) throw error
        }

        // Marcar como enviado
        await supabase.from("notificacoes_fila").update({
          status: "enviado",
          enviado_em: new Date().toISOString(),
        }).eq("id", notif.id)

        results.enviados++
      } catch (err: any) {
        // Marcar como erro
        await supabase.from("notificacoes_fila").update({
          status: "erro",
          erro_msg: err.message || "Erro desconhecido",
        }).eq("id", notif.id)

        results.erros++
      }
    }

    // ═══════════════════════════════════════════
    // 2. LEMBRETE DE CONSULTA 2H ANTES VIA WHATSAPP
    // ═══════════════════════════════════════════
    const agora = new Date()
    const daqui2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000)
    const daqui2h30 = new Date(agora.getTime() + 2.5 * 60 * 60 * 1000)

    // Buscar consultas que acontecem entre 2h e 2h30 a partir de agora
    const { data: consultasProximas } = await supabase
      .from("consultas")
      .select("id, clinica_id, paciente_id, profissional_id, data_hora_inicio, duracao_minutos, procedimento_id")
      .in("status", ["agendado", "confirmado"])
      .gte("data_hora_inicio", daqui2h.toISOString())
      .lte("data_hora_inicio", daqui2h30.toISOString())

    for (const consulta of consultasProximas ?? []) {
      // Verificar se já enviou lembrete para esta consulta
      const { count: jaEnviou } = await supabase
        .from("notificacoes_fila")
        .select("id", { count: "exact", head: true })
        .eq("consulta_id", consulta.id)
        .eq("tipo", "lembrete")

      if ((jaEnviou ?? 0) > 0) continue

      // Buscar dados do paciente
      let telefonePaciente = null
      let nomePaciente = "Paciente"
      if (consulta.paciente_id) {
        const { data: pac } = await supabase.from("pacientes")
          .select("nome_completo, telefone, whatsapp")
          .eq("id", consulta.paciente_id)
          .single()
        if (pac) {
          telefonePaciente = pac.whatsapp || pac.telefone
          nomePaciente = pac.nome_completo || "Paciente"
        }
      }

      // Se não tem paciente cadastrado, buscar na conversa do LYRA
      if (!telefonePaciente) {
        const { data: conversaLyra } = await supabase.from("lyra_conversas")
          .select("contato_telefone, contato_nome")
          .eq("clinica_id", consulta.clinica_id)
          .not("contato_telefone", "is", null)
          .order("ultimo_contato", { ascending: false })
          .limit(1)
          .single()
        if (conversaLyra) {
          telefonePaciente = conversaLyra.contato_telefone
          nomePaciente = conversaLyra.contato_nome || nomePaciente
        }
      }

      if (!telefonePaciente) continue

      // Buscar nome da clínica
      const { data: clinicaData } = await supabase.from("clinicas")
        .select("nome").eq("id", consulta.clinica_id).single()

      const horaConsulta = consulta.data_hora_inicio?.split("T")[1]?.substring(0, 5) || "?"
      const dataConsulta = consulta.data_hora_inicio?.split("T")[0]?.split("-").reverse().join("/") || "?"

      // Enfileirar lembrete para o paciente
      await supabase.from("notificacoes_fila").insert({
        clinica_id: consulta.clinica_id,
        tipo: "lembrete",
        canal: "whatsapp",
        destinatario_telefone: telefonePaciente,
        destinatario_nome: nomePaciente,
        paciente_id: consulta.paciente_id,
        consulta_id: consulta.id,
        mensagem: `Ola ${nomePaciente}! Lembramos que sua consulta na ${clinicaData?.nome || "clinica"} esta marcada para hoje as ${horaConsulta}. Caso precise remarcar, entre em contato. Ate logo!`,
        agendar_para: new Date().toISOString(),
      })

      results.enviados++
    }

    // ═══════════════════════════════════════════
    // 3. ANIVERSÁRIOS DO DIA (roda 1x por dia)
    // ═══════════════════════════════════════════
    const hoje = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const dia = String(hoje.getDate()).padStart(2, "0")
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")

    // Buscar clínicas com aniversário habilitado
    const { data: clinicas } = await supabase
      .from("clinicas")
      .select("id, nome, configuracoes")

    for (const clinica of clinicas ?? []) {
      const config = (clinica.configuracoes as any)?.notificacoes
      if (!config?.whatsapp_aniversario) continue

      // Buscar pacientes que fazem aniversário hoje e não foram notificados
      const { data: aniversariantes } = await supabase
        .from("pacientes")
        .select("id, nome_completo, telefone, data_nascimento")
        .eq("clinica_id", clinica.id)
        .not("telefone", "is", null)
        .not("data_nascimento", "is", null)

      for (const pac of aniversariantes ?? []) {
        if (!pac.data_nascimento || !pac.telefone) continue
        const dn = pac.data_nascimento as string
        // Comparar dia/mês
        if (!dn.endsWith(`-${mes}-${dia}`) && !dn.includes(`${mes}-${dia}`)) {
          // Check MM-DD match
          const parts = dn.split("-")
          if (parts.length < 3 || parts[1] !== mes || parts[2] !== dia) continue
        }

        // Verificar se já enviou hoje
        const { count } = await supabase
          .from("notificacoes_fila")
          .select("id", { count: "exact", head: true })
          .eq("paciente_id", pac.id)
          .eq("tipo", "aniversario")
          .gte("created_at", new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString())

        if ((count ?? 0) > 0) continue

        // Enfileirar
        await supabase.from("notificacoes_fila").insert({
          clinica_id: clinica.id,
          tipo: "aniversario",
          canal: "whatsapp",
          destinatario_telefone: pac.telefone,
          destinatario_nome: pac.nome_completo,
          paciente_id: pac.id,
          mensagem: `Feliz aniversário, ${pac.nome_completo}! 🎂 Toda a equipe da ${clinica.nome} deseja muita saúde e felicidades. Conte sempre conosco!`,
          agendar_para: new Date().toISOString(),
        })

        results.aniversarios++
      }
    }

    // ═══════════════════════════════════════════
    // 3. COBRANÇAS PRÓXIMAS DO VENCIMENTO
    // ═══════════════════════════════════════════
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split("T")[0]

    for (const clinica of clinicas ?? []) {
      const config = (clinica.configuracoes as any)?.notificacoes
      if (!config?.whatsapp_cobranca) continue

      // Buscar lançamentos pendentes que vencem amanhã
      const { data: lancamentos } = await supabase
        .from("lancamentos")
        .select("id, paciente_id, valor, vencimento, descricao")
        .eq("clinica_id", clinica.id)
        .eq("status", "pendente")
        .eq("tipo", "receita")
        .eq("vencimento", amanhaStr)

      for (const lanc of lancamentos ?? []) {
        if (!lanc.paciente_id) continue

        const { data: pac } = await supabase
          .from("pacientes")
          .select("nome_completo, telefone")
          .eq("id", lanc.paciente_id)
          .single()

        if (!pac?.telefone) continue

        // Verificar se já notificou
        const { count } = await supabase
          .from("notificacoes_fila")
          .select("id", { count: "exact", head: true })
          .eq("tipo", "cobranca")
          .eq("consulta_id", lanc.id)

        if ((count ?? 0) > 0) continue

        await supabase.from("notificacoes_fila").insert({
          clinica_id: clinica.id,
          tipo: "cobranca",
          canal: "whatsapp",
          destinatario_telefone: pac.telefone,
          destinatario_nome: pac.nome_completo,
          paciente_id: lanc.paciente_id,
          consulta_id: lanc.id,
          mensagem: `Olá ${pac.nome_completo}, lembramos que o valor de R$ ${Number(lanc.valor).toFixed(2)} referente a "${lanc.descricao || "serviço"}" vence amanhã (${amanhaStr.split("-").reverse().join("/")}). Para dúvidas, entre em contato.`,
          agendar_para: new Date().toISOString(),
        })

        results.cobrancas++
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error("notifications-cron error:", err)
    return new Response(JSON.stringify({ error: err.message, ...results }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
