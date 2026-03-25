import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, Edit2, Package,
  TrendingDown, AlertTriangle, Info, History, TrendingUp, X, Loader2
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { Badge } from '../../components/ui/Badge'
import type { Product, ProductCategory } from '../../types/estoque'

const CATEGORIAS: ProductCategory[] = [
  'Injetáveis', 'Descartáveis', 'Medicamentos',
  'Materiais Dentários', 'Equipamentos', 'Limpeza', 'Outros'
]

interface ProdutoForm {
  code: string
  name: string
  category: ProductCategory
  unit: string
  currentStock: number
  minimumStock: number
  expirationDate: string
  unitCost: number
  provider: string
  location: string
}

const formVazio: ProdutoForm = {
  code: '', name: '', category: 'Descartáveis', unit: 'Unidade',
  currentStock: 0, minimumStock: 5, expirationDate: '',
  unitCost: 0, provider: '', location: '',
}

export function ProdutosPage() {
  const { getProducts, createProduct, updateProduct, loadProducts, isLoading, registerEntry, registerExit } = useEstoque()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const products = getProducts()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movModal, setMovModal] = useState<{ tipo: 'entrada' | 'saida'; prodId: string } | null>(null)
  const [movQty, setMovQty] = useState('')
  const [movMotivo, setMovMotivo] = useState('')
  const [form, setForm] = useState<ProdutoForm>(formVazio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const openNew = () => { setEditProduct(null); setForm(formVazio); setIsModalOpen(true) }
  const openEdit = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditProduct(p)
    setForm({
      code: p.code, name: p.name, category: p.category, unit: p.unit,
      currentStock: p.currentStock, minimumStock: p.minimumStock,
      expirationDate: p.expirationDate || '', unitCost: p.unitCost,
      provider: p.provider || '', location: p.location || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    if (editProduct) {
      await updateProduct(editProduct.id, { ...form })
    } else {
      await createProduct(form)
    }
    setSaving(false)
    setIsModalOpen(false)
    setForm(formVazio)
    setEditProduct(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      <header className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/estoque" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Catálogo de Produtos</h1>
              <p className="text-slate-500">Gerencie todos os itens do estoque</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar por nome ou código..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
            <option value="all">Todas as Categorias</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Estoque</th>
                <th className="px-5 py-3 hidden md:table-cell">Mín.</th>
                <th className="px-5 py-3 hidden lg:table-cell">Custo Un.</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => setSelectedProduct(product)}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{product.name}</span>
                      <span className="text-xs text-slate-500 font-medium font-mono">{product.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        product.currentStock === 0 ? 'text-red-500' :
                        product.currentStock < product.minimumStock ? 'text-orange-500' : 'text-slate-700'
                      }`}>{product.currentStock}</span>
                      <span className="text-xs text-slate-400 font-medium">{product.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm font-semibold text-slate-500">{product.minimumStock}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-slate-700">
                      {product.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.currentStock === 0 ? (
                      <Badge className="bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle size={12} className="mr-1" /> ZERADO
                      </Badge>
                    ) : product.currentStock < product.minimumStock ? (
                      <Badge className="bg-orange-50 text-orange-700 border border-orange-200">
                        <TrendingDown size={12} className="mr-1" /> CRÍTICO
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">NORMAL</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => openEdit(product, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    {products.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <Package size={28} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-slate-700 font-semibold mb-1">Nenhum produto cadastrado</p>
                          <p className="text-sm text-slate-400 max-w-sm mx-auto">Cadastre materiais, insumos e medicamentos para controlar quantidades, custos e validades.</p>
                        </div>
                        <button onClick={openNew}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 mt-2">
                          <Plus size={16} /> Cadastrar primeiro produto
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500">Nenhum produto encontrado com os filtros atuais.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </main>

      {/* Product Detail Drawer */}
      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={() => setSelectedProduct(null)} />
          <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase">{selectedProduct.code}</span>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{selectedProduct.name}</h2>
              <div className="flex gap-2 mb-6">
                <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">{selectedProduct.category}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">{selectedProduct.location || 'Sem Local'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${selectedProduct.currentStock <= selectedProduct.minimumStock ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-tight">Estoque Atual</span>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-800">{selectedProduct.currentStock}</span>
                    <span className="font-semibold text-slate-500 mb-1">{selectedProduct.unit}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-tight">Estoque Mínimo</span>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-800">{selectedProduct.minimumStock}</span>
                    <span className="font-semibold text-slate-500 mb-1">{selectedProduct.unit}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  onClick={() => { setMovModal({ tipo: 'entrada', prodId: selectedProduct.id }); setMovQty(''); setMovMotivo('') }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <TrendingUp size={16} /> Registrar Entrada
                </button>
                <button
                  onClick={() => { setMovModal({ tipo: 'saida', prodId: selectedProduct.id }); setMovQty(''); setMovMotivo('') }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
                  <TrendingDown size={16} /> Ajuste / Saída
                </button>
              </div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info size={18} className="text-slate-400" /> Detalhes
              </h3>
              <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Fornecedor Principal:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.provider || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Custo Unitário:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Validade:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.expirationDate ? new Date(selectedProduct.expirationDate + 'T00:00').toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={18} className="text-slate-400" /> Últimas Movimentações
              </h3>
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <Link to="/estoque/movimentacoes" className="text-sm font-bold text-indigo-600 mt-2 inline-block">Ver histórico completo</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Novo / Editar Produto ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditProduct(null); setForm(formVazio) }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" required className="input-base" placeholder="Ex: Ácido Hialurônico 1ml"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" className="input-base" placeholder="INJ-001"
                    value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select className="input-base" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <input type="text" className="input-base" placeholder="Frasco, Caixa, Unidade..."
                    value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque atual</label>
                  <input type="number" min="0" className="input-base"
                    value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: +e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                  <input type="number" min="0" className="input-base"
                    value={form.minimumStock} onChange={e => setForm(f => ({ ...f, minimumStock: +e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input type="number" min="0" step="0.01" className="input-base"
                    value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: +e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                  <input type="date" className="input-base"
                    value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                  <input type="text" className="input-base" placeholder="Nome do fornecedor"
                    value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input type="text" className="input-base" placeholder="Ex: Geladeira 1, Almoxarifado A"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditProduct(null); setForm(formVazio) }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving || !form.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? 'Salvando...' : editProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Movimentação */}
      {movModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMovModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
            <div className={`px-6 py-4 border-b ${movModal.tipo === 'entrada' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <h3 className="text-sm font-bold text-gray-900">
                {movModal.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída/Ajuste'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Quantidade *</label>
                <input type="number" min="1" value={movQty} onChange={e => setMovQty(e.target.value)} autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-green-500/20" placeholder="0" />
                {movModal.tipo === 'saida' && selectedProduct && Number(movQty) > selectedProduct.currentStock && (
                  <p className="text-xs text-red-500 mt-1">Estoque atual: {selectedProduct.currentStock}. Quantidade excede o disponível.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Motivo</label>
                <input type="text" value={movMotivo} onChange={e => setMovMotivo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm outline-none" placeholder="Ex: Compra, uso em procedimento..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-between">
              <button onClick={() => setMovModal(null)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button
                disabled={!movQty || Number(movQty) <= 0 || (movModal.tipo === 'saida' && selectedProduct && Number(movQty) > selectedProduct.currentStock)}
                onClick={async () => {
                  const qty = Number(movQty)
                  if (qty <= 0) return
                  if (movModal.tipo === 'entrada') {
                    await registerEntry(movModal.prodId, qty, movMotivo || 'Entrada manual', user?.nome || 'Operador')
                  } else {
                    await registerExit(movModal.prodId, qty, movMotivo || 'Saída manual', user?.nome || 'Operador')
                  }
                  setMovModal(null)
                  setSelectedProduct(null)
                  toast({ title: 'Movimentação registrada', type: 'success' })
                }}
                className={`flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-40 ${movModal.tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
