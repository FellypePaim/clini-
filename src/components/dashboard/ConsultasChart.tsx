import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SemanaData {
  semana: string
  consultas: number
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg shadow-gray-100/50">
        <p className="text-xs text-gray-500 mb-1">Semana de {label}</p>
        <p className="text-lg font-bold text-gray-900">
          {payload[0].value}{' '}
          <span className="text-sm font-normal text-gray-500">consultas</span>
        </p>
      </div>
    )
  }
  return null
}

export function ConsultasChart() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [dados, setDados] = useState<SemanaData[]>([])
  const [loading, setLoading] = useState(true)

  const loadDados = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    // Últimas 4 semanas
    const semanas: SemanaData[] = []
    const hoje = new Date()

    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - (i + 1) * 7)
      const fimSemana = new Date(hoje)
      fimSemana.setDate(hoje.getDate() - i * 7)

      const { count } = await supabase
        .from('consultas')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinicaId)
        .gte('data_hora_inicio', inicioSemana.toISOString())
        .lt('data_hora_inicio', fimSemana.toISOString())

      semanas.push({
        semana: inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        consultas: count ?? 0,
      })
    }

    setDados(semanas)
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    if (!clinicaId) return
    loadDados()
  }, [clinicaId, loadDados])

  const total = dados.reduce((acc, d) => acc + d.consultas, 0)
  const lastWeek = dados[dados.length - 1]?.consultas ?? 0
  const prevWeek = dados[dados.length - 2]?.consultas ?? 0
  const variacao = prevWeek > 0 ? (((lastWeek - prevWeek) / prevWeek) * 100).toFixed(1) : '0'
  const positivo = Number(variacao) >= 0

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Consultas por Semana</h3>
          <p className="text-xs text-gray-400 mt-0.5">Últimas 4 semanas</p>
        </div>
        {!loading && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${positivo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {positivo ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {positivo ? '+' : ''}{variacao}%
          </div>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-24 bg-gray-100 rounded" />
          <div className="h-40 bg-gray-50 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-bold text-gray-900">{total}</span>
            <span className="text-sm text-gray-400">consultas no período</span>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="consultas"
                stroke="#16A34A"
                strokeWidth={2.5}
                dot={{ fill: '#16A34A', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: '#16A34A', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </article>
  )
}
