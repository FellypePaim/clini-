## 1. IDENTIDADE DO PROJETO
- Nome: Prontuário Verde
- Tipo: SaaS multi-tenant para clínicas médicas, odontológicas e estéticas
- Stack: React 19 + TypeScript 5.9 + Vite 8 + Tailwind 4 + shadcn/ui + Zustand 5 + Supabase
- Gerador: Antigravity
- Supabase Project Ref: mddbbwbwmwcvecbnfmqg
- Supabase URL: https://mddbbwbwmwcvecbnfmqg.supabase.co
- Versão: **v2.1.0** (Landing Page + Dark Clinical Redesign — 29/03/2026)

## 2. STATUS DAS FASES
- Fase 1: ✅ Estrutura base + Dashboard
- Fase 2: ✅ Módulo Agenda (com drag-and-drop)
- Fase 3A: ✅ PEP — Pacientes + Anamnese
- Fase 3B: ✅ PEP — Prontuário + Prescrição + Harmonização
- Fase 4: ✅ LYRA (UI + IA v2 — agendar/cancelar/reagendar)
- Fase 5: ✅ Nexus CRM Kanban
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
- Fase 20: ✅ **SuperAdmin v2 — 100% dados reais, sem hardcode (27/03/2026)**
- Fase 21: ✅ **LYRA v3 — agendamento real, CRM auto, WhatsApp funcional (28/03/2026)**
- Fase 22: ✅ **Segurança RBAC + Melhorias por Role (29/03/2026)**
- Fase 23: ✅ **Dark Clinical Redesign — UI/UX v2.0 (29/03/2026)**
- Fase 24: ✅ **Landing Page — 8 seções + Quiz WhatsApp (29/03/2026)**

## 3. BACKEND — SUPABASE

### Tabelas criadas:
clinicas, profiles, pacientes, anamneses, documentos_paciente,
procedimentos, consultas, evolucoes, prescricoes, termos_consentimento,
harmonizacoes, lyra_conversas, lyra_mensagens, leads, leads_historico,
campanhas, orcamentos, lancamentos, convenios, produtos_estoque,
estoque_movimentacoes, procedimento_insumos, ai_usage_logs, whatsapp_instancias,
auditoria_global, feature_flags, tickets_suporte, releases,
profissional_ausencias, notificacoes_fila

### Colunas adicionadas:
- lyra_conversas: metadata JSONB, total_mensagens INTEGER, ultimo_contato TIMESTAMPTZ
- lyra_mensagens: metadata JSONB, sessao_id UUID, sessao_inicio BOOLEAN
- harmonizacoes: mapeamento JSONB (dados do mapa facial)
- documentos_paciente: storage_path TEXT
- profiles: conselho TEXT, telefone TEXT, clinica_id nullable (para registro pendente)

### Constraints:
- lyra_conversas: UNIQUE (clinica_id, contato_telefone)
- whatsapp_instancias: UNIQUE (nome_instancia)

### Função helper:
- `get_my_clinica_id()` — SECURITY DEFINER, retorna clinica_id do auth.uid() sem acionar RLS

### RLS:
- Ativo em todas as tabelas
- Profiles: SELECT/UPDATE via `get_my_clinica_id()` (evita recursão infinita)
- Profiles: INSERT próprio (`id = auth.uid()`)
- Clinicas: INSERT para authenticated, SELECT via clinica_id do profile
- lyra_conversas, lyra_mensagens, leads, whatsapp_instancias: RLS por clinica_id
- Anon policies: anamneses INSERT, pacientes SELECT/UPDATE por paciente_id via JWT

