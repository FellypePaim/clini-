import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

export type TransacaoTipo = 'receita' | 'despesa'
export type TransacaoStatus = 'pago' | 'pendente' | 'cancelado'

export interface Transacao {
  id: string
  descricao: string
  valor: number
  dataConsolidacao: string
  vencimento?: string
  tipo: TransacaoTipo
  status: TransacaoStatus
  formaPagamento?: string
  categoriaId?: string
  pacienteId?: string
  profissionalId?: string
  consultaId?: string
  observacoes?: string
  categoriaNome?: string
  categoriaCor?: string
}

export interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: TransacaoTipo
  cor?: string
  icone?: string
}

export function useFinanceiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState({ receita: 0, despesa: 0, saldo: 0 })

  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const { toast } = useToast()

  // ── Buscar Categorias ───────────────────────────────────────────────────
  const fetchCategorias = useCallback(async () => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('financeiro_categorias' as any)
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('nome')

      if (error) throw error
      setCategorias(data as any[] || [])
    } catch (err: any) {
      console.error(err)
    }
  }, [clinicaId])

  // ── Buscar Transações ────────────────────────────────────────────────────
  const fetchTransacoes = useCallback(async (periodo?: { start: string, end: string }) => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('transacoes' as any)
        .select('*, categoria:financeiro_categorias(nome, cor)')
        .eq('clinica_id', clinicaId)
        .order('data_consolidacao', { ascending: false })

      if (periodo) {
        query = (query as any).gte('data_consolidacao', periodo.start).lte('data_consolidacao', periodo.end)
      }

      const { data, error } = await query

      if (error) throw error

      const mapped: Transacao[] = (data as any[] || []).map((row: any) => ({
        id: row.id,
        descricao: row.descricao,
        valor: row.valor,
        dataConsolidacao: row.data_consolidacao,
        vencimento: row.vencimento,
        tipo: row.tipo,
        status: row.status,
        formaPagamento: row.forma_pagamento,
        categoriaId: row.categoria_id,
        pacienteId: row.paciente_id,
        profissionalId: row.profissional_id,
        consultaId: row.consulta_id,
        observacoes: row.observacoes,
        categoriaNome: row.categoria?.nome,
        categoriaCor: row.categoria?.cor
      }))

      setTransacoes(mapped)
      
      // Calcular Sumário
      const rec = mapped.filter(t => t.tipo === 'receita' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0)
      const des = mapped.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0)
      setSummary({ receita: rec, despesa: des, saldo: rec - des })

    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao buscar financeiro.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  useEffect(() => {
    fetchCategorias()
    fetchTransacoes()
  }, [clinicaId, fetchCategorias, fetchTransacoes])

  // ── Salvar Transação ──────────────────────────────────────────────────────
  const addTransacao = useCallback(async (transacao: Omit<Transacao, 'id'>) => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('transacoes' as any)
        .insert({
          clinica_id: clinicaId,
          descricao: transacao.descricao,
          valor: transacao.valor,
          data_consolidacao: transacao.dataConsolidacao,
          vencimento: transacao.vencimento,
          tipo: transacao.tipo,
          status: transacao.status,
          forma_pagamento: transacao.formaPagamento,
          categoria_id: transacao.categoriaId,
          paciente_id: transacao.pacienteId,
          profissional_id: transacao.profissionalId,
          consulta_id: transacao.consultaId,
          observacoes: transacao.observacoes
        })

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Transação registrada.', type: 'success' })
      await fetchTransacoes()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchTransacoes, toast])

  const deleteTransacao = useCallback(async (id: string) => {
    if (!clinicaId) return
    try {
      const { error } = await supabase.from('transacoes' as any).delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Transação removida.', type: 'success' })
      await fetchTransacoes()
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao deletar.', type: 'error' })
    }
  }, [clinicaId, fetchTransacoes, toast])

  return {
    transacoes,
    categorias,
    summary,
    isLoading,
    fetchTransacoes,
    addTransacao,
    deleteTransacao,
    fetchCategorias
  }
}
