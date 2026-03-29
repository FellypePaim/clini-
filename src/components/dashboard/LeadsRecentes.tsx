import React from 'react'
import { MessageSquare, ArrowUpRight, Clock, Smartphone, Instagram, User, ExternalLink } from 'lucide-react'
import { useNexus } from '../../hooks/useNexus'
import { Avatar } from '../ui/Avatar'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const ORIGIN_ICONS = {
  'WhatsApp LYRA': <Smartphone size={14} className="text-emerald-500" />,
  'Manual': <User size={14} className="text-slate-400" />,
  'Indicação': <ExternalLink size={14} className="text-indigo-400" />,
  'Instagram': <Instagram size={14} className="text-pink-500" />
}

export function LeadsRecentes() {
  const { leads, isLoading } = useNexus()

  const recentLeads = leads.slice(0, 5)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col h-full" style={{ background: 'var(--color-bg-card)' }}>
      <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">Leads Recentes</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight mt-1">Últimos contatos do CRM</p>
        </div>
        <Link 
          to="/nexus" 
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          title="Ver funil completo"
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-dim)] p-8 text-center">
            <MessageSquare size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">Nenhum lead encontrado</p>
            <p className="text-[11px] mt-1">Os contatos do WhatsApp aparecerão aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-[var(--color-bg-card-hover)] transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <Avatar 
                    nome={lead.name}
                    className="w-10 h-10 border border-indigo-100 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{lead.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        {ORIGIN_ICONS[lead.origin]}
                        <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight">{lead.origin}</span>
                      </span>
                      <span className="text-[var(--color-text-dim)] text-[10px] font-bold">•</span>
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">{lead.procedure}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                   <div className={cn(
                     "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border mb-1 whitespace-nowrap",
                     lead.stage === 'Perdido' ? "bg-rose-50 text-rose-600 border-rose-100" :
                     lead.stage === 'Agendado' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                     "bg-indigo-50 text-indigo-600 border-indigo-100"
                   )}>
                     {lead.stage}
                   </div>
                   <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--color-text-muted)] font-bold">
                     <Clock size={10} />
                     {new Date(lead.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-[var(--color-bg-deep)] border-t border-[var(--color-border)] rounded-b-2xl">
        <Link 
          to="/nexus" 
          className="block w-full text-center py-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-[var(--color-bg-card-hover)] rounded-xl transition-all"
        >
          Gerenciar Funil
        </Link>
      </div>
    </div>
  )
}
