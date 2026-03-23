import React, { useEffect, useState, useCallback } from 'react'
import {
  Search,
  Filter,
  Mail,
  Shield,
  Clock,
  Key,
  Building2,
  Unlock,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  Loader2,
  UserPlus
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

export function SuperUsuariosPage() {
  const { getUsers, createUser, getClinics, isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clinicas, setClinicas] = useState<any[]>([])

  const handleLoad = useCallback(async () => {
    const data = await getUsers()
    setUsuarios(data)
  }, [getUsers])

  useEffect(() => {
    handleLoad()
  }, [handleLoad])

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = u.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter ? u.role === roleFilter : true
    return matchSearch && matchRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return <Badge className="bg-purple-500/10 text-purple-500 border-none text-[9px] font-black">SUPERADMIN</Badge>
      case 'admin': return <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black">ADMIN</Badge>
      case 'profissional': return <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] font-black">PROFISSIONAL</Badge>
      case 'recepcao': return <Badge className="bg-slate-500/10 text-slate-500 border-none text-[9px] font-black">RECEPÇÃO</Badge>
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-none text-[9px] font-black">{role.toUpperCase()}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Gestão Global de Usuários</h1>
        <p className="text-slate-400 font-medium">Visualize e gerencie todos os acessos de todas as clínicas da plataforma.</p>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-slate-800/60 transition-all font-medium"
            />
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setRoleFilter(prev => prev === 'superadmin' ? null : 'superadmin')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border border-slate-700/50 font-bold rounded-2xl transition-all",
                roleFilter === 'superadmin' ? "bg-purple-600 text-white" : "bg-slate-800/40 text-slate-300 hover:bg-slate-800/60"
              )}
            >
                <Filter size={20} />
                Filtrar SuperAdmins
            </button>
            <button
               onClick={async () => {
                 const data = await getClinics()
                 setClinicas(data)
                 setShowCreateModal(true)
               }}
               className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 group"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                CRIAR USUÁRIO
            </button>
         </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-800/20 border border-slate-700/30 rounded-[32px] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     <th className="px-8 py-6">Usuário / Perfil</th>
                     <th className="px-8 py-6">Clínica Vinculada</th>
                     <th className="px-8 py-6">Nível de Acesso</th>
                     <th className="px-8 py-6">Status / Atividade</th>
                     <th className="px-8 py-6 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  {filteredUsuarios.map((user, _i) => (
                     <tr key={user.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-lg border border-slate-700/50">
                                 {user.nome_completo?.charAt(0) || 'U'}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-200 group-hover:text-white">{user.nome_completo || 'Sem Nome'}</span>
                                 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                    <Mail size={12} className="text-slate-600" />
                                    {user.email}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <div className="p-2 bg-slate-900/50 rounded-lg">
                                 <Building2 size={16} className="text-slate-500" />
                              </div>
                              <span className="text-xs font-bold text-slate-400">{user.clinicas?.nome || 'SuperAdmin Restricted'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           {getRoleBadge(user.role)}
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ATIVO</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                 <Clock size={12} />
                                 {user.last_login ? `Último acesso: ${new Date(user.last_login).toLocaleDateString()}` : 'Nunca acessou'}
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toast({ title: 'Reset de Senha', description: `Link de redefinição enviado para ${user.email}.`, type: 'info' })}
                                className="p-2 bg-slate-800/50 hover:bg-purple-600 text-slate-500 hover:text-white rounded-xl transition-all shadow-sm"
                                title="Resetar senha"
                              >
                                 <Key size={16} />
                              </button>
                              <button
                                onClick={() => toast({ title: 'Acesso Desbloqueado', description: `Usuário ${user.nome_completo || user.email} desbloqueado.`, type: 'success' })}
                                className="p-2 bg-slate-800/50 hover:bg-amber-600 text-slate-500 hover:text-white rounded-xl transition-all shadow-sm"
                                title="Desbloquear usuário"
                              >
                                 <Unlock size={16} />
                              </button>
                              <button
                                onClick={() => { navigator.clipboard.writeText(user.id); toast({ title: 'ID Copiado', description: `UUID do usuário ${user.nome_completo || user.email} copiado.`, type: 'success' }) }}
                                className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-500 hover:text-white rounded-xl transition-all"
                                title="Copiar ID do usuário"
                              >
                                 <MoreHorizontal size={16} />
                              </button>
                              <ChevronRight className="text-slate-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" size={20} />
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {filteredUsuarios.length === 0 && !isLoading && (
             <div className="p-20 text-center">
                <Shield size={48} className="text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Nenhum usuário correspondente aos filtros.</p>
             </div>
         )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Modal Criar Usuário */}
      {showCreateModal && (
        <CriarUsuarioModal
          clinicas={clinicas}
          onClose={() => setShowCreateModal(false)}
          onSave={async (formData) => {
            const result = await createUser(formData)
            if (result) {
              setShowCreateModal(false)
              handleLoad()
            }
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════
// Modal de Criação de Usuário
// ════════════════════════════════════════════════
function CriarUsuarioModal({ clinicas, onClose, onSave, isLoading }: {
  clinicas: any[]
  onClose: () => void
  onSave: (data: any) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'profissional',
    clinica_id: '',
    especialidade: '',
    conselho: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Criar Usuário</h2>
              <p className="text-xs text-slate-500">Adicionar novo usuário à plataforma</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome completo *</label>
            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              placeholder="Nome do usuário" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                placeholder="email@clinica.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Senha *</label>
              <input type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} required minLength={6}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                placeholder="Min. 6 caracteres" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Função *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm">
                <option value="admin">Administrador</option>
                <option value="profissional">Profissional</option>
                <option value="recepcao">Recepção</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Clínica</label>
              <select value={form.clinica_id} onChange={e => setForm({ ...form, clinica_id: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm">
                <option value="">Sem clínica (pendente)</option>
                {clinicas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Especialidade</label>
              <input value={form.especialidade} onChange={e => setForm({ ...form, especialidade: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                placeholder="Ex: Dermatologia" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Conselho</label>
              <input value={form.conselho} onChange={e => setForm({ ...form, conselho: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                placeholder="CRM/SP 123456" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-70 text-sm">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><Plus className="w-4 h-4" /> Criar Usuário</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
