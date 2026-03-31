import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  Inbox,
  Send,
  Plus,
  X,
  ChevronDown,
  User,
  Shield,
  Paperclip,
  Star,
  Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const QUICK_REPLIES = [
  'Estamos verificando seu caso. Em breve retornaremos.',
  'Problema identificado e corrigido. Pode testar novamente?',
  'Poderia enviar um print da tela com o erro?',
  'Obrigado pelo contato! Seu ticket foi resolvido.',
  'Vamos encaminhar para a equipe tecnica.',
]
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { markSuporteAsRead } from '../../hooks/useUnreadSupporte'

interface Ticket {
  id: string
  assunto: string
  descricao: string | null
  clinica_id: string | null
  status: string
  prioridade: string
  responsavel_id: string | null
  created_at: string
  updated_at: string
  clinica_nome: string
  total_mensagens: number
}

interface TicketMessage {
  id: string
  ticket_id: string
  autor_id: string | null
  conteudo: string
  imagem_url: string | null
  e_superadmin: boolean | null
  created_at: string
  profiles: {
    nome_completo: string
    role: string
    avatar_url: string | null
  } | null
}

interface Clinic {
  id: string
  nome: string
  [key: string]: unknown
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critica: { label: 'Critica', className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  alta:    { label: 'Alta',    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  media:   { label: 'Media',   className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  baixa:   { label: 'Baixa',   className: 'bg-slate-800/10 text-[var(--color-text-muted)] ring-slate-500/20' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aberto:       { label: 'Aberto',       className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  em_andamento: { label: 'Em andamento', className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  resolvido:    { label: 'Resolvido',    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  fechado:      { label: 'Fechado',      className: 'bg-slate-800/10 text-[var(--color-text-muted)] ring-slate-500/20' },
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

function PriorityBadge({ prioridade }: { prioridade: string }) {
  const config = PRIORITY_CONFIG[prioridade] ?? PRIORITY_CONFIG.baixa
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.fechado
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

export function SuperSuportePage() {
  const {
    getSuporte,
    createTicket,
    updateTicket,
    getTicketMessages,
    sendTicketMessage,
    getClinics,
    isLoading,
  } = useSuperAdmin()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loaded, setLoaded] = useState(false)

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clinicsLoaded, setClinicsLoaded] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({
    assunto: '',
    descricao: '',
    prioridade: 'media',
    clinica_id: '',
  })
  const [creatingTicket, setCreatingTicket] = useState(false)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  )

  const isChatDisabled = selectedTicket?.status === 'fechado' || selectedTicket?.status === 'resolvido'

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    const res = await getSuporte()
    if (Array.isArray(res)) setTickets(res)
    setLoaded(true)
  }, [getSuporte])

  useEffect(() => {
    fetchTickets()
    markSuporteAsRead()
  }, [fetchTickets])

  // Fetch messages when ticket selected
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([])
      return
    }
    let cancelled = false
    async function load() {
      setMessagesLoading(true)
      const res = await getTicketMessages(selectedTicketId!)
      if (!cancelled && Array.isArray(res)) {
        setMessages(res)
      }
      if (!cancelled) setMessagesLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [selectedTicketId, getTicketMessages])

  // Realtime — subscribe to new messages
  useEffect(() => {
    if (!selectedTicketId) return
    const channel = supabase
      .channel(`sa-ticket-${selectedTicketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets_mensagens',
        filter: `ticket_id=eq.${selectedTicketId}`,
      }, async () => {
        const res = await getTicketMessages(selectedTicketId)
        if (Array.isArray(res)) setMessages(res)
        markSuporteAsRead()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedTicketId, getTicketMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filtered tickets
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets.filter((t) => {
      if (q && !t.assunto.toLowerCase().includes(q) && !t.clinica_nome.toLowerCase().includes(q)) {
        return false
      }
      if (priorityFilter !== 'todos' && t.prioridade !== priorityFilter) return false
      if (statusFilter !== 'todos' && t.status !== statusFilter) return false
      return true
    })
  }, [tickets, search, priorityFilter, statusFilter])

  // KPIs
  const kpis = useMemo(() => {
    const total = tickets.length
    const abertos = tickets.filter((t) => t.status === 'aberto').length
    const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length
    const resolvidos = tickets.filter((t) => t.status === 'resolvido').length
    return { total, abertos, emAndamento, resolvidos }
  }, [tickets])

  // Upload image to storage
  async function uploadImageToStorage(file: File): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `suporte/superadmin/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('clinica-assets').upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('clinica-assets').getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      console.error('Erro upload:', err)
      return null
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Send message
  async function handleSendMessage() {
    if (!selectedTicketId || sendingMessage || isChatDisabled) return
    if (!messageText.trim() && !selectedFile) return
    setSendingMessage(true)

    let imagemUrl: string | undefined
    if (selectedFile) {
      imagemUrl = (await uploadImageToStorage(selectedFile)) || undefined
    }

    await sendTicketMessage(selectedTicketId, messageText.trim() || '', true, imagemUrl)
    setMessageText('')
    setSelectedFile(null)
    setImagePreview(null)
    const res = await getTicketMessages(selectedTicketId)
    if (Array.isArray(res)) setMessages(res)
    await fetchTickets()
    setSendingMessage(false)
  }

  // Update ticket status/priority
  async function handleUpdateTicket(field: 'status' | 'prioridade', value: string) {
    if (!selectedTicketId) return
    await updateTicket(selectedTicketId, { [field]: value })
    await fetchTickets()
  }

  // Open new ticket modal
  async function handleOpenNewTicketModal() {
    setShowNewTicketModal(true)
    if (!clinicsLoaded) {
      const res = await getClinics()
      if (Array.isArray(res)) setClinics(res)
      setClinicsLoaded(true)
    }
  }

  // Create ticket
  async function handleCreateTicket() {
    if (!newTicketForm.assunto.trim() || creatingTicket) return
    setCreatingTicket(true)
    await createTicket({
      assunto: newTicketForm.assunto.trim(),
      descricao: newTicketForm.descricao.trim() || undefined,
      prioridade: newTicketForm.prioridade,
      clinica_id: newTicketForm.clinica_id || undefined,
    })
    setNewTicketForm({ assunto: '', descricao: '', prioridade: 'media', clinica_id: '' })
    setShowNewTicketModal(false)
    setCreatingTicket(false)
    await fetchTickets()
  }

  // Handle keydown on message textarea
  function handleMessageKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading && !loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Suporte</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Gerenciamento de tickets de suporte das clinicas.</p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* LEFT PANEL — Ticket List */}
        <div className="w-[40%] flex flex-col min-h-0 bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-slate-700/50">
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
              <LifeBuoy size={14} className="text-purple-400 mb-1" />
              <span className="text-lg font-black text-white">{kpis.total}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Total</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
              <AlertCircle size={14} className="text-blue-400 mb-1" />
              <span className="text-lg font-black text-white">{kpis.abertos}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Abertos</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
              <Clock size={14} className="text-amber-400 mb-1" />
              <span className="text-lg font-black text-white">{kpis.emAndamento}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Andamento</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
              <CheckCircle2 size={14} className="text-emerald-400 mb-1" />
              <span className="text-lg font-black text-white">{kpis.resolvidos}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">Resolvidos</span>
            </div>
          </div>

          {/* New Ticket Button */}
          <div className="p-3 border-b border-slate-700/50">
            <button
              onClick={handleOpenNewTicketModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Plus size={16} />
              Novo Ticket
            </button>
          </div>

          {/* Search + Filters */}
          <div className="p-3 space-y-2 border-b border-slate-700/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por assunto ou clinica..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-[var(--color-text-muted)] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <Filter size={12} className="text-[var(--color-text-muted)] shrink-0" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-xs rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
                >
                  <option value="todos">Todas Prioridades</option>
                  <option value="critica">Critica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-xs rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                <option value="todos">Todos Status</option>
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em andamento</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
              </select>
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                <Inbox size={40} className="mb-3 text-[var(--color-text-secondary)]" />
                <p className="text-sm font-medium">Nenhum ticket encontrado</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all',
                      'hover:bg-slate-800/60',
                      selectedTicketId === ticket.id
                        ? 'bg-slate-800/80 border-2 border-purple-500/60'
                        : 'bg-slate-800/30 border-2 border-transparent',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-white line-clamp-1 flex-1">
                        {ticket.assunto}
                      </h3>
                      <PriorityBadge prioridade={ticket.prioridade} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--color-text-muted)] truncate">{ticket.clinica_nome}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {formatDateTime(ticket.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                        <MessageSquare size={11} />
                        {ticket.total_mensagens}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Chat */}
        <div className="w-[60%] flex flex-col min-h-0 bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <MessageSquare size={48} className="mb-4 text-[var(--color-text-secondary)]" />
              <p className="text-sm font-medium">Selecione um ticket</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700/50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">{selectedTicket.assunto}</h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{selectedTicket.clinica_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">Status:</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicket('status', e.target.value)}
                      className="px-2 py-1 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-xs rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      <option value="aberto">Aberto</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="resolvido">Resolvido</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">Prioridade:</label>
                    <select
                      value={selectedTicket.prioridade}
                      onChange={(e) => handleUpdateTicket('prioridade', e.target.value)}
                      className="px-2 py-1 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-xs rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      <option value="critica">Critica</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  {(selectedTicket as any).avaliacao && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase">Avaliacao:</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star key={v} size={14} className={cn(v <= (selectedTicket as any).avaliacao ? 'text-amber-400 fill-amber-400' : 'text-slate-600')} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                    <MessageSquare size={32} className="mb-2 text-[var(--color-text-secondary)]" />
                    <p className="text-sm">Sem mensagens ainda</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSuperAdmin = !!msg.e_superadmin
                    const authorName = msg.profiles?.nome_completo ?? (isSuperAdmin ? 'Equipe de Suporte' : 'Desconhecido')
                    const authorRole = msg.profiles?.role ?? ''

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex flex-col max-w-[75%]',
                          isSuperAdmin ? 'ml-auto items-end' : 'mr-auto items-start',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={cn(
                              'flex items-center gap-1.5',
                              isSuperAdmin ? 'flex-row-reverse' : 'flex-row',
                            )}
                          >
                            <span className="text-xs font-semibold text-[var(--color-text-dim)]">{authorName}</span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                                isSuperAdmin
                                  ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
                                  : 'bg-slate-800/10 text-[var(--color-text-muted)] ring-slate-500/20',
                              )}
                            >
                              {isSuperAdmin ? (
                                <>
                                  <Shield size={9} />
                                  SuperAdmin
                                </>
                              ) : (
                                <>
                                  <User size={9} />
                                  {authorRole || 'Clinica'}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            isSuperAdmin
                              ? 'bg-purple-600/30 text-purple-100 rounded-tr-md'
                              : 'bg-slate-700/50 text-slate-200 rounded-tl-md',
                          )}
                        >
                          {msg.imagem_url && (
                            <a href={msg.imagem_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                              <img src={msg.imagem_url} alt="Anexo" className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            </a>
                          )}
                          {msg.conteudo && <p>{msg.conteudo}</p>}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-muted)] mt-1 px-1">
                          {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-slate-700/50">
                {isChatDisabled ? (
                  <div className="text-center py-2 text-sm text-[var(--color-text-muted)]">
                    Ticket {selectedTicket.status === 'fechado' ? 'fechado' : 'resolvido'} - mensagens desabilitadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Quick Replies */}
                    {showQuickReplies && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {QUICK_REPLIES.map((qr, i) => (
                          <button key={i}
                            onClick={() => { setMessageText(qr); setShowQuickReplies(false) }}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors truncate max-w-[250px]">
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-slate-700/50" />
                        <button onClick={() => { setImagePreview(null); setSelectedFile(null) }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"><X size={12} /></button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <button onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className={cn("p-2.5 rounded-xl transition-colors shrink-0", showQuickReplies ? "text-purple-400 bg-purple-500/10" : "text-[var(--color-text-muted)] hover:text-purple-400 hover:bg-slate-800/60")}
                        title="Respostas rapidas">
                        <Zap size={18} />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-purple-400 hover:bg-slate-800/60 transition-colors shrink-0" title="Enviar imagem">
                        <Paperclip size={18} />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={handleMessageKeyDown}
                        placeholder="Digite sua mensagem..." rows={2}
                        className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-[var(--color-text-muted)] transition-all resize-none" />
                      <button onClick={handleSendMessage} disabled={(!messageText.trim() && !selectedFile) || sendingMessage}
                        className={cn('p-3 rounded-xl transition-colors shrink-0',
                          (messageText.trim() || selectedFile) && !sendingMessage ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800/60 text-[var(--color-text-secondary)] cursor-not-allowed')}>
                        {sendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Novo Ticket</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1.5">Assunto</label>
                <input
                  type="text"
                  value={newTicketForm.assunto}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, assunto: e.target.value }))}
                  placeholder="Assunto do ticket..."
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-[var(--color-text-muted)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1.5">Descricao</label>
                <textarea
                  value={newTicketForm.descricao}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o problema..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-[var(--color-text-muted)] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1.5">Prioridade</label>
                  <select
                    value={newTicketForm.prioridade}
                    onChange={(e) => setNewTicketForm((f) => ({ ...f, prioridade: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-sm rounded-xl cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1.5">Clinica</label>
                  <select
                    value={newTicketForm.clinica_id}
                    onChange={(e) => setNewTicketForm((f) => ({ ...f, clinica_id: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 text-[var(--color-text-dim)] text-sm rounded-xl cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value="">Nenhuma</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicketForm.assunto.trim() || creatingTicket}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors',
                  newTicketForm.assunto.trim() && !creatingTicket
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-800 text-[var(--color-text-secondary)] cursor-not-allowed',
                )}
              >
                {creatingTicket && <Loader2 size={14} className="animate-spin" />}
                Criar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
