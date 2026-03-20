import React from 'react'
import {
  LifeBuoy,
  Search,
  User,
  Building2,
  CheckCircle,
  AlertTriangle,
  Send,
  Flag,
  Rocket
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'

export function SuperSuportePage() {
  const { getSuporteTickets, isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [data, setData] = React.useState<any[]>([])
  const [searchTicket, setSearchTicket] = React.useState('')
  const [prioFilter, setPrioFilter] = React.useState<string>('todos')
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())
  const [showSearch, setShowSearch] = React.useState(false)
  const [bannerAtivo, setBannerAtivo] = React.useState(false)
  const [bannerTexto, setBannerTexto] = React.useState('')

  React.useEffect(() => {
    async function fetch() {
      const res = await getSuporteTickets()
      if (res) setData(res)
    }
    fetch()
  }, [getSuporteTickets])

  const tickets = (data?.length ? data : []).filter((tk: any) => {
    if (dismissed.has(tk.id)) return false
    const q = searchTicket.toLowerCase()
    const matchSearch = !searchTicket || tk.msg?.toLowerCase().includes(q) || tk.clinica?.toLowerCase().includes(q) || tk.user?.toLowerCase().includes(q)
    const matchPrio = prioFilter === 'todos' || tk.priority === prioFilter
    return matchSearch && matchPrio
  })

  const handleResponder = (tk: any) => {
    const phone = tk.telefone?.replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=Olá ${tk.user}, sou da equipe de suporte. Estou entrando em contato sobre seu ticket.`, '_blank')
    } else {
      toast({ title: 'Ticket Selecionado', description: `Usuário: ${tk.user} | Clínica: ${tk.clinica} | Prioridade: ${tk.priority}`, type: 'info' })
    }
  }

  const handleFecharTicket = (tkId: string) => {
    setDismissed(prev => new Set([...prev, tkId]))
    toast({ title: 'Ticket Fechado', description: 'Ticket marcado como resolvido e removido da fila.', type: 'success' })
  }

  const releases = [
    { version: 'v2.5.0-beta', date: '21/03/2026', title: 'Infraestrutura SuperAdmin Core', type: 'major', status: 'staging' },
    { version: 'v2.4.8', date: '15/03/2026', title: 'Hotfix: WhatsApp Webhook Timeout', type: 'fix', status: 'production' },
    { version: 'v2.4.7', date: '10/03/2026', title: 'Módulo de Estoque e Almoxarifado', type: 'feature', status: 'production' },
  ]

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical': return <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] font-black">CRÍTICO</Badge>
      case 'high': return <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] font-black">ALTO</Badge>
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-500 border-none text-[8px] font-black">MÉDIO</Badge>
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-none text-[8px] font-black">BAIXO</Badge>
    }
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Suporte & Release Control</h1>
          <p className="text-slate-400 font-medium">Atendimento a clínicas, feature flags e controle de versões.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={() => toast({ title: 'Deploy via CI/CD', description: 'Para fazer deploy, faça push para a branch main e acione o pipeline de CI/CD no GitHub Actions.', type: 'info' })}
             className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all">
              <Rocket size={18} /> DEPLOY NOVA VERSÃO
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Central de Tickets (Col-Span-2) */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <LifeBuoy size={16} /> TICKETS DE SUPORTE ABERTOS
              </h3>
              <div className="flex items-center gap-2">
                 {showSearch && (
                   <input
                     autoFocus
                     type="text"
                     value={searchTicket}
                     onChange={e => setSearchTicket(e.target.value)}
                     placeholder="Buscar ticket..."
                     className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl outline-none focus:ring-1 focus:ring-purple-500 w-40"
                   />
                 )}
                 <button onClick={() => setShowSearch(s => !s)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Search size={16} /></button>
                 <select value={prioFilter} onChange={e => setPrioFilter(e.target.value)} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer">
                   <option value="todos">Todas Prioridades</option>
                   <option value="critical">Crítico</option>
                   <option value="high">Alto</option>
                   <option value="medium">Médio</option>
                   <option value="low">Baixo</option>
                 </select>
              </div>
           </div>

           <div className="space-y-4">
              {tickets.map(tk => (
                <div key={tk.id} className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-[32px] group hover:bg-slate-800/50 transition-all relative overflow-hidden">
                   <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-purple-400 uppercase tracking-widest">{tk.id}</span>
                         {getPriorityBadge(tk.priority)}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tk.time}</span>
                   </div>
                   
                   <p className="text-sm font-black text-white mb-6 line-clamp-2 leading-relaxed group-hover:text-purple-400 transition-colors">
                      {tk.msg}
                   </p>

                   <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-700/30">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                            <Building2 size={14} className="text-slate-600" />
                            {tk.clinica}
                         </div>
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                            <User size={14} className="text-slate-600" />
                            {tk.user}
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button
                           onClick={() => handleResponder(tk)}
                           className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-purple-700 transition-all">
                            <Send size={12} /> RESPONDER
                         </button>
                         <button onClick={() => handleFecharTicket(tk.id)} className="p-2 bg-slate-700/50 rounded-lg text-slate-400 hover:text-emerald-400 transition-all" title="Fechar ticket"><CheckCircle size={16} /></button>
                      </div>
                   </div>
                   
                   {/* Gradient visual decoration */}
                   {tk.status === 'open' && (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* Release Control & Changelog */}
        <div className="space-y-8">
           <div className="space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <Flag size={16} className="text-indigo-400" /> VERSÕES DA PLATAFORMA
              </h3>
              <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden group">
                 <div className="space-y-6">
                    {releases.map(rel => (
                       <div key={rel.version} className="relative pl-8 pb-8 last:pb-0 border-l border-slate-800 group-last:border-none">
                          <div className={cn(
                             "absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full",
                             rel.status === 'production' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-purple-500'
                          )} />
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest",
                                   rel.status === 'production' ? 'text-emerald-500' : 'text-purple-400'
                                )}>{rel.version}</span>
                                <Badge className={cn(
                                   "text-[8px] font-black border-none",
                                   rel.type === 'major' ? 'bg-indigo-500/10 text-indigo-400' : rel.type === 'fix' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                )}>{rel.type.toUpperCase()}</Badge>
                             </div>
                             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{rel.date}</span>
                          </div>
                          <h4 className="text-xs font-black text-white mb-2 leading-tight uppercase tracking-tight">{rel.title}</h4>
                          <span className="text-[10px] font-black text-slate-500 py-0.5 px-2 bg-slate-900 rounded-md border border-slate-800 uppercase tracking-widest">{rel.status}</span>
                       </div>
                    ))}
                 </div>
                 <button
                   onClick={() => toast({ title: 'Logs de Commit', description: 'Execute git log --oneline no repositório para o histórico completo.', type: 'info' })}
                   className="w-full py-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest border border-dashed border-slate-700/50 rounded-2xl hover:border-slate-500 transition-all font-mono">
                    VER LOGS DE COMMIT COMPLETO
                 </button>
              </div>
           </div>

           {/* Painel de Avisos Urgentes */}
           <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[40px] space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <AlertTriangle size={24} />
                 </div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Maintenance Banner</h3>
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                 Ative um aviso global para todos os usuários notificando sobre manutenções programadas ou instabilidade.
              </p>
              <textarea
                value={bannerTexto}
                onChange={e => setBannerTexto(e.target.value)}
                placeholder="Ex: Manutenção programada hoje às 22h. O sistema ficará indisponível por ~30 min."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/20 text-white text-xs font-medium rounded-2xl outline-none focus:ring-1 focus:ring-amber-500/40 resize-none placeholder:text-slate-600"
              />
              <button
                onClick={() => {
                  if (!bannerTexto.trim()) {
                    toast({ title: 'Texto obrigatório', description: 'Digite o texto do aviso antes de publicar.', type: 'error' })
                    return
                  }
                  setBannerAtivo(prev => !prev)
                  toast({ title: bannerAtivo ? 'Banner Desativado' : 'Banner Publicado!', description: bannerAtivo ? 'O aviso global foi removido.' : `Aviso exibido para todos os usuários: "${bannerTexto}"`, type: bannerAtivo ? 'info' : 'success' })
                }}
                className={`w-full py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border ${bannerAtivo ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'}`}>
                 {bannerAtivo ? 'DESATIVAR AVISO GLOBAL' : 'PUBLICAR AVISO GLOBAL'}
              </button>
              {bannerAtivo && (
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center animate-pulse">
                  ● BANNER ATIVO
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}
