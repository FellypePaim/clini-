import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { 
  MessageSquare,
  Calendar,
  Edit2,
  AlertCircle,
  Clock,
  Instagram,
  User,
  ExternalLink,
  Smartphone
} from 'lucide-react'
import type { Lead } from '../../types/verdesk'
import { Avatar } from '../ui/Avatar'

interface LeadCardProps {
  lead: Lead
  onEdit?: (id: string) => void
  onAction?: (id: string, action: string) => void
  isDragging?: boolean
  onClick?: (id: string) => void
}

const ORIGIN_ICONS = {
  'WhatsApp OVYVA': <Smartphone size={14} className="text-emerald-500" />,
  'Manual': <User size={14} className="text-[var(--color-text-muted)]" />,
  'Indicação': <ExternalLink size={14} className="text-indigo-400" />,
  'Instagram': <Instagram size={14} className="text-pink-500" />
}

export function LeadCard({ lead, onEdit, onAction, isDragging, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  })

  // Style for dnd-kit transform if any
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // Calculate time in stage
  const lastUpdate = new Date(lead.updatedAt)
  const diffDays = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
  const isUrgent = diffDays >= 3 && lead.stage !== 'Perdido' && lead.stage !== 'Agendado'

  const _getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(lead.id)}
      className={`
        relative group p-4 bg-[var(--color-bg-card)] border rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'opacity-50 ring-2 ring-indigo-500 z-50' : 'border-[var(--color-border)]'}
        ${isUrgent ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar 
            nome={lead.name}
            className="w-9 h-9 border border-indigo-100 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{lead.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {ORIGIN_ICONS[lead.origin]}
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-tight">{lead.origin}</span>
            </div>
          </div>
        </div>
        
        {isUrgent && (
          <div className="text-red-500 animate-pulse">
            <AlertCircle size={16} />
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate mr-2">{lead.procedure}</span>
          <span className="text-xs font-bold text-[var(--color-text-primary)] whitespace-nowrap">
            {lead.estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] font-medium">
          <Clock size={10} />
          {diffDays === 0 ? 'Atualizado hoje' : `há ${diffDays} dias`}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); onAction?.(lead.id, 'whatsapp'); }}
            title="WhatsApp"
          >
            <MessageSquare size={14} />
          </button>
          <button 
            type="button"
            className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); onAction?.(lead.id, 'schedule'); }}
            title="Agendar"
          >
            <Calendar size={14} />
          </button>
          <button 
            type="button"
            className="p-1.5 text-[var(--color-text-muted)] bg-[var(--color-bg-deep)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit?.(lead.id); }}
            title="Editar"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
