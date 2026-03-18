import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  Plus, Send, Bot, User, Settings, Clock, CheckCircle, Play, Sparkles, CalendarDays
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OvyvaConversation, OvyvaMessage } from '../../types/ovyva'
import { Avatar } from '../ui/Avatar'
import { Link } from 'react-router-dom'

interface ChatWindowProps {
  conversation: OvyvaConversation
  onSend: (text: string) => void
  onTakeover: () => void
  onReturnToAI: () => void
}

export function ChatWindow({ conversation, onSend, onTakeover, onReturnToAI }: ChatWindowProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.mensagens])

  const handleSend = () => {
    if (!inputText.trim()) return
    onSend(inputText)
    setInputText('')
  }

  // Agrupar mensagens por sessao_id ou data aproximada
  const groupedSessions = useMemo(() => {
    const groups: { label: string, date: Date, msgs: OvyvaMessage[] }[] = []
    
    // Fallback simple grouper by date/session
    let currentGroupId: string | null = null
    let currentGroup: OvyvaMessage[] = []
    let lastDate: Date = new Date(0)

    conversation.mensagens.forEach((msg, idx) => {
      const msgDate = new Date(msg.created_at)
      const diffHours = (msgDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
      
      const isNewSession = msg.sessao_inicio || diffHours > 4 || idx === 0
      
      const df = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      const diffDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / 86400000)

      if (isNewSession) {
        if (currentGroup.length > 0) {
          const firstInGroup = new Date(currentGroup[0].created_at)
          const daysAgo = diffDays(new Date(), firstInGroup)
          let label = `──────── Hoje ────────`
          if (daysAgo === 1) label = `──────── Ontem ────────`
          else if (daysAgo > 1) label = `──────── Retornou após ${daysAgo} dias • ${df.format(firstInGroup)} ────────`
          else if (idx === 0) label = `──────── Primeira conversa • ${df.format(firstInGroup)} ────────`
          
          groups.push({ label, date: firstInGroup, msgs: currentGroup })
        }
        currentGroup = [msg]
        currentGroupId = msg.sessao_id || null
      } else {
        currentGroup.push(msg)
      }
      lastDate = msgDate
    })

    if (currentGroup.length > 0) {
      const firstInGroup = new Date(currentGroup[0].created_at)
      const df = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      const diffDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / 86400000)

      const daysAgo = diffDays(new Date(), firstInGroup)
      let label = `──────── Hoje ────────`
      if (daysAgo === 1) label = `──────── Ontem ────────`
      else if (daysAgo > 1) label = `──────── Sessão • ${df.format(firstInGroup)} ────────`
      else if (groups.length === 0) label = `──────── Primeira conversa • ${df.format(firstInGroup)} ────────`
      groups.push({ label, date: firstInGroup, msgs: currentGroup })
    }

    return groups
  }, [conversation.mensagens])

  const displayName = conversation.contato_nome || `Novo contato • ${conversation.contato_telefone}`
  const avatarName = conversation.contato_nome ? conversation.contato_nome : "?"

  return (
    <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden h-full">
       {/* Chat Header */}
       <div className="bg-white p-6 border-b border-gray-50 shrink-0 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 transition-all">
          <div className="flex items-center gap-4">
             <Avatar nome={avatarName} size="lg" className="border-4 border-white shadow-xl shadow-gray-200/50" />
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <h3 className="text-sm font-black text-gray-900 border-none uppercase tracking-widest">{displayName}</h3>
                   {conversation.status === 'ia_ativa' && (
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   )}
                   {conversation.status === 'aguardando_humano' && (
                     <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                   )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                   {conversation.status === 'ia_ativa' ? (
                     <span className="flex items-center gap-1.5 text-green-600">
                        <Bot className="w-3.5 h-3.5" /> IA Monitorando Ativamente
                     </span>
                   ) : conversation.status === 'aguardando_humano' ? (
                     <span className="flex items-center gap-1.5 text-orange-600">
                        <User className="w-3.5 h-3.5" /> Aguardando Humano
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-gray-500">
                        <User className="w-3.5 h-3.5" /> Atendimento Humano
                     </span>
                   )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {conversation.status === 'ia_ativa' ? (
               <button 
                onClick={onTakeover}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
               >
                 <User className="w-3.5 h-3.5" /> Assumir Atendimento
               </button>
             ) : (
               <button 
                onClick={onReturnToAI}
                className="px-6 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-green-200"
               >
                 <Bot className="w-3.5 h-3.5" /> Devolver para IA
               </button>
             )}
             <button className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                <Settings className="w-5 h-5" />
             </button>
          </div>
       </div>

       {/* Messages Area */}
       <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur-md border border-white/40 px-6 py-2 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm z-20">
             Conversa Criptografada ponta-a-ponta
          </div>

          {conversation.paciente_id && (
            <div className="w-full flex justify-center mb-8">
               <Link to={`/pacientes/${conversation.paciente_id}`} className="bg-white hover:bg-green-50 border border-green-100 p-4 rounded-3xl shadow-lg shadow-green-500/5 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] group">
                 <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <User className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-green-700 capitalize">
                       {conversation.contato_nome}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                       <CalendarDays className="w-3 h-3" /> Paciente Cadastrado — Ver Prontuário &rarr;
                    </p>
                 </div>
               </Link>
            </div>
          )}

          {groupedSessions.map((session, sIdx) => (
             <div key={sIdx} className="space-y-6">
                <div className="flex justify-center my-6">
                   <div className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      {session.label}
                   </div>
                </div>
                {session.msgs.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
             </div>
          ))}
          <div ref={messagesEndRef} />
       </div>

       {/* Input Area */}
       <div className="p-8 bg-white border-t border-gray-50 flex flex-col gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
          {conversation.status === 'ia_ativa' && (
             <div className="bg-yellow-50/50 border border-yellow-100 p-3 rounded-2xl flex items-center gap-3 animate-slide-in">
                <Clock className="w-4 h-4 text-orange-400" />
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                  IA em Modo Autônomo · Digite para interferir e assumir automaticamente
                </p>
             </div>
          )}

          <div className="flex items-center gap-6">
             <button className="p-3.5 bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all shadow-sm">
                <Plus className="w-6 h-6" />
             </button>
             
             <div className="flex-1 relative group">
                <input 
                  type="text" 
                  value={inputText}
                  placeholder="Escreva sua mensagem aqui..."
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-[32px] py-4 pl-8 pr-16 text-sm font-medium placeholder:text-gray-300 outline-none focus:bg-white focus:border-green-500/20 focus:ring-4 focus:ring-green-500/5 transition-all shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={cn(
                    "absolute right-2 top-2 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    inputText.trim() ? "bg-green-500 text-white shadow-lg shadow-green-500/30 hover:scale-105 active:scale-90" : "bg-gray-100 text-gray-300"
                  )}
                >
                   <Send className="w-5 h-5" />
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

function MessageBubble({ message }: { message: OvyvaMessage }) {
  const isPatient = message.remetente === 'paciente'
  const isIA      = message.remetente === 'ia'

  return (
    <div className={cn(
      "flex flex-col gap-2 max-w-[80%] animate-slide-in",
      isPatient ? "self-start items-start" : "self-end items-end"
    )}>
       <div className={cn(
         "p-6 rounded-[32px] text-sm leading-relaxed shadow-sm group relative",
         isPatient ? "bg-white border border-gray-100 text-gray-600 rounded-bl-none" : 
         isIA ? "bg-green-50/80 border border-green-100 text-green-900 rounded-br-none" : 
         "bg-gray-900 text-white rounded-br-none shadow-xl shadow-gray-900/10"
       )}>
          {isIA && (
            <div className="flex items-center gap-2 mb-3 opacity-60">
               <Bot className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Sofia • IA Assistente</span>
            </div>
          )}

          {!isPatient && !isIA && (
            <div className="flex items-center gap-2 mb-3 opacity-40">
               <User className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Atendimento Recepção</span>
            </div>
          )}

          {message.isAudio ? (
            <div className="flex items-center gap-6 pr-4">
               <button className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-lg shadow-green-500/20">
                  <Play className="w-6 h-6 fill-current" />
               </button>
               <div className="flex flex-col gap-2 flex-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                     <div className="h-full w-1/3 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                     <span>{message.audioDuration}</span>
                     <span>Mensagem de voz</span>
                  </div>
               </div>
            </div>
          ) : (
            <p className="font-medium">{message.conteudo}</p>
          )}

          <div className={cn(
            "absolute -bottom-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
            isPatient ? "left-0" : "right-0"
          )}>
             <span className="text-[10px] text-gray-400 font-bold">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          </div>
       </div>
    </div>
  )
}
