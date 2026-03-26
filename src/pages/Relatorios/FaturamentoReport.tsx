import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, DollarSign, TrendingDown, TrendingUp, Receipt, Loader2, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  categoria?: string
  paciente_nome?: string
  profissional_nome?: string
  status: 'pago' | 'pendente'
}

interface DiaFaturamento {
  data: string
  valor: number
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
  // Ano atual
  return {
    inicio: new Date(now.getFullYear(), 0, 1),
    fim: new Date(now.getFullYear(), 11, 31),
  }
}

export function FaturamentoReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [periodo, setPeriodo] = useState('mes_atual')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [evolucao, setEvolucao] = useState<DiaFaturamento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    const { inicio, fim } = getPeriodoDates(periodo)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]

    try {
      // Buscar transações reais
      const { data, error } = await supabase
        .from('transacoes' as any)
        .select(`
          id, data_consolidacao, descricao, valor, tipo, status, categoria_id,
          pacientes (nome_completo),
          profiles:profissional_id (nome_completo)
        `)
        .eq('clinica_id', clinicaId)
        .gte('data_consolidacao', inicioStr)
        .lte('data_consolidacao', fimStr)
        .order('data_consolidacao', { ascending: false })

      if (error) throw error

      const mapped: Lancamento[] = (data as any[] || []).map((l: any) => ({
        id: l.id,
        data_consolidacao: l.data_consolidacao,
        descricao: l.descricao || '—',
        valor: Number(l.valor) || 0,
        tipo: l.tipo,
        categoria: l.categoria_id || 'Geral',
        paciente_nome: l.pacientes?.nome_completo ?? null,
        profissional_nome: l.profiles?.nome_completo ?? null,
        status: l.status
      }))

      setLancamentos(mapped)

      // Evolução diária (apenas pagas)
      const pagas = mapped.filter(l => l.status === 'pago' && l.tipo === 'receita')
      const agrupado: Record<string, number> = {}
      pagas.forEach(l => {
        const dia = l.data_consolidacao
        agrupado[dia] = (agrupado[dia] ?? 0) + l.valor
      })

      const evo = Object.entries(agrupado)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([data, valor]) => ({
          data: new Date(data + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor,
        }))

      setEvolucao(evo)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  // KPIs
  const receitaBruta = lancamentos
    .filter(l => l.tipo === 'receita' && l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)
    
  const deducoes = lancamentos
    .filter(l => l.tipo === 'despesa' && l.status === 'pago')
    .reduce((s, l) => s + l.valor, 0)
    
  const receitaLiquida = receitaBruta - deducoes

  const aReceber = lancamentos
    .filter(l => l.tipo === 'receita' && l.status === 'pendente')
    .reduce((s, l) => s + l.valor, 0)

  const exportPDF = () => {
    const doc = new jsPDF()
    const periodoLabel = periodo === 'mes_atual' ? 'Mês Atual' : periodo === 'mes_anterior' ? 'Mês Anterior' : `Ano ${new Date().getFullYear()}`
    doc.setFontSize(16)
    doc.text('Relatório de Faturamento por Período', 14, 18)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)

    autoTable(doc, {
      startY: 32,
      head: [['Data', 'Descrição', 'Categoria', 'Paciente', 'Tipo', 'Status', 'Valor (R$)']],
      body: lancamentos.map(l => [
        new Date(l.data_consolidacao + 'T00:00').toLocaleDateString('pt-BR'),
        l.descricao,
        l.categoria || '—',
        l.paciente_nome || '—',
        l.tipo === 'receita' ? 'Receita' : 'Despesa',
        l.status === 'pago' ? 'Pago' : 'Pendente',
        l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      ]),
      foot: [[
        '', '', '', '', '', 'Receita Líquida',
        receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      ]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 101, 52], fontStyle: 'bold' },
    })

    doc.save(`faturamento-${periodo}.pdf`)
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
              <h1 className="text-2xl font-black text-slate-900 uppercase">Faturamento por Período</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={exportPDF} disabled={isLoading || lancamentos.length === 0} className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-black text-[11px] uppercase tracking-widest text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-50">
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
                  <option value="ano_atual">Todo o Ano {new Date().getFullYear()}</option>
                </select>
             </div>
           </div>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* KPIs Reais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Receita Bruta', valor: receitaBruta, icon: <DollarSign size={20} />, color: 'emerald', sub: 'Pagas e Liquidadas' },
            { label: 'Despesas', valor: deducoes, icon: <TrendingDown size={20} />, color: 'rose', sub: 'Custos Operacionais' },
            { label: 'Saldo Líquido', valor: receitaLiquida, icon: <Receipt size={20} />, color: 'indigo', dark: true, sub: 'Lucro do Período' },
            { label: 'Expectativa', valor: aReceber, icon: <TrendingUp size={20} />, color: 'amber', sub: 'A Receber / Pendentes' },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] ${kpi.dark ? 'bg-indigo-900 border-indigo-900 text-white' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${kpi.dark ? 'text-indigo-200' : 'text-slate-400'}`}>{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.dark ? 'bg-white/10 text-white' : `bg-${kpi.color}-50 text-${kpi.color}-600`}`}>{kpi.icon}</div>
              </div>
              <div>
                <span className="text-3xl font-black block leading-none">
                  {kpi.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
                <p className={`text-[10px] font-bold mt-2 uppercase tracking-wide opacity-60`}>{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico Real */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
             <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Evolução de Receitas</h3>
               <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Consolidação diária de pagamentos recebidos</p>
             </div>
             <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Realizado</span>
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
                 <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                 <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Nenhum dado financeiro consolidado</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="data" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                    tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} 
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: any) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Valor"]}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Listagem Real */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Principais Movimentações</h3>
            <Badge className="bg-emerald-50 text-emerald-700 font-black border-none px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
              {lancamentos.length} Lançamentos
            </Badge>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5">Paciente / Prof</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-300">Carregando...</td></tr>
                ) : lancamentos.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-300 uppercase tracking-widest text-xs">Vazio</td></tr>
                ) : lancamentos.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 font-mono text-[11px] text-slate-400">
                      {new Date(row.data_consolidacao + 'T00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-4 text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{row.descricao}</td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {row.categoria}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">{row.paciente_nome || '—'}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{row.profissional_nome || 'Clínica'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Badge className={cn(
                        "text-[9px] font-black border-none uppercase tracking-widest",
                        row.status === 'pago' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className={`px-8 py-4 text-right ${row.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-500'} font-black`}>
                      {row.tipo === 'despesa' ? '- ' : ''}
                      {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
