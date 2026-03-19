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
import { FinanceiroPage } from '../pages/Financeiro/FinanceiroPage'
import { EmConstrucao } from '../components/ui/EmConstrucao'
import { VerdeskPage } from '../pages/Verdesk/VerdeskPage'
import { PerformancePage } from '../pages/Verdesk/PerformancePage'
import { CampanhasPage } from '../pages/Verdesk/CampanhasPage'
import { EstoquePage } from '../pages/Estoque/EstoquePage'
import { ProdutosPage } from '../pages/Estoque/ProdutosPage'
import { MovimentacoesPage } from '../pages/Estoque/MovimentacoesPage'
import { AlertasPage } from '../pages/Estoque/AlertasPage'
import { RegrasConsumoPage } from '../pages/Estoque/RegrasConsumoPage'
import { RelatoriosPage } from '../pages/Relatorios/RelatoriosPage'
import { ProducaoProfissionalReport } from '../pages/Relatorios/ProducaoProfissionalReport'
import { FaturamentoReport } from '../pages/Relatorios/FaturamentoReport'
import { FunilLeadsReport } from '../pages/Relatorios/FunilLeadsReport'
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
import { SuperAdminLayout } from '../components/superadmin/SuperAdminLayout'
import { SuperDashboardPage } from '../pages/SuperAdmin/SuperDashboardPage'
import { SuperClinicasPage } from '../pages/SuperAdmin/SuperClinicasPage'
import { SuperUsuariosPage } from '../pages/SuperAdmin/SuperUsuariosPage'
import { SuperSaudePage } from '../pages/SuperAdmin/SuperSaudePage'
import { SuperFinanceiroPage } from '../pages/SuperAdmin/SuperFinanceiroPage'
import { SuperIAPage } from '../pages/SuperAdmin/SuperIAPage'
import { SuperWhatsAppPage } from '../pages/SuperAdmin/SuperWhatsAppPage'
import { SuperLogsPage } from '../pages/SuperAdmin/SuperLogsPage'
import { SuperConfiguracoesPage } from '../pages/SuperAdmin/SuperConfiguracoesPage'
import { SuperSuportePage } from '../pages/SuperAdmin/SuperSuportePage'
import { SuperAdminDiagnosticoPage } from '../pages/Dev/SuperAdminDiagnosticoPage'

// ─── Guard de autenticação ────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return user?.role === 'superadmin' 
      ? <Navigate to="/superadmin" replace /> 
      : <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

// ─── Guard de SuperAdmin ─────────────────────────────
function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <Navigate to="/login" state={{ error: 'Acesso negado. Apenas superadmins.' }} replace />
  }
  return <>{children}</>
}

// ─── Módulos "Em Construção" ──────────────────────────
const modulos = [
  { path: 'prescricoes',   name: 'Prescrições',   icon: 'ClipboardList', desc: 'Prescrições digitais com assinatura eletrônica.' },
]

export function AppRouter() {
  const { user } = useAuthStore()

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
        <Route index element={
          user?.role === 'superadmin' 
            ? <Navigate to="/superadmin" replace /> 
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        
        {/* Módulo Pacientes / PEP */}
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/pacientes/:id" element={<PatientProfilePage />} />

        {/* Módulo Financeiro */}
        <Route path="/financeiro" element={<FinanceiroPage />} />

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
        <Route path="/estoque/regras" element={<RegrasConsumoPage />} />
        <Route path="/estoque/alertas" element={<AlertasPage />} />

        {/* Módulo Relatórios */}
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/relatorios/producao-profissional" element={<ProducaoProfissionalReport />} />
        <Route path="/relatorios/faturamento" element={<FaturamentoReport />} />
        <Route path="/relatorios/funil-leads" element={<FunilLeadsReport />} />

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
            <Route path="/dev/superadmin-diagnostico" element={<SuperAdminDiagnosticoPage />} />
          </>
        )}
      </Route>

      {/* Rota pública de Anamnese */}
      <Route path="/anamnese/:token" element={<PublicAnamnesisPage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />

      {/* Rotas de SuperAdmin */}
      <Route
        path="/superadmin"
        element={
          <RequireSuperAdmin>
            <SuperAdminLayout />
          </RequireSuperAdmin>
        }
      >
        <Route index element={<SuperDashboardPage />} />
        <Route path="clinicas" element={<SuperClinicasPage />} />
        <Route path="usuarios" element={<SuperUsuariosPage />} />
        <Route path="saude" element={<SuperSaudePage />} />
        <Route path="financeiro" element={<SuperFinanceiroPage />} />
        <Route path="ia" element={<SuperIAPage />} />
        <Route path="whatsapp" element={<SuperWhatsAppPage />} />
        <Route path="logs" element={<SuperLogsPage />} />
        <Route path="configuracoes" element={<SuperConfiguracoesPage />} />
        <Route path="suporte" element={<SuperSuportePage />} />
        <Route path="releases" element={<div>Controle de Releases</div>} />
      </Route>
    </Routes>
  )
}
