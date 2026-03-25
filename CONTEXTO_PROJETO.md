## 1. IDENTIDADE DO PROJETO
- Nome: Prontuário Verde
- Tipo: SaaS multi-tenant para clínicas médicas, odontológicas e estéticas
- Stack: React 19 + TypeScript 5.9 + Vite 8 + Tailwind 4 + shadcn/ui + Zustand 5 + Supabase
- Gerador: Antigravity
- Supabase Project Ref: mddbbwbwmwcvecbnfmqg
- Supabase URL: https://mddbbwbwmwcvecbnfmqg.supabase.co
- Versão: **v1.4.0** (Ausências, UX fixes, Alertas sistema — 25/03/2026)

## 2. STATUS DAS FASES
- Fase 1: ✅ Estrutura base + Dashboard
- Fase 2: ✅ Módulo Agenda (com drag-and-drop)
- Fase 3A: ✅ PEP — Pacientes + Anamnese
- Fase 3B: ✅ PEP — Prontuário + Prescrição + Harmonização
- Fase 4: ✅ OVYVA (UI + IA v2 — agendar/cancelar/reagendar)
- Fase 5: ✅ Verdesk CRM Kanban
- Fase 6: ✅ Financeiro
- Fase 7: ✅ Estoque
- Fase 8: ✅ Relatórios + Configurações
- Fase 9A: ✅ Schema SQL Supabase (40+ tabelas + RLS + triggers)
- Fase 9B: ✅ Frontend conectado ao Supabase
- Fase 10: ✅ IA Gemini 2.5 Flash integrada (5 actions)
- Fase 11: ✅ Storage Supabase (8 buckets)
- Fase 12: ✅ WhatsApp Evolution API Multi-Tenant
- Fase 13: 🔜 Deploy produção (Vercel/Netlify)
- Fase 14: ✅ SuperAdmin Global (criar clínica com admin + criar usuário)
- Fase 15: ✅ Diagnósticos e Testes
- Fase 16: ✅ Revisão Geral Completa — 65+ correções
- Fase 17: ✅ **Fluxo de Registro + Multi-tenant hardening (23/03/2026)**
- Fase 18: ✅ **Types sync + ai_usage_logs + Code-splitting (24/03/2026)**
- Fase 19: ✅ **Gestão de Ausências de Profissionais (25/03/2026)**

## 3. BACKEND — SUPABASE

### Tabelas criadas:
clinicas, profiles, pacientes, anamneses, documentos_paciente,
procedimentos, consultas, evolucoes, prescricoes, termos_consentimento,
harmonizacoes, ovyva_conversas, ovyva_mensagens, leads, leads_historico,
campanhas, orcamentos, lancamentos, convenios, produtos_estoque,
estoque_movimentacoes, procedimento_insumos, ai_usage_logs, whatsapp_instancias,
auditoria_global, feature_flags, tickets_suporte, releases,
profissional_ausencias, notificacoes_fila

### Colunas adicionadas:
- ovyva_conversas: metadata JSONB, total_mensagens INTEGER, ultimo_contato TIMESTAMPTZ
- ovyva_mensagens: metadata JSONB, sessao_id UUID, sessao_inicio BOOLEAN
- harmonizacoes: mapeamento JSONB (dados do mapa facial)
- documentos_paciente: storage_path TEXT
- profiles: conselho TEXT, telefone TEXT, clinica_id nullable (para registro pendente)

### Constraints:
- ovyva_conversas: UNIQUE (clinica_id, contato_telefone)
- whatsapp_instancias: UNIQUE (nome_instancia)

### Função helper:
- `get_my_clinica_id()` — SECURITY DEFINER, retorna clinica_id do auth.uid() sem acionar RLS

### RLS:
- Ativo em todas as tabelas
- Profiles: SELECT/UPDATE via `get_my_clinica_id()` (evita recursão infinita)
- Profiles: INSERT próprio (`id = auth.uid()`)
- Clinicas: INSERT para authenticated, SELECT via clinica_id do profile
- ovyva_conversas, ovyva_mensagens, leads, whatsapp_instancias: RLS por clinica_id
- Anon policies: anamneses INSERT, pacientes SELECT/UPDATE por paciente_id via JWT

