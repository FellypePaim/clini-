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
      <div className="border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-lg shadow-black/5" style={{ background: 'var(--color-bg-card)' }}>
        <p className="text-xs text-[var(--color-text-muted)] mb-1">Semana de {label}</p>
        <p className="text-lg font-bold text-[var(--color-text-primary)]">
          {payload[0].value}{' '}
          <span className="text-sm font-normal text-[var(--color-text-muted)]">consultas</span>
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
  const [error, setError] = useState<string | null>(null)

  const loadDados = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    setError(null)
    try {
      const semanas: SemanaData[] = []
      const hoje = new Date()

      for (let i = 3; i >= 0; i--) {
        const inicioSemana = new Date(hoje)
        inicioSemana.setDate(hoje.getDate() - (i + 1) * 7)
        const fimSemana = new Date(hoje)
        fimSemana.setDate(hoje.getDate() - i * 7)

        const { count, error: qErr } = await supabase
          .from('consultas')
          .select('*', { count: 'exact', head: true })
          .eq('clinica_id', clinicaId)
          .gte('data_hora_inicio', inicioSemana.toISOString())
          .lt('data_hora_inicio', fimSemana.toISOString())

        if (qErr) throw qErr

        semanas.push({
          semana: inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          consultas: count ?? 0,
        })
      }

      setDados(semanas)
    } catch {
      setError('Erro ao carregar dados')
      setDados([])
    } finally {
      setLoading(false)
    }
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
    <article className="rounded-xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-bg-card)' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Consultas por Semana</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Últimas 4 semanas</p>
        </div>
        {!loading && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${positivo ? 'bg-cyan-500/10 text-cyan-500' : 'bg-red-50 text-red-600'}`}>
            {positivo ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {positivo ? '+' : ''}{variacao}%
          </div>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-24 bg-[var(--color-bg-deep)] rounded" />
          <div className="h-40 bg-[var(--color-bg-deep)] rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={loadDados} className="mt-2 text-xs text-cyan-500 font-medium hover:underline">Tentar novamente</button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-bold text-[var(--color-text-primary)]">{total}</span>
            <span className="text-sm text-[var(--color-text-muted)]">consultas no período</span>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                stroke="#0891b2"
                strokeWidth={2.5}
                dot={{ fill: '#0891b2', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: '#0891b2', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </article>
  )
}
