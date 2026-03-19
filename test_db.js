import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function test() {
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error("Error listing users:", error)
    return
  }
  console.log("Users found:", users.users.map(u => u.email))
  
  const { data: profiles, error: errP } = await supabase.from('profiles').select('*')
  if (errP) console.log("Profiles error:", errP)
  else console.log("Profiles found:", profiles.length)

  // Find the professional Dr Rafael Mendes ID
  const rdm = profiles?.find(p => p.nome_completo?.includes('Rafael'))
  console.log("Dr Rafael profile:", rdm?.id, rdm?.role, rdm?.clinica_id)
}

test()
