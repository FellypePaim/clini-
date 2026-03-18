import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { KpiCards } from '../../components/dashboard/KpiCards'
import { ConsultasChart } from '../../components/dashboard/ConsultasChart'
import { ProcedimentosPieChart } from '../../components/dashboard/ProcedimentosPieChart'
import { AgendamentosList } from '../../components/dashboard/AgendamentosList'
import { PacientesRecentes } from '../../components/dashboard/PacientesRecentes'
import { Sparkles } from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário'

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ── Cabeçalho da página ─────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Aqui está o resumo da clínica para hoje,{' '}
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <button
          id="dashboard-ai-insight"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 
                     text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-600 
                     transition-all duration-200 shadow-sm shadow-green-200"
        >
          <Sparkles className="w-4 h-4" />
          Insights com IA
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────── */}
      <KpiCards />

      {/* ── Gráficos ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ConsultasChart />
        </div>
        <div className="lg:col-span-2">
          <ProcedimentosPieChart />
        </div>
      </div>

      {/* ── Listas ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <AgendamentosList />
        </div>
        <div className="lg:col-span-2">
          <PacientesRecentes />
        </div>
      </div>
    </div>
  )
}
