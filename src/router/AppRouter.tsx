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
  { path: 'prontuario',    name: 'Prontuário',    icon: 'FileText',      desc: 'Prontuários eletrônicos completos e seguros.'    },
  { path: 'prontuario',    name: 'Prontuário',    icon: 'FileText',      desc: 'Prontuários eletrônicos completos e seguros.'    },
  { path: 'verdesk',       name: 'Verdesk CRM',   icon: 'Briefcase',     desc: 'Funil de vendas e gestão de leads (Kanban).'     },
  { path: 'financeiro',    name: 'Financeiro',    icon: 'DollarSign',    desc: 'Fluxo de caixa, cobranças e relatórios.'         },
  { path: 'estoque',       name: 'Estoque',       icon: 'Package',       desc: 'Controle de insumos e produtos clínicos.'        },
  { path: 'prescricoes',   name: 'Prescrições',   icon: 'ClipboardList', desc: 'Prescrições digitais com assinatura eletrônica.' },
  { path: 'relatorios',    name: 'Relatórios',    icon: 'BarChart3',     desc: 'Analytics e relatórios gerenciais.'              },
  { path: 'configuracoes', name: 'Configurações', icon: 'Settings',      desc: 'Configurações da clínica e permissões.'          },
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

        {/* Módulos em construção */}
        {modulos.map(({ path, name, icon, desc }) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<EmConstrucao moduleName={name} iconName={icon} description={desc} eta="Fase 2" />}
          />
        ))}
      </Route>

      {/* Rota pública de Anamnese */}
      <Route path="/anamnese/:token" element={<PublicAnamnesisPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
