import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const usersToCreate = [
  { email: 'admin@clinicaverde.com.br', password: 'admin123', roleStr: 'administrador', name: 'Administrador Demo' },
  { email: 'profissional@clinicaverde.com.br', password: 'prof123', roleStr: 'profissional', name: 'Profissional Demo' },
  { email: 'recepcao@clinicaverde.com.br', password: 'rec123', roleStr: 'recepcao', name: 'Recepção Demo' }
]

async function seed() {
  console.log("Iniciando Seed de Usuários (Bypass via Admin API)...")
  
  // 1. Check or Create an initial Clinica
  console.log("Verificando se existe alguma clinica...")
  let clinicaId = '00000000-0000-0000-0000-000000000000'
  const { data: clins, error: errC } = await supabase.from('clinicas').select('id').limit(1)
  
  if (clins && clins.length > 0) {
    clinicaId = clins[0].id
    console.log("Clínica existente aproveitada:", clinicaId)
  } else {
    // try to insert
    console.log("Criando nova clínica base...")
    const { data: newClin, error: newClinErr } = await supabase.from('clinicas').insert({
       nome: 'Clínica Verde Matriz',
       email: 'matriz@clinicaverde.com.br'
    }).select('id').single()
    if (newClin) clinicaId = newClin.id
    if (newClinErr) {
       console.log("Não precisou ciar clínica (provavelmente RLS ou ja existe por ID)")
    }
  }

  for (const info of usersToCreate) {
     console.log(`Verificando/Criando usuário: ${info.email}...`)
     const { data: userCreated, error: userError } = await supabase.auth.admin.createUser({
       email: info.email,
       password: info.password,
       email_confirm: true,
       user_metadata: {
         nome_completo: info.name,
         role: info.roleStr,
         clinica_id: clinicaId
       }
     })

     if (userError) {
        if (userError.message.includes('already registered')) {
           console.log(`\t⚠️ Usuário ${info.email} já existe. Tentando forçar atualização de senha/role...`)
           // Optionally update password/metadata to match what's needed for tests
           const { data: foundUsers } = await supabase.auth.admin.listUsers()
           const existing = foundUsers?.users.find(u => u.email === info.email)
           if (existing) {
              await supabase.auth.admin.updateUserById(existing.id, {
                 password: info.password,
                 user_metadata: {
                   nome_completo: info.name,
                   role: info.roleStr,
                   clinica_id: clinicaId
                 }
              })
              console.log("\t✅ Forçado Update de senha/role no usuário existente.")
           }
        } else {
           console.error(`\t❌ Falha ao criar ${info.email}:`, userError.message)
        }
     } else {
        console.log(`\t✅ Criado com sucesso! ID:`, userCreated.user.id)
     }
  }
}

seed().then(() => {
  console.log("Tudo pronto! Você já pode logar.")
  process.exit(0)
}).catch(console.error)
