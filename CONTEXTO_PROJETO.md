# Prontuário Verde - Relatório de Contexto e Implementação

Este documento consolida o estado atual do projeto **Prontuário Verde** para continuidade do desenvolvimento com preservação de contexto total.

## 🏗️ Stack Técnica Consolidada
- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui (Estética Premium/Bordas Arredondadas)
- **Estado Global**: Zustand
- **Roteamento**: React Router DOM (v6+)
- **Formulários**: React Hook Form + Zod
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **IA**: Externa (Implementada via Stubs/Contratos de Interface)

---

## 🚀 Módulos Implementados

### 1. Dashboard & Core (`/dashboard`)
*   **KPI Cards**: Agendamentos hoje, pacientes novos, faturamento (mock).
*   **Gráficos**: Distribuição de procedimentos e volume de atendimentos.
*   **Layout**: `MainLayout` com sidebar minimalista e header contextual.

### 2. Gestão de Agenda (`/agenda`)
*   **Visualização**: Abas Dia / Semana / Mês.
*   **Filtros**: Por profissional e status (Confirmado, Pendente, Cancelado).
*   **Modal de Agendamento**: Criação de consultas com recorrência e busca de pacientes.

### 3. Gestão de Pacientes & PEP (`/pacientes`)
*   **Listagem**: Tabela paginada com avatar, CPF mascarado e status.
*   **Perfil do Paciente (`/pacientes/:id`)**:
    *   **Resumo**: Dados demográficos + Linha do tempo de atendimentos.
    *   **Anamnese**: Formulário completo (histórico médico, alergias, hábitos).
    *   **Documentos**: Upload e listagem de exames.
    *   **Evolução Clínica**: Registro com transcrição por IA e resumo automático estruturado.
    *   **Prescrição Digital**: Editor com preview A4, assinatura digital simulada e QR Code.
    *   **Harmonização Facial**: Mapa interativo SVG com registro de zonas (Botox, Preenchimento).
    *   **Termos e Consentimentos**: Templates com assinatura digital capturada via canvas.

### 4. OVYVA — Secretária Virtual IA (`/ovyva`)
*   **Operacional**: Chat em 3 colunas (Conversas, Janela de Chat, Contexto do Contato).
*   **Inteligência**: Detecção de intenção, modo autônomo e botão de "Assumir Atendimento".
*   **Configurações**: Ajuste de personalidade, regras de agendamento e base de conhecimento.
*   **Analytics**: KPI de resolução por IA e histórico completo de logs de interação.

---

## 🛠️ Infraestrutura de Dados (Hooks & Mocks)
*   `useAuthStore`: Gestão de login e perfil do usuário.
*   `usePatients`: CRUD de pacientes e busca rápida.
*   `useProntuario`: Lógica de PEP, Harmonização, Prescrições e integrações de IA.
*   `useOVYVA`: Mock de conversas, mensagens de áudio e configurações da IA.

---

## 📂 Estrutura de Arquivos Chave
- `src/router/AppRouter.tsx`: Configuração de todas as rotas.
- `src/hooks/`: Toda a lógica de estado e simulação de API.
- `src/types/`: Definições TypeScript rigorosas para cada módulo.
- `src/index.css`: Design System com classes `.input-ovyva` e `.custom-scrollbar`.

---

## ⏭️ Próximos Passos (Backlog)
- [ ] **Verdesk CRM**: Funil de vendas (Kanban) para gestão de leads gerados pela OVYVA.
- [ ] **Módulo Financeiro**: Fluxo de caixa, emissão de notas e gestão de convênios.
- [ ] **Módulo de Estoque**: Controle de produtos e insumos clínicos.
- [ ] **Relatórios Avançados**: Exportação de dados e BI da clínica.

---
*Documento gerado em 18 de Março de 2026 para fins de backup de contexto.*
