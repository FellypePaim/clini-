import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-client@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Verificar se o usuário autenticado é SUPERADMIN
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Acesso não autorizado')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      throw new Error('Apenas superadmins podem realizar esta ação.')
    }

    const { action, clinicId, data } = await req.json()

    // 2. Roteamento de Ações Administrative
    let result = null

    switch (action) {
      case 'get_platform_stats':
        // Simulação de KPIs globais — implementar queries reais
        result = {
          clinics: { active: 42, total: 45 },
          users: { active: 284, total: 310 },
          patientBase: 45200,
          appointmentsToday: 1248,
          aiUsage: { calls: 85420, cost: 142.50 },
          uptime: 99.98,
          mrr: 38420
        }
        break

      case 'create_clinic':
        // Transactional: Create Clinic -> Create Admin User -> Send Welcome Email
        const { data: newClinic, error: clinicErr } = await supabaseClient
          .from('clinicas')
          .insert({
            nome: data.nome,
            cnpj: data.cnpj,
            email: data.email,
            plano_id: data.planoId,
            status_plano: 'trial',
          })
          .select()
          .single()

        if (clinicErr) throw clinicErr
        
        // Log auditing manually
        await supabaseClient.from('auditoria_global').insert({
          usuario_id: user.id,
          clinica_id: newClinic.id,
          acao: 'CREATE_CLINIC',
          recurso: 'clinicas',
          recurso_id: newClinic.id,
          dados_depois: newClinic
        })

        result = newClinic
        break

      case 'impersonate_clinic':
        // Generate a custom OTP or temporary token (simulado)
        result = { 
          token: btoa(`${clinicId}-${Date.now()}`),
          expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
        break

      default:
        throw new Error(`Ação não suportada: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
