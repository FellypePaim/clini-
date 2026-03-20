import { useEffect, useState } from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

type AppointmentStatus = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'red' }> = {
  agendado:       { label: 'Agendado',       variant: 'blue'   },
  confirmado:     { label: 'Confirmado',     variant: 'green'  },
  em_atendimento: { label: 'Em atendimento', variant: 'orange' },
  concluido:      { label: 'Concluído',      variant: 'gray'   },
  cancelado:      { label: 'Cancelado',      variant: 'red'    },
  faltou:         { label: 'Faltou',         variant: 'red'    },
}

interface Agendamento {
  id: string
  horaInicio: string
  pacienteNome: string
  procedimento: string
  profissionalNome: string
  valor: number | null
  status: AppointmentStatus
}

export function AgendamentosList() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const clinicaId = user?.clinicaId
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    loadAgendamentos()
  }, [clinicaId])

  async function loadAgendamentos() {
    setLoading(true)
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

    const { data, error } = await supabase
      .from('consultas')
      .select(`
        id,
        data_hora,
        procedimento,
        status,
        valor,
        pacientes (nome_completo),
        profiles (nome_completo)
      `)
      .eq('clinica_id', clinicaId)
      .gte('data_hora', inicioHoje)
      .lt('data_hora', fimHoje)
      .order('data_hora', { ascending: true })
      .limit(8)

    if (!error && data) {
      setAgendamentos(data.map((c: any) => ({
        id: c.id,
        horaInicio: new Date(c.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        pacienteNome: c.pacientes?.nome_completo ?? 'Paciente',
        procedimento: c.procedimento ?? 'Consulta',
        profissionalNome: c.profiles?.nome_completo ?? 'Profissional',
        valor: c.valor ?? null,
        status: c.status as AppointmentStatus,
      })))
    }
    setLoading(false)
  }

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Agenda de Hoje</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/agenda')}
          className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors"
        >
          Ver tudo <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-gray-100">
              <div className="w-20 h-4 bg-gray-100 rounded" />
              <div className="flex-1 h-4 bg-gray-100 rounded" />
              <div className="w-16 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mb-2 text-gray-200" />
          <p className="text-sm font-medium">Nenhum agendamento para hoje</p>
        </div>
      ) : (
        <div className="space-y-2">
          {agendamentos.map((apt) => {
            const statusConfig = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG['agendado']
            return (
              <div
                key={apt.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 group cursor-pointer',
                  apt.status === 'em_atendimento'
                    ? 'border-orange-200 bg-orange-50/50'
                    : 'border-gray-100 hover:border-green-200 hover:bg-green-50/30'
                )}
              >
                <div className="flex items-center gap-1.5 text-gray-500 w-20 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-xs font-medium">{apt.horaInicio}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{apt.pacienteNome}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {apt.procedimento} · {apt.profissionalNome.split(' ')[0]}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {apt.valor && (
                    <span className="text-xs font-semibold text-gray-700">
                      R$ {apt.valor.toLocaleString('pt-BR')}
                    </span>
                  )}
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
