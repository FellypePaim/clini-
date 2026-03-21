import { 
  UserPlus, 
  ExternalLink, 
  Calendar, 
  Target, 
  Zap, 
  CreditCard, 
  BarChart3, 
  User,
  Activity,
  ArrowRight,
  Stethoscope,
  Link2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OvyvaConversation } from '../../types/ovyva'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'

interface ContactContextProps {
  conversation: OvyvaConversation
}

export function ContactContext({ conversation }: ContactContextProps) {
  const navigate = useNavigate()

  const displayName = conversation.contato_nome || `Novo Contato`
  const isLead = !conversation.paciente_id

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
            <Target className="w-3.5 h-3.5" /> IA & Intenção
          </h4>
          <div className="bg-green-50/50 p-6 rounded-[32px] border border-green-100 relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
             <p className="text-xs font-black text-green-700 uppercase tracking-widest leading-relaxed">
               {conversation.metadata?.intent || 'Aguardando classificação da IA'}
             </p>
             <p className="text-[10px] text-green-600/60 font-medium mt-2">
                Precisão baseada no histórico de chat
             </p>
          </div>
       </div>

       {/* Patient Profile / Registration */}
       <div className="mb-10 space-y-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Perfil Clínico
          </h4>
          
          {!isLead ? (
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/pacientes/${conversation.paciente_id}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 transition-all group shadow-sm"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-green-600 group-hover:scale-110 transition-transform">
                       <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black text-gray-900 uppercase">Ver Prontuário</p>
                       <p className="text-[9px] text-gray-400 font-medium">Histórico Clínico Completo</p>
                    </div>
                 </div>
                 <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
              </button>
              <button 
                onClick={() => navigate(`/verdesk?search=${conversation.contato_telefone}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-[9px] font-black uppercase tracking-widest transition-all"
              >
                 <BarChart3 className="w-3.5 h-3.5" /> Ver Histórico Verdesk
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => navigate(`/pacientes?new=true&phone=${conversation.contato_telefone}&name=${encodeURIComponent(conversation.contato_nome || '')}`)}
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
                    <span className="text-[9px] font-black text-orange-800 uppercase flex items-center gap-1 group-hover:underline">Estágio Verdesk</span>
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
            <Zap className="w-3.5 h-3.5" /> Ações Rápidas
          </h4>
          <div className="grid grid-cols-2 gap-4">
             <ActionButton icon={<Calendar className="w-5 h-5" />} label="Agendar" color="green" onClick={() => navigate('/agenda')} />
             <ActionButton icon={<CreditCard className="w-5 h-5" />} label="Cobrança" color="blue" onClick={() => navigate('/financeiro')} />
             <ActionButton icon={<Stethoscope className="w-5 h-5" />} label="Receita" color="purple" onClick={() => navigate('/prescricoes')} />
             <ActionButton icon={<ExternalLink className="w-5 h-5" />} label="WhatsApp" color="gray" onClick={() => window.open(`https://wa.me/${conversation.contato_telefone?.replace(/\D/g, '')}`, '_blank')} />
          </div>
       </div>
    </div>
  )
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-100 hover:border-green-600",
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
