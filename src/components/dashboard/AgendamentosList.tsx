import React from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { mockAgendamentosHoje } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import type { AppointmentStatus } from '../../types'
import { cn } from '../../lib/utils'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'red' }> = {
  agendado:       { label: 'Agendado',       variant: 'blue'   },
  confirmado:     { label: 'Confirmado',     variant: 'green'  },
  em_atendimento: { label: 'Em atendimento', variant: 'orange' },
  concluido:      { label: 'Concluído',      variant: 'gray'   },
  cancelado:      { label: 'Cancelado',      variant: 'red'    },
  faltou:         { label: 'Faltou',         variant: 'red'    },
}

const PROCEDIMENTO_LABEL: Record<string, string> = {
  consulta:   'Consulta',
  retorno:    'Retorno',
  botox:      'Botox',
  limpeza:    'Limpeza',
  ortodontia: 'Ortodontia',
  exame:      'Exame',
  cirurgia:   'Cirurgia',
  outro:      'Outro',
}

export function AgendamentosList() {
  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Agenda de Hoje</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors">
          Ver tudo <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {mockAgendamentosHoje.map((apt) => {
          const statusConfig = STATUS_CONFIG[apt.status]
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
              {/* Horário */}
              <div className="flex items-center gap-1.5 text-gray-500 w-20 shrink-0">
                <Clock className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs font-medium">{apt.horaInicio}</span>
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{apt.pacienteNome}</p>
                <p className="text-xs text-gray-400 truncate">
                  {PROCEDIMENTO_LABEL[apt.procedimento]} · {apt.profissionalNome.split(' ')[0]} {apt.profissionalNome.split(' ').slice(-1)[0]}
                </p>
              </div>

              {/* Valor + status */}
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
    </article>
  )
}
