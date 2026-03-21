import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, AlertTriangle, Clock, DollarSign, Percent, Loader2, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface Lancamento {
  id: string
  data_consolidacao: string
  descricao: string
  valor: number
  categoria: string
  paciente_nome: string | null
  profissional_nome: string | null
  diasAtraso: number
}

interface AgingBucket {
  faixa: string
  quantidade: number
  valor: number
  cor: string
}

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
  if (periodo === 'trimestre') {
    const trimestre = Math.floor(now.getMonth() / 3)
    return {
      inicio: new Date(now.getFullYear(), trimestre * 3, 1),
      fim: new Date(now.getFullYear(), trimestre * 3 + 3, 0),
    }
  }
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31),
  }
}

function calcularDiasAtraso(dataConsolidacao: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const data = new Date(dataConsolidacao + 'T00:00:00')
  return Math.max(0, Math.floor((today.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)))
}

export function InadimplenciaReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [pendentes, setPendentes] = useState<Lancamento[]>([])
  const [receitaEsperada, setReceitaEsperada] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]

    try {
      const [pendentesRes, totalRes] = await Promise.all([
        supabase
          .from('lancamentos' as any)
          .select('id, data_consolidacao, descricao, valor, categoria, paciente_nome, profissional_nome')
          .eq('clinica_id', clinicaId)
          .eq('tipo', 'receita')
          .eq('status', 'pendente')
          .gte('data_consolidacao', inicioStr)
          .lte('data_consolidacao', fimStr)
          .order('data_consolidacao', { ascending: true }),

        supabase
          .from('lancamentos' as any)
          .select('valor')
          .eq('clinica_id', clinicaId)
          .eq('tipo', 'receita')
          .gte('data_consolidacao', inicioStr)
          .lte('data_consolidacao', fimStr),
      ])

      if (pendentesRes.error) throw pendentesRes.error

      const mapped: Lancamento[] = (pendentesRes.data as any[] || []).map((l: any) => ({
        id: l.id,
        data_consolidacao: l.data_consolidacao,
        descricao: l.descricao || '—',
        valor: Number(l.valor) || 0,
        categoria: l.categoria || 'Geral',
        paciente_nome: l.paciente_nome || null,
        profissional_nome: l.profissional_nome || null,
        diasAtraso: calcularDiasAtraso(l.data_consolidacao),
      }))

      setPendentes(mapped)

      const total = (totalRes.data as any[] || []).reduce((s: number, l: any) => s + (Number(l.valor) || 0), 0)
      setReceitaEsperada(total)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  const totalInadimplente = pendentes.reduce((s, l) => s + l.valor, 0)
  const qtdLancamentos = pendentes.length
  const ticketMedio = qtdLancamentos > 0 ? totalInadimplente / qtdLancamentos : 0
  const pctReceita = receitaEsperada > 0 ? (totalInadimplente / receitaEsperada) * 100 : 0

  const agingBuckets: AgingBucket[] = [
    {
      faixa: 'Até 30d',
      quantidade: pendentes.filter(l => l.diasAtraso <= 30).length,
      valor: pendentes.filter(l => l.diasAtraso <= 30).reduce((s, l) => s + l.valor, 0),
      cor: '#f59e0b',
    },
    {
      faixa: '31–60d',
      quantidade: pendentes.filter(l => l.diasAtraso >= 31 && l.diasAtraso <= 60).length,
      valor: pendentes.filter(l => l.diasAtraso >= 31 && l.diasAtraso <= 60).reduce((s, l) => s + l.valor, 0),
      cor: '#f97316',
    },
    {
      faixa: '61–90d',
      quantidade: pendentes.filter(l => l.diasAtraso >= 61 && l.diasAtraso <= 90).length,
      valor: pendentes.filter(l => l.diasAtraso >= 61 && l.diasAtraso <= 90).reduce((s, l) => s + l.valor, 0),
      cor: '#ef4444',
    },
    {
      faixa: '+90d',
      quantidade: pendentes.filter(l => l.diasAtraso > 90).length,
      valor: pendentes.filter(l => l.diasAtraso > 90).reduce((s, l) => s + l.valor, 0),
      cor: '#7f1d1d',
    },
  ]

  const periodoLabel = periodo === 'mes_atual'
    ? 'Mês Atual'
    : periodo === 'mes_anterior'
    ? 'Mês Anterior'
    : periodo === 'trimestre'
    ? 'Trimestre Atual'
    : `Ano ${new Date().getFullYear()}`

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Inadimplência', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)
    doc.text(
      `Total Inadimplente: ${totalInadimplente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}   % da Receita: ${pctReceita.toFixed(1)}%`,
      14, 34
    )

    autoTable(doc, {
      startY: 42,
      head: [['Descrição', 'Paciente', 'Data Venc.', 'Dias em Atraso', 'Valor']],
      body: pendentes.map(l => [
        l.descricao,
        l.paciente_nome || '—',
        new Date(l.data_consolidacao + 'T00:00').toLocaleDateString('pt-BR'),
        `${l.diasAtraso}d`,
        l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ]),
      foot: [['', '', '', 'TOTAL', totalInadimplente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] },
      footStyles: { fillColor: [254, 242, 242], textColor: [127, 29, 29], fontStyle: 'bold' },
    })

    doc.save(`relatorio-inadimplencia-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function agingColor(dias: number) {
    if (dias <= 30) return 'bg-amber-50 text-amber-700'
    if (dias <= 60) return 'bg-orange-50 text-orange-700'
    if (dias <= 90) return 'bg-red-50 text-red-700'
    return 'bg-red-100 text-red-900'
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Financeiro
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Inadimplência</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || pendentes.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-black text-[11px] uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-50"
            >
              <Download size={16} /> Exportar PDF
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Período de Análise</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest appearance-none"
              >
                <option value="mes_atual">Este Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short' })})</option>
                <option value="mes_anterior">Mês Passado</option>
                <option value="trimestre">Trimestre Atual</option>
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
            { label: 'Total Inadimplente', valor: totalInadimplente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <AlertTriangle size={20} />, color: 'rose', sub: 'Receitas pendentes', dark: true, darkBg: 'bg-rose-900 border-rose-900' },
            { label: 'Qtd. Lançamentos', valor: String(qtdLancamentos), icon: <Clock size={20} />, color: 'amber', sub: 'Cobranças em aberto', dark: false, darkBg: '' },
            { label: 'Ticket Médio', valor: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <DollarSign size={20} />, color: 'indigo', sub: 'Valor médio pendente', dark: false, darkBg: '' },
            { label: '% da Rec. Esperada', valor: `${pctReceita.toFixed(1)}%`, icon: <Percent size={20} />, color: 'rose', sub: 'Taxa de inadimplência', dark: false, darkBg: '' },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] ${kpi.dark ? `${kpi.darkBg} text-white` : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${kpi.dark ? 'text-rose-200' : 'text-slate-400'}`}>{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.dark ? 'bg-white/10 text-white' : `bg-${kpi.color}-50 text-${kpi.color}-600`}`}>{kpi.icon}</div>
              </div>
              <div>
                <span className="text-3xl font-black block leading-none">{kpi.valor}</span>
                <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico de Aging */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Aging — Dias em Atraso</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Segmentação das pendências por tempo de atraso</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-rose-300" />
              </div>
            ) : agingBuckets.every(b => b.quantidade === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl">
                <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="faixa"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => `R$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    labelStyle={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}
                    formatter={((value: any, name: string) => [
                      name === 'valor'
                        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : value,
                      name === 'valor' ? 'Valor' : 'Quantidade',
                    ]) as any}
                  />
                  <Bar dataKey="valor" radius={[12, 12, 0, 0]}>
                    {agingBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Resumo dos buckets */}
          {!isLoading && agingBuckets.some(b => b.quantidade > 0) && (
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-50">
              {agingBuckets.map((b) => (
                <div key={b.faixa} className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.faixa}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{b.quantidade}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                    {b.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabela de Pendentes */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lançamentos Pendentes</h3>
            <Badge className="bg-rose-50 text-rose-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {qtdLancamentos} pendentes
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5">Paciente</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5 text-center">Vencimento</th>
                  <th className="px-8 py-5 text-center">Dias em Atraso</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-300">Carregando...</td></tr>
                ) : pendentes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-10 h-10 text-slate-200" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                      </div>
                    </td>
                  </tr>
                ) : pendentes.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 text-slate-900 text-sm group-hover:text-rose-600 transition-colors">{row.descricao}</td>
                    <td className="px-8 py-4 text-slate-600 text-xs">{row.paciente_nome || '—'}</td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{row.categoria}</span>
                    </td>
                    <td className="px-8 py-4 text-center font-mono text-[11px] text-slate-400">
                      {new Date(row.data_consolidacao + 'T00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={cn('text-[10px] font-black border-none uppercase tracking-widest', agingColor(row.diasAtraso))}>
                        {row.diasAtraso}d
                      </Badge>
                    </td>
                    <td className="px-8 py-4 text-right text-rose-600 font-black">
                      {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
                {pendentes.length > 0 && (
                  <tr className="bg-rose-50/50 font-black">
                    <td colSpan={5} className="px-8 py-4 text-rose-700 text-sm uppercase tracking-widest">Total Inadimplente</td>
                    <td className="px-8 py-4 text-right text-rose-700 font-black">
                      {totalInadimplente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
