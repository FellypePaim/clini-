import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  PackageCheck,
  ToggleLeft,
  ToggleRight,
  Plus
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { Badge } from '../../components/ui/Badge'

const TIPO_CONFIG = {
  'Entrada': { icon: <ArrowDownRight size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', bgHover: 'hover:bg-emerald-100', textColors: 'text-emerald-700' },
  'Saída': { icon: <ArrowUpRight size={18} />, color: 'text-red-500', bg: 'bg-red-50', bgHover: 'hover:bg-red-100', textColors: 'text-red-700' },
  'Ajuste': { icon: <RefreshCw size={18} />, color: 'text-amber-500', bg: 'bg-amber-50', bgHover: 'hover:bg-amber-100', textColors: 'text-amber-700' }
}

export function MovimentacoesPage() {
  const { getMovimentacoes, consumptionRules, toggleConsumptionRule, products } = useEstoque()
  const movimentos = getMovimentacoes()

  const [activeTab, setActiveTab] = useState<'historico' | 'automacao'>('historico')

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/estoque" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Movimentações 
              <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{movimentos.length} registradas</span>
            </h1>
            <p className="text-slate-500">Histórico de fluxo de estoque e regras de baixa</p>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('historico')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Histórico Cronológico
          </button>
          <button 
            onClick={() => setActiveTab('automacao')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'automacao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Baixas Automáticas (PEP)
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'historico' && (
          <div className="max-w-4xl mx-auto space-y-4">
             {/* Feed Chronological */}
            {movimentos.map(mov => (
              <div key={mov.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border-2 ${TIPO_CONFIG[mov.type].bg} ${TIPO_CONFIG[mov.type].textColors} border-transparent`}>
                   {TIPO_CONFIG[mov.type].icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {mov.quantity}x {mov.productName}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {new Date(mov.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                    <Badge className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border ${TIPO_CONFIG[mov.type].bg} ${TIPO_CONFIG[mov.type].textColors}`}>
                      {mov.type}
                    </Badge>
                    <span className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {mov.reason}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs mt-3 text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                      <User size={14} className="text-slate-400" /> {mov.responsible}
                    </span>
                    {mov.linkedTo && (
                      <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        <PackageCheck size={14} /> ID: {mov.linkedTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'automacao' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
              <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                <RefreshCw size={18} className="text-indigo-600" /> Como funciona?
              </h3>
              <p className="text-sm text-indigo-800/80 font-medium">
                Ao finalizar a evolução clínica que contenha um desses procedimentos,<br/> 
                o estoque será debitado automaticamente.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Procedimento</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {consumptionRules.map(rule => {
                    const product = products.find(p => p.id === rule.productId);
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {rule.procedureName}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium font-mono text-xs text-indigo-600">
                          {product ? product.name : `PROD-${rule.productId}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{rule.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleConsumptionRule(rule.id)}
                            className={`p-1 rounded-full transition-colors ${rule.isActive ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
                          >
                            {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
