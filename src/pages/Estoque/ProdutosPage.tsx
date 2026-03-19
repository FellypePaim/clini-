import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  History,
  Info,
  Package
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { Badge } from '../../components/ui/Badge'
import type { Product, ProductCategory } from '../../types/estoque'

const CATEGORIAS: ProductCategory[] = [
  'Injetáveis', 'Descartáveis', 'Medicamentos', 
  'Materiais Dentários', 'Equipamentos', 'Limpeza', 'Outros'
]

export function ProdutosPage() {
  const { getProducts, createProduct, registerEntry, registerExit, isLoading } = useEstoque()
  const products = getProducts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveType, setMoveType] = useState<'entrada' | 'saida'>('entrada')

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '', code: '', category: 'Outros', unit: 'Unidade',
    currentStock: 0, minimumStock: 0, unitCost: 0
  })

  const [moveData, setMoveData] = useState({ quantity: 1, reason: '', cost: 0 })
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProduct(formData)
    setIsModalOpen(false)
    setFormData({ name: '', code: '', category: 'Outros', unit: 'Unidade', currentStock: 0, minimumStock: 0, unitCost: 0 })
  }

  const handleMoveEstoque = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    if (moveType === 'entrada') {
      await registerEntry(selectedProduct.id, moveData.quantity, moveData.reason, 'Admin', moveData.cost)
    } else {
      await registerExit(selectedProduct.id, moveData.quantity, moveData.reason, 'Admin')
    }
    setIsMoveModalOpen(false)
    setMoveData({ quantity: 1, reason: '', cost: 0 })
    setSelectedProduct(null)
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
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="all">Todas as Categorias</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Custo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 cursor-pointer group" onClick={() => setSelectedProduct(product)}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{product.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{product.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.currentStock === 0 ? <Badge className="bg-red-50 text-red-600">Zerado</Badge> : 
                     product.currentStock <= product.minimumStock ? <Badge className="bg-orange-50 text-orange-600">Crítico</Badge> : 
                     <Badge className="bg-emerald-50 text-emerald-600">Normal</Badge>}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                    {product.currentStock} {product.unit} <span className="text-xs font-normal text-slate-400 whitespace-nowrap">(min: {product.minimumStock})</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {product.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600"><MoreVertical size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Product Drawer */}
      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in p-6">
            <header className="mb-8">
               <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedProduct.name}</h2>
               <p className="text-sm text-slate-400 font-mono uppercase">{selectedProduct.code}</p>
            </header>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atual</span>
                <p className="text-2xl font-black text-slate-800">{selectedProduct.currentStock} {selectedProduct.unit}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo</span>
                <p className="text-2xl font-black text-slate-800">{selectedProduct.minimumStock} {selectedProduct.unit}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button 
                onClick={() => { setMoveType('entrada'); setMoveData({ ...moveData, cost: selectedProduct.unitCost }); setIsMoveModalOpen(true) }}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <TrendingUp size={18} /> Entrada
              </button>
              <button 
                onClick={() => { setMoveType('saida'); setIsMoveModalOpen(true) }}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-100 flex items-center justify-center gap-2"
              >
                <TrendingDown size={18} /> Saída
              </button>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Info size={18} className="text-indigo-600" /> Informações</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
               <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Custo Atual:</span>
                  <span className="text-slate-900 font-bold">{selectedProduct.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
               </div>
               <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Localização:</span>
                  <span className="text-slate-900">{selectedProduct.location || 'Não informado'}</span>
               </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-pop-in">
            <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Novo Produto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
            </header>
            <form onSubmit={handleSaveProduct} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Produto</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Código</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code:e.target.value})} className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category:e.target.value as any})} className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque Inicial</label>
                <input type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock:Number(e.target.value)})} className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo (R$)</label>
                <input type="number" step="0.01" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost:Number(e.target.value)})} className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button disabled={isLoading} type="submit" className="col-span-2 py-3 mt-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                {isLoading ? 'Salvando...' : 'Cadastrar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {isMoveModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
            <header className={`px-6 py-4 border-b flex justify-between items-center ${moveType === 'entrada' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <h3 className={`font-black ${moveType === 'entrada' ? 'text-emerald-800' : 'text-red-800'}`}>
                {moveType === 'entrada' ? 'Lançar Entrada' : 'Lançar Saída'}
              </h3>
              <button onClick={() => setIsMoveModalOpen(false)} className="font-bold">×</button>
            </header>
            <form onSubmit={handleMoveEstoque} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade ({selectedProduct.unit})</label>
                <input required type="number" min="1" value={moveData.quantity} onChange={e => setMoveData({...moveData, quantity:Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</label>
                <input required value={moveData.reason} onChange={e => setMoveData({...moveData, reason:e.target.value})} placeholder="Ex: NF-1234 ou Ajuste" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" className={`w-full py-3 mt-2 text-white font-bold rounded-xl ${moveType === 'entrada' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {isLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
