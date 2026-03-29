import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Play,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Send,
  Users
} from 'lucide-react'
import { useVerdesk } from '../../hooks/useVerdesk'
import type { CampaignStatus } from '../../types/verdesk'
import { Badge } from '../../components/ui/Badge'

const STATUS_CONFIG: Record<CampaignStatus, { icon: React.ReactNode, color: string, bg: string }> = {
  'Rascunho': { icon: <AlertCircle size={14} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  'Agendada': { icon: <CalendarIcon size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  'Enviada': { icon: <CheckCircle2 size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
}

export function CampanhasPage() {
  const { campaigns, sendCampaign, createCampaign } = useVerdesk()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Wizard state mock
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    targetAudience: 'Todos os contatos',
    message: ''
  })

  const handleSendOrSchedule = async () => {
    if (!newCampaign.title.trim() || !newCampaign.message.trim()) return
    try {
      await createCampaign({
        title: newCampaign.title,
        status: 'Rascunho',
        targetAudience: newCampaign.targetAudience,
        message: newCampaign.message,
      })
      setNewCampaign({ title: '', targetAudience: 'Todos os contatos', message: '' })
      setIsWizardOpen(false)
      setWizardStep(1)
    } catch (err) {
      console.error('Erro ao criar campanha:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)] overflow-y-auto relative">
      <header className="px-6 py-4 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/verdesk" className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Campanhas Marketing</h1>
            <p className="text-[var(--color-text-muted)]">Envio em massa e segmentação pelo WhatsApp</p>
          </div>
        </div>

        <button 
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <Plus size={18} /> Nova Campanha
        </button>
      </header>

      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-6">
              
              {/* Icon Status */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0 ${STATUS_CONFIG[campaign.status].bg} ${STATUS_CONFIG[campaign.status].color}`}>
                {campaign.status === 'Enviada' ? <Megaphone size={24} /> : 
                 campaign.status === 'Agendada' ? <CalendarIcon size={24} /> : <AlertCircle size={24} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] truncate">{campaign.title}</h3>
                  <Badge className={`text-xs font-bold px-2 py-0.5 border ${STATUS_CONFIG[campaign.status].bg} ${STATUS_CONFIG[campaign.status].color} gap-1 shadow-sm`}>
                    {STATUS_CONFIG[campaign.status].icon} {campaign.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-3 max-w-2xl bg-[var(--color-bg-deep)] p-3 rounded-lg border border-[var(--color-border)] font-medium">
                  "{campaign.message}"
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1.5 bg-[var(--color-bg-card)] px-2 py-1 rounded-md">
                    <Users size={14} className="text-[var(--color-text-muted)]" /> Audiência: {campaign.targetAudience}
                  </span>
                  
                  {campaign.status === 'Agendada' && campaign.scheduledAt && (
                    <span className="flex items-center gap-1 px-2 py-1 text-indigo-600 bg-indigo-50 rounded-md">
                      <CalendarIcon size={14} /> Agendado para {new Date(campaign.scheduledAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  
                  {campaign.status === 'Enviada' && campaign.sentAt && (
                    <span className="flex items-center gap-1 px-2 py-1 text-emerald-600 bg-emerald-50 rounded-md">
                      <CheckCircle2 size={14} /> Enviado em {new Date(campaign.sentAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics / Actions */}
              <div className="shrink-0 flex flex-col items-end gap-3 min-w-[140px]">
                {campaign.metrics ? (
                  <div className="flex gap-4 p-3 bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-xl">
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Entregues</span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{campaign.metrics.delivered}</span>
                    </div>
                    <div className="w-px bg-[var(--color-border)]" />
                    <div className="text-center">
                      <span className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Respostas</span>
                      <span className="text-sm font-bold text-emerald-600">{campaign.metrics.responded}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {campaign.status !== 'Enviada' && (
                      <button 
                        onClick={() => sendCampaign(campaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Play size={14} /> Disparar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </main>

      {/* Campaign Wizard Drawer */}
      {isWizardOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsWizardOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-[var(--color-bg-card)] shadow-2xl z-50 flex flex-col border-l border-[var(--color-border)] animate-slide-in">
            <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-deep)]">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Nova Campanha WhatsApp</h2>
              
              {/* Stepper */}
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-border)] z-0" />
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step} 
                    className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                      ${wizardStep === step ? 'bg-indigo-600 border-indigo-600 text-white' : 
                        wizardStep > step ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[var(--color-bg-card)] border-slate-300 text-[var(--color-text-muted)]'}
                    `}
                  >
                    {wizardStep > step ? <CheckCircle2 size={16} /> : step}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 px-1">
                <span>Público</span>
                <span>Mensagem</span>
                <span>Disparo</span>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[var(--color-bg-card)]">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Nome da Campanha</label>
                    <input
                      type="text"
                      placeholder="Ex: Promoção de Inverno"
                      value={newCampaign.title}
                      onChange={e => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-sm p-3 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Audiência (Segmentação)</label>
                    <select
                      value={newCampaign.targetAudience}
                      onChange={e => setNewCampaign(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="w-full text-sm p-3 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Todos os contatos">Todos os contatos na base</option>
                      <option value="Sem retorno > 6 meses">Pacientes sem retorno &gt; 6 meses</option>
                      <option value="Aniversariantes do mês">Aniversariantes do mês</option>
                      <option value="Procedimento: Botox">Procedimento: Botox</option>
                      <option value="Estágio: Perdido">Estágio: Perdido</option>
                    </select>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                    <Users className="text-indigo-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900">Alcance Estimado</h4>
                      <p className="text-xs text-indigo-700 font-medium">Essa segmentação atingirá aproximadamente <strong>342 contatos</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Mensagem do WhatsApp</label>
                    <div className="relative">
                      <textarea
                        rows={6}
                        placeholder="Olá {{nome}}, temos uma novidade..."
                        className="w-full text-sm p-3 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-[var(--color-bg-deep)]"
                        value={newCampaign.message}
                        onChange={e => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                      />
                      <div className="absolute right-3 bottom-3 flex gap-2">
                         <button className="text-[10px] bg-[var(--color-border)] hover:bg-slate-300 text-[var(--color-text-secondary)] font-bold px-2 py-1 rounded">{"{{nome}}"}</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview WA Bubble */}
                  <div className="bg-[#E5DDD5] p-4 rounded-xl relative border border-[var(--color-border)]">
                    <div className="bg-[#dcf8c6] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[85%] ml-auto text-sm text-[#303030] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-4 h-4 overflow-hidden pointer-events-none transform -translate-y-full translate-x-1/2">
                        <div className="w-4 h-4 bg-[#dcf8c6] transform -rotate-45 translate-y-2"></div>
                      </div>
                      <p>Olá <strong>João da Silva</strong>! Tudo bem? Passando para avisar que a nossa agenda de dezembro já está aberta. Gostaria de reservar um horário?</p>
                      <div className="text-[10px] text-[var(--color-text-muted)] text-right mt-1 font-medium">14:00 <CheckCircle2 size={12} className="inline text-blue-500" /></div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="p-5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] shadow-sm space-y-4 text-sm font-medium">
                    <div className="flex justify-between border-b border-[var(--color-border)] pb-3">
                      <span className="text-[var(--color-text-muted)]">Público selecionado</span>
                      <span className="font-bold text-[var(--color-text-primary)]">Todos os contatos</span>
                    </div>
                    <div className="flex justify-between border-b border-[var(--color-border)] pb-3">
                      <span className="text-[var(--color-text-muted)]">Total de contatos</span>
                      <span className="font-bold text-[var(--color-text-primary)]">342</span>
                    </div>
                    <div>
                      <span className="block text-[var(--color-text-muted)] mb-2">Mensagem</span>
                      <p className="p-3 bg-[var(--color-bg-deep)] rounded-lg text-[var(--color-text-secondary)] italic border border-[var(--color-border)]">
                        "Olá {'{{nome}}'}! Tudo bem? Passando para avisar..."
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-3">Quando disparar?</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-indigo-500 bg-indigo-50 rounded-xl cursor-pointer ring-1 ring-indigo-500 outline-none">
                        <input type="radio" name="disparo" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" defaultChecked />
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">Disparar Agora</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-xl cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors">
                        <input type="radio" name="disparo" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        <span className="text-sm font-bold text-[var(--color-text-secondary)]">Agendar Data e Hora</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] flex justify-between gap-3">
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-card)] hover:bg-[var(--color-border)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              
              <div className="flex gap-2">
                {wizardStep > 1 && (
                  <button 
                    onClick={() => setWizardStep(s => s - 1)}
                    className="px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)] rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                )}
                
                {wizardStep < 3 ? (
                  <button 
                    onClick={() => setWizardStep(s => s + 1)}
                    className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-100"
                  >
                    Avançar
                  </button>
                ) : (
                  <button 
                    onClick={handleSendOrSchedule}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md shadow-emerald-100"
                  >
                    <Send size={16} /> Confirmar Disparo
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