### Migrations (supabase/migrations/):
1. `20260319000001_lancamentos.sql` — Lançamentos financeiros + RLS
2. `20260319000002_prescricoes.sql` — Prescrições + RLS
3. `20260319000003_estoque.sql` — Estoque completo + RLS
4. `20260321000001_anamnese_public_policy.sql` — Policy anon anamneses
5. `20260322000001_fix_anon_rls_policies.sql` — Fix cast uuid/text
6. `20260322000002_rls_ovyva_leads_whatsapp.sql` — RLS OVYVA/leads/WhatsApp
7. `20260323000001_profiles_allow_null_clinica.sql` — clinica_id nullable + self-insert
8. `20260323000002_allow_clinica_creation_on_register.sql` — Policy INSERT clinicas
9. `20260323000003_add_conselho_telefone_to_profiles.sql` — Colunas conselho/telefone
10. `20260323000004_profiles_rls_same_clinica.sql` — SELECT mesma clínica
11. `20260323000005_fix_profiles_rls_recursion.sql` — SECURITY DEFINER function
12. `20260323000006_profiles_update_same_clinica.sql` — UPDATE mesma clínica
13. `20260324000001_ai_usage_logs.sql` — Tabela ai_usage_logs + RLS
14. `20260325000001_profissional_ausencias.sql` — Tabela ausências/folgas + RLS

## 4. EDGE FUNCTIONS DEPLOYADAS

### ai-gateway (✅ v3 — atualizada 25/03/2026)
Actions:
- `detect_intent` → gemini-2.5-flash-lite
- `transcribe_audio` → gemini-2.5-flash
- `generate_summary` → gemini-2.5-flash
- `ovyva_respond` → gemini-2.5-flash (com reagendamento, horários, ausências profissionais)
- `dashboard_insights` → gemini-2.5-flash-lite

### whatsapp-webhook (✅ multi-tenant, fail-fast)
- Recebe webhook da Evolution API
- Identifica clinica_id pela instância (sem fallback env var)
- Encaminha para ai-gateway

### whatsapp-manager (✅)
- criar_instancia, obter_qrcode, verificar_status, desconectar, listar

### whatsapp-send (✅)
- Envia texto/imagem/documento via Evolution API

### superadmin-actions (✅ v3)
- get_platform_stats, get_clinics, create_clinic (com admin), create_user
- get_users, manage_clinic_status, impersonate_user
- get_audit_logs, get_financeiro_stats, get_ia_stats, get_whatsapp_stats

### user-manager (✅ v2 — --no-verify-jwt)
- create_user (admin cria colaborador com auth + profile)
- disable_user (ban + ativo=false)
- link_user (vincular colaborador existente por e-mail)

### register (✅ --no-verify-jwt, endpoint público)
- register_admin (cria auth + clínica + profile admin, com rollback)
- register_funcionario (cria auth + profile sem clínica, pendente)

## 5. SECRETS
- GEMINI_API_KEY ✅
- SUPABASE_URL ✅
- SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅
- SUPABASE_DB_URL ✅
- EVOLUTION_API_URL ✅
- EVOLUTION_API_KEY ✅
- EVOLUTION_INSTANCE ✅

## 6. STORAGE — BUCKETS
- clinica-assets ✅ público
- pacientes-documentos ✅ privado
- pacientes-exames ✅ privado
- pacientes-fotos ✅ privado
- prontuario-termos ✅ privado
- prontuario-receitas ✅ privado
- harmonizacao-mapas ✅ privado
- anamnese-assets ✅ privado

## 7. FLUXO DE REGISTRO

### Admin (nova clínica)
1. `/register` → escolhe "Administrador"
2. Preenche dados da clínica + dados pessoais
3. Edge function `register` cria: auth user → clínica → profile (admin, ativo)
4. Redireciona para `/login`

### Funcionário
1. `/register` → escolhe "Funcionário"
2. Preenche dados pessoais (nome, email, telefone, especialidade, conselho)
3. Edge function `register` cria: auth user → profile (sem clinica_id, inativo)
4. Redireciona para `/login` → ao logar cai em `/aguardando-aprovacao`
5. Polling automático (15s) verifica se foi vinculado
6. Admin vai em Configurações → Profissionais → "Vincular por E-mail"
7. Ao vincular, funcionário recebe acesso imediato

