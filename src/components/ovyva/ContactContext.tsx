import { useState } from 'react'
import {
  UserPlus,
  ExternalLink,
  Calendar,
  Target,
  Zap,
  BarChart3,
  User,
  Activity,
  ArrowRight,
  Link2,
  X,
  Loader2,
  Save,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OvyvaConversation } from '../../types/ovyva'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'

interface ContactContextProps {
  conversation: OvyvaConversation
  onPatientLinked?: () => void
}

export function ContactContext({ conversation, onPatientLinked }: ContactContextProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const displayName = conversation.contato_nome || 'Novo Contato'
  const isLead = !conversation.paciente_id

  // Extrair primeiro e último nome do contato
  const nameParts = (conversation.contato_nome || '').split(' ')
  const [form, setForm] = useState({
    nome_completo: conversation.contato_nome || '',
    telefone: conversation.contato_telefone || '',
    whatsapp: conversation.contato_telefone || '',
    email: '',
    cpf: '',
    data_nascimento: '',
    genero: '',
    como_conheceu: 'WhatsApp OVYVA',
  })

  const handleSavePaciente = async () => {
    if (!form.nome_completo.trim()) {
      toast({ title: 'Nome obrigatorio', description: 'Preencha o nome do paciente.', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const { data: paciente, error } = await supabase.from('pacientes').insert({
        clinica_id: user?.clinicaId,
        nome_completo: form.nome_completo,
        telefone: form.telefone,
        whatsapp: form.whatsapp,
        email: form.email || null,
        cpf: form.cpf || null,
        data_nascimento: form.data_nascimento || null,
        genero: form.genero || null,
        como_conheceu: form.como_conheceu,
        ativo: true,
      }).select('id').single()

      if (error) throw error

      // Vincular conversa ao paciente
      await supabase.from('ovyva_conversas')
        .update({ paciente_id: paciente.id })
        .eq('id', conversation.id)

      toast({ title: 'Paciente cadastrado', description: `${form.nome_completo} vinculado a esta conversa.`, type: 'success' })
      setShowModal(false)
      onPatientLinked?.()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Falha ao cadastrar.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-80 flex flex-col border-l border-gray-100 h-full bg-white shrink-0 overflow-y-auto custom-scrollbar p-8 animate-fade-in">
       {/* Context Header */}
       <div className="mb-10 text-center flex flex-col items-center">
          <div className="relative inline-block mb-6">
             <Avatar nome={conversation.contato_nome || '?'} size="lg" className="w-24 h-24 text-4xl border-4 border-white shadow-2xl shadow-gray-200/50" />
             {isLead && (
               <div className="absolute -bottom-2 -left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-orange-500/30 whitespace-nowrap">
                  Lead Novo
               </div>
             )}
          </div>
          <h3 className="text-lg font-black text-gray-900 border-none uppercase tracking-widest leading-tight">{displayName}</h3>
          <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-2 bg-gray-50 px-3 py-1 rounded-full">{conversation.contato_telefone}</p>
       </div>

       {/* AI Intent Detection */}
       <div className="mb-10">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> IA & Intencao
          </h4>
          <div className="bg-cyan-500/5 p-6 rounded-[32px] border border-cyan-500/20 relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
             <p className="text-xs font-black text-cyan-600 uppercase tracking-widest leading-relaxed">
               {conversation.metadata?.intent || 'Aguardando classificacao da IA'}
             </p>
             <p className="text-[10px] text-cyan-500/60 font-medium mt-2">
                Precisao baseada no historico de chat
             </p>
          </div>
       </div>

       {/* Patient Profile / Registration */}
       <div className="mb-10 space-y-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Perfil Clinico
          </h4>

          {!isLead ? (
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/pacientes/${conversation.paciente_id}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 transition-all group shadow-sm"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-cyan-500 group-hover:scale-110 transition-transform">
                       <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black text-gray-900 uppercase">Ver Prontuario</p>
                       <p className="text-[9px] text-gray-400 font-medium">Historico Clinico Completo</p>
                    </div>
                 </div>
                 <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3 active:scale-95"
              >
                 <UserPlus className="w-4 h-4" /> Cadastrar como Paciente
              </button>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-orange-800 uppercase flex items-center gap-1"><Link2 className="w-3 h-3" /> Origem</span>
                    <span className="text-[9px] font-black text-orange-600 uppercase bg-orange-100 px-2 py-1 rounded-md">OVYVA AI</span>
                 </div>
                 <div className="h-px bg-orange-200/50" />
                 <button
                   onClick={() => navigate(`/verdesk?search=${conversation.contato_telefone}`)}
                   className="flex items-center justify-between group"
                 >
                    <span className="text-[9px] font-black text-orange-800 uppercase flex items-center gap-1 group-hover:underline">Estagio Verdesk</span>
                    <span className="text-[9px] font-black text-gray-900 uppercase">
                      {conversation.metadata?.lead_stage || 'Novo Lead Remoto'} &rarr;
                    </span>
                 </button>
              </div>
            </div>
          )}
       </div>

       {/* Quick Actions */}
       <div className="mb-10">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> Acoes Rapidas
          </h4>
          <div className="grid grid-cols-2 gap-4">
             <ActionButton icon={<Calendar className="w-5 h-5" />} label="Agendar" color="green" onClick={() => navigate(`/agenda?phone=${conversation.contato_telefone}&name=${encodeURIComponent(conversation.contato_nome || '')}`)} />
             <ActionButton icon={<BarChart3 className="w-5 h-5" />} label="Verdesk" color="blue" onClick={() => navigate(`/verdesk?search=${conversation.contato_telefone}`)} />
             <ActionButton icon={<Activity className="w-5 h-5" />} label="Historico" color="purple" onClick={() => conversation.paciente_id ? navigate(`/pacientes/${conversation.paciente_id}`) : navigate(`/verdesk?search=${conversation.contato_telefone}`)} />
             <ActionButton icon={<ExternalLink className="w-5 h-5" />} label="WhatsApp" color="gray" onClick={() => window.open(`https://wa.me/${conversation.contato_telefone?.replace(/\D/g, '')}`, '_blank')} />
          </div>
       </div>

       {/* Modal Cadastrar Paciente */}
       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 space-y-6 animate-fade-in" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between">
               <h2 className="text-lg font-black text-gray-900">Cadastrar Paciente</h2>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome Completo *</label>
                 <input value={form.nome_completo} onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))}
                   className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telefone</label>
                   <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">WhatsApp</label>
                   <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">E-mail</label>
                   <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email"
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CPF</label>
                   <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nascimento</label>
                   <input value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} type="date"
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Genero</label>
                   <select value={form.genero} onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                     className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none bg-white">
                     <option value="">Selecionar</option>
                     <option value="masculino">Masculino</option>
                     <option value="feminino">Feminino</option>
                     <option value="outro">Outro</option>
                   </select>
                 </div>
               </div>
             </div>

             <button onClick={handleSavePaciente} disabled={saving}
               className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               {saving ? 'Salvando...' : 'Cadastrar e Vincular'}
             </button>
           </div>
         </div>
       )}
    </div>
  )
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  const colors: Record<string, string> = {
    green: "bg-cyan-500/5 text-cyan-600 hover:bg-cyan-600 hover:text-white border border-cyan-500/20 hover:border-cyan-500",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-100 hover:border-blue-600",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-100 hover:border-purple-600",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-600 hover:text-white border border-gray-200 hover:border-gray-600"
  }

  return (
    <button onClick={onClick} className={cn(
      "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-sm",
      colors[color]
    )}>
       {icon}
       <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}
