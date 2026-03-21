import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Target, Users, TrendingUp, AlertTriangle, ArrowDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface FunilData {
  stage: string
  count: number
  value: number
  color: string
}

const STAGES_ORDER = [
  { key: 'perguntou_valor', label: 'Perguntou Valor', color: '#94a3b8' },
  { key: 'demonstrou_interesse', label: 'Interesse', color: '#6366f1' },
  { key: 'quase_fechando', label: 'Quase Fechando', color: '#8b5cf6' },
  { key: 'agendado', label: 'Agendado ✓', color: '#10b981' },
  { key: 'perdido', label: 'Perdido', color: '#f43f5e' }
]

export function FunilLeadsReport() {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const [data, setData] = useState<FunilData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!clinicaId) return
    setIsLoading(true)

    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('estagio, valor_estimado')
        .eq('clinica_id', clinicaId)

      if (error) throw error

      const counts = (leads || []).reduce((acc: any, lead: any) => {
        acc[lead.estagio] = (acc[lead.estagio] || 0) + 1
        acc[lead.estagio + '_val'] = (acc[lead.estagio + '_val'] || 0) + (Number(lead.valor_estimado) || 0)
        return acc
      }, {})

      const funil = STAGES_ORDER.map(s => ({
        stage: s.label,
        count: counts[s.key] || 0,
        value: counts[s.key + '_val'] || 0,
        color: s.color
      }))

      setData(funil)
    } catch (err) {
      console.error('Erro ao carregar funil:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clinicaId])

  useEffect(() => { loadData() }, [loadData])

  const totalLeads = data.reduce((s, d) => s + d.count, 0)
  const agendados = data.find(d => d.stage === 'Agendado ✓')?.count || 0
  const conversao = totalLeads > 0 ? (agendados / totalLeads) * 100 : 0
  const pipelineValue = data.filter(d => d.stage !== 'Perdido').reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/relatorios" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
               <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Relatórios <ArrowLeft size={10} className="rotate-180" /> CRM
              </div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Funil de Conversão Leads</h1>
            </div>
          </div>
          
          <button
            onClick={() => {
              const header = 'Estágio,Quantidade,Valor (R$)\n'
              const rows = data.map(d => `${d.stage},${d.count},${d.value.toFixed(2)}`).join('\n')
              const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'funil_leads.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
             <Download size={16} /> Exportar
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* KPIs Funil */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de Leads', valor: totalLeads, icon: <Users size={20} />, color: 'slate' },
            { label: 'Taxa de Conversão', valor: `${conversao.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'emerald' },
            { label: 'Pipeline Ativo', valor: pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: <Target size={20} />, color: 'indigo' },
            { label: 'Gargalo Principal', valor: 'Orçamento', icon: <AlertTriangle size={20} />, color: 'amber' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-600`}>{kpi.icon}</div>
              </div>
              <span className="text-3xl font-black text-slate-900 block">{kpi.valor}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Visualização de Funil */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Fluxo de Maturação (Leads)</h3>
             
             <div className="space-y-4">
               {isLoading ? (
                  <div className="h-[400px] animate-pulse bg-slate-50 rounded-3xl" />
               ) : data.filter(d => d.stage !== 'Perdido').map((step, idx) => {
                 const percentage = totalLeads > 0 ? (step.count / totalLeads) * 100 : 0
                 return (
                   <div key={step.stage} className="relative">
                      <div 
                        className="h-16 rounded-2xl flex items-center justify-between px-6 transition-all hover:scale-[1.01] cursor-default"
                        style={{ 
                          width: `${Math.max(40, 100 - (idx * 15))}%`, 
                          backgroundColor: step.color + '15',
                          border: `2px solid ${step.color}30`
                        }}
                      >
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black shadow-sm" style={{ color: step.color }}>{idx + 1}</span>
                           <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{step.stage}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-sm font-black text-slate-900">{step.count} leads</span>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{percentage.toFixed(0)}% do total</p>
                        </div>
                      </div>
                      {idx < 3 && (
                        <div className="flex justify-center w-full my-1 opacity-20">
                          <ArrowDown size={14} className="text-slate-400" />
                        </div>
                      )}
                   </div>
                 )
               })}
             </div>
          </div>

          {/* Breakdown Financeiro do Funil */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Volume Financeiro (R$)</h3>
             
             <div className="flex-1">
                {isLoading ? (
                  <div className="h-full animate-pulse bg-slate-50 rounded-3xl" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.filter(d => d.stage !== 'Perdido')}>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="stage" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        formatter={(val: any) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      />
                      <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
             </div>

             <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                {data.filter(d => d.stage !== 'Perdido').map(step => (
                  <div key={step.stage} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
                       <span className="font-bold text-slate-500 uppercase tracking-tight">{step.stage}</span>
                    </div>
                    <span className="font-black text-slate-900">{step.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
