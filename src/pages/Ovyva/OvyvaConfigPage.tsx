import { useState } from 'react'
import { 
  Bot, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  Save, 
  ChevronRight, 
  ArrowLeft,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useOVYVA } from '../../hooks/useOVYVA'

type ConfigSection = 'personality' | 'scheduling' | 'knowledge' | 'messages';

export function OvyvaConfigPage() {
  const navigate = useNavigate()
  const { config, updateAIConfig } = useOVYVA()
  const [activeTab, setActiveTab] = useState<ConfigSection>('personality')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
       {/* Config Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => navigate('/ovyva')}
              className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400 hover:text-green-600"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-2xl font-black text-gray-900 border-none uppercase tracking-widest">Configurações OVYVA</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   Calibrando o cérebro da sua assistente virtual IA
                </p>
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
             {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Salvar Configurações
          </button>
       </div>

       {/* Config Layout */}
       <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Section Selector */}
          <div className="w-full lg:w-80 space-y-2 shrink-0">
             <SectionTab 
              icon={<Bot className="w-5 h-5" />} 
              label="Personalidade" 
              active={activeTab === 'personality'} 
              onClick={() => setActiveTab('personality')} 
             />
             <SectionTab 
              icon={<Calendar className="w-5 h-5" />} 
              label="Agendamento" 
              active={activeTab === 'scheduling'} 
              onClick={() => setActiveTab('scheduling')} 
             />
             <SectionTab 
              icon={<BookOpen className="w-5 h-5" />} 
              label="Base de Dados" 
              active={activeTab === 'knowledge'} 
              onClick={() => setActiveTab('knowledge')} 
             />
             <SectionTab 
              icon={<MessageSquare className="w-5 h-5" />} 
              label="Templates" 
              active={activeTab === 'messages'} 
              onClick={() => setActiveTab('messages')} 
             />

             <div className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/40 transition-all" />
                <Zap className="w-6 h-6 text-green-400 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Status da IA</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ativa (24h)</span>
                </div>
             </div>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm shadow-gray-200/50 min-h-[600px] animate-slide-in">
             {activeTab === 'personality' && (
               <div className="space-y-10">
                  <ConfigHeader title="Voz e Tom" desc="Como a Sofia deve falar com seus pacientes?" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField label="Nome da Assistente" desc="O nome que a IA usará para se identificar">
                        <input type="text" defaultValue={config.aiName} className="input-ovyva" />
                     </FormField>

                     <FormField label="Tom de Voz" desc="Formalidade e cordialidade no atendimento">
                        <select className="input-ovyva capitalize" defaultValue={config.toneOfVoice}>
                           <option value="formal">👔 Formal</option>
                           <option value="cordial">🤝 Cordial</option>
                           <option value="informal">👋 Informal</option>
                           <option value="atenciosa">💖 Atenciosa</option>
                        </select>
                     </FormField>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <ConfigHeader title="Disponibilidade Autônoma" desc="Horários que a IA responderá sozinha" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField label="Início do Turno">
                        <input type="time" defaultValue={config.workingHours.start} className="input-ovyva" />
                     </FormField>
                     <FormField label="Fim do Turno">
                        <input type="time" defaultValue={config.workingHours.end} className="input-ovyva" />
                     </FormField>
                     <FormField label="Fora do Horário">
                        <select className="input-ovyva" defaultValue={config.offHoursAction}>
                           <option value="padrao">Responder padrão</option>
                           <option value="notificar">Silenciar e Notificar</option>
                           <option value="ignorar">Não Responder</option>
                        </select>
                     </FormField>
                  </div>
               </div>
             )}

             {activeTab === 'scheduling' && (
               <div className="space-y-10">
                  <ConfigHeader title="Restrições" desc="Controles de segurança para agendamentos" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField label="Antecedência Mínima" desc="Tempo mínimo para agendar sem aprovação humana">
                        <select className="input-ovyva" defaultValue={config.minLeadTimeHours}>
                           <option value={1}>1 hora</option>
                           <option value={2}>2 horas</option>
                           <option value={4}>4 horas</option>
                           <option value={24}>24 horas (Recomendado)</option>
                        </select>
                     </FormField>

                     <FormField label="Fluxo de Confirmação">
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 h-[48px]">
                           <div className="w-10 h-6 bg-green-500 rounded-full p-1 flex justify-end">
                              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Confirmação Instantânea</span>
                        </div>
                     </FormField>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <ConfigHeader title="Serviços Habilitados" desc="Quais consultas a IA pode agendar?" />
                  
                  <div className="space-y-4">
                     {config.enabledAppointmentTypes.map(type => (
                       <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:scale-[1.01] transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-green-500">
                                <Zap className="w-5 h-5" />
                             </div>
                             <span className="text-xs font-black uppercase text-gray-700">{type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] text-gray-400 font-bold">Duração: 45 min</span>
                             <button className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                     ))}
                     <button className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[32px] text-[10px] font-black uppercase text-gray-400 hover:border-green-200 hover:text-green-600 transition-all flex items-center justify-center gap-3">
                        <Plus className="w-4 h-4" /> Adicionar Tipo de Serviço
                     </button>
                  </div>
               </div>
             )}

             {activeTab === 'knowledge' && (
               <div className="space-y-10">
                  <ConfigHeader title="Base de Conhecimento" desc="Dê contexto sobre sua clínica para a IA" />
                  
                  <FormField label="Bio e Informações Gerais" desc="Use variáveis para endereço, valores base e política de cancelamento">
                     <textarea 
                        className="input-ovyva min-h-[160px] resize-none leading-relaxed" 
                        defaultValue={config.clinicInfo}
                     />
                  </FormField>

                  <div className="h-px bg-gray-100" />

                  <div className="flex items-center justify-between mb-2">
                     <ConfigHeader title="Perguntas Frequentes (FAQ)" desc="Respostas rápidas para dúvidas comuns" />
                     <button className="btn-secondary py-2 border-none">Gerar por IA</button>
                  </div>

                  <div className="space-y-4">
                     {config.faqs.map(faq => (
                       <div key={faq.id} className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all">
                          <div className="flex items-start justify-between gap-6">
                             <div className="flex-1 space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-900 border-l-4 border-green-500 pl-4">{faq.pergunta}</p>
                                <p className="text-[11px] text-gray-400 font-medium pl-5">{faq.resposta}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-green-600 rounded-xl transition-all"><Settings className="w-4 h-4" /></button>
                                <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'messages' && (
               <div className="space-y-10">
                  <ConfigHeader title="Templates e Variáveis" desc="Padronize as comunicações autônomas" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {config.templates.map(tpl => (
                        <div key={tpl.id} className="flex flex-col gap-4 p-8 bg-gray-50/50 rounded-[40px] border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all group">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-100/50 px-3 py-1.5 rounded-full">{tpl.trigger}</span>
                              <div className="flex gap-2">
                                 <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-500 transition-colors" />
                              </div>
                           </div>
                           <textarea 
                              className="w-full bg-transparent resize-none border-none outline-none text-xs text-gray-500 font-medium leading-relaxed h-24"
                              defaultValue={tpl.content}
                           />
                           <div className="h-px bg-gray-200/50 my-2" />
                           <div className="flex flex-wrap gap-2">
                              {['nome_paciente', 'data', 'clinica'].map(v => (
                                 <span key={v} className="text-[8px] font-black uppercase bg-white border border-gray-100 text-gray-400 px-2 py-1 rounded-lg">
                                    {`{{${v}}}`}
                                 </span>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
       </div>
    </div>
  )
}

function SectionTab({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-6 h-20 rounded-[32px] flex items-center gap-6 transition-all duration-300 border border-transparent group",
        active ? "bg-white shadow-xl shadow-gray-200/40 border-gray-100 text-green-600" : "hover:bg-gray-100/50 text-gray-400"
      )}
    >
       <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-green-50 text-green-600 scale-110" : "bg-gray-50 text-gray-300 group-hover:bg-white"
       )}>
          {icon}
       </div>
       <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  )
}

function ConfigHeader({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-1">
       <h3 className="text-sm font-black text-gray-900 border-none uppercase tracking-widest">{title}</h3>
       <p className="text-[10px] text-gray-400 font-bold tracking-widest">{desc}</p>
    </div>
  )
}

function FormField({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
       <div className="flex items-center gap-2 mb-1">
         <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest leading-none">{label}</label>
         {desc && (
            <div className="group relative cursor-help">
               <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[9px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {desc}
               </div>
            </div>
         )}
       </div>
       {children}
    </div>
  )
}
