import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search,
  ChevronDown,
  Building2,
  Plus,
  X,
  Loader2,
  UserPlus,
  Users,
  Power,
  Mail,
  Clock,
  Shield,
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface User {
  id: string
  nome_completo: string
  email: string
  role: string
  clinica_id: string | null
  ativo: boolean
  especialidade: string | null
  telefone: string | null
  avatar_url: string | null
  created_at: string
  clinicas: { nome: string } | null
  last_login: string | null
}

interface Clinic {
  id: string
  nome: string
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  admin: { label: 'Admin', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  profissional: { label: 'Profissional', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  recepcao: { label: 'Recepcao', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  superadmin: { label: 'SuperAdmin', bg: 'bg-red-500/15', text: 'text-red-400' },
}

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'recepcao', label: 'Recepcao' },
  { value: 'superadmin', label: 'SuperAdmin' },
]

function formatLastLogin(value: string | null): string {
  if (!value) return 'Nunca'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SuperUsuariosPage() {
  const { getUsers, createUser, updateUser, getClinics, isLoading } = useSuperAdmin()
  const { toast } = useToast()

  const [usuarios, setUsuarios] = useState<User[]>([])
  const [clinicas, setClinicas] = useState<Clinic[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Track which row has an open clinic dropdown
  const [clinicDropdownUserId, setClinicDropdownUserId] = useState<string | null>(null)
  const clinicDropdownRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    setLoadingUsers(true)
    const [usersData, clinicsData] = await Promise.all([getUsers(), getClinics()])
    setUsuarios(usersData)
    setClinicas(clinicsData)
    setLoadingUsers(false)
  }, [getUsers, getClinics])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close clinic dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clinicDropdownRef.current && !clinicDropdownRef.current.contains(e.target as Node)) {
        setClinicDropdownUserId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase()
    const matchSearch =
      !term ||
      u.nome_completo?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  // ------ Action handlers ------

  async function handleToggleAtivo(user: User) {
    const newAtivo = !user.ativo
    const ok = await updateUser(user.id, { ativo: newAtivo })
    if (ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ativo: newAtivo } : u)),
      )
    }
  }

  async function handleRoleChange(user: User, newRole: string) {
    if (newRole === user.role) return
    const ok = await updateUser(user.id, { role: newRole })
    if (ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      )
    }
  }

  async function handleClinicChange(user: User, newClinicId: string) {
    const clinica_id = newClinicId || null
    const ok = await updateUser(user.id, { clinica_id })
    if (ok) {
      const clinic = clinicas.find((c) => c.id === newClinicId)
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, clinica_id, clinicas: clinic ? { nome: clinic.nome } : null }
            : u,
        ),
      )
    }
    setClinicDropdownUserId(null)
  }

  // ------ Render helpers ------

  function RoleBadge({ role }: { role: string }) {
    const cfg = ROLE_CONFIG[role] ?? { label: role, bg: 'bg-slate-500/15', text: 'text-slate-400' }
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
          cfg.bg,
          cfg.text,
        )}
      >
        {cfg.label}
      </span>
    )
  }

  function StatusDot({ ativo }: { ativo: boolean }) {
    return (
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            ativo ? 'bg-green-500' : 'bg-red-500',
          )}
        />
        <span
          className={cn(
            'text-[10px] font-black uppercase tracking-widest',
            ativo ? 'text-green-500' : 'text-red-500',
          )}
        >
          {ativo ? 'Ativo' : 'Inativo'}
        </span>
      </span>
    )
  }

  // ------ Main render ------

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Gestao de Usuarios</h1>
        <p className="text-slate-400 font-medium mt-1">
          Gerencie todos os usuarios e permissoes da plataforma.
        </p>
      </div>

      {/* Toolbar: search + filter + create */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-slate-800/60 transition-all font-medium"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-4 pr-10 text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>

        {/* Create user button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          Criar Usuario
        </button>
      </div>

      {/* Loading state */}
      {loadingUsers && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loadingUsers && (
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  <th className="px-6 py-5">Usuario</th>
                  <th className="px-6 py-5">Clinica</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Ultimo Acesso</th>
                  <th className="px-6 py-5 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredUsuarios.map((user) => {
                  const isSuperAdmin = user.role === 'superadmin'
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Avatar + Name + Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700/50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-sm text-slate-400 border border-slate-700/50 group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all">
                              {user.nome_completo?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-200 truncate">
                              {user.nome_completo || 'Sem nome'}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                              <Mail size={11} className="flex-shrink-0" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Clinica */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-400 truncate">
                            {user.clinicas?.nome || 'Sem clinica'}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusDot ativo={user.ativo} />
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={12} className="flex-shrink-0" />
                          {formatLastLogin(user.last_login)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin ? (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Protegido
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle ativo/inativo */}
                            <button
                              onClick={() => handleToggleAtivo(user)}
                              className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                                user.ativo ? 'bg-green-600' : 'bg-slate-700',
                              )}
                              title={user.ativo ? 'Desativar usuario' : 'Ativar usuario'}
                            >
                              <span
                                className={cn(
                                  'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                                  user.ativo ? 'translate-x-6' : 'translate-x-1',
                                )}
                              />
                            </button>

                            {/* Role change dropdown */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="profissional">Profissional</option>
                              <option value="recepcao">Recepcao</option>
                            </select>

                            {/* Move to clinic */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setClinicDropdownUserId(
                                    clinicDropdownUserId === user.id ? null : user.id,
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                                title="Mover para clinica"
                              >
                                <Building2 size={12} />
                                <ChevronDown size={12} />
                              </button>
                              {clinicDropdownUserId === user.id && (
                                <div
                                  ref={clinicDropdownRef}
                                  className="absolute right-0 top-full mt-1 z-50 w-56 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl py-1 max-h-60 overflow-y-auto"
                                >
                                  <button
                                    onClick={() => handleClinicChange(user, '')}
                                    className={cn(
                                      'w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors',
                                      !user.clinica_id
                                        ? 'text-purple-400'
                                        : 'text-slate-400',
                                    )}
                                  >
                                    Sem clinica
                                  </button>
                                  {clinicas.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => handleClinicChange(user, c.id)}
                                      className={cn(
                                        'w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors',
                                        user.clinica_id === c.id
                                          ? 'text-purple-400'
                                          : 'text-slate-400',
                                      )}
                                    >
                                      {c.nome}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredUsuarios.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Users size={48} className="text-slate-800 mb-4" />
              <p className="text-slate-500 font-bold text-sm">
                Nenhum usuario encontrado.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create user modal */}
      {showCreateModal && (
        <CreateUserModal
          clinicas={clinicas}
          isLoading={isLoading}
          onClose={() => setShowCreateModal(false)}
          onSave={async (formData) => {
            const result = await createUser(formData)
            if (result) {
              setShowCreateModal(false)
              loadData()
            }
          }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────
// Create User Modal
// ────────────────────────────────────────────────────

function CreateUserModal({
  clinicas,
  isLoading,
  onClose,
  onSave,
}: {
  clinicas: Clinic[]
  isLoading: boolean
  onClose: () => void
  onSave: (data: {
    nome_completo: string
    email: string
    senha: string
    role: string
    clinica_id: string
  }) => void
}) {
  const [form, setForm] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    role: 'profissional',
    clinica_id: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  const inputClass =
    'w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all'
  const labelClass =
    'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Criar Usuario</h2>
              <p className="text-xs text-slate-500">Adicionar novo usuario a plataforma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Nome completo *</label>
            <input
              value={form.nome_completo}
              onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
              required
              className={inputClass}
              placeholder="Nome do usuario"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={inputClass}
                placeholder="email@clinica.com"
              />
            </div>
            <div>
              <label className={labelClass}>Senha *</label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
                minLength={6}
                className={inputClass}
                placeholder="Min. 6 caracteres"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Funcao *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              >
                <option value="admin">Administrador</option>
                <option value="profissional">Profissional</option>
                <option value="recepcao">Recepcao</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Clinica</label>
              <select
                value={form.clinica_id}
                onChange={(e) => setForm({ ...form, clinica_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Sem clinica (pendente)</option>
                {clinicas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
