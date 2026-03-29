import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  ArrowRight,
  TrendingDown,
  Warehouse,
  Plus
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { usePermissions } from '../../store/authStore'
import { Badge } from '../../components/ui/Badge'
import { ShoppingBag } from 'lucide-react'

export function EstoquePage() {
  const { products, getAlerts } = useEstoque()
  const { isAdmin } = usePermissions()

  const stats = useMemo(() => {
    const totalItems = products.length;
    const criticalItems = products.filter(p => p.currentStock < p.minimumStock).length;
    const zeroItems = products.filter(p => p.currentStock === 0).length;
    
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0);
    
    const now = Date.now()
    const in30d = now + 30 * 24 * 60 * 60 * 1000
    const expiringItems = products.filter(p => p.expirationDate &&
      new Date(p.expirationDate).getTime() < in30d && new Date(p.expirationDate).getTime() > now
    ).length;
    const expiredItems = products.filter(p => p.expirationDate &&
      new Date(p.expirationDate).getTime() < now
    ).length;

    return { totalItems, criticalItems, zeroItems, totalValue, expiringItems, expiredItems };
  }, [products]);

  const alerts = getAlerts();

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)] overflow-y-auto">
      {/* Header */}
      <header className="px-6 py-4 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Warehouse className="text-indigo-600" />
              Gestão de Estoque
            </h1>
            <p className="text-[var(--color-text-muted)]">Controle de materiais, insumos e movimentações</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/estoque/movimentacoes" 
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] transition-all shadow-sm"
            >
              Movimentações
            </Link>
            <Link 
              to="/estoque/regras" 
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] transition-all shadow-sm flex items-center gap-2"
            >
              <ShoppingBag size={18} className="text-indigo-500" />
              Regras
            </Link>
            <Link 
              to="/estoque/produtos" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <Package size={18} />
              Catálogo
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-sm font-semibold text-[var(--color-text-muted)]">Itens Cadastrados</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Package size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.totalItems}</span>
              <span className="text-xs font-bold text-[var(--color-text-muted)]">produtos</span>
            </div>
            <Package size={80} className="absolute -bottom-4 -right-4 text-slate-50 opacity-50 z-0" />
          </div>

          <div className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-text-muted)]">Estoque Crítico</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.criticalItems}</span>
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingDown size={12} /> {stats.zeroItems} zerados
              </span>
            </div>
          </div>

          {isAdmin ? (
            <div className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--color-text-muted)]">Valor em Estoque</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--color-text-muted)]">Produtos Ativos</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={18} /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">{products.filter(p => p.currentStock > 0).length}</span>
                <span className="text-xs font-bold text-[var(--color-text-muted)]">com estoque</span>
              </div>
            </div>
          )}

          <div className={`bg-[var(--color-bg-card)] p-5 rounded-2xl border shadow-sm ${stats.expiredItems > 0 ? 'border-red-200 bg-red-50/30' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-text-muted)]">Validade</span>
              <div className={`p-2 rounded-lg ${stats.expiredItems > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}><Calendar size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.expiringItems + stats.expiredItems}</span>
              <div className="flex flex-col gap-0.5">
                {stats.expiredItems > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{stats.expiredItems} vencido{stats.expiredItems > 1 ? 's' : ''}</span>}
                {stats.expiringItems > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stats.expiringItems} vence em 30d</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">

        {alerts.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Alertas de Reposição
              </h2>
              <Link to="/estoque/alertas" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Ver todos os alertas <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.slice(0, 3).map((product) => (
                <div key={product.id} className={`p-4 rounded-xl border ${product.currentStock === 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[var(--color-text-muted)]">{product.code}</span>
                    <Badge className={product.currentStock === 0 ? 'bg-red-100 text-red-700 hover:bg-red-100 border-none' : 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none'}>
                      {product.currentStock === 0 ? 'ZERADO' : 'CRÍTICO'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-[var(--color-text-primary)] mb-3 truncate" title={product.name}>{product.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-muted)]">Estoque Atual</span>
                      <span className={`font-bold ${product.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {product.currentStock} {product.unit}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-[var(--color-text-muted)]">Mínimo Ideal</span>
                      <span className="font-bold text-[var(--color-text-secondary)]">{product.minimumStock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Package size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Estoque vazio</h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mb-6">
              Comece cadastrando seus produtos, materiais e insumos no catálogo. Depois você poderá controlar entradas, saídas e receber alertas de reposição.
            </p>
            <Link
              to="/estoque/produtos"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <Plus size={18} />
              Cadastrar primeiro produto
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
