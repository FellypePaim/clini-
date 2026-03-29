import { useEffect, useState, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface ProcData {
  nome: string
  valor: number
  cor: string
}

const CORES = ['#0891b2', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; payload: { cor: string } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-lg shadow-black/5" style={{ background: 'var(--color-bg-card)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.payload.cor }} />
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">{item.name}</p>
        </div>
        <p className="text-lg font-bold text-[var(--color-text-primary)]">{item.value}%</p>
      </div>
    )
  }
  return null
}

export function ProcedimentosPieChart() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [procedimentos, setProcedimentos] = useState<ProcData[]>([])
  const [loading, setLoading] = useState(true)

  const loadDados = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const mesAtual = new Date()
    const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString()

    const { data } = await supabase
      .from('consultas')
      .select('procedimento:procedimentos(nome)')
      .eq('clinica_id', clinicaId)
      .gte('data_hora_inicio', inicioMes)

    if (data && data.length > 0) {
      // Contar ocorrências por procedimento
      const contagem: Record<string, number> = {}
      data.forEach((c: any) => {
        const proc = c.procedimento?.nome ?? 'Outros'
        contagem[proc] = (contagem[proc] ?? 0) + 1
      })

      const total = data.length
      const sorted = Object.entries(contagem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([nome, count], idx) => ({
          nome,
          valor: Math.round((count / total) * 100),
          cor: CORES[idx % CORES.length],
        }))

      setProcedimentos(sorted)
    } else {
      setProcedimentos([])
    }
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    if (!clinicaId) return
    loadDados()
  }, [clinicaId, loadDados])

  const _total = procedimentos.reduce((acc, p) => acc + p.valor, 0)

  return (
    <article className="rounded-xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-bg-card)' }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Distribuição por Procedimento</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Este mês</p>
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-4 items-center">
          <div className="w-40 h-40 rounded-full bg-[var(--color-bg-deep)]" />
          <div className="flex-1 space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-3 bg-[var(--color-bg-deep)] rounded" />)}
          </div>
        </div>
      ) : procedimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
          <p className="text-sm font-medium">Sem dados de procedimentos</p>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">Registre consultas para ver o gráfico</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={procedimentos}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="valor"
                  nameKey="nome"
                >
                  {procedimentos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2.5">
            {procedimentos.map((proc) => (
              <div key={proc.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: proc.cor }} />
                  <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[90px]">{proc.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full bg-[var(--color-border)] w-16 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${proc.valor}%`, background: proc.cor }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] w-8 text-right">
                    {proc.valor}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
