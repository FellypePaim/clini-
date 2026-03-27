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
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuporteClinica, type TicketClinica, type TicketMensagem } from '../../hooks/useSuporteClinica'

// ─── Config ──────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critica: { label: 'Critica', className: 'bg-red-50 text-red-600 ring-red-200' },
  alta:    { label: 'Alta',    className: 'bg-amber-50 text-amber-600 ring-amber-200' },
  media:   { label: 'Media',   className: 'bg-blue-50 text-blue-600 ring-blue-200' },
  baixa:   { label: 'Baixa',   className: 'bg-gray-50 text-gray-500 ring-gray-200' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aberto:       { label: 'Aberto',       className: 'bg-blue-50 text-blue-600 ring-blue-200' },
  em_andamento: { label: 'Em andamento', className: 'bg-amber-50 text-amber-600 ring-amber-200' },
  resolvido:    { label: 'Resolvido',    className: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  fechado:      { label: 'Fechado',      className: 'bg-gray-50 text-gray-500 ring-gray-200' },
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
  const { getTickets, createTicket, getMessages, sendMessage, isLoading } = useSuporteClinica()

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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  )

  const isChatDisabled = selectedTicket?.status === 'fechado' || selectedTicket?.status === 'resolvido'

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    const res = await getTickets()
    setTickets(res)
    setLoaded(true)
  }, [getTickets])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Fetch messages when ticket selected
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filtered tickets
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets.filter((t) => {
      if (q && !t.assunto.toLowerCase().includes(q)) return false
      if (statusFilter !== 'todos' && t.status !== statusFilter) return false
      return true
    })
  }, [tickets, search, statusFilter])

  // KPIs
  const kpis = useMemo(() => ({
    total: tickets.length,
    abertos: tickets.filter((t) => t.status === 'aberto').length,
    emAndamento: tickets.filter((t) => t.status === 'em_andamento').length,
    resolvidos: tickets.filter((t) => t.status === 'resolvido').length,
  }), [tickets])

  // Send message
  async function handleSendMessage() {
    if (!selectedTicketId || !messageText.trim() || sendingMessage || isChatDisabled) return
    setSendingMessage(true)
    await sendMessage(selectedTicketId, messageText.trim())
    setMessageText('')
    const res = await getMessages(selectedTicketId)
    setMessages(res)
    await fetchTickets()
    setSendingMessage(false)
  }

  // Create ticket
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
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
          <p className="text-sm text-gray-500 mt-0.5">Abra e acompanhe seus tickets de suporte.</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} />
          Novo Ticket
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* LEFT PANEL — Ticket List */}
        <div className="w-[38%] flex flex-col min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-gray-100">
            {[
              { icon: LifeBuoy, color: 'text-green-500', value: kpis.total, label: 'Total' },
              { icon: AlertCircle, color: 'text-blue-500', value: kpis.abertos, label: 'Abertos' },
              { icon: Clock, color: 'text-amber-500', value: kpis.emAndamento, label: 'Andamento' },
              { icon: CheckCircle2, color: 'text-emerald-500', value: kpis.resolvidos, label: 'Resolvidos' },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="flex flex-col items-center p-2 rounded-xl bg-gray-50">
                <Icon size={14} className={cn(color, 'mb-1')} />
                <span className="text-lg font-bold text-gray-900">{value}</span>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="p-3 space-y-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por assunto..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-green-500/30"
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
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Inbox size={40} className="mb-3 text-gray-300" />
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
                      'w-full text-left p-3 rounded-xl transition-all',
                      'hover:bg-gray-50',
                      selectedTicketId === ticket.id
                        ? 'bg-green-50 border-2 border-green-500/50 shadow-sm'
                        : 'bg-white border-2 border-transparent',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                        {ticket.assunto}
                      </h3>
                      <PriorityBadge prioridade={ticket.prioridade} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={ticket.status} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <MessageSquare size={11} />
                        {ticket.total_mensagens}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[11px] text-gray-400">
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
        <div className="w-[62%] flex flex-col min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-medium">Selecione um ticket para ver a conversa</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{selectedTicket.assunto}</h2>
                    {selectedTicket.descricao && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{selectedTicket.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={selectedTicket.status} />
                    <PriorityBadge prioridade={selectedTicket.prioridade} />
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageSquare size={32} className="mb-2 text-gray-300" />
                    <p className="text-sm">Sem mensagens ainda</p>
                    <p className="text-xs mt-1">Envie uma mensagem para iniciar a conversa</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSuperAdmin = !!msg.e_superadmin
                    const authorName = msg.profiles?.nome_completo ?? 'Desconhecido'
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
                          <span className="text-xs font-semibold text-gray-600">{authorName}</span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                              isSuperAdmin
                                ? 'bg-purple-50 text-purple-600 ring-purple-200'
                                : 'bg-green-50 text-green-600 ring-green-200',
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
                              ? 'bg-purple-50 text-purple-900 rounded-tl-md border border-purple-100'
                              : 'bg-green-600 text-white rounded-tr-md',
                          )}
                        >
                          {msg.conteudo}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                {isChatDisabled ? (
                  <div className="text-center py-2 text-sm text-gray-400">
                    Ticket {selectedTicket.status === 'fechado' ? 'fechado' : 'resolvido'} — mensagens desabilitadas
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleMessageKeyDown}
                      placeholder="Digite sua mensagem..."
                      rows={2}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 transition-all resize-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className={cn(
                        'p-3 rounded-xl transition-colors shrink-0',
                        messageText.trim() && !sendingMessage
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed',
                      )}
                    >
                      {sendingMessage ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <LifeBuoy size={20} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Novo Ticket</h2>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto *</label>
                <input
                  type="text"
                  value={newTicketForm.assunto}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, assunto: e.target.value }))}
                  placeholder="Ex: Erro ao agendar consulta..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descricao</label>
                <textarea
                  value={newTicketForm.descricao}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o problema com detalhes..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
                <select
                  value={newTicketForm.prioridade}
                  onChange={(e) => setNewTicketForm((f) => ({ ...f, prioridade: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl cursor-pointer outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
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
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicketForm.assunto.trim() || creatingTicket}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors',
                  newTicketForm.assunto.trim() && !creatingTicket
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
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