### Migrations (supabase/migrations/):
1. `20260319000001_lancamentos.sql` — Lançamentos financeiros + RLS
2. `20260319000002_prescricoes.sql` — Prescrições + RLS
3. `20260319000003_estoque.sql` — Estoque completo + RLS
4. `20260321000001_anamnese_public_policy.sql` — Policy anon anamneses
5. `20260322000001_fix_anon_rls_policies.sql` — Fix cast uuid/text
6. `20260322000002_rls_ovyva_leads_whatsapp.sql` — RLS LYRA/leads/WhatsApp
7. `20260323000001_profiles_allow_null_clinica.sql` — clinica_id nullable + self-insert
8. `20260323000002_allow_clinica_creation_on_register.sql` — Policy INSERT clinicas
9. `20260323000003_add_conselho_telefone_to_profiles.sql` — Colunas conselho/telefone
10. `20260323000004_profiles_rls_same_clinica.sql` — SELECT mesma clínica
11. `20260323000005_fix_profiles_rls_recursion.sql` — SECURITY DEFINER function
12. `20260323000006_profiles_update_same_clinica.sql` — UPDATE mesma clínica
13. `20260324000001_ai_usage_logs.sql` — Tabela ai_usage_logs + RLS
14. `20260325000001_profissional_ausencias.sql` — Tabela ausências/folgas + RLS

## 4. EDGE FUNCTIONS DEPLOYADAS

### ai-gateway (✅ v5 — atualizada 28/03/2026)
Actions:
- `detect_intent` → gemini-2.5-flash-lite
- `transcribe_audio` → gemini-2.5-flash
- `generate_summary` → gemini-2.5-flash
- `lyra_respond` → gemini-2.5-flash (prompt compacto, slots reais 3 dias, auto-cadastro paciente, CRM auto, notif profissional)
- `dashboard_insights` → gemini-2.5-flash-lite

### LYRA v3 — Funcionalidades (28/03/2026):
- Auto-cadastro de paciente (nome + WhatsApp) quando IA coleta nome completo
- Agendamento real na tabela `consultas` com timezone BR (-03:00)
- Anti-duplicata: verifica se já existe consulta no mesmo horário
- Notificação imediata ao profissional via WhatsApp (agendar/cancelar/reagendar)
- CRM automático: cria lead + avança estágio baseado na intenção da IA
- Pausa IA por contato quando humano assume atendimento
- Chat LYRA: envio real via whatsapp-send, assinatura do atendente
- Lock de concorrência + deduplicação de mensagens
- Fallback robusto: se IA falha, envia mensagem padrão (nunca fica mudo)
- Profissionais: só role=profissional no prompt (admin/recepção excluídos)
- Webhook Evolution API v2: campos camelCase, enabled:true, QRCODE_UPDATED

### whatsapp-webhook (✅ v3 — 28/03/2026)
- Recebe webhook da Evolution API v2
- Deduplicação de mensagens (mesmo texto + conversa + 60s)
- Cria lead no CRM automaticamente ao novo contato
- Salva pushName do contato
- Pausa IA se conversa em `atendido_humano`
- Fallback: se IA falha, envia "instabilidade momentânea"

### whatsapp-manager (✅ v2 — 28/03/2026)
- criar_instancia, obter_qrcode, verificar_status, desconectar, listar
- excluir_instancia (logout + delete Evolution + remove DB)
- reconectar (restart + novo QR code)
- Webhook auto-config Evolution API v2 (camelCase, enabled:true)

### whatsapp-send (✅ v2 — 28/03/2026)
- Envia texto/imagem/documento via Evolution API
- Busca instância dinâmica da clínica no banco (não mais hardcoded)

### superadmin-actions (✅ v4 — reescrita 27/03/2026)
6 abas 100% funcionais, 0 dados fictícios:
- get_dashboard — KPIs globais, gráfico 7d, AI usage, últimas clínicas
- get_clinics — lista enriquecida (users, pacientes, consultas, leads, WhatsApp)
- create_clinic, suspend_clinic, delete_clinic, impersonate_clinic
- get_users, create_user, update_user (role, ativo, clinica_id)
- get_financeiro — MRR/ARR/LTV baseado no plano (não status), receita real
- get_audit_logs — auditoria global
- get_suporte, create_ticket, update_ticket, get_ticket_messages, send_ticket_message

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

