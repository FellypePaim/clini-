import React from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Calendar, 
  Users, 
  BarChart3, 
  PieChart, 
  Download,
  Filter,
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

export function SuperFinanceiroPage() {
  const { getFinanceiroStats, isLoading } = useSuperAdmin()
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    async function fetch() {
      const res = await getFinanceiroStats()
      if (res) setData(res)
    }
    fetch()
  }, [getFinanceiroStats])

  const stats = [
    { label: 'MRR Atual', value: `R$ ${(data?.mrr || 0).toLocaleString()}`, trend: '+0.0%', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'ARR Estimado', value: `R$ ${(data?.arr || 0).toLocaleString()}`, trend: '+0.0%', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'LTV Médio', value: `R$ ${(data?.ltv || 0).toLocaleString()}`, trend: '+0.0%', icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Churn Rate', value: `${data?.churn || 0}%`, trend: '-0.0%', icon: PieChart, color: 'text-red-400', bg: 'bg-red-400/10' },
  ]

  const planos = data?.planos || [
    { nome: 'Básico', valor: '0', clinicas: 0, cor: 'bg-slate-500' },
    { nome: 'Trial', valor: '0', clinicas: 0, cor: 'bg-purple-500' }
  ]

  const recentes = data?.recentes || []

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Financeiro da Plataforma</h1>
          <p className="text-slate-400 font-medium">Gestão de MRR, assinaturas e faturamento recorrente.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all">
              <Download size={18} /> Exportar CSV
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 group">
              <Calendar size={18} /> FECHAMENTO DO MÊS
           </button>
        </div>
      </div>

      {/* Grid de KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[32px] group relative overflow-hidden transition-all hover:bg-slate-800/50">
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{stat.label}</p>
                   <div className="flex items-end gap-3">
                      <span className="text-2xl font-black text-white tracking-tight">{stat.value}</span>
                      <span className={cn(
                        "text-[10px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
                        stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      )}>
                        {stat.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {stat.trend}
                      </span>
                   </div>
                </div>
             </div>
             <stat.icon size={120} className="absolute -bottom-8 -right-8 text-slate-700/5 group-hover:scale-110 transition-transform duration-700" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Distribuição por Plano */}
        <div className="space-y-6">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <PieChart size={16} /> DISTRIBUIÇÃO POR PLANO
           </h3>
           <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-center h-48 relative">
                 {/* Fake Donut Chart */}
                 <div className="w-40 h-40 rounded-full border-[24px] border-slate-700 relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[24px] border-purple-500 border-t-transparent border-l-transparent rotate-45" />
                    <div className="absolute inset-0 rounded-full border-[24px] border-indigo-500 border-b-transparent border-l-transparent border-r-transparent -rotate-12" />
                    <div className="flex flex-col items-center">
                       <span className="text-2xl font-black text-white">42</span>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CLÍNICAS</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 {planos.map(p => (
                   <div key={p.nome} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-2 h-2 rounded-full", p.cor)} />
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-white tracking-widest uppercase">{p.nome}</span>
                            <span className="text-[10px] font-bold text-slate-500">R$ {p.valor}/mês</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-sm font-black text-slate-200">{p.clinicas}</span>
                         <span className="text-[10px] font-bold text-slate-500 block">{(p.clinicas/42*100).toFixed(0)}%</span>
                      </div>
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 text-[10px] font-black text-purple-400 hover:text-white uppercase tracking-widest border border-dashed border-purple-500/20 rounded-2xl hover:border-purple-500/40 transition-all">
                 VER TODOS OS PLANOS
              </button>
           </div>
        </div>

        {/* Histórico Recente de Transações */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <CreditCard size={16} /> ÚLTIMAS TRANSAÇÕES
              </h3>
              <div className="flex items-center gap-2">
                 <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"><Filter size={16} /></button>
              </div>
           </div>

           <div className="bg-slate-800/40 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <th className="px-8 py-6">Clínica / Plano</th>
                       <th className="px-8 py-6">Valor</th>
                       <th className="px-8 py-6">Status</th>
                       <th className="px-8 py-6 text-right">Data</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/30">
                    {recentes.map((item) => (
                       <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer">
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-200 group-hover:text-purple-400 transition-colors">{item.clinica}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.plano}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="text-sm font-black text-white">R$ {item.valor}</span>
                          </td>
                          <td className="px-8 py-5">
                             <Badge className={cn(
                               "text-[9px] font-black border-none px-3",
                               item.status === 'pago' ? "bg-emerald-500/10 text-emerald-500" : item.status === 'vencido' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                             )}>
                               {item.status.toUpperCase()}
                             </Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <span className="text-xs font-bold text-slate-400">{item.data}</span>
                                <ArrowRight size={16} className="text-slate-700 group-hover:text-white transition-all group-hover:translate-x-1" />
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              
              <div className="p-6 bg-slate-900/30 border-t border-slate-800/50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <AlertCircle size={14} className="text-amber-500" /> 12 clínicas com vencimento em 7 dias
                 </div>
                 <button className="text-[11px] font-black text-purple-400 hover:text-white transition-colors uppercase tracking-widest">
                   VER TODAS AS COBRANÇAS
                 </button>
              </div>
           </div>

           {/* Gráfico de Faturamento Estimado (Area Chart) */}
           <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 p-8 rounded-[40px] relative overflow-hidden h-[240px] group shadow-2xl">
              <div className="relative z-10 flex flex-col h-full">
                 <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Projeção de Faturamento (30d)</h4>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tighter">R$ 42.150</span>
                    <span className="text-xs font-bold text-emerald-400">+R$ 3.730 projetado</span>
                 </div>
                 
                 <div className="mt-auto flex items-end justify-between gap-1 h-24">
                    {Array.from({ length: 30 }).map((_, i) => (
                       <div 
                         key={i} 
                         className="flex-1 bg-purple-500/40 rounded-t-sm hover:bg-purple-500 transition-all cursor-help" 
                         style={{ height: `${20 + i * 2 + Math.random() * 10}%` }}
                         title={`Dia ${i+1}: R$ ${(i*1.2 + 30).toFixed(1)}K`}
                       />
                    ))}
                 </div>
              </div>
              <BarChart3 className="absolute -bottom-10 -right-10 w-48 h-48 text-purple-500/5 group-hover:scale-110 transition-transform duration-700" />
           </div>
        </div>

      </div>
    </div>
  )
}
