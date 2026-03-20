import { useState, useCallback, useEffect } from 'react'
import type { AgendaAppointment, AppointmentFormData, AgendaFiltros } from '../types/agenda'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export function useAgenda() {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── INIT REALTIME E FETCH INICIAL ───────────────────────────────────────────
  useEffect(() => {
    if (!clinicaId) return

    const getInitialAppointments = async () => {
      // Carrega inicial sem filtros fortes para ter algo na tela
      await getAppointments()
    }
    
    getInitialAppointments()

    // Subscreve a mudanças na tabela de consultas da clinica
    const channel = supabase.channel('agenda_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultas',
          filter: `clinica_id=eq.${clinicaId}`
        },
        async (payload) => {
          // Quando houver mudança (insert, update, delete), apenas re-buscamos atualizados
          // Outra forma seria mesclar o payload diretamente no state frontend.
          // Por simplicidade, refetch.
          await getAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clinicaId])

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

        if (filtros?.profissionalId && filtros.profissionalId !== 'todos') {
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
    [clinicaId, toast]
  )

  // ── Criar consulta ────────────────────────────────────────────────────
  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<AgendaAppointment> => {
      setIsLoading(true)
      try {
        if (!clinicaId) throw new Error('Clínica não identificada')

        const dataHoraInicio = `${data.data}T${data.horaInicio}:00`
        const dataHoraFim = `${data.data}T${data.horaFim}:00`

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

        // Para simplificar, estamos pondo null no procedimento_id pois data.procedimento é string no Mock 
        // e requereria buscar ID do procedimento real
        const insertData = {
          clinica_id: clinicaId,
          paciente_id: data.pacienteId,
          profissional_id: data.profissionalId,
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
          status: data.status,
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

        toast({ title: 'Sucesso', description: 'Consulta agendada.', type: 'success' })
        
        // Dispara refetch em vez de montar manual as joins.
        // O Realtime listener pode também pegar isso, mas chamamos para já garantir sync local se não houver listener para a prop user.
        await getAppointments()
        
        return appointments[0] // Gambiarra provisória no retorno
      } catch (err: any) {
        toast({ title: 'Atenção', description: err.message || 'Falha ao agendar', type: 'error' })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, getAppointments, toast, appointments]
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
