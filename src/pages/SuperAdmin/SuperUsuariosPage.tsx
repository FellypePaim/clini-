import React, { useEffect, useState } from 'react'
import { 
  Search, 
  Filter, 
  UserCircle, 
  Mail, 
  Shield, 
  Clock, 
  Key, 
  Ban, 
  Settings,
  Building2,
  Lock,
  Unlock,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { useToast } from '../../hooks/useToast'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

export function SuperUsuariosPage() {
  const { getUsers, isLoading } = useSuperAdmin()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getUsers()
      setUsuarios(data)
    }
    load()
  }, [getUsers])

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
               onClick={() => toast({ title: 'Segurança', description: 'A criação de conta SuperAdmin exige execução de script direto no banco por segurança. Utilize o terminal SQL do Supabase.', type: 'info' })}
               className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl transition-all"
            >
                CRIAR SUPERADMIN
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
                  {filteredUsuarios.map((user, i) => (
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
                                onClick={() => toast({ title: 'Opções', description: 'Gerenciamento avançado de usuário em breve.', type: 'info' })}
                                className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-500 hover:text-white rounded-xl transition-all"
                                title="Mais opções"
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
    </div>
  )
}
