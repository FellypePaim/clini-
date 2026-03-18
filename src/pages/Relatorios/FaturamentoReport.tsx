import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Badge } from '../../components/ui/Badge'

export function FaturamentoReport() {
  const [periodo, setPeriodo] = useState('Este mês')

  // Mock KPIs
  const kpis = {
    receitaBruta: 125400,
    deducoes: 15300,
    receitaLiquida: 110100,
    crescimento: 14.5,
  }

  // Evolução Diária (Area Chart) mock
  const evolucaoDiaria = Array.from({ length: 30 }).map((_, i) => {
    const dia = (i + 1).toString().padStart(2, '0');
    // Random variations for a realistic curve
    const base = 3000 + Math.sin(i / 2) * 1500;
    const finalVal = base + Math.random() * 1000;
    return {
      data: `${dia}/03`,
      valor: Math.max(800, Math.floor(finalVal))
    }
  })

  // Mock Detailed Table
  const tableData = [
    { id: '1', data: '18/03/2026', paciente: 'Roberto Carlos', procedimento: 'Implante Dentário', profissional: 'Dr. Carlos Souza', valor: 3500, convenio: 'Particular' },
    { id: '2', data: '18/03/2026', paciente: 'Amanda Silva', procedimento: 'Clareamento a Laser', profissional: 'Dra. Ana Silva', valor: 850, convenio: 'Amil Dental' },
    { id: '3', data: '17/03/2026', paciente: 'Juliana Paes', procedimento: 'Harmonização (Botox)', profissional: 'Dra. Sofia Mendes', valor: 2100, convenio: 'Particular' },
    { id: '4', data: '17/03/2026', paciente: 'Marcos Mion', procedimento: 'Limpeza de Pele', profissional: 'Dra. Ana Silva', valor: 350, convenio: 'Bradesco Saúde' },
    { id: '5', data: '16/03/2026', paciente: 'Fernanda Lima', procedimento: 'Tratamento de Canal', profissional: 'Dr. Marcos Lima', valor: 1200, convenio: 'Sulamérica' },
    { id: '6', data: '16/03/2026', paciente: 'Tiago Leifert', procedimento: 'Restauração Resina', profissional: 'Dra. Ana Silva', valor: 450, convenio: 'Particular' },
    { id: '7', data: '15/03/2026', paciente: 'Fátima Bernardes', procedimento: 'Avaliação Geral', profissional: 'Dr. Carlos Souza', valor: 200, convenio: 'Particular' },
  ]

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
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Faturamento por Período
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
              <Download size={18} /> Resumo Diário
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">Período Fiscal</label>
             <select 
               value={periodo} 
               onChange={(e) => setPeriodo(e.target.value)}
               className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
             >
               <option>Este mês (Março 2026)</option>
               <option>Mês passado (Fevereiro 2026)</option>
               <option>Ano atual (2026)</option>
               <option>Personalizado...</option>
             </select>
           </div>
           
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">Convênio</label>
             <select className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500">
               <option>Todos (Públicos e Particulares)</option>
               <option>Particular Apenas</option>
               <option>Convênios Apenas</option>
             </select>
           </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* KPIs Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Receita Bruta Total</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
            </div>
            <span className="text-4xl font-black text-slate-900 block mb-2">
              {kpis.receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
               <TrendingUp size={16} /> +{kpis.crescimento}% vs. período anterior
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tributos e Glosas</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
            </div>
            <span className="text-4xl font-black text-slate-900 block mb-2">
              {kpis.deducoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-slate-400">
               Representa ~12,2% do faturamento
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-6 rounded-2xl border border-indigo-600 shadow-md text-white relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">Receita Líquida Estimada</span>
              <div className="p-2 bg-black/20 text-indigo-100 rounded-lg"><Receipt size={20} /></div>
            </div>
            <span className="text-4xl font-black text-white block mb-2">
              {kpis.receitaLiquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-indigo-200">
               Valor líquido sem custos operacionais
            </div>
          </div>
        </div>

        {/* Gráfico Analítico (AreaChart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
             <h3 className="text-base font-bold text-slate-800">Evolução do Faturamento Diário</h3>
             <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase tracking-wide">
               Março / 2026
             </span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoDiaria} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} minTickGap={20} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `R$ ${val/1000}k`}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.15)', padding: '12px' }}
                  formatter={(value: any) => [
                    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    "Faturamento"
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detalhamento Tabela */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Lançamentos Recentes (Detail)</h3>
            <Badge className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 border-none">Últimos {tableData.length} registros</Badge>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Procedimento</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Profissional Repasse</th>
                  <th className="px-6 py-4 text-center">Convênio/Origem</th>
                  <th className="px-6 py-4 text-right">Valor Final (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.data}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.procedimento}</td>
                    <td className="px-6 py-4 text-slate-600">{row.paciente}</td>
                    <td className="px-6 py-4 text-indigo-600 font-semibold">{row.profissional}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-widest ${
                        row.convenio === 'Particular' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {row.convenio}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">
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
