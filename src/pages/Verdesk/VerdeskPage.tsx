import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent, DropAnimation } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart2, 
  Megaphone, 
  TrendingUp, 
  Wallet, 
  Users 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVerdesk } from '../../hooks/useVerdesk'
import type { LeadStage, Lead } from '../../types/verdesk'
import { KanbanColumn } from '../../components/verdesk/KanbanColumn'
import { LeadCard } from '../../components/verdesk/LeadCard'
import { LeadDrawer } from '../../components/verdesk/LeadDrawer'
import { Badge } from '../../components/ui/Badge'

const STAGES: LeadStage[] = [
  'Perguntou Valor',
  'Demonstrou Interesse',
  'Quase Fechando',
  'Agendado',
  'Perdido',
]

export function VerdeskPage() {
  const { leads, moveLead } = useVerdesk()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Active lead for overlay
  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeId),
    [activeId, leads]
  )

  // Stats
  const stats = useMemo(() => {
    const totalPipeline = leads
      .filter(l => l.stage !== 'Perdido' && l.stage !== 'Agendado')
      .reduce((sum, lead) => sum + lead.estimatedValue, 0)
    
    return {
      totalLeads: leads.length,
      pipelineValue: totalPipeline,
    }
  }, [leads])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const activeLeadObj = leads.find(l => l.id === active.id)
      const overIdStr = over.id as string
      
      // If dropped over a column or another card in a different column
      // dnd-kit normally handles this by passing the column id or target card id
      // For simplicity in this fixed column layout:
      if (STAGES.includes(overIdStr as LeadStage)) {
        moveLead(active.id as string, overIdStr as LeadStage)
      } else {
        // Find stage of the item we dropped over
        const overLeadObj = leads.find(l => l.id === overIdStr)
        if (overLeadObj && overLeadObj.stage !== activeLeadObj?.stage) {
          moveLead(active.id as string, overLeadObj.stage)
        }
      }
    }
    
    setActiveId(null)
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Verdesk CRM</h1>
            <p className="text-slate-500">Gestão conversacional e funil de vendas</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/verdesk/performance" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
            >
              <BarChart2 size={18} />
              Performance
            </Link>
            <Link 
              to="/verdesk/campanhas" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
            >
              <Megaphone size={18} />
              Campanhas
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              <Plus size={18} />
              Novo Lead
            </button>
          </div>
        </div>

        {/* Stats & Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Total</span>
              <span className="text-lg font-bold text-slate-900">
                {stats.pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Ativos</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalLeads}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar leads..." 
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn 
                key={stage} 
                id={stage} 
                title={stage}
                leads={leads.filter((l) => l.stage === stage)}
                onLeadClick={(leadId) => setSelectedLeadId(leadId)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activeLead ? (
              <div className="rotate-2 scale-105 opacity-90">
                <LeadCard lead={activeLead} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Lead Detail Drawer/Modal */}
      {selectedLeadId && (
        <LeadDrawer 
          leadId={selectedLeadId} 
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  )
}
