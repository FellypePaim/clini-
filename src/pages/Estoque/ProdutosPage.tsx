import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  History,
  Info
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { Badge } from '../../components/ui/Badge'
import type { Product, ProductCategory } from '../../types/estoque'

const CATEGORIAS: ProductCategory[] = [
  'Injetáveis', 'Descartáveis', 'Medicamentos', 
  'Materiais Dentários', 'Equipamentos', 'Limpeza', 'Outros'
]

export function ProdutosPage() {
  const { getProducts, createProduct } = useEstoque()
  const products = getProducts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
            <Filter size={16} /> Mais Filtros
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Estoque Atual</th>
                <th className="px-6 py-4 hidden md:table-cell">Mínimo / Ideal</th>
                <th className="px-6 py-4 hidden lg:table-cell">Custo Unitário</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr 
                  key={product.id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => setSelectedProduct(product)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{product.name}</span>
                      <span className="text-xs text-slate-500 font-medium font-mono">{product.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        product.currentStock === 0 ? 'text-red-500' : 
                        product.currentStock < product.minimumStock ? 'text-orange-500' : 'text-slate-700'
                      }`}>
                        {product.currentStock}
                      </span>
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
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                        NORMAL
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); console.log('Edit', product.id) }} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Product Detail Drawer (Mock/Simplified) */}
      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={() => setSelectedProduct(null)} />
          <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase">{selectedProduct.code}</span>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20} className="rotate-180"/></button>
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
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <TrendingUp size={16} /> Registrar Entrada
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
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
                  <span className="text-slate-500 font-medium">Validade Mais Próxima:</span>
                  <span className="font-semibold text-slate-900">{selectedProduct.expirationDate ? new Date(selectedProduct.expirationDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={18} className="text-slate-400" /> Últimas Movimentações
              </h3>
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                 <p className="text-sm text-slate-500 font-medium italic">Gráfico e histórico restrito ao módulo de Movimentações.</p>
                 <Link to="/estoque/movimentacoes" className="text-sm font-bold text-indigo-600 mt-2 inline-block">Ver histórico completo</Link>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
