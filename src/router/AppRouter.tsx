import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'

// ─── Loading fallback ──────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
    </div>
  )
}

// ─── Helper: lazy com named export ─────────────────────
function lazyNamed<T extends Record<string, any>>(
  factory: () => Promise<T>,
  name: keyof T
) {
  return lazy(() => factory().then(m => ({ default: m[name] })))
}

// ─── Páginas públicas (carregam rápido, manter eager) ──
import { LoginPage } from '../pages/Login/LoginPage'
import { RegisterPage } from '../pages/Login/RegisterPage'
import { WaitingApprovalPage } from '../pages/Login/WaitingApprovalPage'
import { NotFoundPage } from '../pages/NotFoundPage'

// ─── Páginas lazy — Landing ───────────────────────────
const LandingPage = lazyNamed(() => import('../pages/Landing/LandingPage'), 'LandingPage')

// ─── Páginas lazy — Core ───────────────────────────────
const DashboardPage = lazyNamed(() => import('../pages/Dashboard/DashboardPage'), 'DashboardPage')
const AgendaPage = lazyNamed(() => import('../pages/Agenda/AgendaPage'), 'AgendaPage')

// ─── Páginas lazy — Pacientes ──────────────────────────
const PacientesPage = lazyNamed(() => import('../pages/Pacientes/PacientesPage'), 'PacientesPage')
const PatientProfilePage = lazyNamed(() => import('../pages/Pacientes/PatientProfilePage'), 'PatientProfilePage')
const PublicAnamnesisPage = lazyNamed(() => import('../pages/Public/PublicAnamnesisPage'), 'PublicAnamnesisPage')

// ─── Páginas lazy — LYRA ──────────────────────────────
const LyraPage = lazyNamed(() => import('../pages/Lyra/LyraPage'), 'LyraPage')
const LyraConfigPage = lazyNamed(() => import('../pages/Lyra/LyraConfigPage'), 'LyraConfigPage')
const LyraHistoryPage = lazyNamed(() => import('../pages/Lyra/LyraHistoryPage'), 'LyraHistoryPage')

// ─── Páginas lazy — Nexus CRM ────────────────────────
const NexusPage = lazyNamed(() => import('../pages/Nexus/NexusPage'), 'NexusPage')
const PerformancePage = lazyNamed(() => import('../pages/Nexus/PerformancePage'), 'PerformancePage')
const CampanhasPage = lazyNamed(() => import('../pages/Nexus/CampanhasPage'), 'CampanhasPage')

// ─── Páginas lazy — Estoque ────────────────────────────
const EstoquePage = lazyNamed(() => import('../pages/Estoque/EstoquePage'), 'EstoquePage')
const ProdutosPage = lazyNamed(() => import('../pages/Estoque/ProdutosPage'), 'ProdutosPage')
const MovimentacoesPage = lazyNamed(() => import('../pages/Estoque/MovimentacoesPage'), 'MovimentacoesPage')
const AlertasPage = lazyNamed(() => import('../pages/Estoque/AlertasPage'), 'AlertasPage')
const RegrasConsumoPage = lazyNamed(() => import('../pages/Estoque/RegrasConsumoPage'), 'RegrasConsumoPage')

// ─── Páginas lazy — Relatórios ─────────────────────────
const RelatoriosPage = lazyNamed(() => import('../pages/Relatorios/RelatoriosPage'), 'RelatoriosPage')
const ProducaoProfissionalReport = lazyNamed(() => import('../pages/Relatorios/ProducaoProfissionalReport'), 'ProducaoProfissionalReport')
const FaturamentoReport = lazyNamed(() => import('../pages/Relatorios/FaturamentoReport'), 'FaturamentoReport')
const FunilLeadsReport = lazyNamed(() => import('../pages/Relatorios/FunilLeadsReport'), 'FunilLeadsReport')
const ProcedimentosReport = lazyNamed(() => import('../pages/Relatorios/ProcedimentosReport'), 'ProcedimentosReport')
const PacientesReport = lazyNamed(() => import('../pages/Relatorios/PacientesReport'), 'PacientesReport')
const RetornoReport = lazyNamed(() => import('../pages/Relatorios/RetornoReport'), 'RetornoReport')
const ConvenioReport = lazyNamed(() => import('../pages/Relatorios/ConvenioReport'), 'ConvenioReport')
const InadimplenciaReport = lazyNamed(() => import('../pages/Relatorios/InadimplenciaReport'), 'InadimplenciaReport')
const DREReport = lazyNamed(() => import('../pages/Relatorios/DREReport'), 'DREReport')
const CampanhasReport = lazyNamed(() => import('../pages/Relatorios/CampanhasReport'), 'CampanhasReport')
const OrigemReport = lazyNamed(() => import('../pages/Relatorios/OrigemReport'), 'OrigemReport')
const LYRAReport = lazyNamed(() => import('../pages/Relatorios/LyraReport'), 'LYRAReport')
const FiscalReport = lazyNamed(() => import('../pages/Relatorios/FiscalReport'), 'FiscalReport')

