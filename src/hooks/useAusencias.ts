import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Ausencia {
  id: string
  profissional_id: string
  clinica_id: string
  data_inicio: string
  data_fim: string
  tipo: 'folga' | 'atestado' | 'ferias' | 'outro'
  motivo: string | null
  notificou_pacientes: boolean
  consultas_canceladas: number
  created_at: string
}

export interface ConsultaConflito {
  id: string
  paciente_id: string | null
  paciente_nome: string
  paciente_telefone: string | null
  data_hora_inicio: string
  procedimento: string | null
  status: string
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAusencias() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [conflitos, setConflitos] = useState<ConsultaConflito[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── Carregar ausências de um profissional ─────────────────────────────────
  const loadAusencias = useCallback(
    async (profissionalId: string): Promise<Ausencia[]> => {
      if (!clinicaId) return []
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profissional_ausencias')
          .select('*')
          .eq('clinica_id', clinicaId)
          .eq('profissional_id', profissionalId)
          .order('data_inicio', { ascending: false })

        if (error) throw error

        const mapped: Ausencia[] = (data || []).map((r: any) => ({
          id: r.id,
          profissional_id: r.profissional_id,
          clinica_id: r.clinica_id,
          data_inicio: r.data_inicio,
          data_fim: r.data_fim,
          tipo: r.tipo as Ausencia['tipo'],
          motivo: r.motivo,
          notificou_pacientes: r.notificou_pacientes ?? false,
          consultas_canceladas: r.consultas_canceladas ?? 0,
          created_at: r.created_at || '',
        }))

        setAusencias(mapped)
        return mapped
      } catch (err: any) {
        toast({ title: 'Erro', description: 'Erro ao carregar ausências.', type: 'error' })
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  // ── Carregar ausências por período (para agenda) ──────────────────────────
  const loadAusenciasByRange = useCallback(
    async (startDate: string, endDate: string): Promise<Ausencia[]> => {
      if (!clinicaId) return []
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profissional_ausencias')
          .select('*')
          .eq('clinica_id', clinicaId)
          .lte('data_inicio', endDate)
          .gte('data_fim', startDate)
          .order('data_inicio', { ascending: true })

        if (error) throw error

        return (data || []).map((r: any) => ({
          id: r.id,
          profissional_id: r.profissional_id,
          clinica_id: r.clinica_id,
          data_inicio: r.data_inicio,
          data_fim: r.data_fim,
          tipo: r.tipo as Ausencia['tipo'],
          motivo: r.motivo,
          notificou_pacientes: r.notificou_pacientes ?? false,
          consultas_canceladas: r.consultas_canceladas ?? 0,
          created_at: r.created_at || '',
        }))
      } catch (err: any) {
        toast({ title: 'Erro', description: 'Erro ao buscar ausências do período.', type: 'error' })
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  // ── Verificar consultas conflitantes ──────────────────────────────────────
  const checkConflitos = useCallback(
    async (profissionalId: string, dataInicio: string, dataFim: string): Promise<ConsultaConflito[]> => {
      if (!clinicaId) return []
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('consultas')
          .select('id, data_hora_inicio, status, observacoes, pacientes(id, nome_completo, telefone, whatsapp), procedimentos(nome)')
          .eq('clinica_id', clinicaId)
          .eq('profissional_id', profissionalId)
          .gte('data_hora_inicio', `${dataInicio}T00:00:00`)
          .lte('data_hora_inicio', `${dataFim}T23:59:59`)
          .not('status', 'eq', 'cancelado')

        if (error) throw error

        const mapped: ConsultaConflito[] = (data || []).map((r: any) => ({
          id: r.id,
          paciente_id: r.pacientes?.id || null,
          paciente_nome: r.pacientes?.nome_completo || 'Sem nome',
          paciente_telefone: r.pacientes?.whatsapp || r.pacientes?.telefone || null,
          data_hora_inicio: r.data_hora_inicio,
          procedimento: r.procedimentos?.nome || null,
          status: r.status || 'agendado',
        }))

        setConflitos(mapped)
        return mapped
      } catch (err: any) {
        toast({ title: 'Erro', description: 'Erro ao verificar conflitos.', type: 'error' })
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  // ── Criar ausência ────────────────────────────────────────────────────────
  const createAusencia = useCallback(
    async (payload: {
      profissional_id: string
      data_inicio: string
      data_fim: string
      tipo: Ausencia['tipo']
      motivo?: string
    }): Promise<Ausencia | null> => {
      if (!clinicaId) return null
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profissional_ausencias')
          .insert({
            clinica_id: clinicaId,
            profissional_id: payload.profissional_id,
            data_inicio: payload.data_inicio,
            data_fim: payload.data_fim,
            tipo: payload.tipo,
            motivo: payload.motivo || null,
          })
          .select()
          .single()

        if (error) throw error

        toast({ title: 'Sucesso', description: 'Ausência registrada.', type: 'success' })

        return {
          id: data.id,
          profissional_id: data.profissional_id,
          clinica_id: data.clinica_id,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          tipo: data.tipo as Ausencia['tipo'],
          motivo: data.motivo,
          notificou_pacientes: data.notificou_pacientes ?? false,
          consultas_canceladas: data.consultas_canceladas ?? 0,
          created_at: data.created_at || '',
        }
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao registrar ausência.', type: 'error' })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  // ── Deletar ausência ──────────────────────────────────────────────────────
  const deleteAusencia = useCallback(
    async (id: string): Promise<boolean> => {
      if (!clinicaId) return false
      setIsLoading(true)
      try {
        const { error } = await supabase
          .from('profissional_ausencias')
          .delete()
          .eq('id', id)
          .eq('clinica_id', clinicaId)

        if (error) throw error

        setAusencias(prev => prev.filter(a => a.id !== id))
        toast({ title: 'Sucesso', description: 'Ausência removida.', type: 'success' })
        return true
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao remover ausência.', type: 'error' })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  // ── Cancelar consultas conflitantes ───────────────────────────────────────
  const cancelarConsultasConflitantes = useCallback(
    async (
      consultas: ConsultaConflito[],
      ausenciaId: string,
      notificar: boolean,
      mensagemCustom?: string
    ): Promise<boolean> => {
      if (!clinicaId || consultas.length === 0) return false
      setIsLoading(true)
      try {
        // 1. Cancelar cada consulta
        const ids = consultas.map(c => c.id)
        const { error: updateErr } = await supabase
          .from('consultas')
          .update({
            status: 'cancelado' as any,
            observacoes: '[CANCELADO - AUSÊNCIA DO PROFISSIONAL]',
          })
          .in('id', ids)
          .eq('clinica_id', clinicaId)

        if (updateErr) throw updateErr

        // 2. Enviar notificações WhatsApp diretamente + salvar na fila
        if (notificar) {
          for (const c of consultas.filter(c => c.paciente_telefone)) {
            const msg = mensagemCustom ||
              `Olá ${c.paciente_nome}, sua consulta do dia ${new Date(c.data_hora_inicio).toLocaleDateString('pt-BR')} foi cancelada devido à ausência do profissional. Entraremos em contato para reagendar.`

            // Enviar direto via whatsapp-send
            try {
              await supabase.functions.invoke('whatsapp-send', {
                body: {
                  numero: c.paciente_telefone,
                  texto: msg,
                  tipo: 'texto',
                  clinica_id: clinicaId,
                },
              })
            } catch (e) {
              console.error('Erro ao enviar WhatsApp:', e)
            }

            // Salvar na fila como histórico
            await supabase.from('notificacoes_fila').insert({
              clinica_id: clinicaId,
              consulta_id: c.id,
              paciente_id: c.paciente_id,
              tipo: 'cancelamento_ausencia',
              canal: 'whatsapp',
              destinatario_nome: c.paciente_nome,
              destinatario_telefone: c.paciente_telefone,
              mensagem: msg,
              status: 'enviado',
              agendar_para: new Date().toISOString(),
              enviado_em: new Date().toISOString(),
            })
          }
        }

        // 3. Atualizar a ausência com os dados de cancelamento
        const { error: ausErr } = await supabase
          .from('profissional_ausencias')
          .update({
            notificou_pacientes: notificar,
            consultas_canceladas: consultas.length,
          })
          .eq('id', ausenciaId)
          .eq('clinica_id', clinicaId)

        if (ausErr) throw ausErr

        const msg = notificar
          ? `${consultas.length} consulta(s) cancelada(s) e pacientes notificados.`
          : `${consultas.length} consulta(s) cancelada(s).`
        toast({ title: 'Sucesso', description: msg, type: 'success' })
        return true
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message || 'Falha ao cancelar consultas.', type: 'error' })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [clinicaId, toast]
  )

  return {
    ausencias,
    conflitos,
    isLoading,
    loadAusencias,
    loadAusenciasByRange,
    checkConflitos,
    createAusencia,
    deleteAusencia,
    cancelarConsultasConflitantes,
  }
}
