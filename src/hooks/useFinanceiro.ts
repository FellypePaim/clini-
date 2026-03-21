import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export interface Lancamento {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data_competencia: string
  status: 'pendente' | 'pago' | 'cancelado'
  paciente_nome?: string
  profissional_nome?: string
  convenio?: string
}

export interface NovoLancamento {
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data_competencia: string
  status: 'pendente' | 'pago' | 'cancelado'
  paciente_id?: string
  convenio?: string
}

export function useFinanceiro() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const clinicaId = user?.clinicaId

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadLancamentos = useCallback(async (inicio?: string, fim?: string) => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('lancamentos')
        .select(`
          id, descricao, valor, tipo, categoria, data_competencia, status, convenio,
          pacientes (nome_completo),
          profiles (nome_completo)
        `)
        .eq('clinica_id', clinicaId)
        .order('data_competencia', { ascending: false })

      if (inicio) query = query.gte('data_competencia', inicio)
      if (fim) query = query.lte('data_competencia', fim)

      const { data, error } = await query
      if (error) throw error

      setLancamentos((data || []).map((l: any) => ({
        id: l.id,
        descricao: l.descricao || '—',
        valor: l.valor || 0,
        tipo: l.tipo,
        categoria: l.categoria || 'Geral',
        data_competencia: l.data_competencia,
        status: l.status || 'pendente',
        paciente_nome: l.pacientes?.nome_completo,
        profissional_nome: l.profiles?.nome_completo,
        convenio: l.convenio,
      })))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  useEffect(() => {
    const now = new Date()
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    loadLancamentos(inicio, fim)
  }, [loadLancamentos])

  const createLancamento = useCallback(async (data: NovoLancamento) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('lancamentos').insert({
        clinica_id: clinicaId,
        vencimento: data.data_competencia,
        ...data,
      })
      if (error) throw error
      toast({ title: 'Lançamento criado', description: `${data.tipo === 'receita' ? 'Receita' : 'Despesa'} registrada.`, type: 'success' })
      await loadLancamentos()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, loadLancamentos, toast])

  const updateLancamentoStatus = useCallback(async (id: string, status: 'pago' | 'cancelado' | 'pendente') => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('lancamentos').update({ status }).eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      setLancamentos(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      toast({ title: 'Status atualizado', description: `Lançamento marcado como ${status}.`, type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  const deleteLancamento = useCallback(async (id: string) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id).eq('clinica_id', clinicaId)
      if (error) throw error
      setLancamentos(prev => prev.filter(l => l.id !== id))
      toast({ title: 'Removido', description: 'Lançamento excluído.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    }
  }, [clinicaId, toast])

  const totais = {
    receita: lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0),
    despesa: lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0),
    pendente: lancamentos.filter(l => l.status === 'pendente').reduce((s, l) => s + (l.tipo === 'receita' ? l.valor : -l.valor), 0),
  }

  return {
    lancamentos,
    isLoading,
    totais,
    loadLancamentos,
    createLancamento,
    updateLancamentoStatus,
    deleteLancamento,
  }
}
