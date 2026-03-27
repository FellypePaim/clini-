import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Search,
  Building2,
  Users,
  UserCheck,
  CalendarCheck,
  Target,
  MessageCircle,
  LogIn,
  PauseCircle,
  PlayCircle,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { NovaClinicaModal } from '../../components/superadmin/NovaClinicaModal'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface Clinic {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  logo_url: string | null
  created_at: string
  status: string
  plano: string
  users: number
  pacientes: number
  consultas: number
  leads: number
  whatsapp: { total: number; online: number }
}

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspensa', label: 'Suspensas' },
] as const

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ativo: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'ATIVO' },
    trial: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'TRIAL' },
    suspensa: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'SUSPENSA' },
  }
  const s = map[status] ?? { bg: 'bg-slate-500/10', text: 'text-slate-400', label: status.toUpperCase() }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider',
        s.bg,
        s.text,
      )}
    >
      {s.label}
    </span>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        <Icon size={13} />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  )
}

export function SuperClinicasPage() {
  const {
    getClinics,
    suspendClinic,
    reactivateClinic,
    deleteClinic,
    impersonateClinic,
    isLoading,
  } = useSuperAdmin()
  const toast = useToast((s) => s.toast)

  const [clinics, setClinics] = useState<Clinic[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const loadClinics = useCallback(async () => {
    const data = await getClinics()
    setClinics(data as Clinic[])
  }, [getClinics])

  useEffect(() => {
    loadClinics()
  }, [loadClinics])

  const filtered = clinics.filter((c) => {
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      c.nome.toLowerCase().includes(term) ||
      (c.cnpj && c.cnpj.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleSuspend(clinic: Clinic) {
    const reason = window.prompt('Motivo da suspensao:')
    if (!reason) return
    setActionLoadingId(clinic.id)
    await suspendClinic(clinic.id, reason)
    await loadClinics()
    setActionLoadingId(null)
  }

  async function handleReactivate(clinic: Clinic) {
    setActionLoadingId(clinic.id)
    await reactivateClinic(clinic.id)
    await loadClinics()
    setActionLoadingId(null)
  }

  async function handleDelete(clinic: Clinic) {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a clinica "${clinic.nome}"? Esta acao e irreversivel.`,
    )
    if (!confirmed) return
    setActionLoadingId(clinic.id)
    await deleteClinic(clinic.id)
    await loadClinics()
    setActionLoadingId(null)
  }

  async function handleImpersonate(clinic: Clinic) {
    setActionLoadingId(clinic.id)
    await impersonateClinic(clinic.id)
    setActionLoadingId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Gestao de Clinicas</h1>
          <p className="text-slate-400 font-medium">
            Controle total sobre as clinicas cadastradas na plataforma.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          Nova Clinica
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-slate-800/60 transition-all font-medium"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && clinics.length === 0 && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-800/20 border border-dashed border-slate-700/50 rounded-3xl text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma clinica encontrada</h3>
          <p className="text-slate-500">Tente ajustar seus filtros ou busca.</p>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((clinic) => {
          const isActionLoading = actionLoadingId === clinic.id
          const isSuspended = clinic.status === 'suspensa'

          return (
            <div
              key={clinic.id}
              className={cn(
                'bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/60 transition-all relative overflow-hidden',
                isSuspended && 'opacity-75',
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/30 overflow-hidden">
                    {clinic.logo_url ? (
                      <img
                        src={clinic.logo_url}
                        alt={clinic.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="text-slate-500" size={24} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate">{clinic.nome}</h3>
                    <p className="text-xs font-medium text-slate-500 truncate">
                      {clinic.cnpj ? `CNPJ: ${clinic.cnpj}` : 'CNPJ nao informado'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                  {statusBadge(clinic.status)}
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Desde {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Plano label */}
              <div className="mb-4">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                  Plano {clinic.plano}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <MetricCard icon={Users} label="Usuarios" value={clinic.users} />
                <MetricCard icon={UserCheck} label="Pacientes" value={clinic.pacientes} />
                <MetricCard icon={CalendarCheck} label="Consultas" value={clinic.consultas} />
                <MetricCard icon={Target} label="Leads" value={clinic.leads} />
              </div>

              {/* WhatsApp indicator */}
              <div className="flex items-center gap-2 mb-5 px-1">
                <MessageCircle size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-400">
                  WhatsApp: {clinic.whatsapp.online}/{clinic.whatsapp.total} online
                </span>
                {clinic.whatsapp.online > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between relative z-10 border-t border-slate-700/30 pt-4">
                <button
                  disabled={isActionLoading}
                  onClick={() => handleImpersonate(clinic)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <LogIn size={14} />
                  )}
                  Impersonar
                </button>

                <div className="flex items-center gap-2">
                  {isSuspended ? (
                    <button
                      disabled={isActionLoading}
                      onClick={() => handleReactivate(clinic)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                      title="Reativar clinica"
                    >
                      <PlayCircle size={14} />
                      Reativar
                    </button>
                  ) : (
                    <button
                      disabled={isActionLoading}
                      onClick={() => handleSuspend(clinic)}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                      title="Suspender clinica"
                    >
                      <PauseCircle size={14} />
                      Suspender
                    </button>
                  )}
                  <button
                    disabled={isActionLoading}
                    onClick={() => handleDelete(clinic)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                    title="Deletar clinica"
                  >
                    <Trash2 size={14} />
                    Deletar
                  </button>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[80px] -mr-10 -mt-10 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/5 blur-[60px] -ml-10 -mb-10 rounded-full pointer-events-none" />
            </div>
          )
        })}
      </div>

      {/* Nova Clinica Modal */}
      <NovaClinicaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadClinics}
      />
    </div>
  )
}
