import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://mddbbwbwmwcvecbnfmqg.supabase.co"
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function reset() {
  console.log("Resetting conversations and messages...")
  
  // Excluir mensagens primeiro devido a chave estrangeira
  const { error: errM } = await supabase.from('ovyva_mensagens').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deleta tudo
  if (errM) console.error("Error deleting messages:", errM.message)
  else console.log("All messages deleted.")

  // Excluir conversas
  const { error: errC } = await supabase.from('ovyva_conversas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (errC) console.error("Error deleting conversations:", errC.message)
  else console.log("All conversations deleted.")

  // Opcional: Limpar leads se necessário? O usuário não pediu explicitamente, mas se eles vêm das conversas...
  // Vou manter os leads por enquanto, a menos que as tabelas de conversa_id no lead precisem ser nulas.
}

reset()
