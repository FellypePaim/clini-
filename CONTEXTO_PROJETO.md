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
- Fase 8: ✅ Relatórios + Configurações (Integrados com dados reais do Supabase)
- Fase 9A: ✅ Schema SQL Supabase (15+ tabelas + RLS + triggers)
- Fase 9B: ✅ Frontend conectado ao Supabase
- Fase 10: ✅ IA Gemini 2.5 Flash integrada (4 actions funcionando)
- Fase 11: ✅ Storage Supabase (8 buckets configurados)
- Fase 12: ✅ WhatsApp Evolution API Multi- Fase 14: ✅ SuperAdmin Global (Painel 100% funcional + Nova Clínica + Export Financeiro + Login Tracking Fix)
- Fase 13: 🔜 Deploy produção (Vercel/Netlify)
- Fase 15: ✅ Diagnósticos e Testes Automatizados Sistêmicos (20/20 Testes Passados)

## 3. BACKEND — SUPABASE

### Tabelas criadas:
clinicas, profiles, pacientes, anamneses, documentos_paciente,
procedimentos, consultas, evolucoes, prescricoes, termos_consentimento,
harmonizacoes, ovyva_conversas, ovyva_mensagens, leads, leads_historico,
campanhas, orcamentos, lancamentos, convenios, produtos_estoque,
estoque_movimentacoes, procedimento_insumos, ai_usage_logs, whatsapp_instancias,
auditoria_global, feature_flags, tickets_suporte, releases

### Colunas adicionadas após schema inicial:
- ovyva_conversas: metadata JSONB, total_mensagens INTEGER, ultimo_contato TIMESTAMPTZ
- ovyva_mensagens: metadata JSONB, sessao_id UUID, sessao_inicio BOOLEAN
- harmonizacoes: mapa_url TEXT
- documentos_paciente: storage_path TEXT

### Constraints adicionadas:
- ovyva_conversas: UNIQUE (clinica_id, contato_telefone)
- whatsapp_instancias: UNIQUE (nome_instancia)

### Views criadas:
- ovyva_conversas_com_preview

### RLS:
- Ativo em todas as tabelas
- Policies service_role criadas para: clinicas, leads, ovyva_conversas, ovyva_mensagens, pacientes
- Policy clinicas_ve_suas_instancias na `whatsapp_instancias`

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

### whatsapp-webhook (✅ funcionando - atualizada multi-tenant)
Lógica:
1. Recebe webhook da Evolution API (`MESSAGES_UPSERT`, `CONNECTION_UPDATE`)
2. Identifica o `instanceName` no payload
3. Busca `clinica_id` referente àquela instância na tabela `whatsapp_instancias` (com fallbacks p/ dev)
4. Encaminha para o `ai-gateway` gerar e enviar a resposta.

### whatsapp-manager (✅ funcionando)
Gerencia o ciclo de vida das instâncias do WhatsApp por clínica. Actions:
- `criar_instancia`: Cria na Evolution, vincula clínica e auto-insere o webhook
- `obter_qrcode`: Busca QR base64
- `verificar_status`: Sincroniza estado de conexão
- `desconectar`: Desloga o número da instância
- `listar`: Retorna as instâncias da clínica ativa

### superadmin-actions (✅ funcionando - Versão 2.1)
Edge Function protegida para operações globais via SuperAdmin:
- `get_platform_stats`: DASHBOARD FIX (Métricas reais de Ativas vs Trial vs Suspensas).
- `get_users`: LOGIN FIX (Varre Auth Admin p/ refletir `last_sign_in_at` real em vez de PROFILE).
- `manage_clinic_status`: Ativa/Suspende clínicas remotamente.
- `create_clinic`: Provisionamento 100% (Nova base de dados + Auditoria).
- `impersonate_user`: Geração de Token Admin p/ suporte direto.

## 5. SECRETS DA EDGE Função (já configurados)
- GEMINI_API_KEY ✅
- SUPABASE_URL ✅
- SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅
- SUPABASE_DB_URL ✅
- EVOLUTION_API_URL ✅
- EVOLUTION_API_KEY ✅
- CLINICA_ID (Fallback em dev) ✅

## 6. STORAGE — BUCKETS CONFIGURADOS
- clinica-assets ✅ público
- pacientes-documentos ✅ privado
- pacientes-exames ✅ privado
- pacientes-fotos ✅ privado
- prontuario-termos ✅ privado
- prontuario-receitas ✅ privado
- harmonizacao-mapas ✅ privado
- anamnese-assets ✅ privado

## 7. ARQUIVOS IMPORTANTES NO PROJETO
- src/pages/SuperAdmin/* → Painel de controle global (Dashboard, Clínicas, Usuários, IA, Financeiro).
- src/components/superadmin/NovaClinicaModal.tsx → Modal de criação de clínicas.
- src/hooks/useSuperAdmin.ts → Hook de conexão centralizado com service_role actions.
- supabase/functions/superadmin-actions/index.ts → Backend administrativo global.
- CONTEXTO_PROJETO.md → Histórico/Arquitetura (Este arquivo).

## 8. PRÓXIMOS PASSOS (Fase 13/15)
1. Deploy final em produção com integração de domínios customizados.
2. Implementação de Relatórios Avançados (PDF / Excel).
3. Hardening de segurança nas Edge Functions (IP Whitelisting).

## 9. COMANDOS ÚTEIS
Deploy Edge Function:
npx supabase functions deploy NAME --project-ref mddbbwbwmwcvecbnfmqg --no-verify-jwt

## 10. DECISÕES DE ARQUITETURA TOMADAS
- **SuperAdmin Security**: O uso de `service_role` nas Edge Functions permite bypass seguro de RLS para auditoria global sem expor chaves ao frontend.
- **Dynamic Icon Rendering**: Implementado padrão de segurança `const Icon = ...` com fallbacks para evitar `undefined element crashes` em dados dinâmicos da IA e WhatsApp.
- **Real-Time Counters**: Sincronização direta de metatags de clínicas para dashboard em vez de queries agendadas (mais ágil).

## Relatório de Testes Automatizados (SuperAdmin)
### ✅ Status Final: 20/20 Testes Passaram
1. **Auth & Acesso** (4/4): Login, Roles e Rota Protegida.
2. **Dashboard Global** (3/3): KPIs reais de Clínicas (Fix Ativas/Trial), Usuários e Pacientes.
3. **Financeiro Global** (1/1): Export CSV Funcional + MRR Real.
4. **Resiliência UI** (2/2): Fix de Runtime Crashes em IA/WA Monitor.

**SISTEMA ESTÁVEL E TESTADO ✅**
**PRONTUÁRIO VERDE v1.0.4**e Impersonation.
10. **Configurações Globais** (2/2): Feature Flags e Planos.

**TESTES SUPERADMIN COMPLETOS ✅**
Total de testes: 20
Passaram: 20
Falharam: 0
Corrigidos: 4
Pendentes: 0
