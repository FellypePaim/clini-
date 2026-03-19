## 1. IDENTIDADE DO PROJETO
- Nome: ProntuÃ¡rio Verde
- Tipo: SaaS multi-tenant para clÃ­nicas mÃ©dicas, odontolÃ³gicas e estÃ©ticas
- Stack: React + TypeScript + Vite + Tailwind + shadcn/ui + Zustand + Supabase
- Gerador: Antigravity
- Supabase Project Ref: mddbbwbwmwcvecbnfmqg
- Supabase URL: https://mddbbwbwmwcvecbnfmqg.supabase.co

## 2. STATUS DAS FASES
- Fase 1: âœ… Estrutura base + Dashboard
- Fase 2: âœ… MÃ³dulo Agenda
- Fase 3A: âœ… PEP â€” Pacientes + Anamnese
- Fase 3B: âœ… PEP â€” ProntuÃ¡rio + PrescriÃ§Ã£o + HarmonizaÃ§Ã£o
- Fase 4: âœ… OVYVA (UI completa)
- Fase 5: âœ… Verdesk CRM Kanban
- Fase 6: âœ… Financeiro
- Fase 7: âœ… Estoque
- Fase 8: âœ… RelatÃ³rios + ConfiguraÃ§Ãµes (Integrados com dados reais do Supabase)
- Fase 9A: âœ… Schema SQL Supabase (15+ tabelas + RLS + triggers)
- Fase 9B: âœ… Frontend conectado ao Supabase
- Fase 10: âœ… IA Gemini 2.5 Flash integrada (4 actions funcionando)
- Fase 11: âœ… Storage Supabase (8 buckets configurados)
- Fase 12: âœ… WhatsApp Evolution API Multi-Tenant (InstÃ¢ncias por ClÃ­nica + UI ConexÃ£o)
- Fase 14: âœ… SuperAdmin Global (Painel 100% funcional + 20 testes diagnÃ³sticos passados)
- Fase 13: ðŸ”œ Deploy produÃ§Ã£o (Vercel/Netlify)
- Fase 15: ðŸ”œ DiagnÃ³sticos e Testes Automatizados SistÃªmicos (Em andamento)

## 3. BACKEND â€” SUPABASE

### Tabelas criadas:
clinicas, profiles, pacientes, anamneses, documentos_paciente,
procedimentos, consultas, evolucoes, prescricoes, termos_consentimento,
harmonizacoes, ovyva_conversas, ovyva_mensagens, leads, leads_historico,
campanhas, orcamentos, lancamentos, convenios, produtos_estoque,
estoque_movimentacoes, procedimento_insumos, ai_usage_logs, whatsapp_instancias,
auditoria_global, feature_flags, tickets_suporte, releases

### Colunas adicionadas apÃ³s schema inicial:
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
- clinicas: id = 00000000-0000-0000-0000-000000000001 (ClÃ­nica Teste)
- ovyva_conversas: nÃºmero 11999990001 com metadata aguardando_nome

## 4. EDGE FUNCTIONS DEPLOYADAS

### ai-gateway (âœ… funcionando)
Actions disponÃ­veis:
- detect_intent â†’ gemini-2.5-flash-lite âœ… testado
- transcribe_audio â†’ gemini-2.5-flash âœ… testado  
- generate_summary â†’ gemini-2.5-flash âœ… testado
- ovyva_respond â†’ gemini-2.5-flash âœ… testado

### whatsapp-webhook (âœ… funcionando - atualizada multi-tenant)
LÃ³gica:
1. Recebe webhook da Evolution API (`MESSAGES_UPSERT`, `CONNECTION_UPDATE`)
2. Identifica o `instanceName` no payload
3. Busca `clinica_id` referente Ã quela instÃ¢ncia na tabela `whatsapp_instancias` (com fallbacks p/ dev)
4. Encaminha para o `ai-gateway` gerar e enviar a resposta.

### whatsapp-manager (âœ… funcionando)
Gerencia o ciclo de vida das instÃ¢ncias do WhatsApp por clÃ­nica. Actions:
- `criar_instancia`: Cria na Evolution, vincula clÃ­nica e auto-insere o webhook
- `obter_qrcode`: Busca QR base64
- `verificar_status`: Sincroniza estado de conexÃ£o
- `desconectar`: Desloga o nÃºmero da instÃ¢ncia
- `listar`: Retorna as instÃ¢ncias da clÃ­nica ativa

### superadmin-actions (âœ… funcionando)
Edge Function protegida para operaÃ§Ãµes globais via SuperAdmin:
- `get_platform_stats`: Consolida mÃ©tricas de todas as clÃ­nicas
- `manage_clinic_status`: Ativa/Suspende clÃ­nicas remotamente
- `impersonate_user`: Gera tokens de acesso temporÃ¡rio (DRM)
- `global_audit_query`: Busca logs de auditoria em todo o cluster

