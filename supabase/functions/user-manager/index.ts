import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Criar cliente com service_role para poder criar usuários
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar autenticação do solicitante (deve ser admin da clínica)
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validar token do solicitante
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    )
    const { data: { user: requestingUser }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verificar se o solicitante é admin na clínica
    const { data: solicitanteProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, clinica_id")
      .eq("id", requestingUser.id)
      .single()

    if (!solicitanteProfile || !["admin", "administrador"].includes(solicitanteProfile.role)) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar colaboradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const body = await req.json()
    const { action } = body

    if (action === "create_user") {
      const { email, senha, nome, role, especialidade, conselho, clinica_id } = body

      // Validar que clinica_id é da mesma clínica do solicitante
      if (clinica_id !== solicitanteProfile.clinica_id) {
        return new Response(JSON.stringify({ error: "Acesso negado: clínica incompatível" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Criar usuário no Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome_completo: nome,
          role,
          clinica_id,
        },
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Criar/atualizar profile (trigger já deve criar, mas garantimos aqui)
      await supabaseAdmin.from("profiles").upsert({
        id: newUser.user.id,
        clinica_id,
        nome_completo: nome,
        role,
        especialidade: especialidade || null,
        conselho: conselho || null,
        ativo: true,
      })

      return new Response(JSON.stringify({ user: newUser.user, success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "disable_user") {
      const { user_id } = body

      // Verificar que o usuário pertence à mesma clínica
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("clinica_id")
        .eq("id", user_id)
        .single()

      if (targetProfile?.clinica_id !== solicitanteProfile.clinica_id) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: "876600h" })
      await supabaseAdmin.from("profiles").update({ ativo: false }).eq("id", user_id)

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
