import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Product, Movement, PurchaseOrder, ProcedureConsumptionRule, ProductCategory } from '../types/estoque'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useToast } from './useToast'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useEstoque() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const user = useAuthStore(state => state.user)
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  // ── INIT REALTIME E FETCH INICIAL ───────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK || !clinicaId) return

    const loadData = async () => {
      await Promise.all([
        fetchProducts(),
        fetchMovements()
      ])
    }
    
    loadData()

    // Subscreve a mudanças no estoque
    const productsChannel = supabase.channel('estoque_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos_estoque', filter: `clinica_id=eq.${clinicaId}` },
        () => fetchProducts()
      )
      .subscribe()

    const movementsChannel = supabase.channel('movimentacoes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estoque_movimentacoes', filter: `clinica_id=eq.${clinicaId}` },
        () => fetchMovements()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(movementsChannel)
    }
  }, [clinicaId])

  // ── Buscar Produtos ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { data, error: pbErr } = await supabase
        .from('produtos_estoque')
        .select('*')
        .eq('clinica_id', clinicaId)
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (pbErr) throw pbErr

      const mapped: Product[] = (data || []).map(row => ({
        id: row.id,
        code: row.codigo || '',
        name: row.nome,
        category: row.categoria as ProductCategory,
        unit: row.unidade || 'Unidade',
        currentStock: row.estoque_atual || 0,
        minimumStock: row.estoque_minimo || 0,
        expirationDate: row.validade || undefined,
        unitCost: row.custo_unitario || 0,
        provider: row.fornecedor_preferencial || undefined,
        location: row.localizacao || undefined,
        createdAt: row.created_at || '',
        updatedAt: row.updated_at || ''
      }))

      setProducts(mapped)
    } catch (err: any) {
      setError(err.message)
      toast({ title: 'Erro', description: 'Erro ao buscar produtos.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, toast])

  // ── Buscar Movimentações ────────────────────────────────────────────────────
  const fetchMovements = useCallback(async () => {
    if (!clinicaId) return
    try {
      const { data, error: pbErr } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          produto:produtos_estoque (nome),
          usuario:profiles (nome_completo)
        `)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (pbErr) throw pbErr

      const mapped: Movement[] = (data || []).map((row: any) => ({
        id: row.id,
        productId: row.produto_id,
        productName: row.produto?.nome || 'Produto Removido',
        type: row.tipo === 'entrada' ? 'Entrada' : row.tipo === 'saida' ? 'Saída' : 'Ajuste',
        quantity: row.quantidade,
        date: row.created_at || '',
        reason: row.motivo || '',
        responsible: row.usuario?.nome_completo || 'Sistema',
        linkedTo: row.consulta_id || row.procedimento_id || undefined
      }))

      setMovements(mapped)
    } catch (err: any) {
      console.error('Erro ao buscar movimentações:', err)
    }
  }, [clinicaId])

  // ── Compatibilidade com Componentes legados (getters) ──────────────────────
  const getProducts = useCallback(() => products.map(p => ({
    ...p,
    status: p.currentStock === 0 ? 'Zerado' : (p.currentStock < p.minimumStock ? 'Crítico' : 'Normal')
  }) as Product & { status: string }), [products])

  const getMovimentacoes = useCallback(() => movements, [movements])
  const getAlerts = useCallback(() => products.filter(p => p.currentStock < p.minimumStock), [products])

  // ── Criar Produto ───────────────────────────────────────────────────────────
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (USE_MOCK || !clinicaId) return
    setIsLoading(true)
    try {
      const { error: pbErr } = await supabase
        .from('produtos_estoque')
        .insert({
          clinica_id: clinicaId,
          codigo: product.code,
          nome: product.name,
          categoria: product.category,
          unidade: product.unit,
          estoque_atual: product.currentStock,
          estoque_minimo: product.minimumStock,
          custo_unitario: product.unitCost,
          validade: product.expirationDate,
          fornecedor_preferencial: product.provider,
          localizacao: product.location,
          ativo: true
        })

      if (pbErr) throw pbErr
      toast({ title: 'Sucesso', description: 'Produto cadastrado.', type: 'success' })
      await fetchProducts()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, fetchProducts, toast])

  // ── Registrar Entrada / Saída ──────────────────────────────────────────────
  const registerMovement = useCallback(async (
    productId: string, 
    quantity: number, 
    type: 'entrada' | 'saida' | 'ajuste', 
    reason: string, 
    linkedTo?: string, 
    newCost?: number
  ) => {
    if (USE_MOCK || !clinicaId) return
    setIsLoading(true)
    try {
      const product = products.find(p => p.id === productId)
      if (!product) throw new Error('Produto não encontrado')

      const currentStock = product.currentStock
      const newStock = type === 'entrada' ? currentStock + quantity : currentStock - quantity

      // Registra a movimentação
      const { error: movErr } = await supabase
        .from('estoque_movimentacoes')
        .insert({
          clinica_id: clinicaId,
          produto_id: productId,
          tipo: type,
          quantidade: quantity,
          motivo: reason,
          estoque_anterior: currentStock,
          estoque_posterior: newStock,
          usuario_id: user?.id,
          consulta_id: linkedTo?.startsWith('CONS-') ? linkedTo.replace('CONS-', '') : undefined
        })

      if (movErr) throw movErr

      // Atualiza o estoque do produto
      const updateData: any = { 
        estoque_atual: newStock,
        updated_at: new Date().toISOString()
      }
      if (newCost !== undefined) updateData.custo_unitario = newCost

      const { error: prodErr } = await supabase
        .from('produtos_estoque')
        .update(updateData)
        .eq('id', productId)

      if (prodErr) throw prodErr

      toast({ title: 'Sucesso', description: 'Estoque atualizado.', type: 'success' })
      await Promise.all([fetchProducts(), fetchMovements()])
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, products, user, fetchProducts, fetchMovements, toast])

  const registerEntry = useCallback((productId: string, quantity: number, reason: string, responsible: string, cost?: number) => {
    registerMovement(productId, quantity, 'entrada', reason, undefined, cost)
  }, [registerMovement])

  const registerExit = useCallback((productId: string, quantity: number, reason: string, responsible: string, linkedTo?: string) => {
    // linkedTo pode vir como ID de consulta ou paciente-ID
    registerMovement(productId, quantity, 'saida', reason, linkedTo)
  }, [registerMovement])

  // ── Outros (Purchase Orders, Consumption Rules) ──────────
  const [consumptionRules, setConsumptionRules] = useState<ProcedureConsumptionRule[]>([])

  const fetchConsumptionRules = useCallback(async () => {
    if (!clinicaId) return
    const { data, error: err } = await supabase
      .from('estoque_regras_consumo' as any)
      .select('*')
      .eq('clinica_id', clinicaId)
      .eq('ativo', true)
    
    if (!err) {
      setConsumptionRules(data.map((r: any) => ({
        id: r.id,
        procedureName: r.procedimento_nome,
        productId: r.produto_id,
        quantity: r.quantidade,
        isActive: r.ativo
      })))
    }
  }, [clinicaId])

  useEffect(() => {
    if (clinicaId) fetchConsumptionRules()
  }, [clinicaId, fetchConsumptionRules])

  const toggleConsumptionRule = useCallback((ruleId: string) => {
    // Implementar update no DB se necessário
    setConsumptionRules(prev => prev.map((r: ProcedureConsumptionRule) => r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
  }, [])

  return {
    products,
    movements,
    isLoading,
    error,
    getProducts,
    getMovimentacoes,
    getAlerts,
    createProduct,
    registerEntry,
    registerExit,
    consumptionRules,
    toggleConsumptionRule,
    purchaseOrders: [] as PurchaseOrder[],
    generatePurchaseOrder: (p: any) => { console.log('Mock PO', p) }
  }
}

// Hook de automação para o PEP
export const useEstoqueAutomation = () => {
  const { registerExit, consumptionRules } = useEstoque();

  const processProcedure = async (procedureName: string, responsible: string, patientId: string, appointmentId?: string) => {
    if (!procedureName) return;
    
    // Busca regras ativas para este procedimento
    const rulesToApply = consumptionRules.filter(r => r.isActive && r.procedureName.toLowerCase() === procedureName.toLowerCase());
    
    if (rulesToApply.length === 0) return;

    for (const rule of rulesToApply) {
      await registerExit(
        rule.productId, 
        rule.quantity, 
        `Baixa Automática - ${procedureName}`, 
        responsible, 
        appointmentId || `PAC-${patientId}`
      );
    }
  };

  return { processProcedure };
};
