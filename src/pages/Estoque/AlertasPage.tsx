import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  ShoppingCart,
  CalendarMinus,
  CheckCircle2,
  Package,
  Clock
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import type { Product } from '../../types/estoque'

export function AlertasPage() {
  const navigate = useNavigate()
  const { products, getAlerts, generatePurchaseOrder, purchaseOrders } = useEstoque()
  const alerts = getAlerts()

  const { toast } = useToast()

  // Padronizado para 30 dias
  const now = Date.now()
  const in30d = now + 30 * 24 * 60 * 60 * 1000
  const expiringProducts = products.filter(p => p.expirationDate &&
    new Date(p.expirationDate).getTime() < in30d
  ).sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
  const expiredProducts = expiringProducts.filter(p => new Date(p.expirationDate!).getTime() < now)
  const soonProducts = expiringProducts.filter(p => new Date(p.expirationDate!).getTime() >= now)

  const [activeTab, setActiveTab] = useState<'estoque' | 'vencimento' | 'pedidos'>('estoque')

  const handleCreateOrder = (product: Product) => {
    generatePurchaseOrder({
      productId: product.id,
      provider: product.provider || 'Fornecedor Padrão',
      quantity: product.minimumStock * 2,
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    toast({ title: 'Pedido gerado', description: `Pedido de ${product.name} criado.`, type: 'success' })
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('pedidos_compra').update({ status: newStatus } as any).eq('id', orderId)
    if (error) { toast({ title: 'Erro', description: error.message, type: 'error' }); return }
    toast({ title: 'Status atualizado', type: 'success' })
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-4 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/estoque" className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Alertas & Reposição</h1>
            <p className="text-[var(--color-text-muted)]">Controle rigoroso de validades e compras pendentes</p>
          </div>
        </div>

        <div className="flex border-b border-[var(--color-border)]">
          <button 
            onClick={() => setActiveTab('estoque')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'estoque' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-slate-300'
            }`}
          >
            Abaixo do Mínimo <Badge className="bg-red-100 text-red-700 border-none px-1.5">{alerts.length}</Badge>
          </button>
          <button 
            onClick={() => setActiveTab('vencimento')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vencimento' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-slate-300'
            }`}
          >
            Vencimentos <Badge className="bg-amber-100 text-amber-700 border-none px-1.5">{expiringProducts.length}</Badge>
          </button>
          <button 
            onClick={() => setActiveTab('pedidos')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pedidos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-slate-300'
            }`}
          >
            Pedidos de Compra
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        
        {activeTab === 'estoque' && (
          <div className="space-y-4">
            {alerts.map(product => (
              <div key={product.id} className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${product.currentStock === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-indigo-600 transition-colors uppercase flex items-center gap-2">
                       {product.name}
                       {product.currentStock === 0 && <Badge className="bg-red-100 text-red-700 border-none uppercase tracking-widest text-[10px]">Zerado</Badge>}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-[var(--color-text-muted)] font-medium">
                      <span>Mínimo: <strong>{product.minimumStock}</strong></span>
                      <span className="w-px h-4 bg-[var(--color-border)]" />
                      <span className={product.currentStock === 0 ? 'text-red-500' : 'text-orange-500'}>
                        Atual: <strong>{product.currentStock}</strong>
                      </span>
                      <span className="w-px h-4 bg-[var(--color-border)]" />
                      <span className="text-[var(--color-text-muted)] font-mono text-xs mt-0.5">{product.code}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleCreateOrder(product)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <ShoppingCart size={18} /> Gerar Pedido
                </button>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                 <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                 <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Estoque Saudável</h2>
                 <p className="text-[var(--color-text-muted)] font-medium">Nenhum produto está abaixo da quantidade mínima definida.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vencimento' && (
          <div className="space-y-4">
            {expiringProducts.map(product => {
              const daysLeft = Math.floor((new Date(product.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft < 0;
              return (
                <div key={product.id} className={`bg-[var(--color-bg-card)] p-5 rounded-2xl border ${isExpired ? 'border-red-300 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : 'border-[var(--color-border)] shadow-sm'} flex items-center justify-between group hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      <CalendarMinus size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-amber-600 transition-colors flex items-center gap-2">
                        {product.name}
                        {isExpired && <Badge className="bg-red-600 text-white border-none uppercase tracking-widest text-[10px] animate-pulse">VENCIDO</Badge>}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-[var(--color-text-muted)] font-medium items-center">
                        <span className="bg-[var(--color-bg-card)] rounded px-2 py-0.5 flex items-center gap-1.5"><Package size={14} className="text-[var(--color-text-muted)]"/> {product.currentStock} em estoque</span>
                        <span className="w-px h-4 bg-[var(--color-border)]" />
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{product.code}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                     <span className={`block text-xl font-black ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                        {isExpired ? 'Vencido' : `${daysLeft} dias`}
                     </span>
                     <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                       {new Date(product.expirationDate!).toLocaleDateString('pt-BR')}
                     </span>
                  </div>
                </div>
              )
            })}
            {expiringProducts.length === 0 && (
              <div className="text-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                 <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                 <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Sem Vencimentos Próximos</h2>
                 <p className="text-[var(--color-text-muted)] font-medium">Nenhum produto expira nos próximos 60 dias.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-4">
             {purchaseOrders.map(order => {
                const product = products.find(p => p.id === order.productId);
                return (
                  <div key={order.id} className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Badge className="bg-indigo-100 text-indigo-700 tracking-widest text-[10px] font-black">{order.status}</Badge>
                        <span className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1"><Clock size={12}/> Criado em {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-[var(--color-text-primary)] text-lg uppercase">{product?.name || `PROD-${order.productId}`}</h3>
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mt-2">
                        <span>Fornecedor: <strong>{order.provider}</strong></span>
                        <span className="text-[var(--color-text-dim)]">•</span>
                        <span>Quantidade: <strong>{order.quantity}</strong> un.</span>
                        <span className="text-[var(--color-text-dim)]">•</span>
                        <span>Entrega Prevista: {new Date(order.expectedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'pendente' && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'aprovado')}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">Aprovar</button>
                      )}
                      {(order.status === 'pendente' || order.status === 'aprovado') && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'entregue')}
                          className="px-3 py-1.5 text-xs font-semibold text-cyan-600 bg-cyan-500/5 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10 transition-colors">Recebido</button>
                      )}
                      <button onClick={() => navigate(`/estoque/produtos?highlight=${order.productId}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors">Detalhes</button>
                    </div>
                  </div>
                )
             })}
             {purchaseOrders.length === 0 && (
              <div className="text-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                 <ShoppingCart size={48} className="mx-auto text-[var(--color-text-dim)] mb-4" />
                 <h2 className="text-lg font-bold text-[var(--color-text-muted)]">Nenhum pedido de compra</h2>
                 <p className="text-[var(--color-text-muted)] font-medium">Nenhum pedido foi gerado recentemente.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
