import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY 

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  const actions = ['get_ia_stats', 'get_whatsapp_stats', 'get_financeiro_stats', 'get_suporte_tickets', 'get_audit_logs', 'get_users']
  for (const action of actions) {
    const { data, error } = await supabase.functions.invoke('superadmin-actions', {
      body: { action }
    })
    console.log(action, error ? 'ERROR: ' + error.message : 'OK - data length/keys: ' + Object.keys(data).join(', '))
  }
}
test()
