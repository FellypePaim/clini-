import { useState, useCallback, useEffect } from 'react'
import type { Product, Movement, PurchaseOrder, ProcedureConsumptionRule } from '../types/estoque'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useEstoque() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [consumptionRules, setConsumptionRules] = useState<ProcedureConsumptionRule[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ── Mappers ─────────────────────────────────────────────────────────────────
  function mapProduct(r: any): Product {
    return {
      id: r.id,
      code: r.codigo || '',
      name: r.nome,
      category: r.categoria,
      unit: r.unidade || 'Unidade',
      currentStock: r.estoque_atual ?? 0,
      minimumStock: r.estoque_minimo ?? 0,
      expirationDate: r.validade || undefined,
      unitCost: r.custo_unitario ?? 0,
      provider: r.fornecedor || undefined,
      location: r.localizacao || undefined,
      createdAt: r.created_at || '',
      updatedAt: r.updated_at || '',
    }
  }

  function mapMovement(r: any): Movement {
    return {
      id: r.id,
      productId: r.produto_id,
      productName: r.produto_nome || '',
      type: r.tipo as any,
      quantity: r.quantidade,
      date: r.created_at || '',
      reason: r.motivo || '',
      responsible: r.responsavel || '',
      linkedTo: r.vinculado_a || undefined,
    }
  }

  // ── Carregar produtos ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos_estoque')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('nome', { ascending: true })
      if (error) throw error
      setProducts((data || []).map(mapProduct))
    } catch (e: any) {
      console.error('Erro ao carregar produtos:', e.message)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  // ── Carregar movimentações ────────────────────────────────────────────────────
  const loadMovements = useCallback(async () => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setMovements((data || []).map(mapMovement))
    } catch (e: any) {
      console.error('Erro ao carregar movimentações:', e.message)
    }
  }, [clinicaId])

  // ── Carregar regras de consumo ────────────────────────────────────────────────
  const loadRules = useCallback(async () => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('procedimento_insumos')
        .select('*')
        .eq('clinica_id', clinicaId)
      if (error) throw error
      setConsumptionRules((data || []).map((r: any) => ({
        id: r.id,
        procedureName: r.procedimento_nome,
        productId: r.produto_id,
        quantity: r.quantidade,
        isActive: r.ativo ?? true,
      })))
    } catch (e: any) {
      console.error('Erro ao carregar regras:', e.message)
    }
  }, [clinicaId])

  useEffect(() => {
    loadProducts()
    loadMovements()
    loadRules()
  }, [loadProducts, loadMovements, loadRules])

  // ── Getters com status calculado ─────────────────────────────────────────────
  const getProducts = useCallback(() =>
    products.map(p => ({
      ...p,
      status: p.currentStock === 0 ? 'Zerado' : (p.currentStock < p.minimumStock ? 'Crítico' : 'Normal'),
    })),
  [products])

  const getAlerts = useCallback(() =>
    products.filter(p => p.currentStock < p.minimumStock),
  [products])

  const getMovimentacoes = useCallback(() => movements, [movements])

  // ── Criar produto ────────────────────────────────────────────────────────────
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('produtos_estoque')
        .insert({
          clinica_id: clinicaId,
          codigo: product.code,
          nome: product.name,
          categoria: product.category,
          unidade: product.unit,
          estoque_atual: product.currentStock,
          estoque_minimo: product.minimumStock,
          validade: product.expirationDate || null,
          custo_unitario: product.unitCost,
          fornecedor: product.provider || null,
          localizacao: product.location || null,
        })
        .select()
        .single()
      if (error) throw error
      setProducts(prev => [mapProduct(data), ...prev])
    } catch (e: any) {
      console.error('Erro ao criar produto:', e.message)
    }
  }, [clinicaId])

  // ── Atualizar produto ────────────────────────────────────────────────────────
  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    if (!clinicaId) return
    try {
      const updateData: any = {}
      if (data.name !== undefined) updateData.nome = data.name
      if (data.code !== undefined) updateData.codigo = data.code
      if (data.category !== undefined) updateData.categoria = data.category
      if (data.unit !== undefined) updateData.unidade = data.unit
      if (data.currentStock !== undefined) updateData.estoque_atual = data.currentStock
      if (data.minimumStock !== undefined) updateData.estoque_minimo = data.minimumStock
      if (data.expirationDate !== undefined) updateData.validade = data.expirationDate
      if (data.unitCost !== undefined) updateData.custo_unitario = data.unitCost
      if (data.provider !== undefined) updateData.fornecedor = data.provider
      if (data.location !== undefined) updateData.localizacao = data.location

      const { error } = await supabase
        .from('produtos_estoque')
        .update(updateData)
        .eq('id', id)
        .eq('clinica_id', clinicaId)
      if (error) throw error
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    } catch (e: any) {
      console.error('Erro ao atualizar produto:', e.message)
    }
  }, [clinicaId])

  // ── Registrar entrada ────────────────────────────────────────────────────────
  const registerEntry = useCallback(async (
    productId: string, quantity: number, reason: string, responsible: string, cost?: number
  ) => {
    if (!clinicaId) return
    const product = products.find(p => p.id === productId)
    if (!product) return
    try {
      const { error: movErr } = await supabase.from('estoque_movimentacoes').insert({
        clinica_id: clinicaId,
        produto_id: productId,
        produto_nome: product.name,
        tipo: 'Entrada',
        quantidade: quantity,
        motivo: reason,
        responsavel: responsible,
      })
      if (movErr) throw movErr

      const novoEstoque = product.currentStock + quantity
      await supabase
        .from('produtos_estoque')
        .update({ estoque_atual: novoEstoque, ...(cost ? { custo_unitario: cost } : {}) })
        .eq('id', productId)
        .eq('clinica_id', clinicaId)

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, currentStock: novoEstoque, ...(cost ? { unitCost: cost } : {}) } : p
      ))
      await loadMovements()
    } catch (e: any) {
      console.error('Erro ao registrar entrada:', e.message)
    }
  }, [clinicaId, products, loadMovements])

  // ── Registrar saída ──────────────────────────────────────────────────────────
  const registerExit = useCallback(async (
    productId: string, quantity: number, reason: string, responsible: string, linkedTo?: string
  ) => {
    if (!clinicaId) return
    const product = products.find(p => p.id === productId)
    if (!product) return
    try {
      const { error: movErr } = await supabase.from('estoque_movimentacoes').insert({
        clinica_id: clinicaId,
        produto_id: productId,
        produto_nome: product.name,
        tipo: 'Saída',
        quantidade: quantity,
        motivo: reason,
        responsavel: responsible,
        vinculado_a: linkedTo || null,
      })
      if (movErr) throw movErr

      const novoEstoque = Math.max(0, product.currentStock - quantity)
      await supabase
        .from('produtos_estoque')
        .update({ estoque_atual: novoEstoque })
        .eq('id', productId)
        .eq('clinica_id', clinicaId)

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, currentStock: novoEstoque } : p
      ))
      await loadMovements()
    } catch (e: any) {
      console.error('Erro ao registrar saída:', e.message)
    }
  }, [clinicaId, products, loadMovements])

  // ── Gerar pedido de compra ────────────────────────────────────────────────────
  const generatePurchaseOrder = useCallback(async (orderData: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>) => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('pedidos_compra')
        .insert({
          clinica_id: clinicaId,
          produto_id: orderData.productId,
          fornecedor: orderData.provider,
          quantidade: orderData.quantity,
          data_prevista: orderData.expectedDate,
          status: 'Pendente',
        })
        .select()
        .single()
      if (error) throw error
      const novo: PurchaseOrder = {
        id: data.id,
        productId: data.produto_id,
        provider: data.fornecedor,
        quantity: data.quantidade,
        expectedDate: data.data_prevista,
        status: data.status,
        createdAt: data.created_at,
      }
      setPurchaseOrders(prev => [novo, ...prev])
    } catch (e: any) {
      console.error('Erro ao gerar pedido:', e.message)
    }
  }, [clinicaId])

  // ── Alternar regra de consumo ─────────────────────────────────────────────────
  const toggleConsumptionRule = useCallback(async (ruleId: string) => {
    if (!clinicaId) return
    const rule = consumptionRules.find(r => r.id === ruleId)
    if (!rule) return
    try {
      const { error } = await supabase
        .from('procedimento_insumos')
        .update({ ativo: !rule.isActive })
        .eq('id', ruleId)
        .eq('clinica_id', clinicaId)
      if (error) throw error
      setConsumptionRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    } catch (e: any) {
      console.error('Erro ao alternar regra:', e.message)
    }
  }, [clinicaId, consumptionRules])

  // ── Criar regra de consumo ────────────────────────────────────────────────────
  const createConsumptionRule = useCallback(async (rule: Omit<ProcedureConsumptionRule, 'id'>) => {
    if (!clinicaId) return
    try {
      const { data, error } = await supabase
        .from('procedimento_insumos')
        .insert({
          clinica_id: clinicaId,
          procedimento_nome: rule.procedureName,
          produto_id: rule.productId,
          quantidade: rule.quantity,
          ativo: rule.isActive,
        })
        .select()
        .single()
      if (error) throw error
      setConsumptionRules(prev => [...prev, {
        id: data.id,
        procedureName: data.procedimento_nome,
        productId: data.produto_id,
        quantity: data.quantidade,
        isActive: data.ativo,
      }])
    } catch (e: any) {
      console.error('Erro ao criar regra:', e.message)
    }
  }, [clinicaId])

  return {
    products,
    movements,
    purchaseOrders,
    consumptionRules,
    isLoading,
    getProducts,
    createProduct,
    updateProduct,
    registerEntry,
    registerExit,
    getMovimentacoes,
    getAlerts,
    generatePurchaseOrder,
    toggleConsumptionRule,
    createConsumptionRule,
    loadProducts,
    loadMovements,
  }
}

// Hook de automação de consumo (mantém compatibilidade)
export const useEstoqueAutomation = () => {
  const { registerExit, consumptionRules } = useEstoque()

  const processProcedure = (procedureName: string, responsible: string, patientId: string) => {
    const rulesToApply = consumptionRules.filter(r => r.isActive && r.procedureName === procedureName)
    rulesToApply.forEach(rule => {
      registerExit(rule.productId, rule.quantity, `Baixa Automática - ${procedureName}`, responsible, `PAC-${patientId}`)
    })
  }

  return { processProcedure }
}
