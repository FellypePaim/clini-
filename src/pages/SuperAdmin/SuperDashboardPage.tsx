import React from 'react'
import { 
  Hospital, 
  Users, 
  Users2, 
  Stethoscope, 
  MessageSquare, 
  Bot, 
  Activity, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

export function SuperDashboardPage() {
  const { getPlatformStats } = useSuperAdmin()
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const data = await getPlatformStats()
      if (data) setStats(data)
      setLoading(false)
    }
    load()
  }, [getPlatformStats])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="font-bold tracking-widest text-[10px] uppercase">Sincronizando Dados Reais...</p>
      </div>
    )
  }

  const kpis = [
    { label: 'Clínicas Ativas', value: stats?.clinics?.active || '0', total: stats?.clinics?.total || '0', icon: Hospital, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Clínicas Trial', value: stats?.clinics?.trial || '0', icon: Hospital, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Usuários Totais', value: stats?.users?.total || '0', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Consultas Hoje', value: stats?.appointmentsToday || '0', icon: Stethoscope, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ]

  const alerts: { id: number; type: string; clinica: string; msg: string; time: string }[] = stats?.alerts || []

  const healthData: { name: string; status: string; latency: string; uptime: string }[] = stats?.healthData || []

  return (
    <div className="space-y-10">
      {/* Header com Saudação */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white">Dashboard Global</h1>
        <p className="text-slate-400 font-medium">Monitoramento em tempo real de toda a infraestrutura Prontuário Verde.</p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[32px] shadow-xl hover:bg-slate-800/60 transition-all group overflow-hidden relative">
             <div className="relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", kpi.bg, kpi.color)}>
                  <kpi.icon size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{kpi.label}</p>
                   <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-black text-white">{kpi.value}</span>
                     {kpi.total && <span className="text-xs font-bold text-slate-500 tracking-wider">/ {kpi.total}</span>}
                   </div>
                </div>
             </div>
             {/* Background Decoration */}
             <kpi.icon className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-700/10 group-hover:scale-110 transition-transform duration-500" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atividade das Clínicas */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Activity className="text-purple-400" size={18} /> Atividade Recente das Clínicas
               </h3>
               <button
                 onClick={() => window.location.hash = '#clinicas'}
                 className="text-[10px] font-black text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                 VER TODAS <ChevronRight size={14} />
               </button>
            </div>
            
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-[32px] overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-5">Clínica</th>
                      <th className="px-6 py-5">Pacientes</th>
                      <th className="px-6 py-5">WhatsApp</th>
                      <th className="px-6 py-5">IA Resposta</th>
                      <th className="px-6 py-5 text-right">Saúde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {(stats?.recentClinicsData || [
                      { nome: 'Nenhuma clínica recente', created_at: new Date().toISOString() }
                    ]).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-[10px] text-white">
                                {row.nome.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-300 group-hover:text-purple-400 transition-colors">{row.nome}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-500">{row.pacientes ?? '—'}</td>
                        <td className="px-6 py-4">
                           <Badge className={cn("text-[9px] font-black border-none", row.status_plano === 'suspensa' ? 'bg-red-500/10 text-red-500' : row.status_plano === 'trial' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500')}>
                             {(row.status_plano || 'ativo').toUpperCase()}
                           </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-400">{new Date(row.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <span className={cn("text-xs font-black", row.status_plano === 'suspensa' ? 'text-red-400' : row.status_plano === 'trial' ? 'text-blue-400' : 'text-emerald-400')}>
                                {row.status_plano === 'suspensa' ? 'SUSPENSA' : row.status_plano === 'trial' ? 'TRIAL' : 'ATIVO'}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                 <div className={cn("h-full", row.status_plano === 'suspensa' ? 'bg-red-500 w-[30%]' : row.status_plano === 'trial' ? 'bg-blue-500 w-[60%]' : 'bg-emerald-500 w-full')} />
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
        </div>

        {/* Sidebar: Alertas e Infra */}
        <div className="space-y-8">
            {/* Infra Health */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[32px] space-y-6 shadow-xl">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Saúde da Infra</h3>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
               </div>
               
               <div className="space-y-5">
                 {healthData.length === 0 ? (
                   <p className="text-[10px] font-bold text-slate-600 text-center py-4 uppercase tracking-widest">Dados de infraestrutura indispon&#237;veis</p>
                 ) : healthData.map(h => (
                   <div key={h.name} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold text-slate-400">{h.name}</span>
                         <span className={cn("text-[10px] font-black", h.status === 'Operacional' ? 'text-emerald-400' : 'text-amber-400')}>{h.latency}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-1000", h.status === 'Operacional' ? 'bg-emerald-500 w-[98%]' : 'bg-amber-500 w-[60%]')} />
                         </div>
                         <span className="text-[10px] font-bold text-slate-500 w-10">{h.uptime}</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Eventos Críticos */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle className="text-red-400" size={16} /> Alertas Críticos
              </h3>
              <div className="space-y-3">
                 {alerts.length === 0 && (
                   <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl text-center">
                     <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nenhum alerta no momento</p>
                   </div>
                 )}
                 {alerts.map(alert => (
                   <div key={alert.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex gap-4 hover:border-slate-600 transition-colors cursor-pointer group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-lg",
                        alert.type === 'error' ? 'bg-red-500/10 text-red-500' : alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      )}>
                        {alert.type === 'error' ? <AlertCircle size={20} /> : alert.type === 'warning' ? <Clock size={20} /> : <ExternalLink size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-0.5">
                            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider truncate mr-2">{alert.clinica}</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase shrink-0">{alert.time}</span>
                         </div>
                         <p className="text-xs font-bold text-slate-300 leading-snug group-hover:text-white transition-colors">{alert.msg}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
        </div>
      </div>

      {/* Grid Financeiro & IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                        <DollarSign size={24} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Receita Mensal (MRR)</h3>
                        <p className="text-[10px] font-bold text-indigo-400 tracking-widest">Faturamento recorrente mensal</p>
                     </div>
                  </div>
                   <div className="text-right">
                     <span className="text-4xl font-black text-white">R$ {(stats?.mrr || 0).toLocaleString()}</span>
                     <span className="text-sm font-bold text-slate-400 block -mt-1">Faturamento Estimado</span>
                  </div>
               </div>
               
               <div className="mt-auto pt-8 border-t border-indigo-500/10 grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">CLÍNICAS ATIVAS</span>
                    <span className="text-lg font-black text-emerald-400">{stats?.clinics?.active || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">CHURN</span>
                    <span className="text-lg font-black text-red-400">{stats?.churn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">PROJEÇÃO</span>
                    <span className="text-lg font-black text-white">R$ {((stats?.mrr || 0) * 1.09).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                  </div>
               </div>
            </div>
            <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-500/5 group-hover:scale-110 transition-transform duration-700" />
         </div>

         <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border border-purple-500/20 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                        <Bot size={24} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Uso da Inteligência Artificial</h3>
                        <p className="text-[10px] font-bold text-purple-400 tracking-widest">{(stats?.aiUsage?.calls || 0).toLocaleString()} calls este mês</p>
                     </div>
                  </div>
                   <div className="text-right">
                     <span className="text-4xl font-black text-white font-mono">U$ {(stats?.aiUsage?.cost || 0).toFixed(2)}</span>
                     <span className="text-sm font-bold text-slate-400 block -mt-1">Custo Estimado Gemini</span>
                  </div>
               </div>
               
               <div className="mt-auto pt-8 border-t border-purple-500/10 grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">SOFIA (CHAT)</span>
                    <span className="text-lg font-black text-white">{(stats?.aiUsage?.tokens || 0).toLocaleString()} tokens</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">TOTAL CALLS</span>
                    <span className="text-lg font-black text-white">{(stats?.aiUsage?.calls || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">CUSTO BRL</span>
                    <span className="text-lg font-black text-purple-400">R$ {((stats?.aiUsage?.cost || 0) * 5.8).toFixed(2)}</span>
                  </div>
               </div>
            </div>
            <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-purple-500/5 group-hover:scale-110 transition-transform duration-700" />
         </div>
      </div>
    </div>
  )
}
