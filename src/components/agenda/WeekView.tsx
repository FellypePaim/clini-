import type { AgendaAppointment, AppointmentStatus } from '../../types/agenda'
import { AppointmentCard } from './AppointmentCard'
import { cn } from '../../lib/utils'

const HOURS       = Array.from({ length: 14 }, (_, i) => i + 7)
const SLOT_HEIGHT = 56
const DIAS        = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekDays(base: Date): Date[] {
  const monday = new Date(base)
  const dow    = monday.getDay()
  const diff   = dow === 0 ? -6 : 1 - dow
  monday.setDate(monday.getDate() + diff)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getCardStyle(apt: AgendaAppointment): React.CSSProperties {
  const startMin = timeToMinutes(apt.horaInicio) - 7 * 60
  const endMin   = timeToMinutes(apt.horaFim)   - 7 * 60
  const top      = (startMin / 60) * SLOT_HEIGHT
  const height   = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT - 2, 26)
  return { position: 'absolute', top, height, left: 2, right: 2 }
}

interface WeekViewProps {
  currentDate: Date
  appointments: AgendaAppointment[]
  onCardClick: (apt: AgendaAppointment) => void
  onSlotClick: (date: string, hour: number) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

export function WeekView({ currentDate, appointments, onCardClick, onSlotClick, onStatusChange }: WeekViewProps) {
  const today      = new Date()
  const weekDays   = getWeekDays(currentDate)
  const totalHeight = HOURS.length * SLOT_HEIGHT

  return (
    <div className="flex-1 overflow-auto">
      {/* Cabeçalho dos dias */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-gray-100 grid"
        style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}
      >
        <div /> {/* espaço horas */}
        {weekDays.map((d, idx) => {
          const isToday = d.toDateString() === today.toDateString()
          const aptCount = appointments.filter(a => a.data === toDateStr(d)).length
          return (
            <div
              key={idx}
              className={cn(
                'py-3 flex flex-col items-center border-l border-gray-100 first:border-l-0',
                isToday && 'bg-green-50'
              )}
            >
              <span className={cn('text-[11px] font-medium', isToday ? 'text-green-600' : 'text-gray-400')}>
                {DIAS[idx]}
              </span>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center my-0.5',
                isToday ? 'bg-green-600 text-white' : 'text-gray-700'
              )}>
                <span className={cn('text-sm font-bold')}>{d.getDate()}</span>
              </div>
              {aptCount > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(aptCount, 3) }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-green-400" />
                  ))}
                  {aptCount > 3 && <div className="w-1 h-1 rounded-full bg-gray-300" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grade */}
      <div
        className="relative grid"
        style={{ gridTemplateColumns: '56px repeat(6, 1fr)', minHeight: totalHeight }}
      >
        {/* Coluna de horas */}
        <div className="relative" style={{ height: totalHeight }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute flex items-start justify-end pr-2 pt-1"
              style={{ top: (h - 7) * SLOT_HEIGHT, height: SLOT_HEIGHT, left: 0, right: 0 }}
            >
              <span className="text-[10px] text-gray-300 font-medium">{String(h).padStart(2,'0')}:00</span>
            </div>
          ))}
        </div>

        {/* Colunas por dia */}
        {weekDays.map((d, idx) => {
          const dateStr = toDateStr(d)
          const dayApts = appointments.filter(a => a.data === dateStr)
          const isToday = d.toDateString() === today.toDateString()

          return (
            <div
              key={idx}
              className={cn(
                'relative border-l border-gray-100',
                isToday && 'bg-green-50/20'
              )}
              style={{ height: totalHeight }}
            >
              {/* Linhas de hora / slots clicáveis */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-gray-100 group cursor-pointer hover:bg-green-50/50 transition-colors"
                  style={{ top: (h - 7) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  onClick={() => onSlotClick(dateStr, h)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-green-400 font-medium">+</span>
                  </div>
                </div>
              ))}

              {/* Cards */}
              {dayApts.map((apt) => (
                <div key={apt.id} style={getCardStyle(apt)} className="z-10">
                  <AppointmentCard
                    appointment={apt}
                    compact
                    onClick={onCardClick}
                    onStatusChange={(id, status) => onStatusChange(id, status)}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
