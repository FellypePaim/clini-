import React from 'react'
import { 
  Bot, 
  Zap, 
  Cpu, 
  Coins, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Settings2,
  Lock,
  MessageSquare,
  Sparkles,
  Command,
  ArrowRight,
  DollarSign,
  Activity
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

export function SuperIAPage() {
  const { getIaStats, isLoading } = useSuperAdmin()
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    async function fetch() {
      const res = await getIaStats()
      if (res) setData(res)
    }
    fetch()
  }, [getIaStats])

  const kpis = [
    { label: 'Tokens Totais (Mês)', value: `${((data?.calls || 0) * 10).toLocaleString()}`, trend: '+0%', icon: BrainCircuit || Bot, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Custo Est. (BRL)', value: `R$ ${(data?.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, trend: '+0%', icon: Coins || DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Tempo Médio Resp.', value: '1.2s', trend: '-0%', icon: Zap || Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Taxa de Sucesso', value: '100%', trend: 'Estável', icon: Sparkles || Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  const actions = data?.models || []

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Monitoramento de IA</h1>
          <p className="text-slate-400 font-medium">Controle de consumo, custos e performance das redes neurais (Gemini Pro).</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2">
              <Cpu className="text-purple-400" size={18} />
              <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">GEMINI-2.5-FLASH</span>
           </div>
           <a
             href="/superadmin/configuracoes"
             className="p-3 bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white rounded-xl transition-all">
              <Settings2 size={20} />
           </a>
        </div>
      </div>

      {/* KPIs da IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon || Bot;
          return (
            <div key={kpi.label} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[32px] group relative overflow-hidden transition-all hover:bg-slate-800/50 shadow-xl">
               <div className="relative z-10">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", kpi.bg, kpi.color)}>
                    <Icon size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{kpi.label}</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{kpi.value}</span>
                        <span className={cn("text-[10px] font-black", kpi.trend.startsWith('+') ? 'text-purple-400' : 'text-emerald-400')}>{kpi.trend}</span>
                     </div>
                  </div>
               </div>
               <Icon size={120} className="absolute -bottom-8 -right-8 text-slate-700/5 group-hover:scale-110 transition-transform duration-700" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Consumo por Action */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <BarChart3 size={16} /> CONSUMO POR FUNCIONALIDADE (30D)
           </h3>
           <div className="bg-slate-800/40 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <th className="px-8 py-6">Funcionalidade / Action</th>
                       <th className="px-8 py-6">Chamadas</th>
                       <th className="px-8 py-6">Tokens</th>
                       <th className="px-8 py-6 text-right">Custo</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/30">
                    {actions.map((item: any) => (
                       <tr key={item.action} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900/50 rounded-xl text-slate-500 group-hover:text-purple-400 transition-colors">
                                   {(() => { const Icon = item.icon || Bot || Cpu; return <Icon size={18} />; })()}
                                </div>
                                <span className="text-sm font-black text-slate-200 uppercase tracking-widest">{item.action || item.nome}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 font-bold text-slate-400">{item.calls}</td>
                          <td className="px-8 py-5 font-bold text-slate-400">{item.tokens}</td>
                          <td className="px-8 py-5 text-right font-black text-white">{item.cost}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Ranking de Clínicas (Mais gastão) */}
           {(data?.topClinics?.length > 0) && (
           <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 🏆 MAIOR CONSUMO POR CLÍNICA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {(data?.topClinics || []).slice(0, 3).map((c: any, idx: number) => {
                   const colors = ['bg-red-500', 'bg-emerald-500', 'bg-blue-500']
                   const maxTokens = data.topClinics[0]?.tokens || 1
                   const pct = Math.round((c.tokens / maxTokens) * 100)
                   return (
                   <div key={c.nome || c.name || idx} className="bg-slate-800/20 border border-slate-700/30 p-5 rounded-3xl relative overflow-hidden group">
                      <div className="relative z-10">
                         <h4 className="text-xs font-black text-white mb-1 uppercase tracking-widest">{c.nome || c.name}</h4>
                         <p className="text-lg font-black text-slate-300 mb-3">{c.tokens?.toLocaleString() || '0'} tokens</p>
                         <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase mb-1">
                            <span>Uso Relativo</span>
                            <span>{pct}%</span>
                         </div>
                         <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div className={cn("h-full", colors[idx] || 'bg-purple-500')} style={{ width: `${pct}%` }} />
                         </div>
                      </div>
                      <div className="absolute top-0 right-0 p-3 text-slate-800 group-hover:text-slate-700 transition-colors">
                         <TrendingUp size={32} />
                      </div>
                   </div>
                 )})}
              </div>
           </div>
           )}
        </div>

        {/* Console IA & Alertas */}
        <div className="space-y-8">
           {/* IA Console (Simulado) */}
           <div className="bg-slate-950/80 border border-slate-800/50 rounded-[40px] p-8 shadow-2xl font-mono relative overflow-hidden min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-500/50" />
                   <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                   <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">IA LIVE CONSOLE</span>
              </div>
              
              <div className="space-y-4 text-[10px]">
                 <div className="flex gap-3">
                    <span className="text-emerald-500 shrink-0">11:15:32</span>
                    <span className="text-slate-500">[INFO]</span>
                    <span className="text-slate-300">detect_intent: "como marcar consulta?" &rarr; intent: APPOINTMENT_REQUEST</span>
                 </div>
                 <div className="flex gap-3">
                    <span className="text-emerald-500 shrink-0">11:15:45</span>
                    <span className="text-slate-500">[INFO]</span>
                    <span className="text-slate-300">ovyva_respond: generating reply (clinic_id: clinica-001) tokens: 420</span>
                 </div>
                 <div className="flex gap-3">
                    <span className="text-amber-500 shrink-0">11:16:02</span>
                    <span className="text-amber-500/80">[WARN]</span>
                    <span className="text-slate-300">latency_alert: scribe_3.5 took 2450ms (p95 threshold exceeded)</span>
                 </div>
                 <div className="flex gap-3">
                    <span className="text-emerald-500 shrink-0">11:16:15</span>
                    <span className="text-slate-500">[INFO]</span>
                    <span className="text-slate-300">transcribe_audio: success (3MB audio) duration: 12.5s</span>
                 </div>
                 <div className="flex gap-3 animate-pulse">
                    <span className="text-emerald-500 shrink-0">11:16:42</span>
                    <span className="text-slate-500">[LIVE]</span>
                    <span className="text-purple-400">Processing complex query to Gemini...</span>
                 </div>
              </div>

              {/* Fake gradient overlap */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
           </div>

           {/* Limites e Bloqueio */}
           <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[40px] space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                    <Lock size={24} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Controle de Quota</h3>
                    <p className="text-[10px] font-bold text-red-500/60 tracking-widest">Proteção automática de faturamento</p>
                 </div>
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                 O sistema bloqueará automaticamente clínicas que excederem o limite orçamentário do plano para evitar custos inesperados de infraestrutura.
              </p>
              <a
                href="/superadmin/configuracoes"
                className="block w-full py-4 bg-slate-800 text-slate-300 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-slate-700 hover:border-slate-500 text-center">
                 CONFIGURAR THRESHOLDS GLOBAIS
              </a>
           </div>
        </div>

      </div>
    </div>
  )
}