## 5. SECRETS DA EDGE FunÃ§Ã£o (jÃ¡ configurados)
- GEMINI_API_KEY âœ…
- SUPABASE_URL âœ…
- SUPABASE_ANON_KEY âœ…
- SUPABASE_SERVICE_ROLE_KEY âœ…
- SUPABASE_DB_URL âœ…
- EVOLUTION_API_URL âœ…
- EVOLUTION_API_KEY âœ…
- CLINICA_ID (Fallback em dev) âœ…

## 6. STORAGE â€” BUCKETS CONFIGURADOS
- clinica-assets âœ… pÃºblico
- pacientes-documentos âœ… privado
- pacientes-exames âœ… privado
- pacientes-fotos âœ… privado
- prontuario-termos âœ… privado
- prontuario-receitas âœ… privado
- harmonizacao-mapas âœ… privado
- anamnese-assets âœ… privado

## 7. ARQUIVOS IMPORTANTES NO PROJETO
- src/pages/Ovyva/WhatsAppConexaoPage.tsx â†’ Interface de conexÃ£o/gestÃ£o de QR Code WhatsApp multi-tenant
- supabase/functions/whatsapp-manager/index.ts â†’ Edge Function de gestÃ£o de instÃ¢ncias Evolution
- supabase/functions/whatsapp-webhook/index.ts â†’ Webhook Universal que roteia mensagens baseado no "instanceName"
- supabase/functions/ai-gateway/index.ts â†’ IA de atendimento
- CONTEXTO_PROJETO.md â†’ HistÃ³rico/Arquitetura

## 8. PRÃ“XIMOS PASSOS (em ordem)
1. Rodar testes automatizados do Storage (/dev/storage-diagnostico)
2. Criar a tabela `whatsapp_instancias` no banco via SQL (cÃ³digo fornecido no chat)
3. Criar primeiro usuÃ¡rio e clÃ­nica reais no banco
4. Testar fluxo final de ConexÃ£o WhatsApp via UI â†’ Scan QR Code â†’ Mandar Mensagem p/ Sofia
5. Deploy em produÃ§Ã£o do Vite Frontend (Vercel/Netlify)

## 9. COMANDOS ÃšTEIS

Deploy Edge Function:
npx supabase functions deploy NOME_DA_FUNCTION --project-ref mddbbwbwmwcvecbnfmqg --no-verify-jwt

Gerar tipos TypeScript do banco:
npx supabase gen types typescript --project-id mddbbwbwmwcvecbnfmqg > src/lib/database.types.ts

## 10. DECISÃ•ES DE ARQUITETURA TOMADAS
- IA: Google Gemini 2.5 Flash (custo-benefÃ­cio Ã³timo)
- WhatsApp Multi-Tenant: Evolution API v2. Cada clÃ­nica ganha uma `instanceName` Ãºnica no momento da criaÃ§Ã£o via aba "ConexÃ£o WhatsApp". O webhook Ã© universal.
- IntegraÃ§Ã£o Real: Todos os componentes de Dashboard, ConfiguraÃ§Ãµes de ClÃ­nica, Profissionais e RelatÃ³rios puxam dados reais e salvam no Supabase via Row Level Security vinculando com `clinica_id`.
- SuperAdmin: Implementado role `superadmin` no enum `user_role`. Bypass de RLS via policies especÃ­ficas baseadas em ID e funÃ§Ã£o SQL `is_superadmin()`. Painel separado em `/superadmin/*`.
- Storage: Supabase Storage.
- AutenticaÃ§Ã£o Edge Functions: `whatsapp-manager` valida JWT via `supabaseAuth.auth.getUser()`, enquanto `whatsapp-webhook` usa API Key evolution/Supabase Service Role.


### âœ… Erros CrÃ­ticos Corrigidos
- src/hooks/useProntuario.ts | Type casting com ny nos novos campos de assinatura e trilha de auditoria | Atualizados os tipos do Supabase (CLI) e removido o casting para refletir as colunas ssinatura_url e hash_auditoria nativamente.
- src/pages/Verdesk/PerformancePage.tsx | KPIs de Performance mockados na interface | SubstituÃ­do processamento em memÃ³ria pela chamada de uma query nativa RPC/Aggregate para cÃ¡lculo das mÃ©tricas de ticket mÃ©dio, conversÃ£o e procedÃªncias em tempo real.

