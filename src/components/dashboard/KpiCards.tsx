import { useEffect, useState, useCallback } from 'react'
import { Calendar, UserPlus, DollarSign, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface KpiData {
  id: string
  titulo: string
  valor: string
  subtitulo: string
  icone: string
  cor: keyof typeof COLOR_MAP
  variacao: number
  progresso: number
}

const ICON_MAP = { Calendar, UserPlus, DollarSign, Target }

const COLOR_MAP = {
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  bar: 'bg-green-500', ring: 'ring-green-100'  },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   bar: 'bg-blue-500',  ring: 'ring-blue-100'   },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', bar: 'bg-purple-500', ring: 'ring-purple-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', bar: 'bg-orange-500', ring: 'ring-orange-100' },
}

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="w-16 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="h-8 w-24 bg-gray-100 rounded mb-1" />
      <div className="h-4 w-32 bg-gray-100 rounded" />
    </div>
  )
}

export function KpiCards() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [kpis, setKpis] = useState<KpiData[]>([])
  const [loading, setLoading] = useState(true)

  const loadKpis = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const hoje = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`
    const inicioHoje = `${hojeStr}T00:00:00`
    const fimHoje = `${hojeStr}T23:59:59`
    const mesAtual = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-01T00:00:00`
    const mesAntDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const mesAnterior = `${mesAntDate.getFullYear()}-${pad(mesAntDate.getMonth() + 1)}-01T00:00:00`
    const fimMesAnterior = mesAtual

    const [consultasRes, pacMesRes, pacMesAntRes, faturamentoRes, agendadasRes, concluidasRes] = await Promise.all([
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId).gte('data_hora_inicio', inicioHoje).lt('data_hora_inicio', fimHoje),
      supabase.from('pacientes').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId).gte('created_at', mesAtual),
      supabase.from('pacientes').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId).gte('created_at', mesAnterior).lt('created_at', fimMesAnterior),
      supabase.from('lancamentos').select('valor')
        .eq('clinica_id', clinicaId).eq('tipo', 'receita').eq('status', 'pago').gte('data_competencia', mesAtual.split('T')[0]),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId).gte('data_hora_inicio', mesAtual),
      supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId).eq('status', 'finalizado').gte('data_hora_inicio', mesAtual),
    ])

    const consultasHoje = consultasRes.count ?? 0
    const pacientesMes = pacMesRes.count ?? 0
    const pacientesMesAnt = pacMesAntRes.count ?? 0
    const faturamento = (faturamentoRes.data ?? []).reduce((s: number, l: any) => s + (l.valor ?? 0), 0)
    const agendadasMes = agendadasRes.count ?? 0
    const concluidasMes = concluidasRes.count ?? 0
    const taxaComparecimento = agendadasMes > 0 ? Math.round((concluidasMes / agendadasMes) * 100) : 0
    const varPacientes = pacientesMesAnt > 0 ? Math.round(((pacientesMes - pacientesMesAnt) / pacientesMesAnt) * 100) : 0

    setKpis([
      {
        id: 'consultas', titulo: 'Consultas Hoje', valor: String(consultasHoje),
        subtitulo: 'agendadas para hoje', icone: 'Calendar', cor: 'green', variacao: 0,
        progresso: Math.min(100, consultasHoje * 10),
      },
      {
        id: 'pacientes', titulo: 'Novos Pacientes', valor: String(pacientesMes),
        subtitulo: 'este mês', icone: 'UserPlus', cor: 'blue', variacao: varPacientes,
        progresso: Math.min(100, pacientesMes * 5),
      },
      {
        id: 'faturamento', titulo: 'Faturamento',
        valor: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
        subtitulo: 'receita do mês', icone: 'DollarSign', cor: 'purple', variacao: 0,
        progresso: Math.min(100, faturamento > 0 ? 60 : 0),
      },
      {
        id: 'comparecimento', titulo: 'Comparecimento', valor: `${taxaComparecimento}%`,
        subtitulo: `${concluidasMes} de ${agendadasMes} consultas`, icone: 'Target', cor: 'orange', variacao: 0,
        progresso: taxaComparecimento,
      },
    ])
    setLoading(false)
  }, [clinicaId])

  useEffect(() => { if (clinicaId) loadKpis() }, [clinicaId, loadKpis])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <KpiSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = ICON_MAP[kpi.icone as keyof typeof ICON_MAP] ?? Calendar
        const colors = COLOR_MAP[kpi.cor]
        const v = kpi.variacao

        return (
          <article
            key={kpi.id}
            className={cn(
              'bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200',
              'hover:shadow-lg hover:shadow-gray-100/80 hover:border-gray-200 hover:-translate-y-0.5'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-4', colors.bg, colors.ring)}>
                <Icon className={cn('w-5 h-5', colors.icon)} />
              </div>
              {v !== 0 && (
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                  v > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                )}>
                  {v > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(v)}%
                </span>
              )}
            </div>

            <p className="text-2xl font-bold text-gray-900 tracking-tight">{kpi.valor}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.subtitulo}</p>

            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out', colors.bar)}
                style={{ width: `${kpi.progresso}%` }}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}
