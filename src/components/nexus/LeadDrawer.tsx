import React, { useState } from 'react'
import {
  X,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Send,
  Link as LinkIcon,
  Phone,
  Clock,
  User,
  History,
  FileText,
  Edit2,
  UserPlus,
  Loader2
} from 'lucide-react'
import { useNexus } from '../../hooks/useNexus'
import { usePatients } from '../../hooks/usePatients'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import type { LeadStage } from '../../types/nexus'

interface LeadDrawerProps {
  leadId: string
  onClose: () => void
}

const STAGES: LeadStage[] = [
  'Perguntou Valor',
  'Demonstrou Interesse',
  'Quase Fechando',
  'Agendado',
  'Perdido',
]

const INTERACTION_ICONS = {
  note: <FileText size={16} className="text-yellow-500" />,
  stage_change: <History size={16} className="text-indigo-500" />,
  message: <MessageSquare size={16} className="text-emerald-500" />,
  appointment: <Calendar size={16} className="text-blue-500" />,
  system: <AlertTriangle size={16} className="text-[var(--color-text-muted)]" />
}

export function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { leads, moveLead, addLeadInteraction, updateLead: _updateLead } = useNexus()
  const { createPatient, isLoading: isCreatingPatient } = usePatients()
  const { user } = useAuthStore()
  const lead = leads.find((l) => l.id === leadId)
  const [note, setNote] = useState('')

  if (!lead) return null

  const handleConvertToPatient = async () => {
     if (!lead) return
     const patient = await createPatient({
        nome: lead.name,
        contato: {
           telefone: lead.phone,
           email: lead.email || ''
        }
     })
     if (patient) {
        moveLead(lead.id, 'Agendado')
        addLeadInteraction(lead.id, {
           type: 'appointment',
           content: `Lead convertido em Paciente: ${patient.id}`,
           author: 'CRM'
        })
     }
  }

  const handleAddNote = () => {
    if (!note.trim()) return
    addLeadInteraction(lead.id, {
      type: 'note',
      content: note,
      author: user?.nome || 'Atendente'
    })
    setNote('')
  }

  const _getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-[var(--color-bg-card)] shadow-2xl z-50 flex flex-col transform transition-transform border-l border-[var(--color-border)]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-deep)]">
          <div className="flex items-center gap-4">
            <Avatar 
               nome={lead.name}
               className="w-12 h-12 border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-700" 
            />
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{lead.name}</h2>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] font-medium">
                <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                <span className="text-[var(--color-text-dim)]">•</span>
                <span className="text-indigo-600">{lead.procedure}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--color-bg-card)]">
          
          {/* Quick Actions & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-[var(--color-bg-card)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1 block">Estágio Atual</span>
              <select
                value={lead.stage}
                onChange={(e) => moveLead(lead.id, e.target.value as LeadStage)}
                className="w-full text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-deep)] border border-[var(--color-border)] rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              >
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            
            <div className="bg-[var(--color-bg-card)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">Ações</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                  title="Abrir WhatsApp"
                >
                  <MessageSquare size={14} /> WA
                </button>
                <button
                  onClick={() => { onClose(); window.location.href = '/agenda' }}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  title="Agendar Consulta"
                >
                  <Calendar size={14} /> Agendar
                </button>
                <button 
                  onClick={handleConvertToPatient}
                  disabled={isCreatingPatient}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  title="Converter para Paciente"
                >
                  {isCreatingPatient ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} 
                  Ficha
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] shadow-sm mb-8 overflow-hidden">
            <div className="px-4 py-3 bg-[var(--color-bg-deep)] border-b border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <User size={16} className="text-[var(--color-text-muted)]" /> Detalhes do Lead
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Valor Estimado</span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  {lead.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Origem</span>
                <Badge className="bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-semibold border-none rounded">
                  {lead.origin}
                </Badge>
              </div>
              <div>
                <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Criado em</span>
                <span className="font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Clock size={14} className="text-[var(--color-text-muted)]" />
                  {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {lead.origin === 'WhatsApp LYRA' && lead.lyraId && (
                <div>
                  <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">LYRA Link</span>
                  <a href={`/lyra/historico?id=${lead.lyraId}`} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                    <LinkIcon size={14} /> Ver Conversa
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <History size={16} className="text-[var(--color-text-muted)]" /> Histórico de Interações
            </h3>
            
            <div className="relative border-l-2 border-[var(--color-border)] ml-4 space-y-6 pb-6 pt-2">
              {/* Add Note Input inside timeline */}
              <div className="relative pl-6 -ml-[13px] group">
                <div className="absolute top-1 left-0 w-6 h-6 rounded-full bg-[var(--color-bg-card)] border-2 border-indigo-200 flex items-center justify-center z-10">
                  <EditIcon className="text-indigo-500" />
                </div>
                <div className="bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Adicionar nota ou registro..."
                    className="w-full text-sm resize-none outline-none min-h-[60px] text-[var(--color-text-secondary)] bg-transparent placeholder-slate-400"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      disabled={!note.trim()}
                      onClick={handleAddNote}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                      <Send size={14} /> Salvar
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactions List */}
              {lead.interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction) => (
                <div key={interaction.id} className="relative pl-6 -ml-[11px] group">
                  <div className="absolute top-1 left-0 w-[22px] h-[22px] rounded-full bg-[var(--color-bg-deep)] border-2 border-white flex items-center justify-center shadow-sm z-10 ring-1 ring-slate-200">
                    {INTERACTION_ICONS[interaction.type]}
                  </div>
                  <div className="bg-[var(--color-bg-card)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-tight">
                        {interaction.author || 'Sistema'}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                        {new Date(interaction.date).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">
                      {interaction.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function EditIcon({ className }: { className?: string }) {
  return <Edit2Icon size={12} className={className} />
}

function Edit2Icon(props: any) {
  return <Edit2 {...props} />
}
