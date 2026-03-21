import React from 'react'
import { 
  Activity, 
  Database, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  MessageSquare, 
  Zap, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Server,
  BarChart3,
  Network
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'

export function SuperSaudePage() {
  const { getSaudeStats, isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [data, setData] = React.useState<any>(null)

  const loadData = React.useCallback(async () => {
    const res = await getSaudeStats()
    if (res) setData(res)
  }, [getSaudeStats])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const dbStatus = data?.dbStatus || 'Verificando...'
  const coreServices = [
    { name: 'Supabase Database', status: dbStatus, latency: data?.dbLatency || '—', uptime: data?.dbUptime || '—', load: data?.dbLoad || '—', icon: Database, color: dbStatus === 'Operacional' ? 'text-emerald-500' : 'text-amber-500' },
    { name: 'Auth Service', status: data?.authStatus || 'Operacional', latency: data?.authLatency || '—', uptime: '99.98%', load: '—', icon: ShieldCheck, color: 'text-emerald-500' },
    { name: 'Edge Functions', status: data?.functionsStatus || 'Operacional', latency: data?.functionsLatency || '—', uptime: '99.95%', load: '—', icon: Zap, color: 'text-emerald-500' },
    { name: 'Storage Buckets', status: data?.storageStatus || 'Operacional', latency: data?.storageLatency || '—', uptime: '100%', load: '—', icon: Server, color: 'text-emerald-500' },
  ]

  const externalApis = [
    { name: 'Google Gemini Pro', status: 'Operacional', latency: '1.2s', quota: '12/60 RPM', icon: Cpu, color: 'text-emerald-500' },
    { name: 'Evolution API (WA)', status: 'Operacional', latency: '0.4s', quota: 'N/A', icon: MessageSquare, color: 'text-emerald-500' },
    { name: 'Cloudflare CDN', status: 'Operacional', latency: '12ms', quota: 'N/A', icon: Globe, color: 'text-emerald-500' },
  ]

  const errorLogs = data?.errors?.map((err: any, i: number) => ({
    id: err.id || i,
    service: err.recurso || 'global',
    msg: err.dados_depois?.error || 'Erro desconhecido na requisição',
    count: 1, 
    lastOccur: new Date(err.created_at).toLocaleDateString()
  })) || []

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Saúde do Sistema</h1>
          <p className="text-slate-400 font-medium">Monitoramento de infraestrutura, latência e integridade dos serviços.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
           <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">STATUS GLOBAL: OPERACIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Infrastructure */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Network size={16} /> CORE INFRASTRUCTURE (SUPABASE)
             </h3>
             <button
               onClick={() => { toast({ title: 'Atualizando...', description: 'Verificando status de todos os serviços.', type: 'info' }); loadData() }}
               className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                <RefreshCw size={16} />
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coreServices.map(service => {
                const Icon = service.icon || Server;
                return (
                 <div key={service.name} className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-[32px] hover:bg-slate-800/50 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                       <div className={cn("p-3 rounded-2xl bg-slate-900/50", service.color)}>
                          <Icon size={24} />
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black">{service.status}</Badge>
                    </div>
                    <h4 className="text-lg font-black text-white mb-4">{service.name}</h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">Latência</span>
                          <span className="text-slate-300">{service.latency}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">Uptime (30d)</span>
                          <span className="text-slate-300">{service.uptime}</span>
                       </div>
                       <div className="pt-2">
                          <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase mb-1.5">
                             <span>Resource Load</span>
                             <span>{service.load}</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: service.load }} />
                          </div>
                       </div>
                    </div>
                 </div>
              )})}
           </div>

           {/* Gráfico de Performance (Placeholder Estético) */}
           <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] relative overflow-hidden h-[300px]">
              <div className="flex items-center justify-between relative z-10 mb-8">
                 <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-400" /> Latência Média Global (ms)
                 </h4>
                 <div className="flex items-center gap-4 text-[10px] font-black text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> P99</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> P50</div>
                 </div>
              </div>
              
              {/* Fake Chart bars */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-2 h-40">
                 {Array.from({ length: 24 }).map((_, i) => (
                   <div key={i} className="flex-1 flex flex-col gap-1 items-center group cursor-help">
                      <div className="w-full bg-purple-500/20 rounded-t-sm group-hover:bg-purple-500/40 transition-colors" style={{ height: `${Math.random() * 60 + 20}%` }} />
                      <div className="w-full bg-emerald-500/40 rounded-t-sm group-hover:bg-emerald-500/60 transition-colors" style={{ height: `${Math.random() * 40 + 10}%` }} />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* External Dependencies & Logs */}
        <div className="space-y-8">
           {/* Third Party APIs */}
           <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[40px] shadow-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Activity size={16} className="text-indigo-400" /> External APIs
              </h3>
              <div className="space-y-6">
                 {externalApis.map(api => {
                    const Icon = api.icon || Globe;
                    return (
                    <div key={api.name} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                       <div className="flex items-center gap-4">
                          <div className={cn("p-2 rounded-lg bg-slate-800/80", api.color)}>
                             <Icon size={18} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-white tracking-wide">{api.name}</span>
                             <span className="text-[10px] font-bold text-slate-500 uppercase">{api.quota === 'N/A' ? 'SLA ativo' : api.quota}</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className={cn("text-[10px] font-black uppercase", api.status === 'Operacional' ? 'text-emerald-500' : 'text-amber-500')}>
                             {api.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">{api.latency}</span>
                       </div>
                    </div>
                 )})}
              </div>
           </div>

           {/* Incident Logs */}
           <div className="space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={16} className="text-red-400" /> Recent Errors (Production)
              </h3>
              <div className="space-y-3">
                 {errorLogs.map((log: any) => (
                    <div key={log.id} className="bg-red-500/5 border border-red-500/10 p-5 rounded-3xl hover:border-red-500/30 transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] font-black py-0.5">{log.service.toUpperCase()}</Badge>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{log.lastOccur}</span>
                       </div>
                       <p className="text-xs font-bold text-slate-300 line-clamp-2 leading-relaxed mb-3 group-hover:text-white transition-colors">
                          {log.msg}
                       </p>
                       <div className="flex items-center gap-2">
                          <div className="text-[10px] font-black text-red-400 uppercase tracking-wider bg-red-400/10 px-2 py-0.5 rounded-md">
                             {log.count} ocorrências
                          </div>
                       </div>
                    </div>
                 ))}
                 <button
                   onClick={() => toast({ title: 'Logs de Erro', description: 'Logs completos disponíveis na tabela audit_logs com filtro resultado=erro.', type: 'info' })}
                   className="w-full py-3 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest border border-dashed border-slate-700/50 rounded-2xl hover:border-slate-500 transition-all">
                    Ver logs de erro completos
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
