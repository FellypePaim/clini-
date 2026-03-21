import React from 'react'
import { 
  Smartphone,
  MessageSquare,
  RefreshCw,
  Zap,
  QrCode,
  Power,
  ShieldCheck,
  Search,
  Users,
  AlertCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'

export function SuperWhatsAppPage() {
  const { getWhatsAppStats, isLoading: _isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [data, setData] = React.useState<any>(null)
  const [filterText, setFilterText] = React.useState('')

  const loadData = React.useCallback(async () => {
    const res = await getWhatsAppStats()
    if (res) setData(res)
  }, [getWhatsAppStats])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const stats = [
    { label: 'Msgs Recebidas (Hoje)', value: String(data?.msgsHoje || 0), trend: '+0%', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Respostas IA (Sofia)', value: String(data?.iaResponses || 0), trend: '0%', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Instâncias Ativas', value: `${data?.conected || 0}/${data?.total || 0}`, trend: 'Online', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Humano Solicitado', value: String(data?.humanRequested || 0), trend: '0%', icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ]

  const allInstances = data?.instancias || []
  const instances = filterText
    ? allInstances.filter((i: any) =>
        i.clinica?.toLowerCase().includes(filterText.toLowerCase()) ||
        i.phone?.includes(filterText)
      )
    : allInstances

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Monitoramento WhatsApp</h1>
          <p className="text-slate-400 font-medium">Controle de instâncias Evolution API e métricas de conversação OVYVA.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={() => { toast({ title: 'Sincronizando...', description: 'Verificando status de todas as instâncias Evolution.', type: 'info' }); loadData() }}
             className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all">
              <RefreshCw size={18} /> Sync All
           </button>
           <button
             disabled
             onClick={() => toast({ title: 'Em desenvolvimento', description: 'O restart do cluster via painel ainda est\u00e1 em desenvolvimento. Execute via terminal SSH.', type: 'info' })}
             className="flex items-center gap-2 px-6 py-3 bg-emerald-600/50 text-white/60 font-black rounded-2xl shadow-xl transition-all cursor-not-allowed"
             title="Em desenvolvimento - requer acesso SSH">
              RESTART CLUSTER
              <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">Dev</span>
           </button>
        </div>
      </div>

      {/* Métricas Rapidamente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon || Smartphone;
          return (
          <div key={stat.label} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[32px] group relative overflow-hidden transition-all hover:bg-slate-800/50 shadow-xl">
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{stat.label}</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">{stat.value}</span>
                      <span className={cn("text-[10px] font-black", stat.color)}>{stat.trend}</span>
                   </div>
                </div>
             </div>
             <Icon size={120} className="absolute -bottom-8 -right-8 text-slate-700/5 group-hover:scale-110 transition-transform duration-700" />
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gestão de Instâncias */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Smartphone size={16} /> INSTÂNCIAS EVOLUTION (CORE)
              </h3>
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                 <input
                   type="text"
                   placeholder="Filtrar número ou clínica..."
                   value={filterText}
                   onChange={(e) => setFilterText(e.target.value)}
                   className="bg-slate-900/50 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-emerald-500 transition-all w-60"
                 />
              </div>
           </div>

           <div className="bg-slate-800/40 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <th className="px-8 py-6">Clínica / Instância</th>
                       <th className="px-8 py-6">Número Conectado</th>
                       <th className="px-8 py-6">Msgs</th>
                       <th className="px-8 py-6">Status</th>
                       <th className="px-8 py-6 text-right">Ação</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/30">
                    {instances.map((item: any) => (
                       <tr key={item.instance} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-200 group-hover:text-emerald-400 transition-colors">{item.clinica}</span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.instance}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 font-mono text-xs text-slate-400">{item.phone}</td>
                          <td className="px-8 py-5">
                             <span className="text-xs font-black text-slate-300">{item.msgs}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                                <div className={cn(
                                   "w-2 h-2 rounded-full",
                                   item.status === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 
                                   item.status === 'close' ? 'bg-red-500' : 'bg-amber-500'
                                )} />
                                <span className={cn(
                                   "text-[9px] font-black uppercase tracking-widest",
                                   item.status === 'open' ? 'text-emerald-500' : 
                                   item.status === 'close' ? 'text-red-500' : 'text-amber-500'
                                )}>
                                   {item.status === 'open' ? 'Online' : item.status === 'close' ? 'Offline' : 'Reconectando'}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-2 outline-none">
                                <button
                                  disabled
                                  onClick={() => toast({ title: 'Em desenvolvimento', description: 'Visualiza\u00e7\u00e3o de conversas ainda em desenvolvimento.', type: 'info' })}
                                  className="p-2 bg-slate-900/50 text-slate-600 rounded-lg cursor-not-allowed opacity-50" title="Ver conversas (em desenvolvimento)">
                                   <MessageSquare size={14} />
                                </button>
                                <button
                                  disabled
                                  onClick={() => toast({ title: 'Em desenvolvimento', description: 'Gera\u00e7\u00e3o de QR Code via painel ainda em desenvolvimento.', type: 'info' })}
                                  className="p-2 bg-slate-900/50 text-slate-600 rounded-lg cursor-not-allowed opacity-50" title="Gerar QR Code (em desenvolvimento)">
                                   <QrCode size={14} />
                                </button>
                                <button
                                  disabled
                                  onClick={() => toast({ title: 'Em desenvolvimento', description: 'Desconex\u00e3o via painel ainda em desenvolvimento.', type: 'info' })}
                                  className="p-2 bg-slate-900/50 text-slate-600 rounded-lg cursor-not-allowed opacity-50" title="Desconectar (em desenvolvimento)">
                                   <Power size={14} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Auditoria de Webhooks & Alertas */}
        <div className="space-y-8">
           {/* Webhook Health Dashboard */}
           <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden group">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={16} className="text-emerald-400" /> Webhook Integridade
              </h3>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-500 uppercase">Incoming Events (24h)</span>
                    <span className="text-emerald-400">99.98% Success</span>
                 </div>
                 <div className="h-2 bg-slate-900 rounded-full flex overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%] shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
                    <div className="h-full bg-indigo-500 w-[4%]" />
                    <div className="h-full bg-red-500 w-[1%]" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">PICO (HOJE)</span>
                       <span className="text-sm font-black text-white">45 req/sec</span>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">LATÊNCIA</span>
                       <span className="text-sm font-black text-white">125ms</span>
                    </div>
                 </div>
              </div>

              {/* Fake Pulse decoration */}
              <div className="absolute -bottom-10 -right-10 text-emerald-500/5 group-hover:scale-125 transition-transform duration-1000">
                 <Zap size={180} />
              </div>
           </div>

           {/* Eventos Críticos WhatsApp */}
           <div className="space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={16} className="text-amber-500" /> Alertas da Instância
              </h3>
              <div className="space-y-3">
                 {[
                    { clinica: 'Clínica Sorriso', msg: 'Sessão encerrada remotamente', time: 'Há 5 min', type: 'error' },
                    { clinica: 'DermoCenter', msg: 'Reconexão falhou (Retry #3)', time: 'Há 8 min', type: 'warning' },
                    { clinica: 'OdontoPlus', msg: 'IA Sofia demorou > 5s para responder', time: 'Há 12 min', type: 'info' },
                 ].map((alert, i) => (
                    <div key={i} className="bg-slate-800/30 border border-slate-700/30 p-4 rounded-2xl flex gap-3 hover:bg-slate-800/50 transition-all cursor-pointer">
                       <div className={cn(
                         "w-1 h-8 rounded-full",
                         alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                       )} />
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-0.5 tracking-tight">{alert.clinica} • {alert.time}</p>
                          <p className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{alert.msg}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