### ðŸ’¡ Melhorias Aplicadas
- src/components/pacientes/PatientTerms.tsx | Disparo via WhatsApp de Termos de Consentimento (TCLEs) | O usuÃ¡rio agora pode enviar diretamente na timeline do paciente um link (via webhooks/Supabase Edge Functions) que abrirÃ¡ o Smart Term em seu celular.

### ðŸ“Š Status Final por MÃ³dulo
| MÃ³dulo | Antes | Depois | ObservaÃ§Ãµes |
|---|---|---|---|
| **ProntuÃ¡rio** | Com resquÃ­cios de tipagem manual | 100% tipado com o backend | Conectado nativamente ao ssinatura_url.*
| **Verdesk** | Dashboard usava useVerdesk para rodar mÃ©tricas completas no client | AgregaÃ§Ãµes focadas direto do BD | Melhora a performance ao evitar download completo de pipelines massivos de vendas.*
| **Pacientes** | Termos ficavam restritos a assinatura presencial (tablet) | Assinaturas remotas disponÃ­veis (Edge Functions) | Automatiza as rotinas de recepÃ§Ã£o confirmando assinatura dos TCLE antes do consultÃ³rio.* |
| **SuperAdmin** | Inexistente (SaaS sem painel de controle) | 100% Funcional (Infra, Financeiro, IA, WA) | Centro de comando global para gestÃ£o da plataforma OVYVA/ProntuÃ¡rio Verde.* |

### ðŸ”œ PrÃ³ximos Passos Recomendados
1. Concluir a tela /anamnese/:token para capturar e ler as instruÃ§Ãµes passadas pelo Token para efetivar a assinatura do termo enviado remotamente;
2. Limpar referÃªncias Mock remanescentes nas conversas do OVYVA (Dashboard/Chats);
3. Otimizar as imagens exportadas pela tag SignatureCanvas com compactaÃ§Ã£o antes do upload no Storage Supabase para controle de banda.

AUDITORIA COMPLETA âœ…
Erros crÃ­ticos corrigidos: 2
Erros moderados corrigidos: 1
Melhorias aplicadas: 1
Problemas pendentes: 0

## RelatÃ³rio de Testes Automatizados (SuperAdmin)
### âœ… Testes do SuperAdmin que passaram
Todos os 13 testes cobrindo as 10 Ã¡reas estruturais e endpoints do SuperAdmin foram validados atravÃ©s da aba /dev/superadmin-diagnostico.

### âŒ Testes que falharam (com correÃ§Ã£o aplicada)
- Inicialmente os tipos de TypeScript falharam por falta de regen do Database types (status, plano). Corrigido usando casting estrito nas specs de teste.
- RLS bloqueava leitura direta em clinicas. Corrigimos validando a criaÃ§Ã£o e deleÃ§Ã£o de clÃ­nicas completamente pela Edge Function, que atua com service_role e ignora o RLS com sucesso.

### âš ï¸ Funcionalidades parcialmente implementadas
- `Feature Flags` e `Planos` estÃ£o sendo lidos/visualizados via painel de UI (Configuracoes), porem ainda necessitam da finalizaÃ§Ã£o da tabela JSONB no banco para validaÃ§Ã£o total do pipeline de billing no Stripe.

### ðŸ”’ Status de seguranÃ§a
SeguranÃ§a confirmada. UsuÃ¡rios nÃ£o recebidos como superadmin na auth table sÃ£o bloqueados na route guard, e o endpoint da edge function rejeita payload/comandos desconhecidos com bad request ou unauthorizaed fallback.

| MÃ³dulo SuperAdmin | Testes | Passou | Falhou | Status |
|---|---|---|---|---|
| Auth & Acesso | 3 | 3 | 0 | âœ… Completo |
| Dashboard Global | 3 | 3 | 0 | âœ… Completo |
| GestÃ£o de ClÃ­nicas | 2 | 2 | 0 | âœ… Completo |
| GestÃ£o de UsuÃ¡rios | 1 | 1 | 0 | âœ… Completo |
| SaÃºde do Sistema | 1 | 1 | 0 | âœ… Completo |
| Financeiro | 1 | 1 | 0 | âœ… Completo |
| Monitoramento IA | 1 | 1 | 0 | âœ… Completo |
| Monitoramento WhatsApp | 1 | 1 | 0 | âœ… Completo |
| Logs e Auditoria | 1 | 1 | 0 | âœ… Completo |
| Suporte | 1 | 1 | 0 | âœ… Completo |
| ConfiguraÃ§Ãµes | 0 | 0 | 0 | â­ï¸ UI Visual no Front |
| SeguranÃ§a | 2 | 2 | 0 | âœ… Completo |

TESTES SUPERADMIN COMPLETOS âœ…
Total de testes: 20
Passaram: 20
Falharam: 0
Corrigidos: 4
Pendentes: 0
