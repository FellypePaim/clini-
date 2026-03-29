import { useState } from 'react'
import { Search, MessageSquare, Clock, UserCheck, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { LyraConversation } from '../../types/lyra'
import { Avatar } from '../ui/Avatar'

interface ConversationListProps {
  conversations: LyraConversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'waiting'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = conversations.filter(c => {
    const unread = c.mensagens_nao_lidas ?? 0
    if (filter === 'unread' && unread <= 0) return false
    if (filter === 'waiting' && c.status !== 'aguardando_humano') return false
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchName = (c.contato_nome || '').toLowerCase().includes(term)
      const matchPhone = (c.contato_telefone || '').includes(term)
      if (!matchName && !matchPhone) return false
    }
    return true
  })

  function formatRelativeTime(dateStr?: string) {
    if (!dateStr) return ''
    const now = new Date()
    const then = new Date(dateStr)
    const diff = now.getTime() - then.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'ontem'
    return `${days} d`
  }

  return (
    <div className="w-80 flex flex-col border-r border-[var(--color-border)] h-full bg-[var(--color-bg-card)] shrink-0 overflow-hidden">
       {/* List Header */}
       <div className="p-6 border-b border-gray-50 shrink-0">
          <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-500" />
            Mensagens
          </h2>
          
          <div className="space-y-4">
            <div className="relative group">
               <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--color-text-muted)] group-hover:text-cyan-500 transition-colors" />
               <input
                type="text"
                placeholder="Buscar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--color-bg-deep)] border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-[var(--color-text-dim)] outline-none focus:ring-2 focus:ring-cyan-500/10 transition-all"
               />
            </div>

            <div className="flex items-center gap-1 bg-[var(--color-bg-deep)] p-1 rounded-xl">
               <FilterTab 
                active={filter === 'all'} 
                onClick={() => setFilter('all')} 
                label="Todas" 
               />
               <FilterTab 
                active={filter === 'unread'} 
                onClick={() => setFilter('unread')} 
                label="Não lidas" 
                count={conversations.filter(c => (c.mensagens_nao_lidas ?? 0) > 0).length}
               />
               <FilterTab 
                active={filter === 'waiting'} 
                onClick={() => setFilter('waiting')} 
                label="Aguardando" 
                count={conversations.filter(c => c.status === 'aguardando_humano').length}
               />
            </div>
          </div>
       </div>

       {/* Conversation List */}
       <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtered.map((conv) => {
            const unread = conv.mensagens_nao_lidas ?? 0
            const displayName = conv.contato_nome || `Novo contato • ${conv.contato_telefone}`
            const avatarLetra = conv.contato_nome ? conv.contato_nome : "?"
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full p-4 flex gap-4 transition-all duration-300 border-b border-gray-50 group border-l-4",
                  selectedId === conv.id 
                    ? "bg-cyan-500/5 border-l-cyan-500" 
                    : "bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]/80 border-l-transparent"
                )}
              >
                <Avatar nome={avatarLetra} size="md" className="shrink-0 ring-2 ring-white shadow-sm" />
                
                <div className="flex-1 text-left min-w-0">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-[var(--color-text-primary)] truncate uppercase tracking-widest">{displayName}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-bold">{formatRelativeTime(conv.ultimo_contato)}</span>
                   </div>
                   
                   <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-[11px] truncate leading-tight flex-1",
                        unread > 0 ? "text-[var(--color-text-primary)] font-bold" : "text-[var(--color-text-muted)] font-medium"
                      )}>
                        {conv.ultima_mensagem || "Nova conversa iniciada..."}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 bg-cyan-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                          {unread}
                        </span>
                      )}
                   </div>

                   <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {conv.metadata?.lead_stage && (
                        <div className={cn(
                          "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg border",
                          conv.metadata.lead_stage === 'agendado' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                          conv.metadata.lead_stage === 'quase_fechando' ? "text-orange-600 bg-orange-50 border-orange-100" :
                          conv.metadata.lead_stage === 'demonstrou_interesse' ? "text-amber-600 bg-amber-50 border-amber-100" :
                          "text-blue-600 bg-blue-50 border-blue-100"
                        )}>
                          {conv.metadata.lead_stage === 'perguntou_valor' ? 'Perguntou' :
                           conv.metadata.lead_stage === 'demonstrou_interesse' ? 'Interessado' :
                           conv.metadata.lead_stage === 'quase_fechando' ? 'Quase Fechando' :
                           conv.metadata.lead_stage === 'agendado' ? 'Agendado' :
                           conv.metadata.lead_stage}
                        </div>
                      )}
                      {conv.status === 'ia_ativa' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/5 px-1.5 py-0.5 rounded-lg border border-cyan-500/20">
                          <Clock className="w-2.5 h-2.5" /> IA Ativa
                        </div>
                      )}
                      {conv.status === 'aguardando_humano' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded-lg border border-orange-100">
                          <UserCheck className="w-2.5 h-2.5" /> Aguardando Humano
                        </div>
                      )}
                      {conv.status === 'resolvido' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-lg border border-blue-100">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Resolvido
                        </div>
                      )}
                      {conv.status === 'atendido_humano' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest bg-[var(--color-bg-card)] px-1.5 py-0.5 rounded-lg border border-[var(--color-border)]">
                          <UserCheck className="w-2.5 h-2.5" /> Atendido
                        </div>
                      )}
                   </div>
                </div>
              </button>
            )
          })}
       </div>
    </div>
  )
}

function FilterTab({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5",
        active ? "bg-[var(--color-bg-card)] text-cyan-500 shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "px-1.5 rounded-md",
          active ? "bg-cyan-500/10 text-cyan-500" : "bg-gray-200 text-[var(--color-text-muted)]"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
