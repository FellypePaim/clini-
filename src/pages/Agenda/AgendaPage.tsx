import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange, X } from 'lucide-react'
import type { AgendaView, AgendaAppointment, AppointmentStatus, AppointmentFormData } from '../../types/agenda'
import { useAgenda } from '../../hooks/useAgenda'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { DayView } from '../../components/agenda/DayView'
import { WeekView } from '../../components/agenda/WeekView'
import { MonthView } from '../../components/agenda/MonthView'
import { AppointmentModal } from '../../components/agenda/AppointmentModal'
import { AppointmentDetailCard } from '../../components/agenda/AppointmentCard'
import { ProfissionalFilter } from '../../components/agenda/ProfissionalFilter'
import { cn } from '../../lib/utils'

// Removido _MESES não usado
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const VIEWS: { key: AgendaView; label: string; icon: typeof Calendar }[] = [
  { key: 'dia',    label: 'Dia',    icon: Calendar      },
  { key: 'semana', label: 'Semana', icon: CalendarDays  },
  { key: 'mes',    label: 'Mês',    icon: CalendarRange },
]

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
  const [date, setDate]       = useState(new Date())
  const [profFiltro, setProfFiltro] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [modalInitialDate, setModalInitialDate]   = useState<string>()
  const [modalInitialHour, setModalInitialHour]   = useState<string>()
  const [selectedApt, setSelectedApt]     = useState<AgendaAppointment | null>(null)
  const [dropping, setDropping]           = useState(false)

  const { appointments, ausencias, createAppointment, updateAppointment, deleteAppointment } = useAgenda()
  const clinicaId = useAuthStore(state => state.user?.clinicaId)

  // ── Lista de profissionais do banco (não derivada dos agendamentos) ──
  const [profissionaisUnicos, setProfissionaisUnicos] = useState<{ id: string; nome: string; especialidade: string; cor: string }[]>([])

  const loadProfissionais = useCallback(async () => {
    if (!clinicaId) return
    const { data } = await supabase
      .from('profiles')
      .select('id, nome_completo, especialidade, cor_agenda')
      .eq('clinica_id', clinicaId)
      .in('role', ['profissional', 'admin'])
      .eq('ativo', true)
      .order('nome_completo')
    if (data) {
      setProfissionaisUnicos(data.map((p: any) => ({
        id: p.id,
        nome: p.nome_completo,
        especialidade: p.especialidade || '',
        cor: p.cor_agenda || 'blue',
      })))
    }
  }, [clinicaId])

  useEffect(() => { loadProfissionais() }, [loadProfissionais])

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

  const handleCardClick = (apt: AgendaAppointment, _evt?: React.MouseEvent) => {
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

  const handleDrop = async (id: string, newDate: string, newHoraInicio: string, newHoraFim: string) => {
    if (dropping) return
    setDropping(true)
    try {
      await updateAppointment(id, { data: newDate, horaInicio: newHoraInicio, horaFim: newHoraFim })
    } finally {
      setDropping(false)
    }
  }

  const handleDayClick = (dateStr: string) => {
    setDate(new Date(dateStr + 'T00:00:00'))
    setView('dia')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 overflow-hidden">
      {/* ── Barra de ferramentas ──────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex flex-col gap-2.5">
          {/* Linha 1: navegação + views + botão novo */}
          <div className="flex items-center justify-between gap-4">
            {/* Navegação */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDate(new Date())}
                  className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 capitalize">{dateLabel}</h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {visibleAppointments.length} consulta{visibleAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Views + botão novo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {VIEWS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
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
                onClick={() => {
                  setModalInitialDate(toDateStr(date))
                  setModalInitialHour('08:00')
                  setIsModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Nova Consulta
              </button>
            </div>
          </div>

          {/* Linha 2: filtro por profissional */}
          {profissionaisUnicos.length > 0 && (
            <ProfissionalFilter selected={profFiltro} onChange={setProfFiltro} profissionais={profissionaisUnicos} />
          )}
        </div>
      </div>

      {/* ── Área de visualização ─────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex">
        <div className="flex-1 overflow-auto">
          {view === 'dia' && (
            <DayView
              date={date}
              appointments={visibleAppointments}
              ausencias={ausencias}
              onCardClick={handleCardClick}
              onSlotClick={(h) => handleSlotClick(toDateStr(date), h)}
              onStatusChange={handleStatusChange}
              onDrop={dropping ? undefined : handleDrop}
            />
          )}

          {view === 'semana' && (
            <WeekView
              currentDate={date}
              appointments={visibleAppointments}
              ausencias={ausencias}
              onCardClick={handleCardClick}
              onSlotClick={handleSlotClick}
              onStatusChange={handleStatusChange}
              onDrop={dropping ? undefined : handleDrop}
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
                  onDelete={async () => { await deleteAppointment(selectedApt.id); setSelectedApt(null) }}
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
