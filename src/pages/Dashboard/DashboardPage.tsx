import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { KpiCards } from '../../components/dashboard/KpiCards'
import { ConsultasChart } from '../../components/dashboard/ConsultasChart'
import { ProcedimentosPieChart } from '../../components/dashboard/ProcedimentosPieChart'
import { AgendamentosList } from '../../components/dashboard/AgendamentosList'
import { PacientesRecentes } from '../../components/dashboard/PacientesRecentes'
import { LeadsRecentes } from '../../components/dashboard/LeadsRecentes'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário'
  const [insightModal, setInsightModal] = useState(false)
  const [insightText, setInsightText] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)

  const handleInsights = async () => {
    setInsightModal(true)
    setInsightText('')
    setInsightLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action: 'dashboard_insights', clinica_id: user?.clinicaId },
      })
      if (error) throw error
      setInsightText(data?.insights ?? 'Nenhum insight disponível no momento.')
    } catch {
      setInsightText('Não foi possível gerar insights agora. Verifique a conexão com a IA.')
    } finally {
      setInsightLoading(false)
    }
  }

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
          onClick={handleInsights}
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

      {/* ── CRM & Listas ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <div className="lg:col-span-3">
          <AgendamentosList />
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <LeadsRecentes />
           <PacientesRecentes />
        </div>
      </div>

      {/* ── Modal Insights IA ──────────────────────────── */}
      {insightModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Insights com IA</h2>
              </div>
              <button onClick={() => setInsightModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 min-h-[120px] flex items-center justify-center">
              {insightLoading ? (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  <p className="text-sm">Gerando insights da clínica...</p>
                </div>
              ) : (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{insightText}</p>
              )}
            </div>
            <div className="px-5 pb-5 flex justify-end">
              <button
                onClick={() => setInsightModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