### SuperAdmin (v2 — 6 abas, 100% real)
- `/superadmin` — Dashboard com KPIs globais, gráfico consultas 7d, AI usage
- `/superadmin/clinicas` — CRUD clínicas, contagens reais, suspender/reativar/deletar
- `/superadmin/usuarios` — Gerenciar todos os users (toggle ativo, alterar role, mover clínica)
- `/superadmin/financeiro` — MRR/ARR/LTV baseado no plano, receita real de lançamentos
- `/superadmin/logs` — Auditoria global com filtros e export CSV
- `/superadmin/suporte` — Two-panel chat: tickets + mensagens em tempo real

## 8. LYRA — AGENTE IA v3

### Capacidades:
- **Agendar**: Cria consulta REAL na tabela `consultas` (timezone BR -03:00)
- **Cancelar**: Cancela consultas do próprio paciente + notifica profissional
- **Reagendar**: Cancela anterior + cria nova + notifica profissional
- **Transferir**: Marca conversa para atendimento humano (pausa IA)
- **Informar**: Responde sobre procedimentos, preços, horários
- **Auto-cadastro**: Cria paciente quando coleta nome completo (nome + WhatsApp)
- **CRM automático**: Cria lead + avança estágio (perguntou → interessado → agendado)
- **Notificar profissional**: WhatsApp imediato em agendar/cancelar/reagendar

### Contexto do prompt (compacto ~500 bytes):
- Nome/tom da assistente + clínica
- Lista de profissionais (só role=profissional)
- Procedimentos com valores
- Consultas agendadas DESTE contato
- Slots livres reais (3 dias úteis, calculados no backend)
- Ausências de profissionais (dias filtrados)
- Histórico limitado a 20 mensagens

### Segurança:
- Paciente só cancela/reagenda consultas dele mesmo
- Anti-duplicata: verifica antes de inserir
- Deduplicação de mensagens no webhook
- Fallback robusto: se Gemini falha → mensagem padrão
- Lock: pausa IA quando humano assume

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
- LYRA respeita ausências automaticamente (não sugere horários)
- Notificação enviada DIRETO via whatsapp-send (não espera CRON)
- CRON (15min): lembrete 2h antes de consultas + aniversários + cobranças

## 11. ALERTAS DO SISTEMA (SINO)
- Consultas agendadas hoje
- Pré-agendamentos LYRA pendentes (respeita toggle `sistema_consulta_pendente`)
- Novos leads 24h (respeita toggle `sistema_novo_lead`)
- Estoque crítico (respeita toggle `sistema_estoque_baixo`)
- Badge vermelho com contador, dropdown clicável, auto-refresh 2min

## 12. ARQUIVOS IMPORTANTES
- `src/pages/Login/RegisterPage.tsx` — Fluxo de registro (admin/funcionário)
- `src/pages/Login/WaitingApprovalPage.tsx` — Tela de espera para funcionários
- `src/pages/SuperAdmin/*` — Painel de controle global
- `src/components/superadmin/NovaClinicaModal.tsx` — Modal de criação com admin
- `src/hooks/useSuperAdmin.ts` — Hook SuperAdmin (createClinic, createUser, etc.)
- `supabase/functions/ai-gateway/index.ts` — Backend IA (LYRA, insights, etc.)
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

## 14. SISTEMA DE SUPORTE
- Tabelas: `tickets_suporte` (assunto, descricao, status, prioridade, clinica_id) + `tickets_mensagens` (conteudo, autor_id, e_superadmin)
- SuperAdmin: two-panel chat — lista tickets + conversa em tempo real
- Status: aberto → em_andamento → resolvido → fechado
- Prioridade: baixa, media, alta, critica
- Mensagens diferenciadas por remetente (superadmin=roxo direita, clínica=cinza esquerda)
- Chat desabilitado em tickets fechados/resolvidos

