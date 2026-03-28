import { useState, useCallback } from 'react'
import { ConversationList } from '../../components/ovyva/ConversationList'
import { ChatWindow } from '../../components/ovyva/ChatWindow'
import { ContactContext } from '../../components/ovyva/ContactContext'
import { useOVYVA } from '../../hooks/useOVYVA'
import { MessageSquare, Bot, Settings, History, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function OvyvaPage() {
  const {
    conversations, selectConversation, activeConversation, config,
    sendMessage, takeoverConversation, returnToAI, refreshConversations,
  } = useOVYVA()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  const aiName = config?.aiName || 'Sofia'

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    const conv = conversations.find(c => c.id === id)
    if (conv) selectConversation(conv)
  }, [conversations, selectConversation])

  const handleTakeover = useCallback(async () => {
    if (!selectedId) return
    await takeoverConversation(selectedId)
    await refreshConversations()
    // Re-selecionar para pegar status atualizado
    const updated = conversations.find(c => c.id === selectedId)
    if (updated) selectConversation({ ...updated, status: 'atendido_humano' })
  }, [selectedId, takeoverConversation, refreshConversations, conversations, selectConversation])

  const handleReturnToAI = useCallback(async () => {
    if (!selectedId) return
    await returnToAI(selectedId)
    await refreshConversations()
    const updated = conversations.find(c => c.id === selectedId)
    if (updated) selectConversation({ ...updated, status: 'ia_ativa' })
  }, [selectedId, returnToAI, refreshConversations, conversations, selectConversation])

  // Usar activeConversation do hook (tem mensagens carregadas) ou fallback
  const selectedConversation = activeConversation?.id === selectedId ? activeConversation
    : conversations.find(c => c.id === selectedId) ?? null

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
       {/* OVYVA Header */}
       <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-xl shadow-green-500/20">
                <Bot className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-gray-900 border-none uppercase tracking-widest">OVYVA</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Secretaria Virtual IA 24/7 Ativa
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <NavButton icon={<History className="w-4 h-4" />} label="Historico" onClick={() => navigate('/ovyva/historico')} />
             <NavButton icon={<Settings className="w-4 h-4" />} label="Configuracoes" onClick={() => navigate('/ovyva/configuracoes')} />
          </div>
       </div>

       {/* Main Chat Panel */}
       <div className="flex-1 flex bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
          />

          {selectedConversation ? (
            <>
              <ChatWindow
                conversation={selectedConversation}
                onSend={(text) => sendMessage(selectedConversation.id, text)}
                onTakeover={handleTakeover}
                onReturnToAI={handleReturnToAI}
                aiName={aiName}
              />
              <ContactContext
                conversation={selectedConversation}
                onPatientLinked={refreshConversations}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 gap-6 opacity-30 select-none">
               <div className="w-32 h-32 rounded-[48px] border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                  <MessageSquare className="w-12 h-12" />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selecione uma conversa para iniciar</p>
            </div>
          )}
       </div>
    </div>
  )
}

function NavButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2.5 bg-white hover:bg-gray-900 hover:text-white rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm"
    >
       {icon} {label}
    </button>
  )
}
