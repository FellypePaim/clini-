import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://mddbbwbwmwcvecbnfmqg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc')
async function run() {
  const {data, error} = await supabase.from('clinicas').select('*')
  if (error) console.error("Error:", error.message)
  else console.log("Data length:", data.length)
}
run()
