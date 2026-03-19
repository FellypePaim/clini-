import { useEffect, useState } from 'react'
import { Calendar, UserPlus, DollarSign, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface KpiData {
  id: string
  titulo: string
  valor: string
  icone: string
  cor: keyof typeof COLOR_MAP
  variacao: number
}

const ICON_MAP = { Calendar, UserPlus, DollarSign, Target }

const COLOR_MAP = {
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'hover:border-green-200'  },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'hover:border-blue-200'   },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'hover:border-purple-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'hover:border-orange-200' },
}

function KpiSkeleton() {
  return (
    <div className="kpi-card animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 mb-4" />
      <div className="h-8 w-20 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-32 bg-gray-100 rounded" />
    </div>
  )
}

export function KpiCards() {
  const { user } = useAuthStore()
  const clinicaId = (user as any)?.user_metadata?.clinica_id
  const [kpis, setKpis] = useState<KpiData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    loadKpis()
  }, [clinicaId])

  async function loadKpis() {
    setLoading(true)
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString()
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()

    // Consultas hoje
    const { count: consultasHoje } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('data_hora', inicioHoje)
      .lt('data_hora', fimHoje)

    // Novos pacientes este mês
    const { count: pacientesMes } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('created_at', mesAtual)

    // Novos pacientes mês anterior
    const { count: pacientesMesAnterior } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('created_at', mesAnterior)
      .lt('created_at', fimMesAnterior)

    // Faturamento do mês (lançamentos do tipo receita)
    const { data: lancamentos } = await supabase
      .from('lancamentos')
      .select('valor')
      .eq('clinica_id', clinicaId)
      .eq('tipo', 'receita')
      .gte('data_competencia', mesAtual.split('T')[0])

    const faturamento = lancamentos?.reduce((sum, l) => sum + (l.valor ?? 0), 0) ?? 0

    // Taxa de comparecimento (consultas concluídas / total agendadas este mês)
    const { count: agendadasMes } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .gte('data_hora', mesAtual)

    const { count: concluidasMes } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .eq('status', 'concluido')
      .gte('data_hora', mesAtual)

    const taxaComparecimento = agendadasMes && agendadasMes > 0
      ? Math.round(((concluidasMes ?? 0) / agendadasMes) * 100)
      : 0

    const variacaoPacientes = pacientesMesAnterior && pacientesMesAnterior > 0
      ? Math.round((((pacientesMes ?? 0) - pacientesMesAnterior) / pacientesMesAnterior) * 100)
      : 0

    setKpis([
      {
        id: 'consultas-hoje',
        titulo: 'Consultas Hoje',
        valor: String(consultasHoje ?? 0),
        icone: 'Calendar',
        cor: 'green',
        variacao: 0,
      },
      {
        id: 'novos-pacientes',
        titulo: 'Novos Pacientes (Mês)',
        valor: String(pacientesMes ?? 0),
        icone: 'UserPlus',
        cor: 'blue',
        variacao: variacaoPacientes,
      },
      {
        id: 'faturamento',
        titulo: 'Faturamento (Mês)',
        valor: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        icone: 'DollarSign',
        cor: 'purple',
        variacao: 0,
      },
      {
        id: 'comparecimento',
        titulo: 'Taxa de Comparecimento',
        valor: `${taxaComparecimento}%`,
        icone: 'Target',
        cor: 'orange',
        variacao: 0,
      },
    ])
    setLoading(false)
  }

  if (loading) {
    return (
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <KpiSkeleton key={i} />)}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.icone as keyof typeof ICON_MAP] ?? Calendar
          const colors = COLOR_MAP[kpi.cor]
          const variacao = kpi.variacao ?? 0
          const TrendIcon = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : Minus
          const trendColor = variacao > 0 ? 'text-green-600' : variacao < 0 ? 'text-red-500' : 'text-gray-400'
          const trendBg   = variacao > 0 ? 'bg-green-50' : variacao < 0 ? 'bg-red-50' : 'bg-gray-50'

          return (
            <article
              key={kpi.id}
              className={cn('kpi-card group cursor-default', colors.border)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
                {variacao !== 0 && (
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', trendBg, trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {Math.abs(variacao)}%
                  </div>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{kpi.valor}</p>
                <p className="text-sm text-gray-500">{kpi.titulo}</p>
              </div>

              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', colors.icon.replace('text-', 'bg-'))}
                  style={{ width: '60%' }}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
