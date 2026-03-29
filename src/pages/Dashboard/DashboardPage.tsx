import React, { useState } from 'react'
import { useAuthStore, usePermissions } from '../../store/authStore'
import { KpiCards } from '../../components/dashboard/KpiCards'
import { ConsultasChart } from '../../components/dashboard/ConsultasChart'
import { ProcedimentosPieChart } from '../../components/dashboard/ProcedimentosPieChart'
import { AgendamentosList } from '../../components/dashboard/AgendamentosList'
import { PacientesRecentes } from '../../components/dashboard/PacientesRecentes'
import { LeadsRecentes } from '../../components/dashboard/LeadsRecentes'
import { Sparkles, X, Loader2, CalendarDays, ArrowRight, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDateFormatted() {
  const d = new Date()
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const day = d.getDate()
  const month = d.toLocaleDateString('pt-BR', { month: 'long' })
  const year = d.getFullYear()
  return { weekday, full: `${day} de ${month}, ${year}` }
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const { isRecepcao, isAdmin } = usePermissions()
  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário'
  const [insightModal, setInsightModal] = useState(false)
  const [insightText, setInsightText] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes'>('mes')
  const date = getDateFormatted()

  const handleInsights = async () => {
    setInsightModal(true)
    setInsightText('')
    setInsightLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { action: 'dashboard_insights', clinica_id: user?.clinicaId },
      })
      if (error) throw error
      setInsightText(data?.data?.insights ?? data?.insights ?? 'Nenhum insight disponível no momento.')
    } catch {
      setInsightText('Não foi possível gerar insights agora. Verifique a conexão com a IA.')
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] capitalize flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {date.weekday}, {date.full}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mt-1">
            {getGreeting()}, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/agenda"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg-card-hover)] hover:border-[var(--color-border-hover)] transition-all"
            style={{ background: 'var(--color-bg-card)' }}
          >
            Ver agenda <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {!isRecepcao && (
            <button
              onClick={handleInsights}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-700 hover:to-indigo-600 transition-all shadow-sm shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              Insights IA
            </button>
          )}
        </div>
      </div>

      {/* ── Filtro de Período ─────────────────────────── */}
      <div className="flex items-center gap-1.5 border border-[var(--color-border)] rounded-xl p-1 w-fit" style={{ background: 'var(--color-bg-card)' }}>
        {([['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              periodo === key ? 'bg-cyan-600 text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card-hover)]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ────────────────────────────────── */}
      <KpiCards periodo={periodo} />

      {/* ── Gráficos (ocultos para recepção) ──────────── */}
      {!isRecepcao && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <ConsultasChart />
          </div>
          <div className="lg:col-span-2">
            <ProcedimentosPieChart />
          </div>
        </div>
      )}

      {/* ── Agendamentos + Leads + Pacientes ──────────── */}
      <div className={`grid grid-cols-1 gap-5 ${isRecepcao ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        <div className="lg:col-span-1">
          <AgendamentosList />
        </div>
        <div className="lg:col-span-1">
          <LeadsRecentes />
        </div>
        {!isRecepcao && (
          <div className="lg:col-span-1">
            <PacientesRecentes />
          </div>
        )}
      </div>

      {/* ── Modal Insights IA ─────────────────────────── */}
      {insightModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in" style={{ background: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">Insights com IA</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Análise baseada nos dados da sua clínica</p>
                </div>
              </div>
              <button onClick={() => setInsightModal(false)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-deep)] rounded-lg transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="p-6 min-h-[140px] flex items-center justify-center">
              {insightLoading ? (
                <div className="flex flex-col items-center gap-3 text-[var(--color-text-muted)]">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">Analisando dados da clínica...</p>
                </div>
              ) : (
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{insightText}</p>
              )}
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => setInsightModal(false)}
                className="px-4 py-2 bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--color-border)] transition-colors"
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
