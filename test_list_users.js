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
  console.log("Users found in auth.users:", users.users.map(u => u.email))
}

test()
