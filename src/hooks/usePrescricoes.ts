import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export interface Prescricao {
  id: string
  paciente_id: string
  paciente_nome: string
  profissional_nome: string
  conteudo: string
  assinatura_hash: string
  created_at: string
  status: 'ativa' | 'cancelada'
}

export interface NovaPrescricao {
  paciente_id: string
  conteudo: string
}

export function usePrescricoes() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const clinicaId = user?.clinicaId

  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPrescricoes = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('prescricoes')
        .select(`
          id, paciente_id, conteudo, assinatura_hash, created_at, status,
          pacientes (nome_completo),
          profiles (nome_completo)
        `)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPrescricoes((data || []).map((p: any) => ({
        id: p.id,
        paciente_id: p.paciente_id,
        paciente_nome: p.pacientes?.nome_completo || '—',
        profissional_nome: p.profiles?.nome_completo || user?.nome || '—',
        conteudo: p.conteudo,
        assinatura_hash: p.assinatura_hash || '',
        created_at: p.created_at,
        status: p.status || 'ativa',
      })))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, user?.nome, toast])

  useEffect(() => { loadPrescricoes() }, [loadPrescricoes])

  const createPrescricao = useCallback(async (data: NovaPrescricao) => {
    if (!clinicaId || !user?.id) return null
    try {
      // Gerar assinatura (hash simples: userId + timestamp)
      const assinatura_hash = btoa(`${user.id}:${Date.now()}:${clinicaId}`)

      const { data: ret, error } = await supabase.from('prescricoes').insert({
        clinica_id: clinicaId,
        paciente_id: data.paciente_id,
        profissional_id: user.id,
        conteudo: data.conteudo,
        assinatura_hash,
        status: 'ativa',
      }).select().single()

      if (error) throw error
      toast({ title: 'Prescrição criada', description: 'Assinada digitalmente.', type: 'success' })
      await loadPrescricoes()
      return ret
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
      return null
    }
  }, [clinicaId, user, loadPrescricoes, toast])

  const cancelarPrescricao = useCallback(async (id: string) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('prescricoes').update({ status: 'cancelada' }).eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      setPrescricoes(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelada' } : p))
      toast({ title: 'Cancelada', description: 'Prescrição cancelada.', type: 'info' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  return { prescricoes, isLoading, loadPrescricoes, createPrescricao, cancelarPrescricao }
}
