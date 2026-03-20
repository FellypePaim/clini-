import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Settings, 
  PauseCircle, 
  Ban, 
  UserPlus, 
  Layout, 
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useSuperAdmin } from '../../hooks/useSuperAdmin'
import { Badge } from '../../components/ui/Badge'
import { NovaClinicaModal } from '../../components/superadmin/NovaClinicaModal'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

export function SuperClinicasPage() {
  const { getClinics, isLoading, suspendClinic, impersonateClinic } = useSuperAdmin()
  const { toast } = useToast()
  const [clinicas, setClinicas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)


  const handleLoad = async () => {
    const data = await getClinics()
    setClinicas(data)
  }

  useEffect(() => {
    handleLoad()
  }, [getClinics])

  const filteredClinicas = clinicas.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa': return <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-black">ATIVA</Badge>
      case 'trial': return <Badge className="bg-blue-500/10 text-blue-500 border-none text-[10px] font-black">TRIAL</Badge>
      case 'suspensa': return <Badge className="bg-red-500/10 text-red-500 border-none text-[10px] font-black">SUSPENSA</Badge>
      case 'cancelada': return <Badge className="bg-slate-500/10 text-slate-500 border-none text-[10px] font-black">CANCELADA</Badge>
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-none text-[10px] font-black">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Gestão de Clínicas</h1>
          <p className="text-slate-400 font-medium">Controle total sobre as instâncias configuradas na plataforma.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 group"
        >
           <Plus size={20} className="group-hover:rotate-90 transition-transform" />
           NOVA CLÍNICA
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-slate-800/60 transition-all font-medium"
            />
         </div>
         <button 
            onClick={() => toast({ title: 'Filtros em breve', description: 'Por enquanto, use a busca rápida.', type: 'info' })}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border border-slate-700/50 text-slate-300 font-bold rounded-2xl hover:bg-slate-800/60 transition-all"
         >
            <Filter size={20} />
            Filtros
         </button>
      </div>

      {/* Grid de Clínicas (Visualização em Cards) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredClinicas.map((clinica) => (
          <div key={clinica.id} className="bg-slate-800/40 border border-slate-700/50 rounded-[32px] p-6 hover:bg-slate-800/60 transition-all group relative overflow-hidden">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-6 relative z-10">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/30 overflow-hidden shadow-xl">
                   {clinica.logo_url ? (
                     <img src={clinica.logo_url} alt={clinica.nome} className="w-full h-full object-cover" />
                   ) : (
                     <Building2 className="text-slate-500 w-7 h-7" />
                   )}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">{clinica.nome}</h3>
                    <p className="text-xs font-bold text-slate-500 tracking-wider">CNPJ: {clinica.cnpj || 'Não informado'}</p>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                 {getStatusBadge(clinica.status_plano || 'trial')}
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Desde {new Date(clinica.created_at).toLocaleDateString()}</p>
               </div>
            </div>

            {/* Infos e Métricas Rápidas */}
            <div className="grid grid-cols-3 gap-4 mb-8">
               <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                     <Users size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Usuários</span>
                  </div>
                  <p className="text-lg font-black text-white">12</p>
               </div>
               <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                     <Calendar size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Consultas</span>
                  </div>
                  <p className="text-lg font-black text-white">428</p>
               </div>
               <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                     <Layout size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Plano</span>
                  </div>
                  <p className="text-xs font-black text-purple-400 uppercase tracking-wider">{clinica.planos?.nome || 'PRO'}</p>
               </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => impersonateClinic(clinica.id)}
                   className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                   title="Entrar como esta clínica"
                 >
                   <Eye size={16} /> ENTRAR
                 </button>
                 <button className="p-2.5 bg-slate-700/30 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                   <Settings size={18} />
                 </button>
               </div>

               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => suspendClinic(clinica.id, 'Suspensão manual via SuperAdmin')}
                   className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                   title="Suspender acesso"
                 >
                   <PauseCircle size={18} />
                 </button>
                 <button className="p-2.5 bg-slate-700/30 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                   <MoreVertical size={18} />
                 </button>
               </div>
            </div>

            {/* Decoração Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[80px] -mr-10 -mt-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/5 blur-[60px] -ml-10 -mb-10 rounded-full" />
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}

      {!isLoading && filteredClinicas.length === 0 && (
         <div className="flex flex-col items-center justify-center py-32 bg-slate-800/20 border border-dashed border-slate-700/50 rounded-[40px] text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
               <Building2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma clínica encontrada</h3>
            <p className="text-slate-500">Tente ajustar seus filtros ou busca.</p>
         </div>
      )}

      <NovaClinicaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLoad}
      />
    </div>
  )
}
