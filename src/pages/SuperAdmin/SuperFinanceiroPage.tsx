import { useState, useEffect, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
  ArrowUpDown,
  Building2,
  Percent,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

interface Plano {
  nome: string
  valor: number
  count: number
}

interface Clinica {
  id: string
  nome: string
  created_at: string
  status: string
  plano: string
}

interface FinanceiroData {
  mrr: number
  arr: number
  ltv: number
  churn: number
  receitaClinicas: number
  planos: Plano[]
  clinicas: Clinica[]
}

type SortDir = 'asc' | 'desc'

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'ativa' || s === 'ativo' || s === 'active') return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
  if (s === 'suspensa' || s === 'suspended') return 'bg-red-500/10 text-red-400 ring-red-500/20'
  if (s === 'trial') return 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
  if (s === 'inativa' || s === 'inactive') return 'bg-slate-800/10 text-[var(--color-text-muted)] ring-slate-500/20'
  return 'bg-slate-800/10 text-[var(--color-text-muted)] ring-slate-500/20'
}

export function SuperFinanceiroPage() {
  const { getFinanceiro, isLoading } = useSuperAdmin()
  const [data, setData] = useState<FinanceiroData | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    async function load() {
      const res = await getFinanceiro()
      if (res) setData(res as FinanceiroData)
    }
    load()
  }, [getFinanceiro])

  const sortedClinicas = useMemo(() => {
    if (!data?.clinicas) return []
    return [...data.clinicas].sort((a, b) => {
      const cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data?.clinicas, sortDir])

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

  const kpis = [
    {
      label: 'MRR',
      value: formatCurrency(data?.mrr ?? 0),
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'ARR',
      value: formatCurrency(data?.arr ?? 0),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'LTV',
      value: formatCurrency(data?.ltv ?? 0),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Churn Rate',
      value: `${data?.churn ?? 0}%`,
      icon: Percent,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Receita Clinicas',
      value: formatCurrency(data?.receitaClinicas ?? 0),
      icon: Building2,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
  ]

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Financeiro da Plataforma</h1>
        <p className="text-[var(--color-text-muted)] font-medium mt-1">
          Visao geral de receita, planos e clinicas.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative overflow-hidden bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 group hover:bg-slate-800/60 transition-all"
          >
            <div className="relative z-10">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-4',
                  kpi.bg,
                  kpi.color,
                )}
              >
                <kpi.icon size={20} />
              </div>
              <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-[0.15em] mb-1">
                {kpi.label}
              </p>
              <span className="text-xl font-black text-white tracking-tight">{kpi.value}</span>
            </div>
            <kpi.icon
              size={100}
              className="absolute -bottom-6 -right-6 text-[var(--color-text-secondary)]/5 group-hover:scale-110 transition-transform duration-700"
            />
          </div>
        ))}
      </div>

      {/* Distribuicao por Plano + Lista de Clinicas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribuicao por Plano */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
            <BarChart3 size={16} /> Distribuicao por Plano
          </h2>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            {(!data?.planos || data.planos.length === 0) && (
              <p className="text-sm text-[var(--color-text-muted)]">Nenhum plano encontrado.</p>
            )}
            {data?.planos?.map((plano) => (
              <div
                key={plano.nome}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:bg-slate-900 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{plano.nome}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {formatCurrency(plano.valor)}/mes
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white">{plano.count}</span>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] block">
                    {plano.count === 1 ? 'clinica' : 'clinicas'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Clinicas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
            <Building2 size={16} /> Lista de Clinicas
          </h2>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Plano</th>
                    <th
                      className="px-6 py-4 cursor-pointer select-none hover:text-[var(--color-text-dim)] transition-colors"
                      onClick={toggleSort}
                    >
                      <span className="inline-flex items-center gap-1">
                        Status
                        <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th className="px-6 py-4 text-right">Criacao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {sortedClinicas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
                        Nenhuma clinica encontrada.
                      </td>
                    </tr>
                  )}
                  {sortedClinicas.map((clinica) => (
                    <tr
                      key={clinica.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-200">{clinica.nome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[var(--color-text-dim)]">{clinica.plano}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset',
                            statusColor(clinica.status),
                          )}
                        >
                          {clinica.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatDate(clinica.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-900/30 border-t border-slate-800/50 text-right">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                {sortedClinicas.length} clinica(s)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
