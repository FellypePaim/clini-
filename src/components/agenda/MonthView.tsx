import { useState } from 'react'
import type { AgendaAppointment } from '../../types/agenda'
import { STATUS_CONFIG } from './AppointmentCard'
import { cn } from '../../lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DIAS_SEMANA  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first    = new Date(year, month, 1)
  const last     = new Date(year, month + 1, 0)
  const startDow = first.getDay() // 0=Dom
  const days: (Date | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // preenche até completar grade de 6 semanas (42 células)
  while (days.length < 42) days.push(null)
  return days
}

interface MonthViewProps {
  currentDate: Date
  appointments: AgendaAppointment[]
  onDayClick: (date: string) => void
  onCardClick: (apt: AgendaAppointment) => void
}

export function MonthView({ currentDate, appointments, onDayClick, onCardClick }: MonthViewProps) {
  const [viewYear, setViewYear] = useState(currentDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

  const today   = new Date()
  const days    = getMonthDays(viewYear, viewMonth)
  const todayStr = toDateStr(today)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="flex-1 overflow-auto px-4 py-4">
      {/* Navegação de mês inline */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 capitalize">
          {MESES_LABELS[viewMonth]} {viewYear}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-1 md: mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-[11px] font-semibold text-gray-400 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md: gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
        {days.map((day, idx) => {
          if (!day) return (
            <div key={`empty-${idx}`} className="bg-gray-50 min-h-24" />
          )

          const dateStr  = toDateStr(day)
          const dayApts  = appointments.filter(a => a.data === dateStr)
          const isToday  = dateStr === todayStr
          const isCurrentMonth = day.getMonth() === viewMonth
          const MAX_VISIBLE = 3

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={cn(
                'bg-white min-h-24 p-1.5 cursor-pointer hover:bg-green-50/50 transition-colors flex flex-col',
                !isCurrentMonth && 'bg-gray-50/60',
              )}
            >
              {/* Número do dia */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                  isToday ? 'bg-green-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                )}>
                  {day.getDate()}
                </span>
                {dayApts.length > 0 && (
                  <span className="text-[9px] text-green-600 font-semibold">
                    {dayApts.length}
                  </span>
                )}
              </div>

              {/* Chips de consulta */}
              <div className="space-y-0.5 flex-1">
                {dayApts.slice(0, MAX_VISIBLE).map((apt) => {
                  const cfg = STATUS_CONFIG[apt.status]
                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onCardClick(apt) }}
                      className={cn('rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80', cfg.bg, cfg.border, 'border')}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: apt.profissionalCor }} />
                      <span className={cn('text-[10px] font-medium truncate', cfg.text)}>
                        {apt.horaInicio} {apt.pacienteNome.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
                {dayApts.length > MAX_VISIBLE && (
                  <div className="text-[9px] text-gray-400 font-medium px-1.5 py-0.5">
                    +{dayApts.length - MAX_VISIBLE} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
