import React, { useState, useRef } from 'react'
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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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
  ausencias?: Array<{ profissional_id: string; data_inicio: string; data_fim: string; tipo: string }>
  onCardClick: (apt: AgendaAppointment) => void
  onSlotClick: (date: string, hour: number) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onDrop?: (id: string, newDate: string, newHoraInicio: string, newHoraFim: string) => void
}

export function WeekView({ currentDate, appointments, ausencias, onCardClick, onSlotClick, onStatusChange, onDrop }: WeekViewProps) {
  const today      = new Date()
  const weekDays   = getWeekDays(currentDate)
  const totalHeight = HOURS.length * SLOT_HEIGHT

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropPreview, setDropPreview] = useState<{ dayIdx: number; top: number } | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleDragStart = (e: React.DragEvent, apt: AgendaAppointment) => {
    setDraggingId(apt.id)
    e.dataTransfer.setData('appointment-id', apt.id)
    e.dataTransfer.setData('duration', String(timeToMinutes(apt.horaFim) - timeToMinutes(apt.horaInicio)))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const col = colRefs.current[dayIdx]
    if (col) {
      const rect = col.getBoundingClientRect()
      const y = e.clientY - rect.top
      const minutes = Math.round((y / SLOT_HEIGHT) * 60 / 15) * 15
      const snappedTop = (minutes / 60) * SLOT_HEIGHT
      setDropPreview({ dayIdx, top: snappedTop })
    }
  }

  const handleDragLeave = () => {
    setDropPreview(null)
  }

  const handleDrop = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault()
    setDropPreview(null)
    setDraggingId(null)
    if (!onDrop) return

    const aptId = e.dataTransfer.getData('appointment-id')
    const duration = Number(e.dataTransfer.getData('duration')) || 30
    const col = colRefs.current[dayIdx]
    if (!col) return

    const rect = col.getBoundingClientRect()
    const y = e.clientY - rect.top
    const rawMinutes = (y / SLOT_HEIGHT) * 60
    const snappedMinutes = Math.round(rawMinutes / 15) * 15
    const startMinutes = 7 * 60 + snappedMinutes

    const newDate = toDateStr(weekDays[dayIdx])
    const newHoraInicio = minutesToTime(startMinutes)
    const newHoraFim = minutesToTime(startMinutes + duration)

    onDrop(aptId, newDate, newHoraInicio, newHoraFim)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDropPreview(null)
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Cabeçalho dos dias */}
      <div
        className="sticky top-0 z-10 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] grid"
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
                'py-3 flex flex-col items-center border-l border-[var(--color-border)] first:border-l-0',
                isToday && 'bg-cyan-500/5'
              )}
            >
              <span className={cn('text-[11px] font-medium', isToday ? 'text-cyan-500' : 'text-[var(--color-text-muted)]')}>
                {DIAS[idx]}
              </span>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center my-0.5',
                isToday ? 'bg-cyan-600 text-white' : 'text-[var(--color-text-secondary)]'
              )}>
                <span className={cn('text-sm font-bold')}>{d.getDate()}</span>
              </div>
              {aptCount > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(aptCount, 3) }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-cyan-400" />
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
              <span className="text-[10px] text-[var(--color-text-dim)] font-medium">{String(h).padStart(2,'0')}:00</span>
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
              ref={(el) => { colRefs.current[idx] = el }}
              className={cn(
                'relative border-l border-[var(--color-border)]',
                isToday && 'bg-cyan-500/5'
              )}
              style={{ height: totalHeight }}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
            >
              {/* Linhas de hora / slots clicáveis */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-[var(--color-border)] group cursor-pointer hover:bg-cyan-500/5 transition-colors"
                  style={{ top: (h - 7) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                  onClick={() => onSlotClick(dateStr, h)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-cyan-400 font-medium">+</span>
                  </div>
                </div>
              ))}

              {/* Drop preview */}
              {dropPreview?.dayIdx === idx && (
                <div
                  className="absolute left-1 right-1 bg-cyan-500/15 border-2 border-dashed border-cyan-400 rounded-lg pointer-events-none z-30 transition-all duration-75"
                  style={{ top: dropPreview.top, height: SLOT_HEIGHT / 2 }}
                />
              )}

              {/* Cards */}
              {dayApts.map((apt) => (
                <div
                  key={apt.id}
                  style={getCardStyle(apt)}
                  className={cn('z-10 cursor-grab active:cursor-grabbing', draggingId === apt.id && 'opacity-30')}
                  draggable
                  onDragStart={(e) => handleDragStart(e, apt)}
                  onDragEnd={handleDragEnd}
                >
                  <AppointmentCard
                    appointment={apt}
                    compact
                    onClick={onCardClick}
                    onStatusChange={(id, status) => onStatusChange(id, status)}
                  />
                </div>
              ))}

              {/* Overlay de ausência */}
              {ausencias?.filter(a =>
                a.data_inicio <= dateStr && a.data_fim >= dateStr
              ).length! > 0 && (
                <div className="absolute inset-x-0 top-0 bottom-0 bg-[var(--color-border)]/40 border-2 border-dashed border-slate-300 rounded-lg z-[5] flex items-start justify-center pt-8 pointer-events-none">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-card)] px-3 py-1.5 rounded-full border border-[var(--color-border)] shadow-sm flex items-center gap-1.5">
                    Ausente
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
