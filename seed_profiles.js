import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function setup() {
  console.log("Populating profiles...")
  const users = [
    { id: '5c0ecea2-ae5c-448b-99f3-44e4ff6ca335', email: 'admin@clinicaverde.com.br', nome: 'Dr. Rafael Mendes (Admin)', role: 'admin' },
    { id: '8e81b0c0-ee45-495d-ad30-13caa272d557', email: 'profissional@clinicaverde.com.br', nome: 'Dr. Profissional', role: 'profissional' },
    { id: '24a580c4-7e36-424a-8b80-6acad655ca16', email: 'recepcao@clinicaverde.com.br', nome: 'Recepção', role: 'recepcao' }
  ]

  for (const u of users) {
     const { error } = await supabase.from('profiles').insert({
       id: u.id,
       email: u.email,
       nome_completo: u.nome,
       role: u.role,
       clinica_id: '00000000-0000-0000-0000-000000000001'
     })
     if (error) console.error(`Failed for ${u.email}:`, error.message)
     else console.log(`Success for ${u.email}`)
  }
}

setup()