// ─── Páginas lazy — Financeiro ─────────────────────────
const FinanceiroPage = lazyNamed(() => import('../pages/Financeiro/FinanceiroPage'), 'FinanceiroPage')

// ─── Páginas lazy — Prescrições ────────────────────────
const PrescricoesPage = lazyNamed(() => import('../pages/Prescricoes/PrescricoesPage'), 'PrescricoesPage')

// ─── Páginas lazy — Configurações ──────────────────────
const ConfiguracoesLayout = lazyNamed(() => import('../pages/Configuracoes/ConfiguracoesPage'), 'ConfiguracoesLayout')
const ClinicaPage = lazyNamed(() => import('../pages/Configuracoes/ClinicaPage'), 'ClinicaPage')
const ProfissionaisPage = lazyNamed(() => import('../pages/Configuracoes/ProfissionaisPage'), 'ProfissionaisPage')
const ProcedimentosPage = lazyNamed(() => import('../pages/Configuracoes/ProcedimentosPage'), 'ProcedimentosPage')
const IntegracoesPage = lazyNamed(() => import('../pages/Configuracoes/IntegracoesPage'), 'IntegracoesPage')
const NotificacoesPage = lazyNamed(() => import('../pages/Configuracoes/NotificacoesPage'), 'NotificacoesPage')
const SegurancaPage = lazyNamed(() => import('../pages/Configuracoes/SegurancaPage'), 'SegurancaPage')

// ─── Páginas lazy — Suporte ──────────────────────────
const SuportePage = lazyNamed(() => import('../pages/Suporte/SuportePage'), 'SuportePage')

// ─── Páginas lazy — Perfil ──────────────────────────
const MeuPerfilPage = lazyNamed(() => import('../pages/Perfil/MeuPerfilPage'), 'MeuPerfilPage')

// ─── Páginas lazy — SuperAdmin ─────────────────────────
const SuperAdminLayout = lazyNamed(() => import('../components/superadmin/SuperAdminLayout'), 'SuperAdminLayout')
const SuperDashboardPage = lazyNamed(() => import('../pages/SuperAdmin/SuperDashboardPage'), 'SuperDashboardPage')
const SuperClinicasPage = lazyNamed(() => import('../pages/SuperAdmin/SuperClinicasPage'), 'SuperClinicasPage')
const SuperUsuariosPage = lazyNamed(() => import('../pages/SuperAdmin/SuperUsuariosPage'), 'SuperUsuariosPage')
const SuperFinanceiroPage = lazyNamed(() => import('../pages/SuperAdmin/SuperFinanceiroPage'), 'SuperFinanceiroPage')
const SuperLogsPage = lazyNamed(() => import('../pages/SuperAdmin/SuperLogsPage'), 'SuperLogsPage')
const SuperSuportePage = lazyNamed(() => import('../pages/SuperAdmin/SuperSuportePage'), 'SuperSuportePage')

// ─── Páginas lazy — Dev ────────────────────────────────
const DiagnosticoPage = lazyNamed(() => import('../pages/Dev/DiagnosticoPage'), 'DiagnosticoPage')
const StorageDiagnosticoPage = lazyNamed(() => import('../pages/Dev/StorageDiagnosticoPage'), 'StorageDiagnosticoPage')
const SuperAdminDiagnosticoPage = lazyNamed(() => import('../pages/Dev/SuperAdminDiagnosticoPage'), 'SuperAdminDiagnosticoPage')

// ─── UI ────────────────────────────────────────────────
import { EmConstrucao } from '../components/ui/EmConstrucao'

// ─── Guard de autenticação ─────────────────────────────
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

// ─── Guard de Role ─────────────────────────────────────
function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

// ─── Guard de SuperAdmin ───────────────────────────────
function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'superadmin') {
    return <Navigate to="/login" state={{ error: 'Acesso negado. Apenas superadmins.' }} replace />
  }
  return <>{children}</>
}

