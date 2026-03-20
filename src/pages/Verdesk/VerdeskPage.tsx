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
import type { DragStartEvent, DragEndEvent, DropAnimation } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  Plus,
  Search,
  Filter,
  BarChart2,
  Megaphone,
  X,
  Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVerdesk } from '../../hooks/useVerdesk'
import type { LeadStage, LeadOrigin } from '../../types/verdesk'
import { KanbanColumn } from '../../components/verdesk/KanbanColumn'
import { LeadCard } from '../../components/verdesk/LeadCard'
import { LeadDrawer } from '../../components/verdesk/LeadDrawer'

const STAGES: LeadStage[] = [
  'Perguntou Valor',
  'Demonstrou Interesse',
  'Quase Fechando',
  'Agendado',
  'Perdido',
]

interface NovoLeadForm {
  name: string
  phone: string
  email: string
  procedure: string
  estimatedValue: number
  origin: LeadOrigin
  stage: LeadStage
}

const formVazio: NovoLeadForm = {
  name: '',
  phone: '',
  email: '',
  procedure: '',
  estimatedValue: 0,
  origin: 'Manual',
  stage: 'Perguntou Valor',
}

export function VerdeskPage() {
  const { leads, moveLead, createLead } = useVerdesk()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState<LeadStage | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const [showNovoLead, setShowNovoLead] = useState(false)
  const [form, setForm] = useState<NovoLeadForm>(formVazio)
  const [saving, setSaving] = useState(false)

  const handleCriarLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await createLead({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      procedure: form.procedure,
      estimatedValue: form.estimatedValue,
      origin: form.origin,
      stage: form.stage,
    })
    setSaving(false)
    setShowNovoLead(false)
    setForm(formVazio)
  }

  // Filtered leads per stage (applies search + stage filter)
  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.procedure.toLowerCase().includes(q)
      const matchStage = !filterStage || l.stage === filterStage
      return matchSearch && matchStage
    })
  }, [leads, search, filterStage])

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
            <button
              onClick={() => setShowNovoLead(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
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
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter(v => !v)}
                className={`p-2 border rounded-lg transition-colors ${filterStage ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <Filter size={18} />
              </button>
              {showFilter && (
                <div className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[200px]">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Filtrar por etapa</p>
                  {(['', ...STAGES] as (LeadStage | '')[]).map(s => (
                    <button
                      key={s}
                      onClick={() => { setFilterStage(s); setShowFilter(false) }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${filterStage === s ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      {s || 'Todas as etapas'}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                leads={filteredLeads.filter((l) => l.stage === stage)}
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

      {/* Modal Novo Lead */}
      {showNovoLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Novo Lead
              </h2>
              <button onClick={() => { setShowNovoLead(false); setForm(formVazio) }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCriarLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" required className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome do paciente/lead"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input type="tel" required className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="(11) 99999-9999"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="opcional"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedimento de Interesse *</label>
                <input type="text" required className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Botox, Harmonização, Consulta"
                  value={form.procedure} onChange={e => setForm(f => ({ ...f, procedure: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                  <input type="number" min={0} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                    value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                  <select className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as LeadOrigin }))}>
                    <option value="Manual">Manual</option>
                    <option value="WhatsApp OVYVA">WhatsApp OVYVA</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Indicação">Indicação</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa Inicial</label>
                <select className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as LeadStage }))}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNovoLead(false); setForm(formVazio) }}
                  className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Criando...' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
