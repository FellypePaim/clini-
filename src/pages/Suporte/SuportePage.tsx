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
  Shield,
  User,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuporteClinica, type TicketClinica, type TicketMensagem } from '../../hooks/useSuporteClinica'
import { markSuporteAsRead } from '../../hooks/useUnreadSupporte'

// ─── Config ──────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critica: { label: 'Critica', className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  alta:    { label: 'Alta',    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  media:   { label: 'Media',   className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  baixa:   { label: 'Baixa',   className: 'bg-slate-500/10 text-[var(--color-text-muted)] ring-slate-500/20' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aberto:       { label: 'Aberto',       className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  em_andamento: { label: 'Em andamento', className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  resolvido:    { label: 'Resolvido',    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  fechado:      { label: 'Fechado',      className: 'bg-slate-500/10 text-[var(--color-text-muted)] ring-slate-500/20' },
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('pt-BR') } catch { return dateStr }
}

function formatTime(dateStr: string): string {
  try { return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

function PriorityBadge({ prioridade }: { prioridade: string }) {
  const config = PRIORITY_CONFIG[prioridade] ?? PRIORITY_CONFIG.baixa
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', config.className)}>
      {config.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.fechado
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', config.className)}>
      {config.label}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────

export function SuportePage() {
  const { getTickets, createTicket, getMessages, sendMessage, uploadImage, isLoading } = useSuporteClinica()

  const [tickets, setTickets] = useState<TicketClinica[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loaded, setLoaded] = useState(false)

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMensagem[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({ assunto: '', descricao: '', prioridade: 'media' })
  const [creatingTicket, setCreatingTicket] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  )

  const isChatDisabled = selectedTicket?.status === 'fechado' || selectedTicket?.status === 'resolvido'

  const fetchTickets = useCallback(async () => {
    const res = await getTickets()
    setTickets(res)
    setLoaded(true)
  }, [getTickets])

  useEffect(() => { fetchTickets(); markSuporteAsRead() }, [fetchTickets])

  useEffect(() => {
    if (!selectedTicketId) { setMessages([]); return }
    let cancelled = false
    async function load() {
      setMessagesLoading(true)
      const res = await getMessages(selectedTicketId!)
      if (!cancelled) { setMessages(res); setMessagesLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [selectedTicketId, getMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets.filter((t) => {
      if (q && !t.assunto.toLowerCase().includes(q)) return false
      if (statusFilter !== 'todos' && t.status !== statusFilter) return false
      return true
    })
  }, [tickets, search, statusFilter])

  const kpis = useMemo(() => ({
    total: tickets.length,
    abertos: tickets.filter((t) => t.status === 'aberto').length,
    emAndamento: tickets.filter((t) => t.status === 'em_andamento').length,
    resolvidos: tickets.filter((t) => t.status === 'resolvido').length,
  }), [tickets])

  async function handleSendMessage() {
    if (!selectedTicketId || sendingMessage || isChatDisabled) return
    if (!messageText.trim() && !selectedFile) return

    setSendingMessage(true)
    let imagemUrl: string | undefined

    if (selectedFile) {
      setUploadingImage(true)
      imagemUrl = await uploadImage(selectedFile) || undefined
      setUploadingImage(false)
    }

    await sendMessage(selectedTicketId, messageText.trim() || (imagemUrl ? '' : ''), imagemUrl)
    setMessageText('')
    setSelectedFile(null)
    setImagePreview(null)
    const res = await getMessages(selectedTicketId)
    setMessages(res)
    await fetchTickets()
    setSendingMessage(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCreateTicket() {
    if (!newTicketForm.assunto.trim() || creatingTicket) return
    setCreatingTicket(true)
    const ticket = await createTicket({
      assunto: newTicketForm.assunto.trim(),
      descricao: newTicketForm.descricao.trim() || undefined,
      prioridade: newTicketForm.prioridade,
    })
    setNewTicketForm({ assunto: '', descricao: '', prioridade: 'media' })
    setShowNewTicketModal(false)
    setCreatingTicket(false)
    await fetchTickets()
    if (ticket) setSelectedTicketId(ticket.id)
  }

  function handleMessageKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  if (isLoading && !loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Suporte</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Abra e acompanhe seus tickets de suporte.</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} />
          Novo Ticket
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* LEFT PANEL — Ticket List */}
        <div className="w-[38%] flex flex-col min-h-0 rounded-2xl overflow-hidden border border-[var(--color-border)]" style={{ background: 'var(--color-bg-card)' }}>
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-[var(--color-border)]">
            {[
              { icon: LifeBuoy, color: 'text-cyan-500', value: kpis.total, label: 'Total' },
              { icon: AlertCircle, color: 'text-blue-500', value: kpis.abertos, label: 'Abertos' },
              { icon: Clock, color: 'text-amber-500', value: kpis.emAndamento, label: 'Andamento' },
              { icon: CheckCircle2, color: 'text-emerald-500', value: kpis.resolvidos, label: 'Resolvidos' },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="flex flex-col items-center p-2 rounded-xl" style={{ background: 'var(--color-bg-deep)' }}>
                <Icon size={14} className={cn(color, 'mb-1')} />
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{value}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="p-3 space-y-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por assunto..."
                className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
                style={{ background: 'var(--color-bg-deep)' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-[var(--color-text-muted)] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/30"
                style={{ background: 'var(--color-bg-deep)' }}
              >
                <option value="todos">Todos os Status</option>
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
                <Inbox size={40} className="mb-3 text-[var(--color-text-dim)]" />
                <p className="text-sm font-medium">Nenhum ticket encontrado</p>
                <p className="text-xs mt-1">Abra um ticket para pedir ajuda</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all border-2',
                      'hover:bg-[var(--color-bg-card-hover)]',
                      selectedTicketId === ticket.id
                        ? 'border-cyan-500/50 bg-[var(--color-bg-card-hover)]'
                        : 'border-transparent',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1 flex-1">
                        {ticket.assunto}
                      </h3>
                      <PriorityBadge prioridade={ticket.prioridade} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={ticket.status} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                        <MessageSquare size={11} />
                        {ticket.total_mensagens}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {formatDate(ticket.created_at)} {formatTime(ticket.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Chat */}
        <div className="w-[62%] flex flex-col min-h-0 rounded-2xl overflow-hidden border border-[var(--color-border)]" style={{ background: 'var(--color-bg-card)' }}>
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <MessageSquare size={48} className="mb-4 text-[var(--color-text-dim)]" />
              <p className="text-sm font-medium">Selecione um ticket para ver a conversa</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--color-border)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] truncate">{selectedTicket.assunto}</h2>
                    {selectedTicket.descricao && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{selectedTicket.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={selectedTicket.status} />
                    <PriorityBadge prioridade={selectedTicket.prioridade} />
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--color-bg-deep)' }}>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                    <MessageSquare size={32} className="mb-2 text-[var(--color-text-dim)]" />
                    <p className="text-sm">Sem mensagens ainda</p>
                    <p className="text-xs mt-1">Envie uma mensagem para iniciar a conversa</p>
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
                          isSuperAdmin ? 'mr-auto items-start' : 'ml-auto items-end',
                        )}
                      >
                        <div className={cn('flex items-center gap-2 mb-1', isSuperAdmin ? 'flex-row' : 'flex-row-reverse')}>
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{authorName}</span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                              isSuperAdmin
                                ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
                            )}
                          >
                            {isSuperAdmin ? (
                              <><Shield size={9} /> Suporte</>
                            ) : (
                              <><User size={9} /> {authorRole || 'Voce'}</>
                            )}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            isSuperAdmin
                              ? 'bg-purple-600/20 text-purple-100 rounded-tl-md border border-purple-500/20'
                              : 'bg-cyan-600 text-white rounded-tr-md',
                          )}
                        >
                          {msg.imagem_url && (
                            <a href={msg.imagem_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                              <img
                                src={msg.imagem_url}
                                alt="Anexo"
                                className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
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
              <div className="p-3 border-t border-[var(--color-border)]">
                {isChatDisabled ? (
                  <div className="text-center py-2 text-sm text-[var(--color-text-muted)]">
                    Ticket {selectedTicket.status === 'fechado' ? 'fechado' : 'resolvido'} — mensagens desabilitadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-[var(--color-border)]" />
                        <button
                          onClick={() => { setImagePreview(null); setSelectedFile(null) }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-cyan-500 hover:bg-[var(--color-bg-card-hover)] transition-colors shrink-0"
                        title="Enviar imagem"
                      >
                        <Paperclip size={18} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleMessageKeyDown}
                        placeholder="Digite sua mensagem..."
                        rows={2}
                        className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all resize-none"
                        style={{ background: 'var(--color-bg-deep)' }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={(!messageText.trim() && !selectedFile) || sendingMessage}
                        className={cn(
                          'p-3 rounded-xl transition-colors shrink-0',
                          (messageText.trim() || selectedFile) && !sendingMessage
                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                            : 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-dim)] cursor-not-allowed',
                        )}
                      >
                        {sendingMessage ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-[var(--color-border)] shadow-2xl" style={{ background: 'var(--color-bg-base)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <LifeBuoy size={20} className="text-cyan-500" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Novo Ticket</h2>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Assunto *</label>
                <input
                  type="text"
                  value={newTicketForm.assunto}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, assunto: e.target.value }))}
                  placeholder="Ex: Erro ao agendar consulta..."
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all"
                  style={{ background: 'var(--color-bg-card)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Descricao</label>
                <textarea
                  value={newTicketForm.descricao}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o problema com detalhes..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-[var(--color-text-muted)] transition-all resize-none"
                  style={{ background: 'var(--color-bg-card)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Prioridade</label>
                <select
                  value={newTicketForm.prioridade}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, prioridade: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm rounded-xl cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                  style={{ background: 'var(--color-bg-card)' }}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Critica</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicketForm.assunto.trim() || creatingTicket}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors',
                  newTicketForm.assunto.trim() && !creatingTicket
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-[var(--color-bg-card-hover)] text-[var(--color-text-dim)] cursor-not-allowed',
                )}
              >
                {creatingTicket && <Loader2 size={14} className="animate-spin" />}
                Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
