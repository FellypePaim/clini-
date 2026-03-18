import { useState, useCallback } from 'react'
import { AGENDA_MOCK, PROFISSIONAIS } from '../data/agendaMockData'
import type { AgendaAppointment, AppointmentFormData, AgendaFiltros } from '../types/agenda'

// ─────────────────────────────────────────────────────────────────────────────
// useAgenda — Hook principal do módulo de Agenda
//
// INTEGRAÇÃO FUTURA COM SUPABASE:
// Substitua cada função stub pelo cliente Supabase quando disponível.
// As assinaturas de retorno são compatíveis — retornam Promise com os
// mesmos shapes de dados. Exemplo de substituição:
//
//   // ATUAL (mock):
//   const getAppointments = async (filtros) => { ... return mockData }
//
//   // FUTURO (Supabase):
//   const getAppointments = async (filtros) => {
//     const { data } = await supabase
//       .from('appointments')
//       .select('*, patients(*), professionals(*)')
//       .eq('data', filtros.data ?? today)
//     return data
//   }
// ─────────────────────────────────────────────────────────────────────────────

export function useAgenda() {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>(AGENDA_MOCK)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── STUB: Buscar consultas com filtros ──────────────────────────────────────
  // Substitua por: supabase.from('appointments').select('...').match(filtros)
  const getAppointments = useCallback(
    async (filtros?: Partial<AgendaFiltros>): Promise<AgendaAppointment[]> => {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 200)) // simula latência
      
      let result = [...AGENDA_MOCK]
      
      if (filtros?.profissionalId && filtros.profissionalId !== 'todos') {
        result = result.filter((a) => a.profissionalId === filtros.profissionalId)
      }
      if (filtros?.status && filtros.status !== 'todos') {
        result = result.filter((a) => a.status === filtros.status)
      }
      
      setIsLoading(false)
      return result
    },
    []
  )

  // ── STUB: Criar consulta ────────────────────────────────────────────────────
  // Substitua por: supabase.from('appointments').insert({ ...payload })
  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<AgendaAppointment> => {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 400))

      const prof = PROFISSIONAIS.find((p) => p.id === data.profissionalId)!

      const novo: AgendaAppointment = {
        id: `apt-${Date.now()}`,
        pacienteId: data.pacienteId,
        pacienteNome: data.pacienteNome,
        profissionalId: data.profissionalId,
        profissionalNome: prof.nome,
        profissionalEspecialidade: prof.especialidade,
        profissionalCor: prof.cor,
        data: data.data,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        procedimento: data.procedimento,
        status: data.status,
        observacoes: data.observacoes,
        valor: data.valor,
        recorrencia: data.repetir
          ? {
              ativa: true,
              tipo: data.recorrenciaTipo ?? 'semanal',
              quantidadeRepeticoes: data.quantidadeRepeticoes ?? 1,
            }
          : undefined,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }

      // Se há recorrência, gera as repetições
      const novos: AgendaAppointment[] = [novo]
      if (data.repetir && data.recorrenciaTipo && data.quantidadeRepeticoes) {
        const intervaloDias = data.recorrenciaTipo === 'semanal'
          ? 7 : data.recorrenciaTipo === 'quinzenal' ? 14 : 30

        for (let i = 1; i <= data.quantidadeRepeticoes; i++) {
          const baseDate = new Date(`${data.data}T00:00:00`)
          baseDate.setDate(baseDate.getDate() + intervaloDias * i)
          novos.push({
            ...novo,
            id: `apt-${Date.now()}-${i}`,
            data: baseDate.toISOString().split('T')[0],
          })
        }
      }

      setAppointments((prev) => [...prev, ...novos])
      setIsLoading(false)
      return novo
    },
    []
  )

  // ── STUB: Atualizar consulta ────────────────────────────────────────────────
  // Substitua por: supabase.from('appointments').update(payload).eq('id', id)
  const updateAppointment = useCallback(
    async (id: string, payload: Partial<AgendaAppointment>): Promise<AgendaAppointment> => {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 300))
      
      let updated: AgendaAppointment | undefined
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            updated = { ...a, ...payload, atualizadoEm: new Date().toISOString() }
            return updated
          }
          return a
        })
      )

      setIsLoading(false)
      if (!updated) throw new Error(`Consulta ${id} não encontrada`)
      return updated
    },
    []
  )

  // ── STUB: Deletar consulta ──────────────────────────────────────────────────
  // Substitua por: supabase.from('appointments').delete().eq('id', id)
  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    setIsLoading(false)
  }, [])

  // ── STUB: Buscar consultas por data específica ──────────────────────────────
  const getAppointmentsByDate = useCallback(
    (date: string, profissionalId?: string): AgendaAppointment[] => {
      return appointments.filter((a) => {
        const matchData = a.data === date
        const matchProf = !profissionalId || profissionalId === 'todos' || a.profissionalId === profissionalId
        return matchData && matchProf
      })
    },
    [appointments]
  )

  // ── STUB: Buscar consultas por intervalo de datas ──────────────────────────
  const getAppointmentsByRange = useCallback(
    (startDate: string, endDate: string, profissionalId?: string): AgendaAppointment[] => {
      return appointments.filter((a) => {
        const matchRange = a.data >= startDate && a.data <= endDate
        const matchProf = !profissionalId || profissionalId === 'todos' || a.profissionalId === profissionalId
        return matchRange && matchProf
      })
    },
    [appointments]
  )

  return {
    appointments,
    isLoading,
    error,
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentsByRange,
  }
}
