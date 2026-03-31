import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) return err('Não autorizado', 401)

    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return err('Acesso negado', 403)

    const body = await req.json().catch(() => { throw new Error('JSON inválido') })
    const { action, clinicId, payload, data: bodyData } = body
    const pd = payload ?? bodyData ?? {}

    // ── Helpers ──────────────────────────────────────────
    const count = async (table: string, filter?: { col: string; val: string }) => {
      let q = db.from(table).select('*', { count: 'exact', head: true })
      if (filter) q = q.eq(filter.col, filter.val)
      const { count: c } = await q
      return c ?? 0
    }

    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).toISOString().split('T')[0]

    // ── Actions ──────────────────────────────────────────
    switch (action) {

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // DASHBOARD — Stats globais reais
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_dashboard': {
        // Contagens paralelas
        const [
          totalClinicas, totalUsers, totalPacientes, consultasHoje, totalConsultas,
          totalLeads, totalPrescricoes, totalEvolucoes
        ] = await Promise.all([
          count('clinicas'),
          count('profiles'),
          count('pacientes'),
          db.from('consultas').select('*', { count: 'exact', head: true }).gte('data_hora_inicio', `${today}T00:00:00`).lte('data_hora_inicio', `${today}T23:59:59`).then(r => r.count ?? 0),
          count('consultas'),
          count('leads'),
          count('prescricoes'),
          count('evolucoes'),
        ])

        // Clínicas com status
        const { data: clinicas } = await db.from('clinicas').select('id, nome, configuracoes, created_at').order('created_at', { ascending: false })
        const ativas = clinicas?.filter((c: any) => c.configuracoes?.status === 'ativo').length ?? 0
        const trial = clinicas?.filter((c: any) => !c.configuracoes?.status || c.configuracoes?.status === 'trial').length ?? 0
        const suspensas = clinicas?.filter((c: any) => c.configuracoes?.status === 'suspensa').length ?? 0

        // AI usage real
        const { data: aiLogs } = await db.from('ai_usage_logs').select('custo_estimado, tokens_entrada, tokens_saida')
        const aiCalls = aiLogs?.length ?? 0
        const aiCost = aiLogs?.reduce((s: number, l: any) => s + (l.custo_estimado ?? 0), 0) ?? 0
        const aiTokens = aiLogs?.reduce((s: number, l: any) => s + (l.tokens_entrada ?? 0) + (l.tokens_saida ?? 0), 0) ?? 0

        // Consultas últimos 7 dias (para gráfico)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        const { data: consultasWeek } = await db.from('consultas').select('data_hora_inicio').gte('data_hora_inicio', `${sevenDaysAgo}T00:00:00`).order('data_hora_inicio')
        const consultasPorDia: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
          consultasPorDia[d] = 0
        }
        consultasWeek?.forEach((c: any) => {
          const d = c.data_hora_inicio?.split('T')[0]
          if (d && consultasPorDia[d] !== undefined) consultasPorDia[d]++
        })

        // Últimas 5 clínicas criadas
        const recentClinicas = clinicas?.slice(0, 5).map((c: any) => ({
          id: c.id, nome: c.nome, created_at: c.created_at,
          status: c.configuracoes?.status || 'trial',
        })) ?? []

        // MRR baseado no plano (não no status)
        const precos: Record<string, number> = { starter: 97, professional: 197, clinic: 397, enterprise: 797 }
        const mrr = (clinicas ?? [])
          .filter((c: any) => c.configuracoes?.status !== 'suspensa')
          .reduce((sum: number, c: any) => sum + (precos[c.configuracoes?.plano] ?? 0), 0)

        return ok({
          clinicas: { total: totalClinicas, ativas, trial, suspensas },
          usuarios: totalUsers,
          pacientes: totalPacientes,
          consultas: { hoje: consultasHoje, total: totalConsultas, porDia: consultasPorDia },
          leads: totalLeads,
          prescricoes: totalPrescricoes,
          evolucoes: totalEvolucoes,
          ai: { calls: aiCalls, cost: Number(aiCost.toFixed(4)), tokens: aiTokens },
          mrr,
          recentClinicas,
        })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CLÍNICAS — Lista enriquecida
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_clinics': {
        const { data: clinicas, error: cErr } = await db.from('clinicas').select('*').order('created_at', { ascending: false })
        if (cErr) throw cErr

        const enriched = await Promise.all((clinicas ?? []).map(async (c: any) => {
          const [users, pacientes, consultas, leads, whatsapp] = await Promise.all([
            count('profiles', { col: 'clinica_id', val: c.id }),
            count('pacientes', { col: 'clinica_id', val: c.id }),
            count('consultas', { col: 'clinica_id', val: c.id }),
            count('leads', { col: 'clinica_id', val: c.id }),
            db.from('whatsapp_instancias').select('status_conexao').eq('clinica_id', c.id).then(r => ({
              total: r.data?.length ?? 0,
              online: r.data?.filter((i: any) => i.status_conexao === 'open').length ?? 0,
            })),
          ])
          return {
            id: c.id, nome: c.nome, cnpj: c.cnpj, email: c.email, telefone: c.telefone,
            logo_url: c.logo_url, created_at: c.created_at,
            status: c.configuracoes?.status || 'trial',
            plano: c.configuracoes?.plano || 'Trial',
            users, pacientes, consultas, leads,
            whatsapp,
          }
        }))

        return ok(enriched)
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CLÍNICA — Criar
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'create_clinic': {
        const { data: newClinic, error: clinicErr } = await db
          .from('clinicas')
          .insert({
            nome: pd.nome, cnpj: pd.cnpj || null,
            email: pd.email_admin ?? pd.email ?? null,
            telefone: pd.telefone || null,
            configuracoes: { plano: pd.plano ?? 'Trial', status: 'trial', criado_por_superadmin: true }
          })
          .select().single()
        if (clinicErr) throw clinicErr

        if (pd.email_admin && pd.senha_admin) {
          const { data: adminAuth, error: adminErr } = await db.auth.admin.createUser({
            email: pd.email_admin, password: pd.senha_admin, email_confirm: true,
          })
          if (!adminErr && adminAuth.user) {
            await db.from('profiles').upsert({
              id: adminAuth.user.id, nome_completo: pd.nome_admin || 'Administrador',
              email: pd.email_admin, role: 'admin', clinica_id: newClinic.id, ativo: true,
            })
          }
        }

        await db.from('auditoria_global').insert({
          usuario_id: user.id, clinica_id: newClinic.id, acao: 'CREATE_CLINIC',
          recurso: 'clinicas', recurso_id: newClinic.id, resultado: 'sucesso', dados_depois: newClinic,
        }).catch(() => {})

        return ok({ clinica: newClinic })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CLÍNICA — Suspender / Reativar
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'suspend_clinic': {
        const targetId = clinicId ?? pd.clinicaId
        if (!targetId) throw new Error('clinicaId obrigatório')

        const novoStatus = pd.suspender ? 'suspensa' : 'ativo'

        // Buscar configuracoes atuais para merge seguro
        const { data: current, error: fetchErr } = await db.from('clinicas').select('configuracoes').eq('id', targetId).single()
        if (fetchErr) throw new Error(`Clínica não encontrada: ${fetchErr.message}`)

        const merged = Object.assign({}, current?.configuracoes ?? {}, {
          status: novoStatus,
          motivo_suspensao: pd.suspender ? (pd.motivo || 'Suspensão via SuperAdmin') : null,
        })

        const { error: sErr } = await db.from('clinicas')
          .update({ configuracoes: merged })
          .eq('id', targetId)
        if (sErr) throw new Error(`Falha ao atualizar: ${sErr.message}`)

        // Log de auditoria (não bloqueia a operação se falhar)
        try {
          await db.from('auditoria_global').insert({
            usuario_id: user.id, clinica_id: targetId,
            acao: pd.suspender ? 'SUSPEND_CLINIC' : 'REACTIVATE_CLINIC',
            recurso: 'clinicas', recurso_id: targetId, resultado: 'sucesso',
          })
        } catch { /* ignore audit errors */ }

        return ok({ success: true, status: novoStatus })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CLÍNICA — Zerar histórico de conversas LYRA
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'reset_conversations': {
        const targetId = clinicId ?? pd.clinicaId
        if (!targetId) throw new Error('clinicaId obrigatório')

        // Buscar IDs das conversas da clínica
        const { data: conversas } = await db.from('lyra_conversas')
          .select('id').eq('clinica_id', targetId)
        const ids = (conversas ?? []).map((c: any) => c.id)

        let msgsDeletadas = 0
        let convsDeletadas = 0

        if (ids.length > 0) {
          // Deletar mensagens de todas as conversas
          const { count: mc } = await db.from('lyra_mensagens')
            .delete({ count: 'exact' })
            .in('conversa_id', ids)
          msgsDeletadas = mc ?? 0

          // Deletar as conversas
          const { count: cc } = await db.from('lyra_conversas')
            .delete({ count: 'exact' })
            .eq('clinica_id', targetId)
          convsDeletadas = cc ?? 0
        }

        // Log auditoria
        try {
          await db.from('auditoria_global').insert({
            usuario_id: user.id, clinica_id: targetId,
            acao: 'RESET_CONVERSATIONS', recurso: 'lyra_conversas',
            resultado: 'sucesso',
            dados_depois: { conversas: convsDeletadas, mensagens: msgsDeletadas },
          })
        } catch { /* ignore */ }

        return ok({ success: true, conversas: convsDeletadas, mensagens: msgsDeletadas })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CLÍNICA — Deletar
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'delete_clinic': {
        const targetId = clinicId ?? pd.clinicaId
        if (!targetId) throw new Error('clinicaId obrigatório')
        await db.from('auditoria_global').delete().eq('clinica_id', targetId)
        await db.from('profiles').delete().eq('clinica_id', targetId)
        const { error: delErr } = await db.from('clinicas').delete().eq('id', targetId)
        if (delErr) throw delErr
        return ok({ success: true })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PLANO — Alterar plano de clínica
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'update_clinic_plan': {
        const targetId = pd.clinica_id
        if (!targetId) throw new Error('clinica_id obrigatório')
        const novoPlano = pd.plano_id as string
        const novoStatus = (pd.status as string) ?? 'ativo'
        const trialAte = pd.trial_ate ?? null

        // Buscar configuracoes atuais da clínica
        const { data: clinicaAtual } = await db.from('clinicas').select('configuracoes').eq('id', targetId).single()
        const configAtual = (clinicaAtual?.configuracoes as any) ?? {}

        const { error: updErr } = await db.from('clinicas').update({
          configuracoes: { ...configAtual, plano: novoPlano },
          status_plano: novoStatus,
          trial_ate: trialAte,
        }).eq('id', targetId)

        if (updErr) throw updErr
        return ok({ success: true })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // USUÁRIOS — Lista com auth metadata
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_users': {
        const { data: profiles, error: pErr } = await db.from('profiles')
          .select('*, clinicas(nome)')
          .order('created_at', { ascending: false })
        if (pErr) throw pErr

        const { data: authData } = await db.auth.admin.listUsers()
        const authMap = new Map<string, { last_sign_in_at: string | null; created_at: string }>()
        authData?.users?.forEach((au: any) => {
          authMap.set(au.id, { last_sign_in_at: au.last_sign_in_at, created_at: au.created_at })
        })

        const users = (profiles ?? []).map((p: any) => ({
          ...p,
          last_login: authMap.get(p.id)?.last_sign_in_at || null,
          auth_created: authMap.get(p.id)?.created_at || null,
        }))

        return ok({ users })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // USUÁRIO — Criar
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'create_user': {
        const { email, senha, nome, role: userRole, clinica_id, especialidade, conselho } = pd
        if (!email || !senha || !nome) throw new Error('Campos obrigatórios: email, senha, nome')

        const { data: authData, error: authErr2 } = await db.auth.admin.createUser({
          email, password: senha, email_confirm: true,
        })
        if (authErr2) throw new Error(authErr2.message)

        const { error: profileErr } = await db.from('profiles').upsert({
          id: authData.user.id, nome_completo: nome, email,
          role: userRole || 'profissional', clinica_id: clinica_id || null,
          especialidade: especialidade || null, conselho: conselho || null,
          ativo: !!clinica_id,
        })
        if (profileErr) {
          await db.auth.admin.deleteUser(authData.user.id)
          throw new Error(profileErr.message)
        }

        return ok({ success: true, user_id: authData.user.id })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // USUÁRIO — Atualizar (role, ativo, clinica_id)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'update_user': {
        const userId = pd.user_id
        if (!userId) throw new Error('user_id obrigatório')
        const updates: Record<string, unknown> = {}
        if (pd.role !== undefined) updates.role = pd.role
        if (pd.ativo !== undefined) updates.ativo = pd.ativo
        if (pd.clinica_id !== undefined) updates.clinica_id = pd.clinica_id || null
        if (Object.keys(updates).length === 0) throw new Error('Nenhum campo para atualizar')
        const { error: uErr } = await db.from('profiles').update(updates).eq('id', userId)
        if (uErr) throw new Error(uErr.message)
        return ok({ success: true })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SUPORTE — CRUD completo de tickets + mensagens
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'create_ticket': {
        const { assunto, descricao, prioridade, clinica_id: ticketClinicId } = pd
        if (!assunto) throw new Error('assunto obrigatório')
        const { data: ticket, error: tErr } = await db.from('tickets_suporte').insert({
          assunto, descricao: descricao || null,
          prioridade: prioridade || 'media', status: 'aberto',
          clinica_id: ticketClinicId || null,
        }).select().single()
        if (tErr) throw new Error(tErr.message)
        return ok({ ticket })
      }

      case 'update_ticket': {
        const ticketId = pd.ticket_id
        if (!ticketId) throw new Error('ticket_id obrigatório')
        const updates: Record<string, unknown> = {}
        if (pd.status !== undefined) updates.status = pd.status
        if (pd.prioridade !== undefined) updates.prioridade = pd.prioridade
        if (pd.responsavel_id !== undefined) updates.responsavel_id = pd.responsavel_id
        updates.updated_at = new Date().toISOString()
        const { error: utErr } = await db.from('tickets_suporte').update(updates).eq('id', ticketId)
        if (utErr) throw new Error(utErr.message)
        return ok({ success: true })
      }

      case 'get_ticket_messages': {
        const ticketId = pd.ticket_id
        if (!ticketId) throw new Error('ticket_id obrigatório')
        const { data: messages, error: mErr } = await db.from('tickets_mensagens')
          .select('*, profiles:autor_id(nome_completo, role, avatar_url)')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
        if (mErr) throw new Error(mErr.message)
        return ok({ messages: messages ?? [] })
      }

      case 'send_ticket_message': {
        const { ticket_id: msgTicketId, conteudo, e_superadmin: isSuperAdmin, imagem_url } = pd
        if (!msgTicketId || (!conteudo && !imagem_url)) throw new Error('ticket_id e conteudo/imagem obrigatórios')
        const { data: msg, error: smErr } = await db.from('tickets_mensagens').insert({
          ticket_id: msgTicketId, autor_id: user.id,
          conteudo: conteudo || '', e_superadmin: isSuperAdmin ?? true,
          imagem_url: imagem_url || null,
        }).select().single()
        if (smErr) throw new Error(smErr.message)
        // Atualizar ticket status para em_andamento se ainda está aberto
        await db.from('tickets_suporte')
          .update({ status: 'em_andamento', updated_at: new Date().toISOString() })
          .eq('id', msgTicketId).eq('status', 'aberto')
        return ok({ message: msg })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // FINANCEIRO — Métricas reais
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_financeiro': {
        const { data: clinicas } = await db.from('clinicas').select('id, nome, configuracoes, created_at')

        // Preços por plano
        const precos: Record<string, number> = { starter: 97, professional: 197, clinic: 397, enterprise: 797 }
        const planosPagos = Object.keys(precos) // planos que geram receita

        // Classificar por PLANO (não por status)
        const allClinics = clinicas ?? []
        const pagantes = allClinics.filter((c: any) => {
          const plano = c.configuracoes?.plano || 'Trial'
          return planosPagos.includes(plano) && c.configuracoes?.status !== 'suspensa'
        })
        const trials = allClinics.filter((c: any) => {
          const plano = c.configuracoes?.plano || 'Trial'
          return plano === 'Trial' || !planosPagos.includes(plano)
        })
        const suspensas = allClinics.filter((c: any) => c.configuracoes?.status === 'suspensa')

        // MRR = soma dos preços dos planos pagos (não-suspensos)
        const mrr = pagantes.reduce((sum: number, c: any) => {
          const plano = c.configuracoes?.plano || 'Trial'
          return sum + (precos[plano] ?? 0)
        }, 0)
        const ltv = pagantes.length > 0 ? (mrr / pagantes.length) * 12 : 0

        // Receita real das clínicas (lançamentos pagos)
        const { data: transacoes } = await db.from('lancamentos').select('valor, tipo, status')
          .eq('tipo', 'receita').eq('status', 'pago')
        const receitaTotal = transacoes?.reduce((s: number, t: any) => s + (t.valor ?? 0), 0) ?? 0

        // Agrupar por plano
        const planoCount: Record<string, number> = {}
        allClinics.forEach((c: any) => {
          const p = c.configuracoes?.plano || 'Trial'
          planoCount[p] = (planoCount[p] ?? 0) + 1
        })

        return ok({
          mrr, arr: mrr * 12, ltv, churn: 0,
          receitaClinicas: receitaTotal,
          planos: Object.entries({ trial: 0, ...precos }).map(([nome, valor]) => ({
            nome, valor, count: planoCount[nome] ?? 0,
          })),
          clinicas: allClinics.map((c: any) => ({
            id: c.id, nome: c.nome, created_at: c.created_at,
            status: c.configuracoes?.status || 'trial',
            plano: c.configuracoes?.plano || 'Trial',
          })),
        })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LOGS — Auditoria global
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_audit_logs': {
        const limit = pd.limit ?? 200
        const { data: logs, error: lErr } = await db.from('auditoria_global')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (lErr) throw lErr
        return ok({ logs: logs ?? [] })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SUPORTE — Tickets reais
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'get_suporte': {
        const { data: tickets } = await db.from('tickets_suporte')
          .select('*, clinicas(nome)')
          .order('created_at', { ascending: false })

        const { data: mensagens } = await db.from('tickets_mensagens')
          .select('ticket_id, id')

        // Contar mensagens por ticket
        const msgCount: Record<string, number> = {}
        mensagens?.forEach((m: any) => {
          msgCount[m.ticket_id] = (msgCount[m.ticket_id] ?? 0) + 1
        })

        const enriched = (tickets ?? []).map((t: any) => ({
          ...t,
          clinica_nome: t.clinicas?.nome ?? 'Sem clínica',
          total_mensagens: msgCount[t.id] ?? 0,
        }))

        return ok({ tickets: enriched })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // IMPERSONATE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'impersonate_clinic': {
        const targetId = clinicId ?? pd.clinicaId
        if (!targetId) throw new Error('clinicaId obrigatório')
        await db.from('auditoria_global').insert({
          usuario_id: user.id, clinica_id: targetId,
          acao: 'IMPERSONATE_CLINIC', recurso: 'clinicas',
          recurso_id: targetId, resultado: 'sucesso',
        }).catch(() => {})
        return ok({ token: btoa(`${targetId}-${Date.now()}`), expires: new Date(Date.now() + 7200000).toISOString() })
      }

      default:
        throw new Error(`Ação não suportada: ${action}`)
    }
  } catch (error) {
    return err((error as Error).message)
  }
})
