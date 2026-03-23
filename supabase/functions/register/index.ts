import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const { action } = body

    // ═══════════════════════════════════════════════
    // AÇÃO: Registrar Admin + Clínica
    // ═══════════════════════════════════════════════
    if (action === "register_admin") {
      const { email, senha, nome, clinica_nome, clinica_cnpj, clinica_telefone, clinica_endereco } = body

      if (!email || !senha || !nome || !clinica_nome) {
        return json({ error: "Campos obrigatórios: email, senha, nome, clinica_nome" }, 400)
      }

      // 1. Criar auth user
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })
      if (authErr) return json({ error: authErr.message }, 400)

      // 2. Criar clínica
      const { data: clinica, error: clinicaErr } = await supabaseAdmin
        .from("clinicas")
        .insert({
          nome: clinica_nome,
          cnpj: clinica_cnpj || null,
          telefone: clinica_telefone || null,
          endereco: clinica_endereco || null,
          configuracoes: { status: "trial" },
        })
        .select("id")
        .single()

      if (clinicaErr) {
        // Rollback: deletar auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return json({ error: clinicaErr.message }, 400)
      }

      // 3. Criar profile como admin
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: authData.user.id,
          nome_completo: nome,
          email,
          role: "admin",
          clinica_id: clinica.id,
          ativo: true,
        })

      if (profileErr) {
        // Rollback
        await supabaseAdmin.from("clinicas").delete().eq("id", clinica.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return json({ error: profileErr.message }, 400)
      }

      return json({ success: true, clinica_id: clinica.id, user_id: authData.user.id })
    }

    // ═══════════════════════════════════════════════
    // AÇÃO: Registrar Funcionário (sem clínica)
    // ═══════════════════════════════════════════════
    if (action === "register_funcionario") {
      const { email, senha, nome, telefone, especialidade, conselho } = body

      if (!email || !senha || !nome) {
        return json({ error: "Campos obrigatórios: email, senha, nome" }, 400)
      }

      // 1. Criar auth user
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })
      if (authErr) return json({ error: authErr.message }, 400)

      // 2. Criar profile sem clinica_id
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: authData.user.id,
          nome_completo: nome,
          email,
          telefone: telefone || null,
          especialidade: especialidade || null,
          conselho: conselho || null,
          role: "profissional",
          clinica_id: null,
          ativo: false,
        })

      if (profileErr) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return json({ error: profileErr.message }, 400)
      }

      return json({ success: true, user_id: authData.user.id })
    }

    return json({ error: "Ação não reconhecida" }, 400)

  } catch (err: any) {
    return json({ error: err.message || "Erro interno" }, 500)
  }
})
