import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, DollarSign, TrendingDown, TrendingUp, Receipt, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface Lancamento {
  id: string
  data_competencia: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  convenio?: string
  paciente_nome?: string
  profissional_nome?: string
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
  const clinicaId = (user as any)?.user_metadata?.clinica_id
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

    // Buscar lançamentos do período
    const { data } = await supabase
      .from('lancamentos')
      .select(`
        id, data_competencia, descricao, valor, tipo, convenio,
        pacientes (nome_completo),
        profiles (nome_completo)
      `)
      .eq('clinica_id', clinicaId)
      .gte('data_competencia', inicioStr)
      .lte('data_competencia', fimStr)
      .order('data_competencia', { ascending: false })

    const mapped: Lancamento[] = (data ?? []).map((l: any) => ({
      id: l.id,
      data_competencia: l.data_competencia,
      descricao: l.descricao ?? '—',
      valor: l.valor ?? 0,
      tipo: l.tipo,
      convenio: l.convenio ?? 'Particular',
      paciente_nome: l.pacientes?.nome_completo ?? null,
      profissional_nome: l.profiles?.nome_completo ?? null,
    }))

    setLancamentos(mapped)

    // Gerar evolução diária agrupada
    const receitas = mapped.filter(l => l.tipo === 'receita')
    const agrupado: Record<string, number> = {}
    receitas.forEach(l => {
      const dia = l.data_competencia
      agrupado[dia] = (agrupado[dia] ?? 0) + l.valor
    })

    const evo = Object.entries(agrupado)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, valor]) => ({
        data: new Date(data + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        valor,
      }))

    setEvolucao(evo)
    setIsLoading(false)
  }, [clinicaId, periodo])

  useEffect(() => { loadData() }, [loadData])

  // KPIs calculados
  const receitaBruta = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const deducoes = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const receitaLiquida = receitaBruta - deducoes

  const periodoLabels: Record<string, string> = {
    mes_atual: `Mês Atual (${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})`,
    mes_anterior: 'Mês Anterior',
    ano_atual: `Ano Atual (${new Date().getFullYear()})`,
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Financeiro
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Faturamento por Período</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">Período</label>
             <select 
               value={periodo} 
               onChange={(e) => setPeriodo(e.target.value)}
               className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[240px] outline-none focus:ring-2 focus:ring-indigo-500"
             >
               <option value="mes_atual">Este Mês</option>
               <option value="mes_anterior">Mês Passado</option>
               <option value="ano_atual">Ano Atual</option>
             </select>
           </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Receita Bruta', valor: receitaBruta, icon: <DollarSign size={20} />, iconBg: 'bg-emerald-50 text-emerald-600', trend: <><TrendingUp size={16} /> Receitas do período</> },
            { label: 'Despesas / Deduções', valor: deducoes, icon: <TrendingDown size={20} />, iconBg: 'bg-red-50 text-red-600', trend: null },
            { label: 'Receita Líquida', valor: receitaLiquida, icon: <Receipt size={20} />, iconBg: 'bg-indigo-900 text-indigo-100', gradient: true },
          ].map((kpi, i) => (
            <div key={i} className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden ${kpi.gradient ? 'bg-gradient-to-br from-indigo-900 to-indigo-700 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold uppercase tracking-widest ${kpi.gradient ? 'text-indigo-200' : 'text-slate-500'}`}>{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.iconBg}`}>{kpi.icon}</div>
              </div>
              {isLoading ? (
                <div className="h-10 w-32 bg-slate-100 rounded animate-pulse" />
              ) : (
                <span className={`text-4xl font-black block mb-2 ${kpi.gradient ? 'text-white' : 'text-slate-900'}`}>
                  {kpi.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
             <h3 className="text-base font-bold text-slate-800">Evolução Diária de Receitas</h3>
             <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase tracking-wide">
               {periodoLabels[periodo]}
             </span>
          </div>
          {isLoading ? (
            <div className="h-[320px] bg-slate-50 rounded-xl animate-pulse flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            </div>
          ) : evolucao.length === 0 ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-300">
              <DollarSign className="w-12 h-12 mb-2" />
              <p className="font-bold text-slate-400">Nenhum lançamento no período</p>
              <p className="text-xs text-slate-300 mt-1">Registre receitas na tela Financeiro</p>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucao} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `R$${val/1000}k`} />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.15)', padding: '12px' }}
                    formatter={(value: any) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Receita"]}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabela de Lançamentos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Lançamentos do Período</h3>
            {!isLoading && <Badge className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 border-none">{lancamentos.length} registros</Badge>}
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <DollarSign className="w-12 h-12 mb-3 text-slate-200" />
              <p className="font-bold text-sm">Nenhum lançamento no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4 text-center">Tipo</th>
                    <th className="px-6 py-4 text-right">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {lancamentos.slice(0, 50).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {new Date(row.data_competencia + 'T00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{row.descricao}</td>
                      <td className="px-6 py-4 text-slate-600">{row.paciente_nome ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-widest ${
                          row.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {row.tipo}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${row.tipo === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.tipo === 'despesa' ? '- ' : ''}
                        {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