// ─── Módulos "Em Construção" ───────────────────────────
const modulos: { path: string; name: string; icon: string; desc: string }[] = []

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing — sempre acessível (logado ou não) */}
        <Route path="/" element={<LandingPage />} />

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />

          {/* Módulo Pacientes / PEP */}
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/:id" element={<PatientProfilePage />} />

          {/* Módulo LYRA */}
          <Route path="/lyra" element={<LyraPage />} />
          <Route path="/lyra/configuracoes" element={<RequireRole roles={['administrador']}><LyraConfigPage /></RequireRole>} />
          <Route path="/lyra/historico" element={<RequireRole roles={['administrador', 'profissional']}><LyraHistoryPage /></RequireRole>} />

          {/* Módulo Nexus CRM */}
          <Route path="/nexus" element={<NexusPage />} />
          <Route path="/nexus/performance" element={<PerformancePage />} />
          <Route path="/nexus/campanhas" element={<CampanhasPage />} />

          {/* Módulo Estoque — admin + profissional */}
          <Route path="/estoque" element={<RequireRole roles={['administrador', 'profissional']}><EstoquePage /></RequireRole>} />
          <Route path="/estoque/produtos" element={<RequireRole roles={['administrador', 'profissional']}><ProdutosPage /></RequireRole>} />
          <Route path="/estoque/movimentacoes" element={<RequireRole roles={['administrador', 'profissional']}><MovimentacoesPage /></RequireRole>} />
          <Route path="/estoque/alertas" element={<RequireRole roles={['administrador', 'profissional']}><AlertasPage /></RequireRole>} />
          <Route path="/estoque/regras" element={<RequireRole roles={['administrador', 'profissional']}><RegrasConsumoPage /></RequireRole>} />

          {/* Módulo Relatórios — admin + profissional */}
          <Route path="/relatorios" element={<RequireRole roles={['administrador', 'profissional']}><RelatoriosPage /></RequireRole>} />
          <Route path="/relatorios/producao-profissional" element={<RequireRole roles={['administrador', 'profissional']}><ProducaoProfissionalReport /></RequireRole>} />
          <Route path="/relatorios/faturamento" element={<RequireRole roles={['administrador', 'profissional']}><FaturamentoReport /></RequireRole>} />
          <Route path="/relatorios/funil-leads" element={<RequireRole roles={['administrador', 'profissional']}><FunilLeadsReport /></RequireRole>} />
          <Route path="/relatorios/procedimentos" element={<RequireRole roles={['administrador', 'profissional']}><ProcedimentosReport /></RequireRole>} />
          <Route path="/relatorios/pacientes" element={<RequireRole roles={['administrador', 'profissional']}><PacientesReport /></RequireRole>} />
          <Route path="/relatorios/retorno" element={<RequireRole roles={['administrador', 'profissional']}><RetornoReport /></RequireRole>} />
          <Route path="/relatorios/convenios" element={<RequireRole roles={['administrador', 'profissional']}><ConvenioReport /></RequireRole>} />
          <Route path="/relatorios/inadimplencia" element={<RequireRole roles={['administrador', 'profissional']}><InadimplenciaReport /></RequireRole>} />
          <Route path="/relatorios/dre" element={<RequireRole roles={['administrador', 'profissional']}><DREReport /></RequireRole>} />
          <Route path="/relatorios/campanhas" element={<RequireRole roles={['administrador', 'profissional']}><CampanhasReport /></RequireRole>} />
          <Route path="/relatorios/origem" element={<RequireRole roles={['administrador', 'profissional']}><OrigemReport /></RequireRole>} />
          <Route path="/relatorios/lyra" element={<RequireRole roles={['administrador', 'profissional']}><LYRAReport /></RequireRole>} />
          <Route path="/relatorios/fiscal" element={<RequireRole roles={['administrador', 'profissional']}><FiscalReport /></RequireRole>} />

          {/* Módulo Financeiro — admin + profissional */}
          <Route path="/financeiro" element={<RequireRole roles={['administrador', 'profissional']}><FinanceiroPage /></RequireRole>} />

          {/* Módulo Prescrições — admin + profissional */}
          <Route path="/prescricoes" element={<RequireRole roles={['administrador', 'profissional']}><PrescricoesPage /></RequireRole>} />

          {/* Meu Perfil — acessível por todos */}
          <Route path="/perfil" element={<MeuPerfilPage />} />

          {/* Módulo Suporte */}
          <Route path="/suporte" element={<RequireRole roles={['administrador']}><SuportePage /></RequireRole>} />

          {/* Módulo Configurações — admin only */}
          <Route path="/configuracoes" element={<RequireRole roles={['administrador']}><ConfiguracoesLayout /></RequireRole>}>
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
          <Route path="financeiro" element={<SuperFinanceiroPage />} />
          <Route path="logs" element={<SuperLogsPage />} />
          <Route path="suporte" element={<SuperSuportePage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
