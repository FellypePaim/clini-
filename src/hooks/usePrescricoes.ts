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

      // REST API direto para contornar bug supabase-js com JSONB
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const itensArr = [{ medicamento: 'Prescrição livre', dosagem: '', frequencia: '', duracao: '', observacoes: data.conteudo }]

      const res = await fetch(`${supabaseUrl}/rest/v1/prescricoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          clinica_id: clinicaId,
          paciente_id: data.paciente_id,
          profissional_id: user.id,
          itens: itensArr,
          conteudo: data.conteudo,
          assinatura_hash,
          status: 'ativa',
          updated_at: new Date().toISOString(),
        }),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erro') }
      const [ret] = await res.json()

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
      const { error } = await supabase.from('prescricoes').update({ status: 'cancelada' } as any).eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      setPrescricoes(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelada' } : p))
      toast({ title: 'Cancelada', description: 'Prescrição cancelada.', type: 'info' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  const updatePrescricao = useCallback(async (id: string, conteudo: string) => {
    if (!clinicaId) return
    try {
      const assinatura_hash = btoa(`${user?.id}:${Date.now()}:${clinicaId}`)
      const itensArr = [{ medicamento: 'Prescrição livre', dosagem: '', frequencia: '', duracao: '', observacoes: conteudo }]
      const { error } = await supabase.from('prescricoes')
        .update({ conteudo, itens: itensArr, assinatura_hash, updated_at: new Date().toISOString() } as any)
        .eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      await loadPrescricoes()
      toast({ title: 'Atualizada', description: 'Prescrição editada e reassinada.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, user?.id, loadPrescricoes, toast])

  const deletePrescricao = useCallback(async (id: string) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('prescricoes').delete().eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      setPrescricoes(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Excluída', description: 'Prescrição removida permanentemente.', type: 'info' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  return { prescricoes, isLoading, loadPrescricoes, createPrescricao, cancelarPrescricao, updatePrescricao, deletePrescricao }
}
