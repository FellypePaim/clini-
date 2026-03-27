import { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  UserCheck,
  CalendarCheck,
  DollarSign,
  Megaphone,
  Bot,
  Cpu,
  Coins,
  FileText,
  ClipboardList,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

interface DashboardData {
  clinicas: { total: number; ativas: number; trial: number; suspensas: number }
  usuarios: number
  pacientes: number
  consultas: { hoje: number; total: number; porDia: Record<string, number> }
  leads: number
  prescricoes: number
  evolucoes: number
  ai: { calls: number; cost: number; tokens: number }
  mrr: number
  recentClinicas: Array<{ id: string; nome: string; created_at: string; status: string }>
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getWeekdayShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'ativa':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400' }
    case 'trial':
      return { bg: 'bg-indigo-500/15', text: 'text-indigo-400' }
    case 'suspensa':
      return { bg: 'bg-red-500/15', text: 'text-red-400' }
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400' }
  }
}

export function SuperDashboardPage() {
  const { getDashboard } = useSuperAdmin()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await getDashboard()
      if (!cancelled) {
        setData(result as DashboardData | null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getDashboard])

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Carregando dashboard...
        </p>
      </div>
    )
  }

  // --- KPI cards ---
  const kpis = [
    {
      label: 'Clinicas',
      value: formatNumber(data.clinicas.total),
      sub: `${formatNumber(data.clinicas.ativas)} ativas / ${formatNumber(data.clinicas.trial)} trial`,
      icon: Building2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Usuarios',
      value: formatNumber(data.usuarios),
      sub: 'total na plataforma',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Pacientes',
      value: formatNumber(data.pacientes),
      sub: 'cadastrados',
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Consultas Hoje',
      value: formatNumber(data.consultas.hoje),
      sub: `${formatNumber(data.consultas.total)} total`,
      icon: CalendarCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'MRR',
      value: formatCurrency(data.mrr),
      sub: 'receita recorrente',
      icon: DollarSign,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Leads',
      value: formatNumber(data.leads),
      sub: 'aguardando conversao',
      icon: Megaphone,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ]

  // --- Chart data ---
  const porDiaEntries = Object.entries(data.consultas.porDia)
  const maxConsultas = Math.max(...porDiaEntries.map(([, v]) => v), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard SuperAdmin</h1>
        <p className="text-sm text-slate-400 mt-1">
          Visao geral da plataforma em tempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/70 transition-colors relative overflow-hidden group"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', kpi.bg)}>
              <kpi.icon className={kpi.color} size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-black text-white">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            <kpi.icon
              className="absolute -bottom-3 -right-3 w-20 h-20 text-slate-700/10 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      {/* Middle row: Chart + AI card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultas 7 dias chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-indigo-400" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              Consultas - Ultimos 7 dias
            </h2>
          </div>

          {porDiaEntries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Sem dados de consultas</p>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {porDiaEntries.map(([dateKey, count]) => {
                const heightPercent = (count / maxConsultas) * 100
                return (
                  <div key={dateKey} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      {formatNumber(count)}
                    </span>
                    <div className="w-full relative" style={{ height: '140px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 transition-all duration-500 hover:from-indigo-500 hover:to-purple-400"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 capitalize">
                      {getWeekdayShort(dateKey)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI Usage card */}
        <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/40 border border-purple-500/20 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="text-purple-400" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              Uso de IA
            </h2>
          </div>

          <div className="space-y-5 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Cpu className="text-purple-400" size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calls</p>
                <p className="text-lg font-black text-white">{formatNumber(data.ai.calls)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <FileText className="text-indigo-400" size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tokens</p>
                <p className="text-lg font-black text-white">{formatNumber(data.ai.tokens)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center">
                <Coins className="text-pink-400" size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo</p>
                <p className="text-lg font-black text-white">
                  U$ {data.ai.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Extra counts */}
          <div className="mt-6 pt-4 border-t border-purple-500/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescricoes</p>
              <p className="text-base font-black text-white">{formatNumber(data.prescricoes)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evolucoes</p>
              <p className="text-base font-black text-white">{formatNumber(data.evolucoes)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent clinics table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700/50">
          <ClipboardList className="text-purple-400" size={18} />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Ultimas Clinicas Cadastradas
          </h2>
        </div>

        {data.recentClinicas.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            Nenhuma clinica cadastrada recentemente
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-700/50">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data de Criacao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.recentClinicas.map((clinica) => {
                  const sc = statusColor(clinica.status)
                  return (
                    <tr
                      key={clinica.id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-white">
                            {clinica.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-200">
                            {clinica.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                            sc.bg,
                            sc.text,
                          )}
                        >
                          {clinica.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(clinica.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
