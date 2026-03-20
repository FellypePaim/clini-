import { useState, useEffect } from 'react'
import {
  Bot, Calendar, BookOpen, MessageSquare, Save, ArrowLeft,
  Clock, Sparkles, Zap, HelpCircle, Smartphone
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { WhatsAppConexaoPage } from './WhatsAppConexaoPage'

type ConfigSection = 'personality' | 'scheduling' | 'knowledge' | 'whatsapp'

// Tipos locais para o formulário
interface OvyvaConfigForm {
  nome_assistente: string
  tom_voz: string
  horario_inicio: string
  horario_fim: string
  acao_fora_horario: string
  base_conhecimento: string
  antecedencia_minima: number
}

export function OvyvaConfigPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId

  const [activeTab, setActiveTab] = useState<ConfigSection>('personality')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [form, setForm] = useState<OvyvaConfigForm>({
    nome_assistente: 'Sofia',
    tom_voz: 'cordial',
    horario_inicio: '08:00',
    horario_fim: '18:00',
    acao_fora_horario: 'padrao',
    base_conhecimento: '',
    antecedencia_minima: 24,
  })

  // Carregar config atual do banco
  useEffect(() => {
    if (!clinicaId) return
    supabase
      .from('clinicas')
      .select('configuracoes')
      .eq('id', clinicaId)
      .single()
      .then(({ data }) => {
        const ovyva = (data?.configuracoes as any)?.ovyva
        if (ovyva) {
          setForm({
            nome_assistente: ovyva.nome_assistente ?? 'Sofia',
            tom_voz: ovyva.tom_voz ?? 'cordial',
            horario_inicio: ovyva.horario_inicio ?? '08:00',
            horario_fim: ovyva.horario_fim ?? '18:00',
            acao_fora_horario: ovyva.acao_fora_horario ?? 'padrao',
            base_conhecimento: ovyva.base_conhecimento ?? '',
            antecedencia_minima: ovyva.antecedencia_minima ?? 24,
          })
        }
        setIsLoading(false)
      })
  }, [clinicaId])

  const handleSave = async () => {
    if (!clinicaId) {
      toast({ title: 'Erro', description: 'Clínica não identificada. Faça login novamente.', type: 'error' })
      return
    }
    setIsSaving(true)
    try {
      // Buscar configuracoes atuais para não sobrescrever outros campos
      const { data: clinica } = await supabase
        .from('clinicas')
        .select('configuracoes')
        .eq('id', clinicaId)
        .single()

      const configAtual = (clinica?.configuracoes as any) ?? {}

      const { error } = await supabase
        .from('clinicas')
        .update({
          configuracoes: {
            ...configAtual,
            ovyva: {
              ...(configAtual.ovyva ?? {}),
              nome_assistente: form.nome_assistente,
              tom_voz: form.tom_voz,
              horario_inicio: form.horario_inicio,
              horario_fim: form.horario_fim,
              acao_fora_horario: form.acao_fora_horario,
              base_conhecimento: form.base_conhecimento,
              antecedencia_minima: form.antecedencia_minima,
            }
          }
        })
        .eq('id', clinicaId)

      if (error) throw error

      toast({ title: 'Configurações salvas!', description: 'A IA já está usando as novas configurações.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const update = (field: keyof OvyvaConfigForm, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Clock className="w-8 h-8 animate-spin text-green-500" />
          <p className="text-xs font-bold uppercase tracking-widest">Carregando configurações...</p>
        </div>
      </div>
    )
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
            disabled={isSaving || !clinicaId}
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
              label="Base de Conhecimento" 
              active={activeTab === 'knowledge'} 
              onClick={() => setActiveTab('knowledge')} 
             />
             <SectionTab 
              icon={<Smartphone className="w-5 h-5" />} 
              label="Conexão WhatsApp" 
              active={activeTab === 'whatsapp'} 
              onClick={() => setActiveTab('whatsapp')} 
             />

             <div className="mt-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/40 transition-all" />
                <Zap className="w-6 h-6 text-green-400 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Status da IA</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ativa (24h)</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-3">Assistente: <span className="text-green-400 font-bold">{form.nome_assistente}</span></p>
             </div>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm shadow-gray-200/50 min-h-[600px] animate-slide-in">
             
             {/* ── PERSONALIDADE ── */}
             {activeTab === 'personality' && (
               <div className="space-y-10">
                  <ConfigHeader title="Voz e Tom" desc="Como a IA deve falar com seus pacientes?" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField label="Nome da Assistente" desc="O nome que a IA usará para se identificar">
                        <input
                          type="text"
                          value={form.nome_assistente}
                          onChange={e => update('nome_assistente', e.target.value)}
                          className="input-ovyva"
                        />
                     </FormField>

                     <FormField label="Tom de Voz" desc="Formalidade e cordialidade no atendimento">
                        <select
                          className="input-ovyva capitalize"
                          value={form.tom_voz}
                          onChange={e => update('tom_voz', e.target.value)}
                        >
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
                        <input
                          type="time"
                          value={form.horario_inicio}
                          onChange={e => update('horario_inicio', e.target.value)}
                          className="input-ovyva"
                        />
                     </FormField>
                     <FormField label="Fim do Turno">
                        <input
                          type="time"
                          value={form.horario_fim}
                          onChange={e => update('horario_fim', e.target.value)}
                          className="input-ovyva"
                        />
                     </FormField>
                     <FormField label="Fora do Horário">
                        <select
                          className="input-ovyva"
                          value={form.acao_fora_horario}
                          onChange={e => update('acao_fora_horario', e.target.value)}
                        >
                           <option value="padrao">Responder padrão</option>
                           <option value="notificar">Silenciar e Notificar</option>
                           <option value="ignorar">Não Responder</option>
                        </select>
                     </FormField>
                  </div>
               </div>
             )}

             {/* ── AGENDAMENTO ── */}
             {activeTab === 'scheduling' && (
               <div className="space-y-10">
                  <ConfigHeader title="Restrições" desc="Controles de segurança para agendamentos" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField label="Antecedência Mínima" desc="Tempo mínimo para agendar sem aprovação humana">
                        <select
                          className="input-ovyva"
                          value={form.antecedencia_minima}
                          onChange={e => update('antecedencia_minima', Number(e.target.value))}
                        >
                           <option value={1}>1 hora</option>
                           <option value={2}>2 horas</option>
                           <option value={4}>4 horas</option>
                           <option value={24}>24 horas (Recomendado)</option>
                        </select>
                     </FormField>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-700">💡 Tipos de serviços</p>
                    <p className="text-[11px] text-amber-600 mt-1">Configure os tipos de procedimentos na aba <strong>Configurações → Procedimentos</strong> e eles aparecerão aqui automaticamente para a IA utilizar.</p>
                  </div>
               </div>
             )}

             {/* ── BASE DE CONHECIMENTO ── */}
             {activeTab === 'knowledge' && (
               <div className="space-y-10">
                  <ConfigHeader title="Base de Conhecimento" desc="Dê contexto sobre sua clínica para a IA responder com precisão" />
                  
                  <FormField
                    label="Bio e Informações Gerais"
                    desc="Endereço, horários, valores, política de cancelamento, etc."
                  >
                     <textarea
                        className="input-ovyva min-h-[240px] resize-none leading-relaxed"
                        placeholder={`Exemplos:\n- Atendemos segunda a sexta das 8h às 18h e sábados das 8h às 12h\n- Estamos na Rua das Flores, 123, Centro\n- Valor da consulta: R$ 150,00\n- Cancelamento com 24h de antecedência`}
                        value={form.base_conhecimento}
                        onChange={e => update('base_conhecimento', e.target.value)}
                     />
                  </FormField>

                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-green-800 uppercase tracking-widest">Dica de Prompt</p>
                        <p className="text-[11px] text-green-700 mt-1 leading-relaxed">
                          Quanto mais detalhado for este texto, mais precisa será a IA. Inclua valores dos procedimentos, convênios aceitos, nome dos profissionais e especialidades.
                        </p>
                      </div>
                    </div>
                  </div>
               </div>
             )}

             {/* ── WHATSAPP ── */}
             {activeTab === 'whatsapp' && (
               <WhatsAppConexaoPage />
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
