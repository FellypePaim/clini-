import React, { useRef, useEffect } from 'react'
import type { AgendaAppointment, AppointmentStatus } from '../../types/agenda'
import { AppointmentCard } from './AppointmentCard'
import { cn } from '../../lib/utils'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00–20:00
const SLOT_HEIGHT = 64 // px por hora

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface DayViewProps {
  date: Date
  appointments: AgendaAppointment[]
  onCardClick: (apt: AgendaAppointment) => void
  onSlotClick: (hour: number) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

export function DayView({ date, appointments, onCardClick, onSlotClick, onStatusChange }: DayViewProps) {
  const nowLineRef = useRef<HTMLDivElement>(null)
  const isToday = date.toDateString() === new Date().toDateString()
  const now = new Date()

  // Scroll para hora atual ao montar
  useEffect(() => {
    if (isToday && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday])

  const nowTopPercent = isToday
    ? ((now.getHours() * 60 + now.getMinutes() - 7 * 60) / (14 * 60)) * 100
    : -1

  // Posiciona cada cards na grade de horas
  function getCardStyle(apt: AgendaAppointment): React.CSSProperties {
    const startMin = timeToMinutes(apt.horaInicio) - 7 * 60
    const endMin   = timeToMinutes(apt.horaFim) - 7 * 60
    const top    = (startMin / 60) * SLOT_HEIGHT
    const height = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT, 28)
    return { position: 'absolute', top, height, left: 8, right: 8 }
  }

  const totalHeight = HOURS.length * SLOT_HEIGHT

  return (
    <div className="flex-1 overflow-auto">
      {/* Data header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-3xl font-bold',
            isToday ? 'text-green-600' : 'text-gray-800'
          )}>
            {date.getDate()}
          </span>
          <span className="text-sm text-gray-400 capitalize">
            {date.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', year: 'numeric' })}
          </span>
          {isToday && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              Hoje
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {appointments.length} consulta{appointments.length !== 1 ? 's' : ''} agendada{appointments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative flex" style={{ minHeight: totalHeight + 40 }}>
        {/* Coluna de horas */}
        <div className="w-16 shrink-0 relative" style={{ height: totalHeight }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute flex items-start justify-end pr-3 pt-1"
              style={{ top: (h - 7) * SLOT_HEIGHT, height: SLOT_HEIGHT, left: 0, right: 0 }}
            >
              <span className="text-[11px] text-gray-300 font-medium">{String(h).padStart(2,'0')}:00</span>
            </div>
          ))}
        </div>

        {/* Grade + Appointments */}
        <div className="flex-1 relative border-l border-gray-100" style={{ height: totalHeight }}>
          {/* Linhas de hora */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-gray-100 cursor-pointer hover:bg-green-50/40 transition-colors group"
              style={{ top: (h - 7) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
              onClick={() => onSlotClick(h)}
            >
              <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-green-500 font-medium">+ Consulta</span>
              </div>
            </div>
          ))}

          {/* Linha "agora" */}
          {isToday && nowTopPercent >= 0 && nowTopPercent <= 100 && (
            <div
              ref={nowLineRef}
              className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
              style={{ top: `${nowTopPercent}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 -ml-1.5 shrink-0" />
              <div className="flex-1 h-px bg-green-500" />
              <span className="text-[10px] text-green-600 font-semibold ml-1 bg-white px-1 rounded">
                {now.getHours().toString().padStart(2,'0')}:{now.getMinutes().toString().padStart(2,'0')}
              </span>
            </div>
          )}

          {/* Cards das consultas */}
          {appointments.map((apt) => (
            <div key={apt.id} style={getCardStyle(apt)} className="z-20">
              <AppointmentCard
                appointment={apt}
                onClick={onCardClick}
                onStatusChange={(id, status) => onStatusChange(id, status)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