## 15. FASE 22 — SEGURANÇA RBAC + MELHORIAS (29/03/2026)

### RequireRole Guard (AppRouter.tsx)
- Componente `RequireRole` protege rotas por array de roles permitidos
- `/financeiro`, `/estoque/*`, `/prescricoes`, `/relatorios/*` → admin + profissional
- `/configuracoes/*` → admin only
- `/lyra/configuracoes` → admin only
- `/lyra/historico` → admin + profissional
- Recepção redireciona para `/dashboard` se tentar acessar URL restrita

### usePermissions Reforçado (authStore.ts)
- Expõe permissões granulares: `canViewFinancial`, `canManageStock`, `canManagePatients`, `canWritePrescriptions`, `canViewReports`, `canManageUsers`, `canViewAllSchedules`
- Helper `hasRole(...roles)` para checks pontuais

### Correções por Módulo
- **Dashboard**: personalizado por role (recepção sem gráficos/insights), filtro de período (Hoje/Semana/Mês), barras KPI com % real, cálculo de data corrigido
- **Agenda**: profissional só vê suas consultas, verificação de ausências antes de agendar, profissionais carregados do banco (não dos appointments), recorrência funcional (semanal/quinzenal/mensal), drag-drop com lock anti-double
- **Pacientes**: botões criar/importar ocultos para recepção, perfil com tabs filtrados por role (recepção só vê resumo/docs/termos)
- **LYRA**: config protegida (admin only), clinica_id em takeover/return, metadata do atendente salva, label dinâmico por role, realtime estabilizado
- **Nexus**: profissional é somente leitura (sem criar leads, sem drag-drop)
- **Financeiro**: profissional só vê seus lançamentos, categorias customizáveis da config da clínica
- **Estoque**: custos ocultos para profissional (mostra "Produtos Ativos" em vez de "Valor em Estoque")
- **Prescrições**: só dono ou admin pode editar/cancelar/excluir
- **Configurações**: anti-escalação (non-admin não pode criar admin), LGPD export só admin, não pode desativar própria conta, CNPJ validado com algoritmo real
- **Header**: alertas filtrados por role, dismissals persistem em localStorage, links admin ocultos para non-admin

### Arquivos Alterados (22 arquivos, 4 commits)
- `src/router/AppRouter.tsx` — RequireRole guard
- `src/store/authStore.ts` — usePermissions reforçado
- `src/components/dashboard/KpiCards.tsx` — filtro período + barras reais
- `src/components/dashboard/PacientesRecentes.tsx` — N+1 fix + clinica_id
- `src/components/dashboard/ProcedimentosPieChart.tsx` — cálculo data fix
- `src/components/dashboard/ConsultasChart.tsx` — error handling
- `src/components/layout/Header.tsx` — alertas filtrados + dismiss persistente
- `src/components/layout/Sidebar.tsx` — versão 1.7.0
- `src/components/lyra/ChatWindow.tsx` — label dinâmico
- `src/hooks/useAgenda.ts` — filtro profissional + ausências + recorrência
- `src/hooks/useLYRA.ts` — clinica_id + metadata + realtime fix
- `src/hooks/useFinanceiro.ts` — filtro profissional
- `src/hooks/usePrescricoes.ts` — canModify() check
- `src/pages/Dashboard/DashboardPage.tsx` — personalizado por role + filtro período
- `src/pages/Agenda/AgendaPage.tsx` — profissionais do banco + drag lock
- `src/pages/Pacientes/PacientesPage.tsx` — canManagePatients
- `src/pages/Pacientes/PatientProfilePage.tsx` — tabs filtrados por role
- `src/pages/Lyra/LyraPage.tsx` — botões config/histórico por role
- `src/pages/Nexus/NexusPage.tsx` — permissões por role
- `src/pages/Financeiro/FinanceiroPage.tsx` — categorias customizáveis
- `src/pages/Estoque/EstoquePage.tsx` — custos ocultos
- `src/pages/Configuracoes/ProfissionaisPage.tsx` — anti-escalação
- `src/pages/Configuracoes/SegurancaPage.tsx` — LGPD guard
- `src/pages/Configuracoes/ClinicaPage.tsx` — CNPJ validação

