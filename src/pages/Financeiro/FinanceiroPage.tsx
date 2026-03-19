import React, { useState, useMemo } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Wallet,
  CreditCard,
  Banknote,
  PieChart as PieChartIcon,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useFinanceiro } from '../../hooks/useFinanceiro'
import type { TransacaoTipo, TransacaoStatus, Transacao } from '../../hooks/useFinanceiro'
import { Badge } from '../../components/ui/Badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { cn } from '../../lib/utils'

export function FinanceiroPage() {
  const { transacoes, summary, isLoading, deleteTransacao, categorias } = useFinanceiro()
  const [activeTab, setActiveTab] = useState<'geral' | 'transacoes' | 'categorias'>('geral')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all')

  // ── Dados para os Gráficos ─────────────────────────────
  const chartData = useMemo(() => {
    const days = 7
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const receitas = transacoes
        .filter(t => t.dataConsolidacao === dateStr && t.tipo === 'receita' && t.status === 'pago')
        .reduce((sum, t) => sum + t.valor, 0)
        
      const despesas = transacoes
        .filter(t => t.dataConsolidacao === dateStr && t.tipo === 'despesa' && t.status === 'pago')
        .reduce((sum, t) => sum + t.valor, 0)
        
      data.push({
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        receitas,
        despesas
      })
    }
    return data
  }, [transacoes])

  // ── Filtragem de Transações ───────────────────────────
  const filteredTransactions = useMemo(() => {
    return transacoes.filter(t => {
      const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.categoriaNome?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchType = typeFilter === 'all' || t.tipo === typeFilter
      return matchSearch && matchType
    })
  }, [transacoes, searchTerm, typeFilter])

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financeiro</h1>
          <p className="text-slate-500 font-medium">Controle total do seu fluxo de caixa e faturamento</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={18} /> Últimos 30 dias
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ring-2 ring-indigo-50 active:scale-95">
            <Plus size={18} /> Nova Transação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Receitas (Pago)</p>
              <h3 className="text-3xl font-black text-slate-900 mb-1">
                {summary.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp size={12} /> +12% vs mês anterior
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Despesas (Pago)</p>
              <h3 className="text-3xl font-black text-slate-900 mb-1">
                {summary.despesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <TrendingDown size={12} /> -5% vs mês anterior
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
           <div className="flex items-start justify-between relative">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Saldo Líquido</p>
              <h3 className={cn("text-3xl font-black mb-1", summary.saldo >= 0 ? "text-indigo-600" : "text-rose-600")}>
                {summary.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-xs font-bold text-slate-400 capitalize">Atualizado agora</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('geral')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'geral' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Visão Geral
          {activeTab === 'geral' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('transacoes')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'transacoes' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Transações
          {activeTab === 'transacoes' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('categorias')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'categorias' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Categorias
          {activeTab === 'categorias' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {activeTab === 'geral' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" /> Fluxo Semanal (E/S)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="#10B981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={3} />
                  <Area type="monotone" dataKey="despesas" stroke="#F43F5E" fillOpacity={1} fill="url(#colorDes)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution or Mini List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-indigo-500" /> Maiores Despesas
            </h3>
            <div className="space-y-4">
              {categorias.filter(c => c.tipo === 'despesa').slice(0, 5).map(cat => {
                 const totalCat = transacoes
                  .filter(t => t.categoriaId === cat.id && t.status === 'pago')
                  .reduce((sum, t) => sum + t.valor, 0)
                 return (
                   <div key={cat.id} className="flex flex-col gap-2">
                     <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-slate-600">{cat.nome}</span>
                       <span className="text-slate-900">{totalCat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                     </div>
                     <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalCat / Math.max(1, summary.despesa)) * 100)}%` }} />
                     </div>
                   </div>
                 )
              })}
              {summary.despesa === 0 && <p className="text-center text-slate-400 py-10 italic">Nenhuma despesa registrada.</p>}
            </div>
          </div>
        </div>
      ) : activeTab === 'transacoes' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
            <div className="relative min-w-[300px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar transação ou categoria..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border-0 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
               {(['all', 'receita', 'despesa'] as const).map(f => (
                 <button 
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize",
                    typeFilter === f ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"
                  )}
                 >
                   {f === 'all' ? 'Todos' : f}
                 </button>
               ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Forma</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">{new Date(t.dataConsolidacao).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          t.tipo === 'receita' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {t.tipo === 'receita' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{t.descricao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                        {t.categoriaNome || 'Sem Categoria'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "text-sm font-black",
                        t.tipo === 'receita' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {t.tipo === 'receita' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 capitalize">
                         {t.formaPagamento === 'cartao_credito' ? <CreditCard size={14} /> : <Banknote size={14} />}
                         {t.formaPagamento?.replace('_', ' ') || '-'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.status === 'pago' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100">
                           <CheckCircle2 size={12} className="mr-1" /> PAGO
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-50 text-orange-700 border border-orange-100">
                           <Clock size={12} className="mr-1" /> PENDENTE
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteTransacao(t.id)} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'categorias' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900">Gerenciar Categorias</h3>
             <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100">
               <Plus size={14} /> Adicionar Categoria
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {categorias.map(cat => (
               <div key={cat.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.cor || '#CBD5E1' }} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{cat.nome}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{cat.tipo}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
               </div>
             ))}
           </div>
        </div>
      ) : null}
    </div>
  )
}
