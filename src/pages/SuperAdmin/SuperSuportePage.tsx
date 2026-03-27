import { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'

interface Ticket {
  id: string
  clinica_id: string | null
  assunto: string
  descricao: string
  status: string
  prioridade: string
  responsavel_id: string | null
  created_at: string
  updated_at: string
  clinica_nome: string
  total_mensagens: number
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  critica: { label: 'Critica', className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  alta:    { label: 'Alta',    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  media:   { label: 'Media',   className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  baixa:   { label: 'Baixa',   className: 'bg-slate-500/10 text-slate-400 ring-slate-500/20' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aberto:       { label: 'Aberto',       className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  em_andamento: { label: 'Em andamento', className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  resolvido:    { label: 'Resolvido',    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  fechado:      { label: 'Fechado',      className: 'bg-slate-500/10 text-slate-400 ring-slate-500/20' },
}

function formatDatePtBR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
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
  const { getSuporte, isLoading } = useSuperAdmin()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function fetchTickets() {
      const res = await getSuporte()
      if (Array.isArray(res)) setTickets(res)
      setLoaded(true)
    }
    fetchTickets()
  }, [getSuporte])

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

  const kpis = useMemo(() => {
    const total = tickets.length
    const abertos = tickets.filter((t) => t.status === 'aberto').length
    const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length
    const resolvidos = tickets.filter((t) => t.status === 'resolvido').length
    return { total, abertos, emAndamento, resolvidos }
  }, [tickets])

  if (isLoading && !loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Suporte</h1>
        <p className="text-slate-400 mt-1">Gerenciamento de tickets de suporte das clinicas.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Tickets"
          value={kpis.total}
          icon={<LifeBuoy size={20} />}
          iconClassName="text-purple-400 bg-purple-500/10"
        />
        <KpiCard
          label="Abertos"
          value={kpis.abertos}
          icon={<AlertCircle size={20} />}
          iconClassName="text-blue-400 bg-blue-500/10"
        />
        <KpiCard
          label="Em Andamento"
          value={kpis.emAndamento}
          icon={<Clock size={20} />}
          iconClassName="text-amber-400 bg-amber-500/10"
        />
        <KpiCard
          label="Resolvidos"
          value={kpis.resolvidos}
          icon={<CheckCircle2 size={20} />}
          iconClassName="text-emerald-400 bg-emerald-500/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por assunto ou clinica..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-slate-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm rounded-xl cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
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
            className="px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm rounded-xl cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/50"
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Inbox size={48} className="mb-4 text-slate-600" />
          <p className="text-sm font-medium">Nenhum ticket de suporte encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Assunto
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Clinica
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  Mensagens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-semibold text-white line-clamp-1">
                      {ticket.assunto}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm text-slate-400">{ticket.clinica_nome}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge prioridade={ticket.prioridade} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-slate-500">{formatDatePtBR(ticket.created_at)}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <MessageSquare size={13} className="text-slate-600" />
                      {ticket.total_mensagens}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconClassName: string
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
      <div className={cn('p-2.5 rounded-xl', iconClassName)}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}
