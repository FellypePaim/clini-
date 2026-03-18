## 1. IDENTIDADE DO PROJETO
- Nome: Prontuário Verde
- Tipo: SaaS multi-tenant para clínicas médicas, odontológicas e estéticas
- Stack: React + TypeScript + Vite + Tailwind + shadcn/ui + Zustand + Supabase
- Gerador: Antigravity
- Supabase Project Ref: mddbbwbwmwcvecbnfmqg
- Supabase URL: https://mddbbwbwmwcvecbnfmqg.supabase.co

## 2. STATUS DAS FASES
- Fase 1: ✅ Estrutura base + Dashboard
- Fase 2: ✅ Módulo Agenda
- Fase 3A: ✅ PEP — Pacientes + Anamnese
- Fase 3B: ✅ PEP — Prontuário + Prescrição + Harmonização
- Fase 4: ✅ OVYVA (UI completa)
- Fase 5: ✅ Verdesk CRM Kanban
- Fase 6: ✅ Financeiro
- Fase 7: ✅ Estoque
- Fase 8: ✅ Relatórios + Configurações
- Fase 9A: ✅ Schema SQL Supabase (15 tabelas + RLS + triggers)
- Fase 9B: ✅ Frontend conectado ao Supabase
- Fase 10: ✅ IA Gemini 2.5 Flash integrada (4 actions funcionando)
- Fase 11: ✅ Storage Supabase (8 buckets configurados)
- Fase 12: 🔜 WhatsApp Evolution API (próxima)
- Fase 13: 🔜 Deploy produção (Vercel/Netlify)

## 3. BACKEND — SUPABASE

### Tabelas criadas:
clinicas, profiles, pacientes, anamneses, documentos_paciente,
procedimentos, consultas, evolucoes, prescricoes, termos_consentimento,
harmonizacoes, ovyva_conversas, ovyva_mensagens, leads, leads_historico,
campanhas, orcamentos, lancamentos, convenios, produtos_estoque,
estoque_movimentacoes, procedimento_insumos, ai_usage_logs

### Colunas adicionadas após schema inicial:
- ovyva_conversas: metadata JSONB, total_mensagens INTEGER, ultimo_contato TIMESTAMPTZ
- ovyva_mensagens: metadata JSONB, sessao_id UUID, sessao_inicio BOOLEAN
- harmonizacoes: mapa_url TEXT
- documentos_paciente: storage_path TEXT

### Constraints adicionadas:
- ovyva_conversas: UNIQUE (clinica_id, contato_telefone)

### Views criadas:
- ovyva_conversas_com_preview

### RLS:
- Ativo em todas as tabelas
- Policies service_role criadas para: clinicas, leads, ovyva_conversas,
  ovyva_mensagens, pacientes

### Dados de teste no banco:
- clinicas: id = 00000000-0000-0000-0000-000000000001 (Clínica Teste)
- ovyva_conversas: número 11999990001 com metadata aguardando_nome

## 4. EDGE FUNCTIONS DEPLOYADAS

### ai-gateway (✅ funcionando)
Actions disponíveis:
- detect_intent → gemini-2.5-flash-lite ✅ testado
- transcribe_audio → gemini-2.5-flash ✅ testado  
- generate_summary → gemini-2.5-flash ✅ testado
- ovyva_respond → gemini-2.5-flash ✅ testado

Lógica de auth: aceita JWT de usuário OU qualquer token com length > 100
Lógica OVYVA: conversa permanente por número, pede nome no 1º contato

### whatsapp-webhook (🔜 criado mas não deployado)
### whatsapp-send (🔜 criado mas não deployado)

## 5. SECRETS DA EDGE FUNCTION (já configurados)
- GEMINI_API_KEY ✅
- SUPABASE_URL ✅
- SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅
- SUPABASE_DB_URL ✅
- EVOLUTION_API_URL 🔜 adicionar
- EVOLUTION_API_KEY 🔜 adicionar
- EVOLUTION_INSTANCE 🔜 adicionar

## 6. STORAGE — BUCKETS CONFIGURADOS
- clinica-assets ✅ público
- pacientes-documentos ✅ privado
- pacientes-exames ✅ privado
- pacientes-fotos ✅ privado
- prontuario-termos ✅ privado
- prontuario-receitas ✅ privado
- harmonizacao-mapas ✅ privado
- anamnese-assets ✅ privado

Políticas: RLS ativo + service_role com acesso total

## 7. ARQUIVOS IMPORTANTES NO PROJETO
- src/lib/supabase.ts → cliente Supabase
- src/lib/database.types.ts → tipos gerados do banco
- src/lib/storage.ts → helpers de Storage
- src/components/ui/FileUpload.tsx → componente de upload
- src/components/ui/FileViewer.tsx → componente de visualização
- supabase/functions/ai-gateway/index.ts → Edge Function IA
- supabase/functions/whatsapp-webhook/index.ts → Edge Function WhatsApp entrada
- supabase/functions/whatsapp-send/index.ts → Edge Function WhatsApp saída
- CONTEXTO_PROJETO.md → este arquivo

## 8. PRÓXIMOS PASSOS (em ordem)
1. Rodar testes automatizados do Storage (/dev/storage-diagnostico)
2. Configurar Evolution API (Railway recomendado para começar)
3. Deploy whatsapp-webhook e whatsapp-send
4. Configurar webhook na Evolution API apontando para o Supabase
5. Testar fluxo completo: paciente manda WhatsApp → Sofia responde
6. Deploy em produção na Vercel/Netlify
7. Criar primeiro usuário e clínica reais no banco
8. QA completo com clínica piloto

## 9. COMANDOS ÚTEIS

Deploy Edge Function:
npx supabase functions deploy NOME_DA_FUNCTION --project-ref mddbbwbwmwcvecbnfmqg

Gerar tipos TypeScript do banco:
npx supabase gen types typescript --project-id mddbbwbwmwcvecbnfmqg > src/lib/database.types.ts

Testar Edge Function (PowerShell):
Usar service role key como Bearer token

## 10. DECISÕES DE ARQUITETURA TOMADAS
- IA: Google Gemini 2.5 Flash (não OpenAI) — melhor custo-benefício
- WhatsApp: Evolution API v2 (não Meta oficial) — mais flexível
- Storage: Supabase Storage (não S3) — integrado ao projeto
- Autenticação Edge Functions: token.length > 100 para aceitar service_role
- OVYVA: 1 conversa permanente por número de WhatsApp por clínica
- Identificação de paciente: pede apenas o nome (não CPF) no 1º contato
- Modelos por tarefa:
  - detect_intent → gemini-2.5-flash-lite (barato, tarefa simples)
  - transcribe_audio → gemini-2.5-flash (processa áudio nativo)
  - generate_summary → gemini-2.5-flash (raciocínio estruturado)
  - ovyva_respond → gemini-2.5-flash (qualidade nas respostas)
