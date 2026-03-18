import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { LoginPage } from '../pages/Login/LoginPage'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { AgendaPage } from '../pages/Agenda/AgendaPage'
import { PacientesPage } from '../pages/Pacientes/PacientesPage'
import { PatientProfilePage } from '../pages/Pacientes/PatientProfilePage'
import { PublicAnamnesisPage } from '../pages/Public/PublicAnamnesisPage'
import { OvyvaPage } from '../pages/Ovyva/OvyvaPage'
import { OvyvaConfigPage } from '../pages/Ovyva/OvyvaConfigPage'
import { OvyvaHistoryPage } from '../pages/Ovyva/OvyvaHistoryPage'
import { EmConstrucao } from '../components/ui/EmConstrucao'
import { VerdeskPage } from '../pages/Verdesk/VerdeskPage'
import { PerformancePage } from '../pages/Verdesk/PerformancePage'
import { CampanhasPage } from '../pages/Verdesk/CampanhasPage'
import { EstoquePage } from '../pages/Estoque/EstoquePage'
import { ProdutosPage } from '../pages/Estoque/ProdutosPage'
import { MovimentacoesPage } from '../pages/Estoque/MovimentacoesPage'
import { AlertasPage } from '../pages/Estoque/AlertasPage'
import { RelatoriosPage } from '../pages/Relatorios/RelatoriosPage'
import { ProducaoProfissionalReport } from '../pages/Relatorios/ProducaoProfissionalReport'
import { FaturamentoReport } from '../pages/Relatorios/FaturamentoReport'
import { ConfiguracoesLayout } from '../pages/Configuracoes/ConfiguracoesPage'
import { ClinicaPage } from '../pages/Configuracoes/ClinicaPage'
import { ProfissionaisPage } from '../pages/Configuracoes/ProfissionaisPage'
import { ProcedimentosPage } from '../pages/Configuracoes/ProcedimentosPage'
import { IntegracoesPage } from '../pages/Configuracoes/IntegracoesPage'
import { NotificacoesPage } from '../pages/Configuracoes/NotificacoesPage'
import { SegurancaPage } from '../pages/Configuracoes/SegurancaPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { DiagnosticoPage } from '../pages/Dev/DiagnosticoPage'
import { StorageDiagnosticoPage } from '../pages/Dev/StorageDiagnosticoPage'
// ─── Guard de autenticação ────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ─── Módulos "Em Construção" ──────────────────────────
const modulos = [
  { path: 'financeiro',    name: 'Financeiro',    icon: 'DollarSign',    desc: 'Fluxo de caixa, cobranças e relatórios.'         },
  { path: 'prescricoes',   name: 'Prescrições',   icon: 'ClipboardList', desc: 'Prescrições digitais com assinatura eletrônica.' },
]

export function AppRouter() {
  return (
    <Routes>
      {/* Rota de login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Rotas protegidas */}
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        
        {/* Módulo Pacientes / PEP */}
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/pacientes/:id" element={<PatientProfilePage />} />

        {/* Módulo OVYVA */}
        <Route path="/ovyva" element={<OvyvaPage />} />
        <Route path="/ovyva/configuracoes" element={<OvyvaConfigPage />} />
        <Route path="/ovyva/historico" element={<OvyvaHistoryPage />} />

        {/* Módulo Verdesk CRM */}
        <Route path="/verdesk" element={<VerdeskPage />} />
        <Route path="/verdesk/performance" element={<PerformancePage />} />
        <Route path="/verdesk/campanhas" element={<CampanhasPage />} />

        {/* Módulo Estoque */}
        <Route path="/estoque" element={<EstoquePage />} />
        <Route path="/estoque/produtos" element={<ProdutosPage />} />
        <Route path="/estoque/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="/estoque/alertas" element={<AlertasPage />} />

        {/* Módulo Relatórios */}
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/relatorios/producao-profissional" element={<ProducaoProfissionalReport />} />
        <Route path="/relatorios/faturamento" element={<FaturamentoReport />} />

        {/* Módulo Configurações */}
        <Route path="/configuracoes" element={<ConfiguracoesLayout />}>
           <Route path="clinica" element={<ClinicaPage />} />
           <Route path="profissionais" element={<ProfissionaisPage />} />
           <Route path="procedimentos" element={<ProcedimentosPage />} />
           <Route path="integracoes" element={<IntegracoesPage />} />
           <Route path="notificacoes" element={<NotificacoesPage />} />
           <Route path="seguranca" element={<SegurancaPage />} />
           <Route index element={<Navigate to="/configuracoes/clinica" replace />} />
        </Route>

        {/* Módulos em construção */}
        {modulos.map(({ path, name, icon, desc }) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<EmConstrucao moduleName={name} iconName={icon} description={desc} eta="Fase 2" />}
          />
        ))}

        {/* Diagnóstico DEV */}
        {import.meta.env.DEV && (
          <>
            <Route path="/dev/diagnostico" element={<DiagnosticoPage />} />
            <Route path="/dev/storage-diagnostico" element={<StorageDiagnosticoPage />} />
          </>
        )}
      </Route>

      {/* Rota pública de Anamnese */}
      <Route path="/anamnese/:token" element={<PublicAnamnesisPage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