## 16. FASE 23 — DARK CLINICAL REDESIGN v2.0 (29/03/2026)

### Design System
- **Tipografia:** DM Sans (substituiu Inter) — weights 300-800
- **Paleta:** cyan (#0891b2) + indigo (#6366f1) + emerald (#10b981) + amber (#f59e0b) — substituiu verde #16A34A
- **Estilo:** Glassmorphism (backdrop-filter blur, rgba borders, radial glows)
- **Referências:** Apple Health + Figma/Vercel

### Dark/Light Mode
- **Store:** `src/store/themeStore.ts` (Zustand + persist em localStorage)
- **Tokens:** CSS custom properties em `src/index.css` (`:root` = dark, `.light` = override)
- **Toggle:** Botão sol/lua no rodapé da Sidebar
- **Default:** Dark mode (respeita `prefers-color-scheme` como fallback)

### Componentes Redesenhados (40+ arquivos)
- Layout: Sidebar, Header, MainLayout
- Dashboard: KpiCards, ConsultasChart, ProcedimentosPieChart, AgendamentosList, PacientesRecentes, LeadsRecentes
- UI: Badge, Avatar, ToastProvider
- Login: sempre dark (glassmorphism + gradiente brand)
- Agenda: DayView, WeekView, AppointmentCard, AppointmentModal
- LYRA: ChatWindow, ConversationList, ContactContext
- Pacientes: PacientesPage, PatientProfilePage
- Nexus: NexusPage, LeadCard, KanbanColumn
- Financeiro, Estoque, Prescrições, Relatórios, Configurações
- PDF generation: PatientTerms (setFillColor corrigido)

### Spec e Plano
- Spec: `docs/superpowers/specs/2026-03-29-dark-clinical-redesign-design.md`
- Plano: `docs/superpowers/plans/2026-03-29-dark-clinical-redesign.md`

## 17. FASE 24 — LANDING PAGE (29/03/2026)

### Estrutura (8 secoes + navbar)
- Navbar fixa glassmorphism com scroll-aware opacity
- Hero com blobs animados + mockup 3D parallax
- Social Proof com contadores animados + marquee
- Features showcase com tabs interativas (6 modulos)
- LYRA chat ao vivo (typing animation sequencial)
- Beneficios com cards stagger entrance
- Depoimentos carousel glassmorphism
- Quiz interativo (8 perguntas) + score + WhatsApp CTA
- Footer com CTA final + links + badges LGPD

### Quiz → WhatsApp
- 8 perguntas diagnosticam + qualificam a clinica
- Score de digitalizacao calculado (perguntas 4-7)
- Mensagem pre-preenchida enviada para 5537998195029
- Confetti no resultado

### Arquivos (12 novos)
- `src/pages/Landing/LandingPage.tsx` + 9 section components
- `src/hooks/useInView.ts` + `src/hooks/useCountUp.ts`
- Dependencia: canvas-confetti

## 18. MIGRATIONS ADICIONAIS
- `20260325000002_clinicas_update_policy.sql` — RLS UPDATE para clinicas
- `20260328000001_whatsapp_instancias_columns.sql` — qr_code_base64, status_conexao, status, numero_conectado, updated_at

## 16. PRÓXIMOS PASSOS
1. Deploy final em produção (Vercel)
2. UI para clínicas abrirem tickets de suporte (lado do admin da clínica)
3. Busca Global (Ctrl+K)
4. Tela "Meu Perfil" acessível por todos os roles (sem Configurações)
5. Upload de imagens no suporte
