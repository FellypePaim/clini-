import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, DollarSign, Users, PieChart as PieChartIcon, Loader2, Calendar, ShieldCheck } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface LancamentoConvenio {
  id: string
  data_competencia: string
  descricao: string
  valor: number
  categoria: string
  status: string
}

interface ConvenioItem {
  nome: string
  valor: number
  quantidade: number
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

function getPeriodoDates(periodo: string): { inicio: Date; fim: Date } {
  const now = new Date()
  if (periodo === 'mes_atual') {
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1),
      fim: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  }
  if (periodo === 'mes_anterior') {
    return {
      inicio: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      fim: new Date(now.getFullYear(), now.getMonth(), 0),
    }
  }
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31),
  }
}

export function ConvenioReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [lancamentos, setLancamentos] = useState<LancamentoConvenio[]>([])
  const [conveniosPacientes, setConveniosPacientes] = useState<ConvenioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]

    try {
      const [lancRes, pacRes] = await Promise.all([
        supabase
          .from('lancamentos' as any)
          .select('id, data_competencia, descricao, valor, categoria, status')
          .eq('clinica_id', clinicaId)
          .eq('tipo', 'receita')
          .gte('data_competencia', inicioStr)
          .lte('data_competencia', fimStr)
          .order('data_competencia', { ascending: false }),

        supabase
          .from('pacientes' as any)
          .select('convenio')
          .eq('clinica_id', clinicaId),
      ])

      if (lancRes.error) throw lancRes.error

      const mapped: LancamentoConvenio[] = (lancRes.data as any[] || []).map((l: any) => ({
        id: l.id,
        data_competencia: l.data_competencia,
        descricao: l.descricao || '—',
        valor: Number(l.valor) || 0,
        categoria: l.categoria || 'Geral',
        status: l.status,
      }))

      setLancamentos(mapped)

      // Agrupamento de pacientes por convênio
      const pacientes = (pacRes.data as any[] || [])
      const convenioMap: Record<string, number> = {}
      pacientes.forEach((p: any) => {
        const conv = p.convenio?.trim() || 'Particular'
        convenioMap[conv] = (convenioMap[conv] ?? 0) + 1
      })

      setConveniosPacientes(
        Object.entries(convenioMap)
          .map(([nome, quantidade]) => ({ nome, valor: 0, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
      )
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  // KPIs derivados de lancamentos por categoria
  const receitaTotal = lancamentos.reduce((s, l) => s + l.valor, 0)

  const particular = lancamentos
    .filter(l => (l.categoria || '').toLowerCase().includes('particular') || (l.categoria || '') === 'Geral')
    .reduce((s, l) => s + l.valor, 0)

  const convenio = receitaTotal - particular
  const pctConvenio = receitaTotal > 0 ? (convenio / receitaTotal) * 100 : 0

  // Agrupamento por categoria para o gráfico/tabela
  const categoriaMap: Record<string, { valor: number; quantidade: number }> = {}
  lancamentos.forEach(l => {
    const cat = l.categoria || 'Geral'
    if (!categoriaMap[cat]) categoriaMap[cat] = { valor: 0, quantidade: 0 }
    categoriaMap[cat].valor += l.valor
    categoriaMap[cat].quantidade += 1
  })

  const pieData = Object.entries(categoriaMap)
    .map(([nome, v]) => ({ nome, valor: v.valor, quantidade: v.quantidade }))
    .sort((a, b) => b.valor - a.valor)

  const periodoLabel = periodo === 'mes_atual'
    ? 'Mês Atual'
    : periodo === 'mes_anterior'
    ? 'Mês Anterior'
    : `Ano ${new Date().getFullYear()}`

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Receita por Convênio', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(
      `Receita Total: ${receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}   % Convênio: ${pctConvenio.toFixed(1)}%`,
      14, 34
    )

    autoTable(doc, {
      startY: 42,
      head: [['Categoria / Convênio', 'Qtd. Lançamentos', 'Valor Total']],
      body: pieData.map(r => [
        r.nome,
        String(r.quantidade),
        r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`relatorio-convenios-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-6 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Financeiro
              </div>
              <h1 className="text-2xl font-black text-[var(--color-text-primary)] uppercase">Receita por Convênio</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || lancamentos.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-card)] font-black text-[11px] uppercase tracking-widest text-[var(--color-text-secondary)] rounded-2xl hover:bg-[var(--color-border)] transition-all border border-[var(--color-border)] disabled:opacity-50"
            >
              <Download size={16} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Período de Análise</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs font-black text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest appearance-none"
              >
                <option value="mes_atual">Este Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short' })})</option>
                <option value="mes_anterior">Mês Passado</option>
                <option value="ano_atual">Todo o Ano {new Date().getFullYear()}</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Receita Total', valor: receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <DollarSign size={20} />, color: 'indigo', sub: 'Todas as categorias', dark: true },
            { label: 'Receita Particular', valor: particular.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <DollarSign size={20} />, color: 'emerald', sub: 'Pagamentos diretos', dark: false },
            { label: 'Receita Convênio', valor: convenio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <ShieldCheck size={20} />, color: 'indigo', sub: 'Planos de saúde', dark: false },
            { label: '% Convênio', valor: `${pctConvenio.toFixed(1)}%`, icon: <Users size={20} />, color: 'amber', sub: 'Da receita total', dark: false },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] ${kpi.dark ? 'bg-indigo-900 border-indigo-900 text-white' : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${kpi.dark ? 'text-indigo-200' : 'text-[var(--color-text-muted)]'}`}>{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.dark ? 'bg-[var(--color-bg-card)]/10 text-white' : `bg-${kpi.color}-50 text-${kpi.color}-600`}`}>{kpi.icon}</div>
              </div>
              <div>
                <span className="text-3xl font-black block leading-none">{kpi.valor}</span>
                <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico PieChart + Pacientes por Convênio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PieChart Receita */}
          <div className="bg-[var(--color-bg-card)] p-8 rounded-[32px] border border-[var(--color-border)] shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Distribuição de Receita</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1 uppercase tracking-tight">Por categoria de lançamento</p>
            </div>

            <div className="h-[320px]">
              {isLoading ? (
                <div className="h-full w-full bg-[var(--color-bg-deep)] rounded-3xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-dim)] border-2 border-dashed border-slate-50 rounded-3xl">
                  <PieChartIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-black text-[var(--color-text-muted)] uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      formatter={(value: any) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Receita']}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pacientes por Convênio */}
          <div className="bg-[var(--color-bg-card)] p-8 rounded-[32px] border border-[var(--color-border)] shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Pacientes por Convênio</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1 uppercase tracking-tight">Distribuição da base de pacientes</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                </div>
              ) : conveniosPacientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <Users className="w-10 h-10 text-slate-200" />
                  <p className="font-black text-[var(--color-text-dim)] uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                </div>
              ) : conveniosPacientes.map((c, i) => {
                const totalPac = conveniosPacientes.reduce((s, x) => s + x.quantidade, 0)
                const pct = totalPac > 0 ? (c.quantidade / totalPac) * 100 : 0
                return (
                  <div key={c.nome} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-[var(--color-text-secondary)] uppercase tracking-wide">{c.nome}</span>
                        <span className="text-[10px] font-black text-[var(--color-text-muted)]">{c.quantidade} pac.</span>
                      </div>
                      <div className="w-full bg-[var(--color-bg-card)] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[var(--color-text-muted)] w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-[var(--color-bg-card)] rounded-[32px] border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Detalhamento por Categoria</h3>
            <Badge className="bg-indigo-50 text-indigo-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {pieData.length} categorias
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-bg-card)] border-b border-slate-50 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5 text-center">Qtd. Lançamentos</th>
                  <th className="px-8 py-5 text-center">% do Total</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-[var(--color-text-dim)]">Carregando...</td></tr>
                ) : pieData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <DollarSign className="w-10 h-10 text-slate-200" />
                        <p className="font-black text-[var(--color-text-dim)] uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                      </div>
                    </td>
                  </tr>
                ) : pieData.map((row, i) => (
                  <tr key={row.nome} className="hover:bg-[var(--color-bg-card-hover)]/50 transition-colors group">
                    <td className="px-8 py-4 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className={cn('text-[var(--color-text-primary)] text-sm group-hover:text-indigo-600 transition-colors')}>{row.nome}</span>
                    </td>
                    <td className="px-8 py-4 text-center text-[var(--color-text-muted)] text-sm">{row.quantidade}</td>
                    <td className="px-8 py-4 text-center">
                      <Badge className="bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-black border-none text-[10px] uppercase tracking-widest">
                        {receitaTotal > 0 ? ((row.valor / receitaTotal) * 100).toFixed(1) : '0.0'}%
                      </Badge>
                    </td>
                    <td className="px-8 py-4 text-right text-emerald-600 font-black">
                      {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
                {pieData.length > 0 && (
                  <tr className="bg-[var(--color-bg-deep)] font-black">
                    <td className="px-8 py-4 text-[var(--color-text-primary)] text-sm uppercase tracking-widest">Total</td>
                    <td className="px-8 py-4 text-center text-[var(--color-text-secondary)]">{lancamentos.length}</td>
                    <td className="px-8 py-4 text-center text-[var(--color-text-secondary)]">100%</td>
                    <td className="px-8 py-4 text-right text-emerald-700 font-black">
                      {receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
