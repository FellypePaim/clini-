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
- Fase 12: ✅ WhatsApp Evolution API Multi-Tenant (Instâncias por Clínica + UI Conexão)
- Fase 14: ✅ SuperAdmin Global (Painel 100% funcional + 20 testes diagnósticos passados)
- Fase 13: 🔜 Deploy produção (Vercel/Netlify)
- Fase 15: 🔜 Diagnósticos e Testes Automatizados Sistêmicos (Em andamento)

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

### superadmin-actions (✅ funcionando)
Edge Function protegida para operações globais via SuperAdmin:
- `get_platform_stats`: Consolida métricas de todas as clínicas
- `manage_clinic_status`: Ativa/Suspende clínicas remotamente
- `impersonate_user`: Gera tokens de acesso temporário (DRM)
- `global_audit_query`: Busca logs de auditoria em todo o cluster
- `create_clinic`: Provisionamento de novas clínicas (com auditoria e limpeza de FK)

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
- src/pages/Dev/SuperAdminDiagnosticoPage.tsx → Painel de Testes Automatizados (20 testes)
- src/hooks/useSuperAdmin.ts → Hook de conexão com Edge Functions administrativas
- supabase/functions/superadmin-actions/index.ts → Backend administrativo global
- CONTEXTO_PROJETO.md → Histórico/Arquitetura (Este arquivo)

## 8. PRÓXIMOS PASSOS (Fase 15)
1. Rodar os testes de diagnóstico regularmente para manter saúde do sistema.
2. Expandir diagnósticos para o fluxo de CRM (Vendas).
3. Finalizar o deploy em produção (Vercel) integrando com o domínio principal.

## 9. COMANDOS ÚTEIS
Deploy Edge Function:
npx supabase functions deploy NAME --project-ref mddbbwbwmwcvecbnfmqg --no-verify-jwt

## 10. DECISÕES DE ARQUITETURA TOMADAS
- SuperAdmin: Painel isolado com role-based access. Bypass de RLS controlado via Edge Functions com `service_role`.
- Diagnóstico: Página dedicada `/dev/*` para testes unitários e de integração em runtime, garantindo que o backend Supabase e as Edge Functions estejam respondendo conforme esperado.

## Relatório de Testes Automatizados (SuperAdmin)
### ✅ Status Final: 20/20 Testes Passaram
1. **Auth & Acesso** (4/4): Login, Roles e Rota Protegida.
2. **Dashboard Global** (3/3): KPIs reais de Clínicas, Usuários e Pacientes.
3. **Listagem de Clínicas** (2/2): Fetch via Edge + Create/Delete robusto (Limpeza de FK).
4. **Gestão de Usuários** (1/1): Acesso cross-clinic via Edge Function.
5. **Saúde do Sistema** (1/1): Logs de erro e status operacional.
6. **Financeiro Global** (1/1): Cálculo de MRR real vs trial.
7. **Monitoramento AI/WA** (2/2): Logs de consumo e instâncias Zap.
8. **Auditoria & Suporte** (2/2): Feed global e lista de tickets.
9. **Segurança & RLS** (2/2): Bloqueio de actions desconhecidas e Auditoria de Impersonation.
10. **Configurações Globais** (2/2): Feature Flags e Planos.

**TESTES SUPERADMIN COMPLETOS ✅**
Total de testes: 20
Passaram: 20
Falharam: 0
Corrigidos: 4
Pendentes: 0
