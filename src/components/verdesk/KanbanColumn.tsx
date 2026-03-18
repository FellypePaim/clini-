import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { MoreVertical, Layers } from 'lucide-react'
import type { Lead } from '../../types/verdesk'
import { LeadCard } from './LeadCard'
import { Badge } from '../ui/Badge'

interface KanbanColumnProps {
  id: string
  title: string
  leads: Lead[]
  onLeadClick?: (id: string) => void
}

const STAGE_COLORS = {
  'Perguntou Valor': 'bg-blue-50 text-blue-700 border-blue-200',
  'Demonstrou Interesse': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Quase Fechando': 'bg-orange-50 text-orange-700 border-orange-200',
  'Agendado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Perdido': 'bg-red-50 text-red-700 border-red-200'
}

const STAGE_DOT_COLORS = {
  'Perguntou Valor': 'bg-blue-500',
  'Demonstrou Interesse': 'bg-yellow-500',
  'Quase Fechando': 'bg-orange-500',
  'Agendado': 'bg-emerald-500',
  'Perdido': 'bg-red-500'
}

export function KanbanColumn({ id, title, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  // Pipeline total for this column
  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col w-80 min-w-80 h-full rounded-2xl bg-slate-100/50 border border-slate-200 transition-all
        ${isOver ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100 ring-inset ring-offset-2' : ''}
      `}
    >
      {/* Column Header */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT_COLORS[title as keyof typeof STAGE_DOT_COLORS] || 'bg-slate-300'}`} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
            <Badge className="ml-2 bg-white text-slate-600 border border-slate-200 font-bold px-1.5 min-w-[20px] justify-center">
              {leads.length}
            </Badge>
          </div>
          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
        
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-1">
          <span className="text-[11px] font-semibold text-slate-500 tracking-tight uppercase">Total esperado</span>
          <span className="text-sm font-bold text-slate-900">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4 custom-scrollbar">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl m-1 opacity-40">
            <Layers className="text-slate-300 mb-2" size={32} />
            <span className="text-xs font-medium text-slate-500">Nenhum lead aqui</span>
          </div>
        )}
        
        {/* Placeholder for dropping */}
        {isOver && leads.length > 0 && (
          <div className="h-10 bg-indigo-100/50 rounded-xl border-2 border-dashed border-indigo-300" />
        )}
      </div>
    </div>
  )
}
