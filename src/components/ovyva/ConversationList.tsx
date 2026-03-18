import { useState } from 'react'
import { Search, Filter, MessageSquare, Clock, UserCheck } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OvyvaConversation } from '../../types/ovyva'
import { Avatar } from '../ui/Avatar'

interface ConversationListProps {
  conversations: OvyvaConversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'waiting'>('all')

  const filtered = conversations.filter(c => {
    if (filter === 'unread') return c.unreadCount > 0
    if (filter === 'waiting') return c.status === 'aguardando_humano'
    return true
  })

  return (
    <div className="w-80 flex flex-col border-r border-gray-100 h-full bg-white shrink-0 overflow-hidden">
       {/* List Header */}
       <div className="p-6 border-b border-gray-50 shrink-0">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-500" />
            Mensagens
          </h2>
          
          <div className="space-y-4">
            <div className="relative group">
               <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
               <input 
                type="text" 
                placeholder="Buscar contato..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-green-500/10 transition-all"
               />
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
               <FilterTab 
                active={filter === 'all'} 
                onClick={() => setFilter('all')} 
                label="Todas" 
               />
               <FilterTab 
                active={filter === 'unread'} 
                onClick={() => setFilter('unread')} 
                label="Não lidas" 
                count={conversations.filter(c => c.unreadCount > 0).length}
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
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-4 flex gap-4 transition-all duration-300 border-b border-gray-50 group border-l-4",
                selectedId === conv.id 
                  ? "bg-green-50/50 border-l-green-500" 
                  : "bg-white hover:bg-gray-50/80 border-l-transparent"
              )}
            >
              <Avatar nome={conv.contatoNome} size="md" className="shrink-0 ring-2 ring-white shadow-sm" />
              
              <div className="flex-1 text-left min-w-0">
                 <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-gray-900 truncate uppercase tracking-widest">{conv.contatoNome}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{conv.horario}</span>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-[11px] truncate leading-tight flex-1",
                      conv.unreadCount > 0 ? "text-gray-900 font-bold" : "text-gray-400 font-medium"
                    )}>
                      {conv.ultimaMensagem}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                        {conv.unreadCount}
                      </span>
                    )}
                 </div>

                 <div className="mt-2 flex items-center gap-1.5">
                    {conv.status === 'ia_respondendo' ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-1.5 py-0.5 rounded-lg border border-green-100">
                        <Clock className="w-2.5 h-2.5" /> IA Respondendo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded-lg border border-orange-100">
                        <UserCheck className="w-2.5 h-2.5" /> Aguardando Humano
                      </div>
                    )}
                 </div>
              </div>
            </button>
          ))}
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
        active ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "px-1.5 rounded-md",
          active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
