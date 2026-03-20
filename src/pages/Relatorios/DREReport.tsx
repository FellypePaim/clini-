import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, BarChart2, Loader2, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface Lancamento {
  id: string
  data_consolidacao: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  status: string
}

interface EvolucaoPeriodo {
  label: string
  receita: number
  despesa: number
}

interface CategoriaAgrupada {
  categoria: string
  tipo: 'receita' | 'despesa'
  valor: number
  quantidade: number
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

function agruparPorSemana(lancamentos: Lancamento[]): EvolucaoPeriodo[] {
  const semanaMap: Record<string, { receita: number; despesa: number }> = {}

  lancamentos.forEach(l => {
    const date = new Date(l.data_consolidacao + 'T00:00')
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const label = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

    if (!semanaMap[label]) semanaMap[label] = { receita: 0, despesa: 0 }
    if (l.tipo === 'receita') semanaMap[label].receita += l.valor
    else semanaMap[label].despesa += l.valor
  })

  return Object.entries(semanaMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({ label, receita: v.receita, despesa: v.despesa }))
}

export function DREReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]

    try {
      const { data, error } = await supabase
        .from('lancamentos' as any)
        .select('id, data_consolidacao, descricao, valor, tipo, categoria, status')
        .eq('clinica_id', clinicaId)
        .gte('data_consolidacao', inicioStr)
        .lte('data_consolidacao', fimStr)
        .order('data_consolidacao', { ascending: true })

      if (error) throw error

      setLancamentos(
        (data as any[] || []).map((l: any) => ({
          id: l.id,
          data_consolidacao: l.data_consolidacao,
          descricao: l.descricao || '—',
          valor: Number(l.valor) || 0,
          tipo: l.tipo,
          categoria: l.categoria || 'Geral',
          status: l.status,
        }))
      )
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  // KPIs
  const receitaBruta = lancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((s, l) => s + l.valor, 0)

  const totalDespesas = lancamentos
    .filter(l => l.tipo === 'despesa')
    .reduce((s, l) => s + l.valor, 0)

  const resultado = receitaBruta - totalDespesas
  const margem = receitaBruta > 0 ? (resultado / receitaBruta) * 100 : 0

  // Evolução semanal
  const evolucao = agruparPorSemana(lancamentos)

  // Agrupamento por categoria
  const categoriaMap: Record<string, { tipo: 'receita' | 'despesa'; valor: number; quantidade: number }> = {}
  lancamentos.forEach(l => {
    const key = `${l.tipo}__${l.categoria}`
    if (!categoriaMap[key]) categoriaMap[key] = { tipo: l.tipo, valor: 0, quantidade: 0 }
    categoriaMap[key].valor += l.valor
    categoriaMap[key].quantidade += 1
  })

  const categorias: CategoriaAgrupada[] = Object.entries(categoriaMap)
    .map(([key, v]) => ({
      categoria: key.split('__')[1],
      tipo: v.tipo,
      valor: v.valor,
      quantidade: v.quantidade,
    }))
    .sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'receita' ? -1 : 1
      return b.valor - a.valor
    })

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
    doc.text('DRE Simplificado', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)
    doc.setFontSize(11)

    const linhasDRE: string[][] = []

    linhasDRE.push(['RECEITAS', '', ''])
    const receitas = categorias.filter(c => c.tipo === 'receita')
    receitas.forEach(c => {
      linhasDRE.push([`  ${c.categoria}`, String(c.quantidade), c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })])
    })
    linhasDRE.push(['Receita Bruta Total', '', receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })])
    linhasDRE.push(['', '', ''])

    linhasDRE.push(['DESPESAS', '', ''])
    const despesas = categorias.filter(c => c.tipo === 'despesa')
    despesas.forEach(c => {
      linhasDRE.push([`  ${c.categoria}`, String(c.quantidade), `(${c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`])
    })
    linhasDRE.push(['Total de Despesas', '', `(${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`])
    linhasDRE.push(['', '', ''])

    linhasDRE.push([resultado >= 0 ? 'LUCRO LÍQUIDO' : 'PREJUÍZO LÍQUIDO', '', resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })])
    linhasDRE.push(['Margem Líquida', '', `${margem.toFixed(1)}%`])

    autoTable(doc, {
      startY: 34,
      head: [['Descrição', 'Qtd.', 'Valor']],
      body: linhasDRE,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
      didParseCell: (data) => {
        const val = data.row.raw as string[]
        if (val[0] === 'RECEITAS' || val[0] === 'DESPESAS') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
        }
        if (val[0]?.includes('LUCRO') || val[0]?.includes('PREJUÍZO')) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = resultado >= 0 ? [240, 253, 244] : [254, 242, 242]
          data.cell.styles.textColor = resultado >= 0 ? [22, 101, 52] : [127, 29, 29]
        }
      },
    })

    doc.save(`relatorio-dre-${new Date().toISOString().split('T')[0]}.pdf`)
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
              <h1 className="text-2xl font-black text-slate-900 uppercase">DRE Simplificado</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={isLoading || lancamentos.length === 0}
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
          <div className="p-6 rounded-3xl border shadow-sm bg-white border-slate-100 flex flex-col justify-between h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Receita Bruta</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={20} /></div>
            </div>
            <div>
              <span className="text-3xl font-black block leading-none">
                {receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">Total de Receitas</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl border shadow-sm bg-white border-slate-100 flex flex-col justify-between h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Total Despesas</span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600"><TrendingDown size={20} /></div>
            </div>
            <div>
              <span className="text-3xl font-black block leading-none">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">Custos do Período</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between h-[160px] ${resultado >= 0 ? 'bg-emerald-900 border-emerald-900 text-white' : 'bg-rose-900 border-rose-900 text-white'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${resultado >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                {resultado >= 0 ? 'Lucro Líquido' : 'Prejuízo Líquido'}
              </span>
              <div className="p-2.5 rounded-xl bg-white/10 text-white">
                <DollarSign size={20} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black block leading-none">
                {Math.abs(resultado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">Resultado do Período</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl border shadow-sm bg-white border-slate-100 flex flex-col justify-between h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Margem Líquida</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><BarChart2 size={20} /></div>
            </div>
            <div>
              <span className={`text-3xl font-black block leading-none ${margem >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {margem.toFixed(1)}%
              </span>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60">Sobre a Receita Bruta</p>
            </div>
          </div>
        </div>

        {/* Gráfico Evolução */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Receitas vs. Despesas</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Evolução semanal comparativa no período</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Despesas</span>
              </div>
            </div>
          </div>

          <div className="h-[360px] w-full">
            {isLoading ? (
              <div className="h-full w-full bg-slate-50 rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
              </div>
            ) : evolucao.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-3xl">
                <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
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
                    formatter={(value: any, name: string) => [
                      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                      name === 'receita' ? 'Receita' : 'Despesa',
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    formatter={(value) => value === 'receita' ? 'Receitas' : 'Despesas'}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                  <Area type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesa)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tabela DRE Estruturada */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Estrutura DRE por Categoria</h3>
            <Badge className="bg-slate-100 text-slate-600 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {lancamentos.length} Lançamentos
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5 text-center">Qtd.</th>
                  <th className="px-8 py-5 text-center">% Participação</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-300">Carregando...</td></tr>
                ) : categorias.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <BarChart2 className="w-10 h-10 text-slate-200" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Nenhum dado encontrado para o período selecionado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Seção Receitas */}
                    <tr className="bg-emerald-50/60">
                      <td colSpan={4} className="px-8 py-3 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        Receitas
                      </td>
                    </tr>
                    {categorias.filter(c => c.tipo === 'receita').map((row) => (
                      <tr key={`rec-${row.categoria}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 text-slate-700 text-sm pl-12 group-hover:text-emerald-600 transition-colors">{row.categoria}</td>
                        <td className="px-8 py-4 text-center text-slate-500 text-sm">{row.quantidade}</td>
                        <td className="px-8 py-4 text-center">
                          <Badge className="bg-emerald-50 text-emerald-600 font-black border-none text-[10px] uppercase tracking-widest">
                            {receitaBruta > 0 ? ((row.valor / receitaBruta) * 100).toFixed(1) : '0.0'}%
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right text-emerald-600 font-black">
                          {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-black border-t border-emerald-100">
                      <td className="px-8 py-4 text-emerald-800 text-sm uppercase tracking-widest">Receita Bruta Total</td>
                      <td className="px-8 py-4 text-center text-emerald-700">
                        {categorias.filter(c => c.tipo === 'receita').reduce((s, c) => s + c.quantidade, 0)}
                      </td>
                      <td className="px-8 py-4 text-center text-emerald-700">100%</td>
                      <td className="px-8 py-4 text-right text-emerald-800 font-black text-base">
                        {receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>

                    {/* Seção Despesas */}
                    <tr className="bg-rose-50/60">
                      <td colSpan={4} className="px-8 py-3 text-[10px] font-black text-rose-700 uppercase tracking-widest">
                        Despesas
                      </td>
                    </tr>
                    {categorias.filter(c => c.tipo === 'despesa').map((row) => (
                      <tr key={`desp-${row.categoria}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 text-slate-700 text-sm pl-12 group-hover:text-rose-600 transition-colors">{row.categoria}</td>
                        <td className="px-8 py-4 text-center text-slate-500 text-sm">{row.quantidade}</td>
                        <td className="px-8 py-4 text-center">
                          <Badge className="bg-rose-50 text-rose-600 font-black border-none text-[10px] uppercase tracking-widest">
                            {receitaBruta > 0 ? ((row.valor / receitaBruta) * 100).toFixed(1) : '0.0'}%
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right text-rose-500 font-black">
                          ({row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-rose-50 font-black border-t border-rose-100">
                      <td className="px-8 py-4 text-rose-800 text-sm uppercase tracking-widest">Total de Despesas</td>
                      <td className="px-8 py-4 text-center text-rose-700">
                        {categorias.filter(c => c.tipo === 'despesa').reduce((s, c) => s + c.quantidade, 0)}
                      </td>
                      <td className="px-8 py-4 text-center text-rose-700">
                        {receitaBruta > 0 ? ((totalDespesas / receitaBruta) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td className="px-8 py-4 text-right text-rose-800 font-black text-base">
                        ({totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </td>
                    </tr>

                    {/* Resultado Final */}
                    <tr className={cn(
                      'font-black border-t-2',
                      resultado >= 0 ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200'
                    )}>
                      <td className={cn('px-8 py-5 text-sm uppercase tracking-widest', resultado >= 0 ? 'text-emerald-900' : 'text-rose-900')}>
                        {resultado >= 0 ? 'Lucro Líquido do Período' : 'Prejuízo Líquido do Período'}
                      </td>
                      <td className="px-8 py-5" />
                      <td className={cn('px-8 py-5 text-center', resultado >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                        Margem: {margem.toFixed(1)}%
                      </td>
                      <td className={cn('px-8 py-5 text-right text-lg font-black', resultado >= 0 ? 'text-emerald-800' : 'text-rose-800')}>
                        {resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
