import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function test() {
  const { data: tables, error } = await supabase.rpc('get_tables_info')
  if (error) {
     // fallback to direct table checks
     const check = async (name) => {
        const { error } = await supabase.from(name).select('id').limit(1)
        console.log(`Table ${name}:`, error ? error.message : 'EXISTS')
     }
     await check('clinicas')
     await check('profiles')
     await check('pacientes')
     await check('ovyva_conversas')
  } else {
     console.log("Tables:", tables)
  }
}

test()
