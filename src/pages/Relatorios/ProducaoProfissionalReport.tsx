import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Stethoscope,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line
} from 'recharts'

export function ProducaoProfissionalReport() {
  const [periodo, setPeriodo] = useState('Ultimos 30 dias')

  // Mock KPIs
  const kpis = {
    totalAtendimentos: 482,
    receitaBruta: 85400,
    ticketMedio: 177.10,
    taxaRetorno: 64,
  }

  // Mock Chart
  const chartData = [
    { nome: 'Dra. Ana (Geral)', atendimentos: 140, meta: 120 },
    { nome: 'Dr. Carlos (Orto)', atendimentos: 105, meta: 100 },
    { nome: 'Dra. Luiza (Pedo)', atendimentos: 85, meta: 90 },
    { nome: 'Dr. Marcos (Endo)', atendimentos: 62, meta: 60 },
    { nome: 'Dra. Sofia (Harm)', atendimentos: 90, meta: 80 },
  ]

  // Mock Table Data
  const tableData = [
    { profissional: 'Dra. Ana Silva', especialidade: 'Clínica Geral', atendimentos: 140, procedimentos: 180, receita: 25000, taxaRetorno: '70%' },
    { profissional: 'Dr. Carlos Souza', especialidade: 'Ortodontia', atendimentos: 105, procedimentos: 110, receita: 32000, taxaRetorno: '85%' },
    { profissional: 'Dra. Luiza Ramos', especialidade: 'Odontopediatria', atendimentos: 85, procedimentos: 100, receita: 12400, taxaRetorno: '60%' },
    { profissional: 'Dra. Sofia Mendes', especialidade: 'Harmonização', atendimentos: 90, procedimentos: 145, receita: 45000, taxaRetorno: '40%' },
    { profissional: 'Dr. Marcos Lima', especialidade: 'Endodontia', atendimentos: 62, procedimentos: 62, receita: 18000, taxaRetorno: '55%' },
  ].sort((a, b) => b.receita - a.receita)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header Padronizado de Relatórios */}
      <header className="px-6 py-6 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex gap-2 items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> Clínico
              </div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Produção por Profissional
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
              <Download size={18} /> Exportar PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm transition-all">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-end">
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">Período</label>
             <select 
               value={periodo} 
               onChange={(e) => setPeriodo(e.target.value)}
               className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500"
             >
               <option>Hoje</option>
               <option>Esta semana</option>
               <option>Este mês</option>
               <option>Últimos 30 dias</option>
               <option>Mês passado</option>
               <option>Personalizado...</option>
             </select>
           </div>
           
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">Profissional</label>
             <select className="p-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-500">
               <option>Todos os profissionais</option>
               <option>Dra. Ana Silva</option>
               <option>Dr. Carlos Souza</option>
             </select>
           </div>
           
           <button className="flex items-center gap-2 p-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 px-6 h-[46px]">
             Gerar Relatório
           </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* KPIs Resumo */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-indigo-600">
              <Stethoscope size={20} />
            </div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Atendimentos</span>
            <span className="text-3xl font-black text-slate-900">{kpis.totalAtendimentos}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-emerald-600">
              <DollarSign size={20} />
            </div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Receita Gerada</span>
            <span className="text-3xl font-black text-slate-900">{kpis.receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-amber-600">
              <Award size={20} />
            </div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ticket Médio</span>
            <span className="text-3xl font-black text-slate-900">{kpis.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Taxa de Retorno</span>
            <span className="text-3xl font-black text-slate-900">{kpis.taxaRetorno}%</span>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
             <h3 className="text-base font-bold text-slate-800">Volume de Atendimentos vs Meta</h3>
             <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
               <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded-sm"/> Atendimentos Realizados</span>
               <span className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-rose-500 rounded-sm"/> Meta Mensal</span>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="atendimentos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                {/* Simulated Meta Line inside BarChart by using another Bar with minimal width, or just mapping. Using simple Bar with red color for simplicity in mixed charts */}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-slate-200 bg-slate-50">
             <h3 className="text-base font-bold text-slate-800">Detalhamento Analítico</h3>
           </div>
           
           <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Profissional</th>
                <th className="px-6 py-4">Especialidade</th>
                <th className="px-6 py-4 text-center">Atendimentos</th>
                <th className="px-6 py-4 text-center">Procedimentos</th>
                <th className="px-6 py-4 text-center">T. Retorno</th>
                <th className="px-6 py-4 text-right">Receita Gerada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{row.profissional}</td>
                  <td className="px-6 py-4 text-slate-500">{row.especialidade}</td>
                  <td className="px-6 py-4 text-center"><span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-bold">{row.atendimentos}</span></td>
                  <td className="px-6 py-4 text-center text-slate-600">{row.procedimentos}</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-bold">{row.taxaRetorno}</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600">
                    {row.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                <td className="px-6 py-4 uppercase text-xs tracking-widest" colSpan={2}>Total Geral</td>
                <td className="px-6 py-4 text-center">{kpis.totalAtendimentos}</td>
                <td className="px-6 py-4 text-center">597</td>
                <td className="px-6 py-4 text-center text-blue-700">{kpis.taxaRetorno}%</td>
                <td className="px-6 py-4 text-right text-emerald-700">
                   {kpis.receitaBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            </tbody>
           </table>
        </div>

      </main>
    </div>
  )
}
