import { useState, useCallback, useEffect } from 'react'
import type { AgendaAppointment, AppointmentFormData, AgendaFiltros } from '../types/agenda'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export function useAgenda() {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([])
  const [ausencias, setAusencias] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const userId = useAuthStore(state => state.user?.id)
  const userRole = useAuthStore(state => state.user?.role)
  const { toast } = useToast()

  // ── Buscar consultas com filtros ──────────────────────────────────────
  const getAppointments = useCallback(
    async (filtros?: Partial<AgendaFiltros>): Promise<AgendaAppointment[]> => {
      setIsLoading(true)
      try {
        if (!clinicaId) return []

        let query = supabase
          .from('consultas')
          .select(`
            id,
            data_hora_inicio,
            data_hora_fim,
            status,
            observacoes,
            valor,
            created_at,
            updated_at,
            paciente:pacientes (
              id,
              nome_completo
            ),
            profissional:profiles!consultas_profissional_id_fkey (
              id,
              nome_completo,
              especialidade,
              cor_agenda
            ),
            procedimento:procedimentos (
              nome
            )
          `)
          .eq('clinica_id', clinicaId)

        // Profissional só vê as próprias consultas por padrão
        if (userRole === 'profissional' && (!filtros?.profissionalId || filtros.profissionalId === 'todos')) {
          query = query.eq('profissional_id', userId!)
        } else if (filtros?.profissionalId && filtros.profissionalId !== 'todos') {
          query = query.eq('profissional_id', filtros.profissionalId)
        }
        if (filtros?.status && filtros.status !== 'todos') {
          query = query.eq('status', filtros.status as any)
        }

        const { data, error: pbErr } = await query

        if (pbErr) throw pbErr

        const mapped: AgendaAppointment[] = (data || []).map((row: any) => ({
          id: row.id,
          pacienteId: row.paciente?.id || '',
          pacienteNome: row.paciente?.nome_completo || 'Sem Nome',
          profissionalId: row.profissional?.id || '',
          profissionalNome: row.profissional?.nome_completo || 'Sem Nome',
          profissionalEspecialidade: row.profissional?.especialidade || '',
          profissionalCor: row.profissional?.cor_agenda || 'blue',
          data: row.data_hora_inicio.split('T')[0],
          horaInicio: row.data_hora_inicio.split('T')[1].substring(0, 5),
          horaFim: row.data_hora_fim.split('T')[1].substring(0, 5),
          procedimento: row.procedimento?.nome || 'Consulta',
          status: row.status || 'agendado',
          observacoes: row.observacoes || undefined,
          valor: row.valor || undefined,
          criadoEm: row.created_at,
          atualizadoEm: row.updated_at
        }))

        setAppointments(mapped)
        return mapped
      } catch (err: any) {
        setError(err.message)
        toast({ title: 'Erro', description: 'Erro ao buscar agenda.', type: 'error' })
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, userId, userRole, toast]
  )

  // ── Buscar ausências de profissionais ────────────────────────────────────
  const loadAusencias = useCallback(async (startDate: string, endDate: string) => {
    if (!clinicaId) return
    try {
      const { data } = await supabase
        .from('profissional_ausencias')
        .select('profissional_id, data_inicio, data_fim, tipo')
        .eq('clinica_id', clinicaId)
        .lte('data_inicio', endDate)
        .gte('data_fim', startDate)
      setAusencias(data ?? [])
    } catch { /* silent */ }
  }, [clinicaId])

  // ── INIT REALTIME E FETCH INICIAL ───────────────────────────────────────────
  useEffect(() => {
    if (!clinicaId) return

    getAppointments()

    // Carregar ausências para um range amplo (3 meses)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    loadAusencias(startStr, endStr)

    const channel = supabase.channel('agenda_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultas',
          filter: `clinica_id=eq.${clinicaId}`
        },
        async (_payload) => {
          await getAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clinicaId, getAppointments, loadAusencias])

  // ── Criar consulta ────────────────────────────────────────────────────
  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<AgendaAppointment> => {
      setIsLoading(true)
      try {
        if (!clinicaId) throw new Error('Clínica não identificada')

        const dataHoraInicio = `${data.data}T${data.horaInicio}:00`
        const dataHoraFim = `${data.data}T${data.horaFim}:00`

        // Validar horário da clínica
        const { data: clinicaConfig } = await supabase.from('clinicas').select('configuracoes').eq('id', clinicaId).single()
        const lyraConfig = (clinicaConfig?.configuracoes as any)?.lyra
        const horaAbr = lyraConfig?.horario_inicio || '07:00'
        const horaFec = lyraConfig?.horario_fim || '21:00'
        if (data.horaInicio < horaAbr || data.horaFim > horaFec) {
          throw new Error(`Horário fora do funcionamento da clínica (${horaAbr} — ${horaFec}).`)
        }

        // Validar conflito
        const { count } = await supabase
          .from('consultas')
          .select('*', { count: 'exact', head: true })
          .eq('profissional_id', data.profissionalId)
          .gte('data_hora_inicio', `${data.data}T00:00:00`)
          .lte('data_hora_inicio', `${data.data}T23:59:59`)
          .or(`and(data_hora_inicio.lte.${dataHoraFim},data_hora_fim.gte.${dataHoraInicio})`)
          .not('status', 'eq', 'cancelado')

        if (count && count > 0) {
          throw new Error('Já existe consulta agendada neste horário.')
        }

        // Verificar se profissional está ausente nesta data
        const { data: ausenciasProf } = await supabase
          .from('profissional_ausencias')
          .select('id')
          .eq('profissional_id', data.profissionalId)
          .lte('data_inicio', data.data)
          .gte('data_fim', data.data)
          .limit(1)

        if (ausenciasProf && ausenciasProf.length > 0) {
          throw new Error('Profissional está ausente nesta data (folga/atestado/férias).')
        }

        // Buscar procedimento_id real se informado
        let procedimentoId = null
        if (data.procedimento) {
          const { data: procData } = await supabase
            .from('procedimentos')
            .select('id')
            .eq('clinica_id', clinicaId)
            .ilike('nome', data.procedimento)
            .limit(1)
            .single()
          if (procData) procedimentoId = procData.id
        }

        const insertData = {
          clinica_id: clinicaId,
          paciente_id: data.pacienteId,
          profissional_id: data.profissionalId,
          procedimento_id: procedimentoId,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
          status: data.status as any,
          observacoes: data.observacoes,
          valor: data.valor,
          recorrente: !!data.repetir
        }

        const { data: ret, error: pbErr } = await supabase
          .from('consultas')
          .insert(insertData)
          .select()
          .single()

        if (pbErr) throw pbErr

        // ── Criar consultas recorrentes se solicitado ──
        if (data.repetir && data.recorrenciaTipo && data.quantidadeRepeticoes && data.quantidadeRepeticoes > 0) {
          const recRows = []
          for (let i = 1; i <= data.quantidadeRepeticoes; i++) {
            const baseDate = new Date(`${data.data}T00:00:00`)
            if (data.recorrenciaTipo === 'semanal') baseDate.setDate(baseDate.getDate() + i * 7)
            else if (data.recorrenciaTipo === 'quinzenal') baseDate.setDate(baseDate.getDate() + i * 14)
            else if (data.recorrenciaTipo === 'mensal') baseDate.setMonth(baseDate.getMonth() + i)

            const pad = (n: number) => String(n).padStart(2, '0')
            const recDateStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`

            recRows.push({
              ...insertData,
              data_hora_inicio: `${recDateStr}T${data.horaInicio}:00`,
              data_hora_fim: `${recDateStr}T${data.horaFim}:00`,
            })
          }
          if (recRows.length > 0) {
            const { error: recErr } = await supabase.from('consultas').insert(recRows)
            if (recErr) console.error('Erro recorrência:', recErr)
          }
        }

        const totalCriadas = 1 + (data.repetir && data.quantidadeRepeticoes ? data.quantidadeRepeticoes : 0)
        toast({ title: 'Sucesso', description: totalCriadas > 1 ? `${totalCriadas} consultas agendadas.` : 'Consulta agendada.', type: 'success' })

        const refreshed = await getAppointments()
        const created = refreshed.find(a => a.id === ret.id)
        return created || refreshed[0]
      } catch (err: any) {
        toast({ title: 'Atenção', description: err.message || 'Falha ao agendar', type: 'error' })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, getAppointments, toast]
  )

  // ── Atualizar consulta ────────────────────────────────────────────────
  const updateAppointment = useCallback(
    async (id: string, payload: Partial<AgendaAppointment>): Promise<AgendaAppointment | undefined> => {
      setIsLoading(true)
      try {
        if (!clinicaId) return undefined

        const updateData: any = {}
        if (payload.data && payload.horaInicio) updateData.data_hora_inicio = `${payload.data}T${payload.horaInicio}:00`
        if (payload.data && payload.horaFim) updateData.data_hora_fim = `${payload.data}T${payload.horaFim}:00`
        if (payload.status) updateData.status = payload.status
        if (payload.observacoes !== undefined) updateData.observacoes = payload.observacoes
        if (payload.valor !== undefined) updateData.valor = payload.valor
        if (payload.pacienteId) updateData.paciente_id = payload.pacienteId
        if (payload.profissionalId) updateData.profissional_id = payload.profissionalId

        const { error: pbErr } = await supabase
          .from('consultas')
          .update(updateData)
          .eq('id', id)
          .eq('clinica_id', clinicaId)

        if (pbErr) throw pbErr

        toast({ title: 'Sucesso', description: 'Consulta atualizada.', type: 'success' })
        await getAppointments()
        return undefined
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao atualizar.', type: 'error' })
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, getAppointments, toast]
  )

  // ── Deletar consulta ──────────────────────────────────────────────────
  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      if (!clinicaId) return

      const { error: pbErr } = await supabase
        .from('consultas')
        .delete()
        .eq('id', id)
        .eq('clinica_id', clinicaId)

      if (pbErr) throw pbErr

      toast({ title: 'Sucesso', description: 'Consulta removida.', type: 'success' })
      setAppointments((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao deletar.', type: 'error' })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Helpers locais para componentes ──────────────────────────────
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
    ausencias,
    isLoading,
    error,
    getAppointments,
    loadAusencias,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentsByRange,
  }
}
