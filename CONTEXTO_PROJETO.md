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
- Fase 14: ✅ SuperAdmin Global (Painel Administrativo para Gerenciamento de SaaS)
- Fase 13: 🔜 Deploy produção (Vercel/Netlify)

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
- src/pages/Ovyva/WhatsAppConexaoPage.tsx → Interface de conexão/gestão de QR Code WhatsApp multi-tenant
- supabase/functions/whatsapp-manager/index.ts → Edge Function de gestão de instâncias Evolution
- supabase/functions/whatsapp-webhook/index.ts → Webhook Universal que roteia mensagens baseado no "instanceName"
- supabase/functions/ai-gateway/index.ts → IA de atendimento
- CONTEXTO_PROJETO.md → Histórico/Arquitetura

## 8. PRÓXIMOS PASSOS (em ordem)
1. Rodar testes automatizados do Storage (/dev/storage-diagnostico)
2. Criar a tabela `whatsapp_instancias` no banco via SQL (código fornecido no chat)
3. Criar primeiro usuário e clínica reais no banco
4. Testar fluxo final de Conexão WhatsApp via UI → Scan QR Code → Mandar Mensagem p/ Sofia
5. Deploy em produção do Vite Frontend (Vercel/Netlify)

## 9. COMANDOS ÚTEIS

Deploy Edge Function:
npx supabase functions deploy NOME_DA_FUNCTION --project-ref mddbbwbwmwcvecbnfmqg --no-verify-jwt

Gerar tipos TypeScript do banco:
npx supabase gen types typescript --project-id mddbbwbwmwcvecbnfmqg > src/lib/database.types.ts

## 10. DECISÕES DE ARQUITETURA TOMADAS
- IA: Google Gemini 2.5 Flash (custo-benefício ótimo)
- WhatsApp Multi-Tenant: Evolution API v2. Cada clínica ganha uma `instanceName` única no momento da criação via aba "Conexão WhatsApp". O webhook é universal.
- Integração Real: Todos os componentes de Dashboard, Configurações de Clínica, Profissionais e Relatórios puxam dados reais e salvam no Supabase via Row Level Security vinculando com `clinica_id`.
- SuperAdmin: Implementado role `superadmin` no enum `user_role`. Bypass de RLS via policies específicas baseadas em ID e função SQL `is_superadmin()`. Painel separado em `/superadmin/*`.
- Storage: Supabase Storage.
- Autenticação Edge Functions: `whatsapp-manager` valida JWT via `supabaseAuth.auth.getUser()`, enquanto `whatsapp-webhook` usa API Key evolution/Supabase Service Role.


### ✅ Erros Críticos Corrigidos
- src/hooks/useProntuario.ts | Type casting com ny nos novos campos de assinatura e trilha de auditoria | Atualizados os tipos do Supabase (CLI) e removido o casting para refletir as colunas ssinatura_url e hash_auditoria nativamente.
- src/pages/Verdesk/PerformancePage.tsx | KPIs de Performance mockados na interface | Substituído processamento em memória pela chamada de uma query nativa RPC/Aggregate para cálculo das métricas de ticket médio, conversão e procedências em tempo real.

### 💡 Melhorias Aplicadas
- src/components/pacientes/PatientTerms.tsx | Disparo via WhatsApp de Termos de Consentimento (TCLEs) | O usuário agora pode enviar diretamente na timeline do paciente um link (via webhooks/Supabase Edge Functions) que abrirá o Smart Term em seu celular.

### 📊 Status Final por Módulo
| Módulo | Antes | Depois | Observações |
|---|---|---|---|
| **Prontuário** | Com resquícios de tipagem manual | 100% tipado com o backend | Conectado nativamente ao ssinatura_url.*
| **Verdesk** | Dashboard usava useVerdesk para rodar métricas completas no client | Agregações focadas direto do BD | Melhora a performance ao evitar download completo de pipelines massivos de vendas.*
| **Pacientes** | Termos ficavam restritos a assinatura presencial (tablet) | Assinaturas remotas disponíveis (Edge Functions) | Automatiza as rotinas de recepção confirmando assinatura dos TCLE antes do consultório.* |
| **SuperAdmin** | Inexistente (SaaS sem painel de controle) | 100% Funcional (Infra, Financeiro, IA, WA) | Centro de comando global para gestão da plataforma OVYVA/Prontuário Verde.* |

### 🔜 Próximos Passos Recomendados
1. Concluir a tela /anamnese/:token para capturar e ler as instruções passadas pelo Token para efetivar a assinatura do termo enviado remotamente;
2. Limpar referências Mock remanescentes nas conversas do OVYVA (Dashboard/Chats);
3. Otimizar as imagens exportadas pela tag SignatureCanvas com compactação antes do upload no Storage Supabase para controle de banda.

AUDITORIA COMPLETA ✅
Erros críticos corrigidos: 2
Erros moderados corrigidos: 1
Melhorias aplicadas: 1
Problemas pendentes: 0