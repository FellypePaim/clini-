import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Percent,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { useVerdesk } from '../../hooks/useVerdesk'

export function PerformancePage() {
  const { leads } = useVerdesk()

  // KPI Calculations
  const stats = useMemo(() => {
    const totalLeads = leads.length
    const agendados = leads.filter(l => l.stage === 'Agendado').length
    const conversionRate = totalLeads ? (agendados / totalLeads) * 100 : 0
    
    const totalValue = leads.reduce((acc, l) => acc + l.estimatedValue, 0)
    const avgTicket = totalLeads ? totalValue / totalLeads : 0

    const ovyvaLeads = leads.filter(l => l.origin === 'WhatsApp OVYVA').length
    
    return {
      totalLeads,
      conversionRate: conversionRate.toFixed(1),
      avgTicket,
      ovyvaPercentage: totalLeads ? (ovyvaLeads / totalLeads) * 100 : 0
    }
  }, [leads])

  // Chart Data
  const funnelData = useMemo(() => {
    const stages = ['Perguntou Valor', 'Demonstrou Interesse', 'Quase Fechando', 'Agendado', 'Perdido']
    return stages.map(stage => ({
      name: stage,
      count: leads.filter(l => l.stage === stage).length
    }))
  }, [leads])

  const originData = useMemo(() => {
    const origins = leads.reduce((acc, l) => {
      acc[l.origin] = (acc[l.origin] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(origins).map(([name, value]) => ({ name, value }))
  }, [leads])

  const procedureData = useMemo(() => {
    const proc = leads.reduce((acc, l) => {
      acc[l.procedure] = (acc[l.procedure] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(proc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }, [leads])

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      <header className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/verdesk" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard de Performance</h1>
            <p className="text-slate-500">Métricas e acompanhamento do CRM Verdesk</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Total de Leads</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.totalLeads}</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12% vs mês ant.</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Taxa de Conversão</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Percent size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.conversionRate}%</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Geral</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Ticket Médio</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {stats.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Leads por OVYVA</span>
              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><PieChartIcon size={18} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.ovyvaPercentage.toFixed(0)}%</span>
              <span className="text-xs font-bold text-slate-500">do total gerado</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-2 gap-6">
        
        {/* Funnel Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Funil de Conversão</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Origin Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Leads por Origem</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={originData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {originData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex flex-col gap-3 ml-4">
              {originData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-semibold text-slate-600">{entry.name}</span>
                  <span className="text-sm font-bold text-slate-900 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evolution Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Top 5 Procedimentos mais Procurados</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Geral (Todos os estágios)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procedureData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  )
}
