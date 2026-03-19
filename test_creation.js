import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function setup() {
  const { data: user, error: errU } = await supabase.auth.admin.createUser({
    email: 'diagnostico@test.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      nome_completo: 'Teste Diagnostico',
      role: 'admin',
      clinica_id: '00000000-0000-0000-0000-000000000001'
    }
  })

  if (errU) console.error("Error:", errU.message)
  else console.log("User created:", user.user.id)
}

setup()
