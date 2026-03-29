import { useEffect, useState, useCallback } from 'react'
import { Phone, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

interface Paciente {
  id: string
  nome_completo: string
  contato: { telefone?: string } | null
  totalConsultas: number
  ultimaConsulta: string | null
}

const BG_COLORS = [
  'bg-cyan-500/10 text-cyan-500',
  'bg-indigo-500/10 text-indigo-400',
  'bg-purple-500/10 text-purple-400',
  'bg-amber-500/10 text-amber-400',
]

export function PacientesRecentes() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const clinicaId = user?.clinicaId
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  const loadPacientes = useCallback(async () => {
    if (!clinicaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, nome_completo, whatsapp, created_at, updated_at')
      .eq('clinica_id', clinicaId)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (!error && data) {
      // Buscar contagem de consultas em uma única query agrupada
      const ids = data.map((p: any) => p.id)
      const { data: consultasData } = await supabase
        .from('consultas')
        .select('paciente_id')
        .eq('clinica_id', clinicaId)
        .in('paciente_id', ids)

      // Agrupar contagem por paciente
      const countMap = new Map<string, number>()
      for (const c of consultasData || []) {
        countMap.set(c.paciente_id, (countMap.get(c.paciente_id) || 0) + 1)
      }

      const pacientesComConsultas = data.map((p: any) => ({
        id: p.id,
        nome_completo: p.nome_completo,
        contato: { telefone: p.whatsapp },
        totalConsultas: countMap.get(p.id) || 0,
        ultimaConsulta: p.updated_at ? p.updated_at.split('T')[0] : null,
      }))
      setPacientes(pacientesComConsultas)
    }
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    if (!clinicaId) return
    loadPacientes()
  }, [clinicaId, loadPacientes])

  return (
    <article className="rounded-xl border border-[var(--color-border)] p-5" style={{ background: 'var(--color-bg-card)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pacientes Recentes</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Últimas atualizações registradas</p>
        </div>
        <button
          onClick={() => navigate('/pacientes')}
          className="flex items-center gap-1 text-xs text-cyan-500 font-medium hover:text-cyan-400 transition-colors"
        >
          Ver todos <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2.5 rounded-lg">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-bg-deep)] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-[var(--color-bg-deep)] rounded" />
                <div className="h-3 w-24 bg-[var(--color-bg-deep)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
          <p className="text-sm font-medium">Nenhum paciente cadastrado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pacientes.map((pac, idx) => {
            const initials = pac.nome_completo
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <div
                key={pac.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-bg-card-hover)] transition-colors cursor-pointer group"
                onClick={() => navigate(`/pacientes/${pac.id}`)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${BG_COLORS[idx % BG_COLORS.length]}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{pac.nome_completo}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-[var(--color-text-dim)]" />
                    <p className="text-xs text-[var(--color-text-muted)]">{pac.contato?.telefone ?? '—'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[var(--color-text-muted)]">Desde</p>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-0.5">
                    {pac.ultimaConsulta
                      ? new Date(pac.ultimaConsulta + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
