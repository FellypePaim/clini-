import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, ShoppingBag, Loader2, CheckCircle2, X } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useEstoque } from '../../hooks/useEstoque'
import { Badge } from '../../components/ui/Badge'
import type { ProcedureConsumptionRule } from '../../types/estoque'

export function RegrasConsumoPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = (user as any)?.user_metadata?.clinica_id
  const { products } = useEstoque()

  const [rules, setRules] = useState<ProcedureConsumptionRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })

  const loadRules = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('procedimento_insumos')
      .select('*')
      .eq('clinica_id', clinicaId)
    
    if (error) {
      console.error('Erro ao carregar regras:', error)
      setRules([])
    } else {
      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        procedureName: r.procedimento_nome,
        productId: r.produto_id,
        quantity: r.quantidade,
        isActive: r.ativo
      }))
      setRules(mapped)
    }
    setIsLoading(false)
  }, [clinicaId])

  useEffect(() => { loadRules() }, [loadRules])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('procedimento_insumos').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
      return
    }
    setRules(prev => prev.filter(r => r.id !== id))
    toast({ title: 'Removido', description: 'Regra de consumo removida.', type: 'success' })
  }

  const handleSave = async (formData: any) => {
    if (!clinicaId) return
    setIsSaving(true)
    
    const payload = {
      clinica_id: clinicaId,
      procedimento_nome: formData.procedureName,
      produto_id: formData.productId,
      quantidade: formData.quantity,
      ativo: true
    }

    const { data, error } = await supabase
      .from('procedimento_insumos')
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast({ title: 'Erro', description: error.message, type: 'error' })
    } else {
      const mapped = {
        id: (data as any).id,
        procedureName: (data as any).procedimento_nome,
        productId: (data as any).produto_id,
        quantity: (data as any).quantidade,
        isActive: (data as any).ativo
      }
      setRules(prev => [...prev, mapped])
      toast({ title: 'Sucesso', description: 'Regra de consumo criada.', type: 'success' })
      setModal({ open: false })
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <ShoppingBag className="text-indigo-600" />
            Regras de Consumo Automático
          </h2>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
            Vincule materiais aos procedimentos para baixa automática no estoque ao finalizar uma evolução.
          </p>
        </div>
        <button 
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
        >
          <Plus size={18}/> Nova Regra
        </button>
      </div>

      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-[var(--color-text-muted)]">
              <ShoppingBag className="w-12 h-12 mb-3 text-slate-200" />
              <p className="font-bold text-sm text-center">Nenhuma regra de consumo configurada.<br/>Adicione materiais que são gastos automaticamente em cada atendimento.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-deep)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  <th className="px-6 py-4">Procedimento</th>
                  <th className="px-6 py-4">Material / Produto</th>
                  <th className="px-6 py-4 text-center">Qtd. Consumida</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-sm font-medium">
                {rules.map((rule) => {
                  const product = products.find(p => p.id === rule.productId)
                  return (
                    <tr key={rule.id} className="hover:bg-[var(--color-bg-card-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-black text-[var(--color-text-secondary)]">{rule.procedureName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-[var(--color-text-primary)]">{product?.name || 'Produto não encontrado'}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{product?.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-indigo-50 text-indigo-700 border-none font-black">
                          {rule.quantity} {product?.unit || 'un'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {rule.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)] text-xs">Inativo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 text-[var(--color-text-dim)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.open && (
        <RuleModal 
          onClose={() => setModal({ open: false })} 
          onSave={handleSave}
          isSaving={isSaving}
          products={products}
        />
      )}
    </div>
  )
}

function RuleModal({ onClose, onSave, isSaving, products }: any) {
  const [form, setForm] = useState({
    procedureName: '',
    productId: '',
    quantity: 1
  })

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag />
            <h3 className="text-lg font-black">Nova Regra de Consumo</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-card)]/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Nome do Procedimento</label>
            <input 
              type="text" 
              placeholder="Ex: Aplicação de Botox"
              className="w-full p-3 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
              value={form.procedureName}
              onChange={e => setForm(p => ({ ...p, procedureName: e.target.value }))}
            />
            <p className="text-[9px] text-[var(--color-text-muted)] ml-1">Deve ser idêntico ao nome cadastrado no catálogo.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Produto / Material</label>
            <select 
              className="w-full p-3 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
              value={form.productId}
              onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
            >
              <option value="">Selecione um produto...</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Quantidade por Procedimento</label>
            <input 
              type="number" 
              className="w-full p-3 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black"
              value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSave(form)}
              disabled={isSaving || !form.procedureName || !form.productId}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Criar Regra
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
