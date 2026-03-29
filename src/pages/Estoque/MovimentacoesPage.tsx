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
  Plus,
  X,
  Loader2
} from 'lucide-react'
import { useEstoque } from '../../hooks/useEstoque'
import { Badge } from '../../components/ui/Badge'

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; bgHover: string; textColors: string; label: string }> = {
  'entrada': { icon: <ArrowDownRight size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', bgHover: 'hover:bg-emerald-100', textColors: 'text-emerald-700', label: 'Entrada' },
  'saida': { icon: <ArrowUpRight size={18} />, color: 'text-red-500', bg: 'bg-red-50', bgHover: 'hover:bg-red-100', textColors: 'text-red-700', label: 'Saída' },
  'ajuste': { icon: <RefreshCw size={18} />, color: 'text-amber-500', bg: 'bg-amber-50', bgHover: 'hover:bg-amber-100', textColors: 'text-amber-700', label: 'Ajuste' },
}
const getTipoConfig = (tipo: string) => TIPO_CONFIG[tipo] || TIPO_CONFIG['entrada']

interface NovaRegraForm {
  procedureName: string
  productId: string
  quantity: number
}

export function MovimentacoesPage() {
  const { getMovimentacoes, consumptionRules, toggleConsumptionRule, createConsumptionRule, products } = useEstoque()
  const movimentos = getMovimentacoes()

  const [activeTab, setActiveTab] = useState<'historico' | 'automacao'>('historico')
  const [showNovaRegra, setShowNovaRegra] = useState(false)
  const [novaRegra, setNovaRegra] = useState<NovaRegraForm>({ procedureName: '', productId: '', quantity: 1 })
  const [savingRegra, setSavingRegra] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida' | 'ajuste'>('all')

  const filteredMovimentos = movimentos.filter(mov => {
    const matchesSearch = searchTerm === '' ||
      mov.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || mov.type === filterType
    return matchesSearch && matchesType
  })

  const handleCriarRegra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaRegra.procedureName || !novaRegra.productId) return
    setSavingRegra(true)
    await createConsumptionRule({ procedureName: novaRegra.procedureName, productId: novaRegra.productId, quantity: novaRegra.quantity, isActive: true })
    setSavingRegra(false)
    setShowNovaRegra(false)
    setNovaRegra({ procedureName: '', productId: '', quantity: 1 })
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-4 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/estoque" className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Movimentações</h1>
            <p className="text-[var(--color-text-muted)]">Histórico de fluxo de estoque e regras de baixa</p>
          </div>
        </div>

        <div className="flex border-b border-[var(--color-border)]">
          <button 
            onClick={() => setActiveTab('historico')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'historico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-slate-300'
            }`}
          >
            Histórico Cronológico
          </button>
          <button 
            onClick={() => setActiveTab('automacao')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'automacao' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-slate-300'
            }`}
          >
            Baixas Automáticas (PEP)
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'historico' && (
          <div className="max-w-4xl mx-auto space-y-4">
             {/* Filtros Simplificados */}
             <div className="flex flex-wrap items-center gap-3 mb-6 bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                <input
                  type="text"
                  placeholder="Buscar produto ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm outline-none bg-transparent"
                />
              </div>
              <div className="w-px h-6 bg-[var(--color-border)] mx-2" />
              <button
                onClick={() => setFilterType('all')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg ${filterType === 'all' ? 'text-indigo-700 bg-indigo-100' : 'text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] hover:bg-[var(--color-border)]'}`}>
                <Calendar size={14} /> Todos
              </button>
              {([{ key: 'entrada', label: 'Entrada' }, { key: 'saida', label: 'Saída' }, { key: 'ajuste', label: 'Ajuste' }] as const).map(tipo => (
                <button
                  key={tipo.key}
                  onClick={() => setFilterType(prev => prev === tipo.key ? 'all' : tipo.key as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg ${filterType === tipo.key ? 'text-indigo-700 bg-indigo-100' : 'text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] hover:bg-[var(--color-border)]'}`}>
                  <Filter size={14} /> {tipo.label}
                </button>
              ))}
            </div>

            {/* Feed Chronological */}
            {filteredMovimentos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="w-14 h-14 bg-[var(--color-bg-card)] rounded-2xl flex items-center justify-center mb-4">
                  <ArrowDownRight size={28} className="text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-secondary)] mb-1">Nenhuma movimentação registrada</h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
                  {products.length === 0
                    ? 'Cadastre produtos no Catálogo primeiro. Depois, entradas e saídas aparecerão aqui automaticamente.'
                    : 'Registre entradas e saídas pelo Catálogo de Produtos. O histórico completo aparecerá aqui.'}
                </p>
                {products.length === 0 && (
                  <Link to="/estoque/produtos"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all mt-4">
                    <PackageCheck size={16} /> Ir para o Catálogo
                  </Link>
                )}
              </div>
            )}
            {filteredMovimentos.map(mov => (
              <div key={mov.id} className="bg-[var(--color-bg-card)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border-2 ${getTipoConfig(mov.type).bg} ${getTipoConfig(mov.type).textColors} border-transparent`}>
                   {getTipoConfig(mov.type).icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] truncate">
                      {mov.quantity}x {mov.productName}
                    </h3>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {new Date(mov.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                    <Badge className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border ${getTipoConfig(mov.type).bg} ${getTipoConfig(mov.type).textColors}`}>
                      {getTipoConfig(mov.type).label}
                    </Badge>
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-deep)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                      {mov.reason}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs mt-3 text-[var(--color-text-muted)] font-medium">
                    <span className="flex items-center gap-1.5 bg-[var(--color-bg-card)] px-2 py-1 rounded-md">
                      <User size={14} className="text-[var(--color-text-muted)]" /> {mov.responsible}
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
                <RefreshCw size={18} className="text-indigo-600" /> Como funciona a Baixa Automática?
              </h3>
              <p className="text-sm text-indigo-800/80 font-medium">
                Ao finalizar a "Evolução Clínica" ou "Prontuário" de um paciente informando a realização de um procedimento,<br/>
                o sistema debitará as unidades listadas abaixo de forma automática, vinculando o ID do paciente no histórico.
              </p>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg-deep)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-4">Procedimento Médico</th>
                    <th className="px-6 py-4">Produto a Consumir</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4 text-center">Status Ativação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-sm">
                  {consumptionRules.map(rule => {
                    const product = products.find(p => p.id === rule.productId)
                    return (
                      <tr key={rule.id} className="hover:bg-[var(--color-bg-card-hover)] transition-colors">
                        <td className="px-6 py-4 font-bold text-[var(--color-text-primary)]">
                          {rule.procedureName}
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-secondary)] font-medium font-mono text-xs">
                          {product ? product.name : `PROD-${rule.productId}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-card)] px-2 py-0.5 rounded">{rule.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleConsumptionRule(rule.id)}
                            className={`p-1 rounded-full transition-colors ${rule.isActive ? 'text-emerald-500 hover:text-emerald-600' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]'}`}
                          >
                            {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <button
                        onClick={() => setShowNovaRegra(true)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto"
                      >
                        <Plus size={16} /> Adicionar Nova Regra
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Nova Regra */}
      {showNovaRegra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Nova Regra de Baixa Automática
              </h2>
              <button onClick={() => setShowNovaRegra(false)} className="p-2 hover:bg-[var(--color-bg-card-hover)] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleCriarRegra} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Botox Glabela"
                  value={novaRegra.procedureName}
                  onChange={e => setNovaRegra(r => ({ ...r, procedureName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Produto a Consumir *</label>
                <select
                  required
                  className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] outline-none focus:ring-2 focus:ring-indigo-500"
                  value={novaRegra.productId}
                  onChange={e => setNovaRegra(r => ({ ...r, productId: e.target.value }))}
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Quantidade a Debitar *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] outline-none focus:ring-2 focus:ring-indigo-500"
                  value={novaRegra.quantity}
                  onChange={e => setNovaRegra(r => ({ ...r, quantity: Number(e.target.value) }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNovaRegra(false)}
                  className="flex-1 px-4 py-2.5 font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] hover:bg-[var(--color-border)] rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingRegra}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50">
                  {savingRegra ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {savingRegra ? 'Salvando...' : 'Criar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
