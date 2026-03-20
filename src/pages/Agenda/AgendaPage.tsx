import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange, X } from 'lucide-react'
import type { AgendaView, AgendaAppointment, AppointmentStatus, AppointmentFormData } from '../../types/agenda'
import { useAgenda } from '../../hooks/useAgenda'
import { DayView } from '../../components/agenda/DayView'
import { WeekView } from '../../components/agenda/WeekView'
import { MonthView } from '../../components/agenda/MonthView'
import { AppointmentModal } from '../../components/agenda/AppointmentModal'
import { AppointmentDetailCard } from '../../components/agenda/AppointmentCard'
import { ProfissionalFilter } from '../../components/agenda/ProfissionalFilter'
import { cn } from '../../lib/utils'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const VIEWS: { key: AgendaView; label: string; icon: typeof Calendar }[] = [
  { key: 'dia',    label: 'Dia',    icon: Calendar      },
  { key: 'semana', label: 'Semana', icon: CalendarDays  },
  { key: 'mes',    label: 'Mês',    icon: CalendarRange },
]

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getWeekLabel(date: Date): string {
  const monday = new Date(date)
  const dow    = monday.getDay()
  const diff   = dow === 0 ? -6 : 1 - dow
  monday.setDate(monday.getDate() + diff)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  return `${monday.getDate()} – ${saturday.getDate()} de ${MESES_FULL[saturday.getMonth()]}, ${saturday.getFullYear()}`
}

export function AgendaPage() {
  const [view, setView]       = useState<AgendaView>('semana')
  const [date, setDate]       = useState(new Date('2026-03-18'))
  const [profFiltro, setProfFiltro] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [modalInitialDate, setModalInitialDate]   = useState<string>()
  const [modalInitialHour, setModalInitialHour]   = useState<string>()
  const [selectedApt, setSelectedApt]     = useState<AgendaAppointment | null>(null)
  const [detailPos, setDetailPos]         = useState({ x: 0, y: 0 })

  const { appointments, createAppointment, updateAppointment, getAppointmentsByDate, getAppointmentsByRange } = useAgenda()

  // ── Lista de profissionais únicos (derivada dos agendamentos) ──
  const profissionaisUnicos = useMemo(() => {
    const seen = new Map<string, { id: string; nome: string; especialidade: string; cor: string }>()
    appointments.forEach(a => {
      if (!seen.has(a.profissionalId)) {
        seen.set(a.profissionalId, {
          id: a.profissionalId,
          nome: a.profissionalNome,
          especialidade: a.profissionalEspecialidade,
          cor: a.profissionalCor,
        })
      }
    })
    return Array.from(seen.values())
  }, [appointments])

  // ── Filtrados por profissional ──────────────────────
  const filteredAppointments = useMemo(() =>
    appointments.filter(a =>
      profFiltro === 'todos' || a.profissionalId === profFiltro
    ),
    [appointments, profFiltro]
  )

  // ── Consultas visíveis no view atual ────────────────
  const visibleAppointments = useMemo(() => {
    if (view === 'dia') {
      return filteredAppointments.filter(a => a.data === toDateStr(date))
    }
    if (view === 'semana') {
      const monday = new Date(date)
      const dow    = monday.getDay()
      const diff   = dow === 0 ? -6 : 1 - dow
      monday.setDate(monday.getDate() + diff)
      const saturday = new Date(monday)
      saturday.setDate(monday.getDate() + 5)
      const start = toDateStr(monday)
      const end   = toDateStr(saturday)
      return filteredAppointments.filter(a => a.data >= start && a.data <= end)
    }
    return filteredAppointments
  }, [filteredAppointments, view, date])

  // ── Navegar data ─────────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    const d = new Date(date)
    if (view === 'dia')    d.setDate(d.getDate() + dir)
    if (view === 'semana') d.setDate(d.getDate() + 7 * dir)
    if (view === 'mes')    d.setMonth(d.getMonth() + dir)
    setDate(d)
  }

  // ── Label do header ───────────────────────────────────
  const dateLabel = useMemo(() => {
    if (view === 'dia')
      return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'semana')
      return getWeekLabel(date)
    return `${MESES_FULL[date.getMonth()]} de ${date.getFullYear()}`
  }, [view, date])

  // ── Handlers ─────────────────────────────────────────
  const handleSlotClick = (dateStr: string, hour: number) => {
    setModalInitialDate(dateStr)
    setModalInitialHour(`${String(hour).padStart(2,'0')}:00`)
    setIsModalOpen(true)
  }

  const handleCardClick = (apt: AgendaAppointment, evt?: React.MouseEvent) => {
    setSelectedApt(apt)
  }

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointment(id, { status })
    if (selectedApt?.id === id) {
      setSelectedApt(prev => prev ? { ...prev, status } : null)
    }
  }

  const handleCreateAppointment = async (data: AppointmentFormData) => {
    await createAppointment(data)
  }

  const handleDayClick = (dateStr: string) => {
    setDate(new Date(dateStr + 'T00:00:00'))
    setView('dia')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 overflow-hidden">
      {/* ── Barra de ferramentas ──────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex flex-col gap-3">
          {/* Linha 1: navegação + views + botão novo */}
          <div className="flex items-center justify-between gap-4">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                id="agenda-today"
                onClick={() => setDate(new Date('2026-03-18'))}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Hoje
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  id="agenda-prev"
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="agenda-next"
                  onClick={() => navigate(1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm font-semibold text-gray-800 capitalize min-w-0">
                {dateLabel}
              </span>
            </div>

            {/* Views + botão novo */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Abas Dia / Semana / Mês */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {VIEWS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    id={`agenda-view-${key}`}
                    onClick={() => setView(key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                      view === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                id="agenda-new"
                onClick={() => {
                  setModalInitialDate(toDateStr(date))
                  setModalInitialHour('08:00')
                  setIsModalOpen(true)
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                <Plus className="w-4 h-4" /> Nova Consulta
              </button>
            </div>
          </div>

          {/* Linha 2: filtro por profissional */}
          <ProfissionalFilter selected={profFiltro} onChange={setProfFiltro} profissionais={profissionaisUnicos} />
        </div>
      </div>

      {/* ── Área de visualização ─────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex">
        <div className="flex-1 overflow-auto">
          {view === 'dia' && (
            <DayView
              date={date}
              appointments={visibleAppointments}
              onCardClick={handleCardClick}
              onSlotClick={(h) => handleSlotClick(toDateStr(date), h)}
              onStatusChange={handleStatusChange}
            />
          )}

          {view === 'semana' && (
            <WeekView
              currentDate={date}
              appointments={visibleAppointments}
              onCardClick={handleCardClick}
              onSlotClick={handleSlotClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {view === 'mes' && (
            <MonthView
              currentDate={date}
              appointments={filteredAppointments}
              onDayClick={handleDayClick}
              onCardClick={handleCardClick}
            />
          )}
        </div>

        {/* ── Painel de detalhe da consulta ──────────── */}
        {selectedApt && (
          <>
            <div
              className="absolute inset-0 z-20"
              onClick={() => setSelectedApt(null)}
            />
            <div className="absolute right-4 top-4 z-30 animate-fade-in">
              <div className="relative">
                <button
                  onClick={() => setSelectedApt(null)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
                <AppointmentDetailCard
                  appointment={selectedApt}
                  onClose={() => setSelectedApt(null)}
                  onStatusChange={(status) => handleStatusChange(selectedApt.id, status)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal de criação ─────────────────────────── */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAppointment}
        initialDate={modalInitialDate}
        initialHour={modalInitialHour}
      />
    </div>
  )
}
