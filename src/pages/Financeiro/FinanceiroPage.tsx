import React, { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown,
  Plus, X, Loader2, Check, Trash2, Filter
} from 'lucide-react'
import { useFinanceiro, type NovoLancamento } from '../../hooks/useFinanceiro'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'

const DEFAULT_CATEGORIAS_RECEITA = ['Consulta', 'Procedimento', 'Convênio', 'Particular', 'Outros']
const DEFAULT_CATEGORIAS_DESPESA = ['Salário', 'Aluguel', 'Materiais', 'Marketing', 'Impostos', 'Outros']

const STATUS_CONFIG = {
  pago: { label: 'Pago', cls: 'bg-emerald-100 text-emerald-700' },
  pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-600' },
}

const formVazio: NovoLancamento = {
  descricao: '',
  valor: 0,
  tipo: 'receita',
  categoria: 'Consulta',
  data_competencia: new Date().toISOString().split('T')[0],
  status: 'pago',
}

export function FinanceiroPage() {
  const { lancamentos, isLoading, totais, loadLancamentos, createLancamento, updateLancamentoStatus, deleteLancamento } = useFinanceiro()
  const clinicaId = useAuthStore(state => state.user?.clinicaId)
  const [categoriasReceita, setCategoriasReceita] = useState(DEFAULT_CATEGORIAS_RECEITA)
  const [categoriasDespesa, setCategoriasDespesa] = useState(DEFAULT_CATEGORIAS_DESPESA)
  const [activeTab, setActiveTab] = useState<'receita' | 'despesa' | 'todos'>('todos')
  const [showModal, setShowModal] = useState(false)

  // Carregar categorias customizadas da config da clínica
  useEffect(() => {
    if (!clinicaId) return
    supabase.from('clinicas').select('configuracoes').eq('id', clinicaId).single().then(({ data }) => {
      const fin = (data?.configuracoes as any)?.financeiro
      if (fin?.categorias_receita?.length) setCategoriasReceita(fin.categorias_receita)
      if (fin?.categorias_despesa?.length) setCategoriasDespesa(fin.categorias_despesa)
    })
  }, [clinicaId])
  const [form, setForm] = useState<NovoLancamento>(formVazio)
  const [saving, setSaving] = useState(false)
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await createLancamento(form)
    setSaving(false)
    setShowModal(false)
    setForm(formVazio)
  }

  const handleFiltrarMes = () => {
    const [ano, mes] = filterMes.split('-').map(Number)
    const inicio = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
    const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
    loadLancamentos(inicio, fim)
  }

  const filtered = lancamentos.filter(l => activeTab === 'todos' || l.tipo === activeTab)

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-5 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={26} /> Financeiro
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-0.5">Fluxo de caixa, receitas e despesas da clínica</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Receitas</p>
              <p className="text-2xl font-black text-emerald-700">
                {totais.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Despesas</p>
              <p className="text-2xl font-black text-red-600">
                {totais.despesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className={`rounded-2xl border p-4 flex items-center gap-4 ${totais.receita - totais.despesa >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${totais.receita - totais.despesa >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
              <DollarSign size={22} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${totais.receita - totais.despesa >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>Saldo Líquido</p>
              <p className={`text-2xl font-black ${totais.receita - totais.despesa >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                {(totais.receita - totais.despesa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="flex border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-bg-card)] shadow-sm">
            {(['todos', 'receita', 'despesa'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-bold transition-colors capitalize ${activeTab === t ? 'bg-slate-800 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card-hover)]'}`}>
                {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)}
              className="p-2 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleFiltrarMes} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <Filter size={14} /> Filtrar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-[var(--color-text-muted)]">
              <DollarSign className="w-14 h-14 mb-3 text-slate-200" />
              <p className="font-bold text-lg">Nenhum lançamento no período</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                Registrar primeiro lançamento
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-deep)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-sm font-medium">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-[var(--color-bg-card-hover)] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(l.data_competencia + 'T00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--color-text-primary)]">{l.descricao}</p>
                      {l.paciente_nome && <p className="text-xs text-[var(--color-text-muted)]">{l.paciente_nome}</p>}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">{l.categoria}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={`border-none text-[10px] uppercase font-bold tracking-widest ${STATUS_CONFIG[l.status].cls}`}>
                        {STATUS_CONFIG[l.status].label}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {l.tipo === 'despesa' ? '- ' : ''}{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {l.status === 'pendente' && (
                          <button onClick={() => updateLancamentoStatus(l.id, 'pago')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Marcar como pago">
                            <Check size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteLancamento(l.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal Novo Lançamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Novo Lançamento
              </h2>
              <button onClick={() => { setShowModal(false); setForm(formVazio) }} className="p-2 hover:bg-[var(--color-bg-card-hover)] rounded-lg">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div className="flex gap-2">
                {(['receita', 'despesa'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t, categoria: t === 'receita' ? 'Consulta' : 'Salário' }))}
                    className={`flex-1 py-2.5 font-bold rounded-xl transition-colors ${form.tipo === t
                      ? t === 'receita' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}>
                    {t === 'receita' ? 'Receita' : 'Despesa'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Descrição *</label>
                <input type="text" required className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Consulta Dr. Ana, Aluguel..."
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Valor (R$) *</label>
                  <input type="number" required min={0} step={0.01} className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.valor} onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Data *</label>
                  <input type="date" required className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.data_competencia} onChange={e => setForm(f => ({ ...f, data_competencia: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Categoria</label>
                  <select className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {(form.tipo === 'receita' ? categoriasReceita : categoriasDespesa).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
                  <select className="w-full p-2.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(formVazio) }}
                  className="flex-1 px-4 py-2.5 font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] hover:bg-[var(--color-border)] rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