### SuperAdmin
- Pode criar clínicas com admin pelo painel `/superadmin/clinicas`
- Pode criar usuários e vincular a qualquer clínica em `/superadmin/usuarios`

## 8. OVYVA — AGENTE IA v2

### Capacidades:
- **Agendar**: Cria pré-agendamento (status pendente), aceita pacientes cadastrados e não-cadastrados
- **Cancelar**: Cancela consultas futuras (agendado/confirmado/pendente)
- **Reagendar**: Cancela atual + cria nova consulta
- **Transferir**: Marca conversa para atendimento humano
- **Informar**: Responde sobre procedimentos, preços, horários

### Contexto do prompt:
- Nome/tom da assistente personalizado por clínica
- Horário de funcionamento (config da clínica)
- Data/hora atuais para contexto temporal
- Tabela de procedimentos com valores reais (valor_particular)
- Agenda ocupada (data_hora_inicio)
- **Ausências de profissionais** (não sugere horários em dias de folga)
- Perfil do paciente se vinculado
- Histórico de 20 mensagens
- Base de conhecimento customizada

## 9. AGENDA — DRAG-AND-DROP
- DayView: arrastar cards para mudar horário (snap 15min)
- WeekView: arrastar entre dias e horários
- Preview visual com borda tracejada verde
- Atualiza data_hora_inicio/fim no banco automaticamente
- Duração preservada ao mover

## 10. GESTÃO DE AUSÊNCIAS
- Tabela `profissional_ausencias`: data_inicio, data_fim, tipo (folga/atestado/férias/outro), motivo
- Modal em Configurações > Profissionais com detecção de conflitos
- 3 opções ao conflitar: cancelar + notificar WhatsApp / cancelar sem notificar / apenas marcar folga
- Bloqueio visual na Agenda (DayView + WeekView) — overlay "Profissional ausente"
- OVYVA respeita ausências automaticamente (não sugere horários)
- Notificação enfileirada em `notificacoes_fila` tipo `cancelamento_ausencia`

## 11. ALERTAS DO SISTEMA (SINO)
- Consultas agendadas hoje
- Pré-agendamentos OVYVA pendentes (respeita toggle `sistema_consulta_pendente`)
- Novos leads 24h (respeita toggle `sistema_novo_lead`)
- Estoque crítico (respeita toggle `sistema_estoque_baixo`)
- Badge vermelho com contador, dropdown clicável, auto-refresh 2min

## 12. ARQUIVOS IMPORTANTES
- `src/pages/Login/RegisterPage.tsx` — Fluxo de registro (admin/funcionário)
- `src/pages/Login/WaitingApprovalPage.tsx` — Tela de espera para funcionários
- `src/pages/SuperAdmin/*` — Painel de controle global
- `src/components/superadmin/NovaClinicaModal.tsx` — Modal de criação com admin
- `src/hooks/useSuperAdmin.ts` — Hook SuperAdmin (createClinic, createUser, etc.)
- `supabase/functions/ai-gateway/index.ts` — Backend IA (OVYVA, insights, etc.)
- `supabase/functions/register/index.ts` — Registro público
- `supabase/functions/user-manager/index.ts` — Gerenciamento de colaboradores
- `src/hooks/useAusencias.ts` — CRUD ausências + conflitos + notificação
- `src/components/configuracoes/AusenciasModal.tsx` — Modal de gestão de folgas
- `CONTEXTO_PROJETO.md` — Este arquivo

## 13. CODE-SPLITTING
- Todas as 57+ páginas usam `React.lazy()` + `Suspense`
- Bundle inicial: 3.1MB → **562KB** (redução de 82%)
- ~60 chunks lazy: relatórios, SuperAdmin, jsPDF, recharts carregam sob demanda
- Helper `lazyNamed()` para named exports em `src/router/AppRouter.tsx`

## 14. PRÓXIMOS PASSOS
1. Deploy final em produção (Vercel)
2. Testar fluxo WhatsApp completo (Evolution API + OVYVA)
