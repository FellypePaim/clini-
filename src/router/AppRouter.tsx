import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { LoginPage } from '../pages/Login/LoginPage'
import { RegisterPage } from '../pages/Login/RegisterPage'
import { WaitingApprovalPage } from '../pages/Login/WaitingApprovalPage'
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
import { FinanceiroPage } from '../pages/Financeiro/FinanceiroPage'
import { PrescricoesPage } from '../pages/Prescricoes/PrescricoesPage'
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
import { RegrasConsumoPage } from '../pages/Estoque/RegrasConsumoPage'
import { FunilLeadsReport } from '../pages/Relatorios/FunilLeadsReport'
import { ProcedimentosReport } from '../pages/Relatorios/ProcedimentosReport'
import { PacientesReport } from '../pages/Relatorios/PacientesReport'
import { RetornoReport } from '../pages/Relatorios/RetornoReport'
import { ConvenioReport } from '../pages/Relatorios/ConvenioReport'
import { InadimplenciaReport } from '../pages/Relatorios/InadimplenciaReport'
import { DREReport } from '../pages/Relatorios/DREReport'
import { CampanhasReport } from '../pages/Relatorios/CampanhasReport'
import { OrigemReport } from '../pages/Relatorios/OrigemReport'
import { OVYVAReport } from '../pages/Relatorios/OVYVAReport'
import { FiscalReport } from '../pages/Relatorios/FiscalReport'
// ─── Guard de autenticação ────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPendingApproval } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isPendingApproval) return <Navigate to="/aguardando-aprovacao" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPendingApproval, user } = useAuthStore()
  if (isAuthenticated && !isPendingApproval) {
    return user?.role === 'superadmin'
      ? <Navigate to="/superadmin" replace />
      : <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

// ─── Guard de SuperAdmin ──────────────────────────────
function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <Navigate to="/login" state={{ error: 'Acesso negado. Apenas superadmins.' }} replace />
  }
  return <>{children}</>
}

// ─── Módulos "Em Construção" ──────────────────────────
const modulos: { path: string; name: string; icon: string; desc: string }[] = []

export function AppRouter() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/aguardando-aprovacao" element={<WaitingApprovalPage />} />

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
        <Route path="/estoque/regras" element={<RegrasConsumoPage />} />

        {/* Módulo Relatórios */}
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/relatorios/producao-profissional" element={<ProducaoProfissionalReport />} />
        <Route path="/relatorios/faturamento" element={<FaturamentoReport />} />
        <Route path="/relatorios/funil-leads" element={<FunilLeadsReport />} />
        <Route path="/relatorios/procedimentos" element={<ProcedimentosReport />} />
        <Route path="/relatorios/pacientes" element={<PacientesReport />} />
        <Route path="/relatorios/retorno" element={<RetornoReport />} />
        <Route path="/relatorios/convenios" element={<ConvenioReport />} />
        <Route path="/relatorios/inadimplencia" element={<InadimplenciaReport />} />
        <Route path="/relatorios/dre" element={<DREReport />} />
        <Route path="/relatorios/campanhas" element={<CampanhasReport />} />
        <Route path="/relatorios/origem" element={<OrigemReport />} />
        <Route path="/relatorios/ovyva" element={<OVYVAReport />} />
        <Route path="/relatorios/fiscal" element={<FiscalReport />} />

        {/* Módulo Financeiro */}
        <Route path="/financeiro" element={<FinanceiroPage />} />

        {/* Módulo Prescrições */}
        <Route path="/prescricoes" element={<PrescricoesPage />} />

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
        <Route path="releases" element={<SuperSuportePage />} />
      </Route>
    </Routes>
  )
}
