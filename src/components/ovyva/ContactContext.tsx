import { 
  UserPlus, 
  ExternalLink, 
  Calendar, 
  Target, 
  Zap, 
  CreditCard, 
  BarChart3, 
  ChevronRight,
  User,
  Activity,
  ArrowRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { OvyvaConversation } from '../../types/ovyva'
import { useNavigate } from 'react-router-dom'

interface ContactContextProps {
  conversation: OvyvaConversation
}

export function ContactContext({ conversation }: ContactContextProps) {
  const navigate = useNavigate()

  return (
    <div className="w-80 flex flex-col border-l border-gray-100 h-full bg-white shrink-0 overflow-y-auto custom-scrollbar p-8 animate-fade-in">
       {/* Context Header */}
       <div className="mb-10 text-center">
          <div className="relative inline-block mb-6">
             <div className="w-24 h-24 rounded-[32px] bg-gray-50 flex items-center justify-center text-gray-300 border-4 border-white shadow-2xl shadow-gray-200/50">
                <User className="w-12 h-12" />
             </div>
             {conversation.isNewLead && (
               <div className="absolute -bottom-2 -left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-orange-500/30">
                  Lead Novo
               </div>
             )}
          </div>
          <h3 className="text-lg font-black text-gray-900 border-none uppercase tracking-widest">{conversation.contatoNome}</h3>
          <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-1 italic">Interação via WhatsApp Business</p>
       </div>

       {/* AI Intent Detection */}
       <div className="mb-10">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Intenção Detectada
          </h4>
          <div className="bg-green-50/50 p-6 rounded-[32px] border border-green-100 relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
             <p className="text-xs font-black text-green-700 uppercase tracking-widest leading-relaxed">
               {conversation.intent || 'Indeterminada no momento'}
             </p>
             <p className="text-[10px] text-green-600/60 font-medium mt-2">
                Confiabilidade da IA: 98%
             </p>
          </div>
       </div>

       {/* Patient Profile / Registration */}
       <div className="mb-10 space-y-4">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Perfil Clínico
          </h4>
          
          {conversation.pacienteId ? (
            <button 
              onClick={() => navigate(`/pacientes/${conversation.pacienteId}`)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 transition-all group"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-green-600 group-hover:scale-110 transition-transform">
                     <Activity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-black text-gray-900 uppercase">Ver Prontuário</p>
                     <p className="text-[9px] text-gray-400 font-medium">Histórico Completo</p>
                  </div>
               </div>
               <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
            </button>
          ) : (
            <button className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3 active:scale-95">
               <UserPlus className="w-4 h-4" /> Cadastrar Paciente
            </button>
          )}

          <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase">Tags IA</span>
                <span className="text-[9px] font-black text-blue-500 uppercase">Estética</span>
             </div>
             <div className="h-px bg-gray-50" />
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 uppercase">Lead Score</span>
                <span className="text-[9px] font-black text-green-500 uppercase">Alto (9/10)</span>
             </div>
          </div>
       </div>

       {/* Quick Actions */}
       <div className="mb-10">
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> Ações Rápidas
          </h4>
          <div className="grid grid-cols-2 gap-4">
             <ActionButton icon={<Calendar className="w-5 h-5" />} label="Agendar" color="green" />
             <ActionButton icon={<CreditCard className="w-5 h-5" />} label="Orçamento" color="blue" />
             <ActionButton icon={<BarChart3 className="w-5 h-5" />} label="CRM Canal" color="purple" />
             <ActionButton icon={<ExternalLink className="w-5 h-5" />} label="WhatsApp" color="gray" />
          </div>
       </div>

       {/* Next Appointments */}
       {conversation.pacienteId && (
         <div className="bg-gray-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:bg-green-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4 opacity-50">
               <Calendar className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-widest">Próxima Consulta</span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest leading-tight">20 de Março • 14:30</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">Dra. Julia • Estética Facial</p>
         </div>
       )}
    </div>
  )
}

function ActionButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white",
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white",
    gray: "bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white"
  }

  return (
    <button className={cn(
      "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-sm",
      colors[color]
    )}>
       {icon}
       <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}
