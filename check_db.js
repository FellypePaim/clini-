import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_trigger_def') 
  // Probably no RPC named get_trigger_def. I'll just check if profiles requires a column I'm not providing.
  console.log("Checking profiles table info...")
  const { data: pinfo, error: ep } = await supabase.from('profiles').select('*').limit(1)
  console.log("Profiles error:", ep)
}

checkTriggers()
