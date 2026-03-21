import { useState, useRef, useCallback } from 'react'
import {
  Save, Trash2, History, ChevronDown, Activity, Plus, Info, X,
  AlertTriangle, CheckCircle, Clock, FileText, Search
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'

// ─── Configuração dos Dentes (Notação FDI) ─────────────────────────
const QUADRANTS = [
  { label: 'Superior Direito', teeth: [18,17,16,15,14,13,12,11] },
  { label: 'Superior Esquerdo', teeth: [21,22,23,24,25,26,27,28] },
  { label: 'Inferior Esquerdo', teeth: [31,32,33,34,35,36,37,38] },
  { label: 'Inferior Direito', teeth: [48,47,46,45,44,43,42,41] },
]

const TOOTH_TYPES: Record<number, string> = {
  11:'IC', 12:'IL', 13:'C', 14:'1PM', 15:'2PM', 16:'1M', 17:'2M', 18:'3M',
  21:'IC', 22:'IL', 23:'C', 24:'1PM', 25:'2PM', 26:'1M', 27:'2M', 28:'3M',
  31:'IC', 32:'IL', 33:'C', 34:'1PM', 35:'2PM', 36:'1M', 37:'2M', 38:'3M',
  41:'IC', 42:'IL', 43:'C', 44:'1PM', 45:'2PM', 46:'1M', 47:'2M', 48:'3M',
}

type ToothCondition =
  | 'higido'
  | 'carie'
  | 'restauracao'
  | 'extracao'
  | 'ausente'
  | 'implante'
  | 'endodontia'
  | 'protese'
  | 'fratura'
  | 'selante'

const CONDITIONS: { value: ToothCondition; label: string; color: string; icon: string }[] = [
  { value: 'higido',       label: 'Hígido',            color: '#16a34a', icon: '✓' },
  { value: 'carie',        label: 'Cárie',             color: '#dc2626', icon: '●' },
  { value: 'restauracao',  label: 'Restauração',       color: '#2563eb', icon: '■' },
  { value: 'extracao',     label: 'Extração Indicada', color: '#f97316', icon: '✕' },
  { value: 'ausente',      label: 'Ausente',           color: '#9ca3af', icon: '—' },
  { value: 'implante',     label: 'Implante',          color: '#8b5cf6', icon: '▲' },
  { value: 'endodontia',   label: 'Endodontia',       color: '#ec4899', icon: '◆' },
  { value: 'protese',      label: 'Prótese',           color: '#14b8a6', icon: '◎' },
  { value: 'fratura',      label: 'Fratura',           color: '#eab308', icon: '⚡' },
  { value: 'selante',      label: 'Selante',           color: '#06b6d4', icon: '◐' },
]

interface ToothData {
  tooth: number
  condition: ToothCondition
  faces?: string[]       // M, D, V, L, O
  observacao?: string
  procedimento_planejado?: string
}

interface PeriodontalData {
  tooth: number
  profundidade: number[]  // vestibular, lingual (mm)
  sangramento: boolean
  mobilidade: number      // 0, 1, 2, 3
  recessao: number
}

interface DentalMappingProps {
  pacienteId: string
}

export function DentalMapping({ pacienteId }: DentalMappingProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [toothMap, setToothMap] = useState<Record<number, ToothData>>({})
  const [perioMap, setPerioMap] = useState<Record<number, PeriodontalData>>({})
  const [activeTooth, setActiveTooth] = useState<number | null>(null)
  const [activeCondition, setActiveCondition] = useState<ToothCondition>('carie')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'odontograma' | 'periodontal' | 'plano'>('odontograma')
  const [planoTexto, setPlanoTexto] = useState('')
  const [observacoesGerais, setObservacoesGerais] = useState('')

  // Carregar sessões anteriores
  useState(() => {
    if (!pacienteId) return
    supabase
      .from('harmonizacoes')
      .select('*, profiles:profissional_id(nome_completo)')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const dental = (data || []).filter((s: any) => s.mapeamento?.tipo === 'odontograma')
        setSessions(dental)
      })
  })

  const handleToothClick = (tooth: number) => {
    setActiveTooth(tooth)
  }

  const applyCondition = () => {
    if (!activeTooth) return
    setToothMap(prev => ({
      ...prev,
      [activeTooth]: {
        ...prev[activeTooth],
        tooth: activeTooth,
        condition: activeCondition,
      }
    }))
  }

  const updateToothData = (tooth: number, data: Partial<ToothData>) => {
    setToothMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, condition: prev[tooth]?.condition || 'higido', ...data }
    }))
  }

  const updatePerio = (tooth: number, data: Partial<PeriodontalData>) => {
    setPerioMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, profundidade: prev[tooth]?.profundidade || [0,0], sangramento: false, mobilidade: 0, recessao: 0, ...data }
    }))
  }

  const removeTooth = (tooth: number) => {
    setToothMap(prev => {
      const next = { ...prev }
      delete next[tooth]
      return next
    })
    setActiveTooth(null)
  }

  const getConditionColor = (tooth: number) => {
    const data = toothMap[tooth]
    if (!data) return '#e5e7eb'
    return CONDITIONS.find(c => c.value === data.condition)?.color || '#e5e7eb'
  }

  const registeredCount = Object.keys(toothMap).length
  const carieCount = Object.values(toothMap).filter(t => t.condition === 'carie').length
  const ausentes = Object.values(toothMap).filter(t => t.condition === 'ausente' || t.condition === 'extracao').length

  const handleSave = async () => {
    if (!clinicaId) return
    setIsSubmitting(true)
    try {
      const mapeamento = {
        tipo: 'odontograma',
        dentes: toothMap,
        periodontal: perioMap,
        plano_tratamento: planoTexto,
        observacoes: observacoesGerais,
      }

      await supabase.from('harmonizacoes').insert({
        paciente_id: pacienteId,
        profissional_id: user?.id || '',
        mapeamento: JSON.parse(JSON.stringify(mapeamento)),
        observacoes_gerais: observacoesGerais || null,
      } as any)

      // Recarregar
      const { data } = await supabase
        .from('harmonizacoes')
        .select('*, profiles:profissional_id(nome_completo)')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })
      const dental = (data || []).filter((s: any) => s.mapeamento?.tipo === 'odontograma')
      setSessions(dental)

      toast({ title: 'Sucesso', description: 'Odontograma salvo com sucesso.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Dentes Registrados" value={registeredCount} total={32} color="blue" />
        <KpiCard label="Cáries Detectadas" value={carieCount} color="red" />
        <KpiCard label="Ausentes/Extração" value={ausentes} color="orange" />
        <KpiCard label="Saúde Periodontal" value={Object.keys(perioMap).length > 0 ? 'Avaliado' : 'Pendente'} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100">
        {([
          { key: 'odontograma', label: 'Odontograma', icon: <Search className="w-4 h-4" /> },
          { key: 'periodontal', label: 'Periodontal', icon: <Activity className="w-4 h-4" /> },
          { key: 'plano', label: 'Plano de Tratamento', icon: <FileText className="w-4 h-4" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              activeTab === t.key ? 'bg-white text-blue-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Odontograma Tab */}
      {activeTab === 'odontograma' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mapa Dental */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Odontograma Interativo</h3>
              <button
                onClick={handleSave}
                disabled={isSubmitting || registeredCount === 0}
                className="btn-primary py-2 px-5 text-xs flex items-center gap-2"
              >
                {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>

            {/* Legenda de condições */}
            <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setActiveCondition(c.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                    activeCondition === c.value
                      ? 'bg-white shadow-sm scale-105'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={activeCondition === c.value ? { borderColor: c.color, color: c.color } : { borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  <span style={{ color: c.color }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Arcadas */}
            <div className="space-y-6">
              {/* Superior */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Arcada Superior</p>
                <div className="flex justify-center gap-1">
                  {QUADRANTS[0].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                  <div className="w-px bg-gray-200 mx-1" />
                  {QUADRANTS[1].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                </div>
              </div>
              {/* Inferior */}
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  {QUADRANTS[3].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                  <div className="w-px bg-gray-200 mx-1" />
                  {QUADRANTS[2].teeth.map(t => (
                    <ToothButton key={t} tooth={t} color={getConditionColor(t)} isActive={activeTooth === t} data={toothMap[t]} onClick={() => { handleToothClick(t); applyConditionTo(t) }} />
                  ))}
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Arcada Inferior</p>
              </div>
            </div>

            {/* Observações */}
            <div className="mt-6">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Observações Gerais</label>
              <textarea
                value={observacoesGerais}
                onChange={(e) => setObservacoesGerais(e.target.value)}
                placeholder="Observações clínicas, notas sobre oclusão, ATM, etc..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none min-h-[60px] transition-all"
                rows={2}
              />
            </div>
          </div>

          {/* Painel Lateral - Detalhes do Dente Selecionado */}
          <div className="w-full lg:w-80 space-y-4">
            {activeTooth ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-lg font-black text-gray-900">Dente {activeTooth}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{TOOTH_TYPES[activeTooth] || ''} · Quadrante {Math.floor(activeTooth / 10)}</p>
                  </div>
                  <button onClick={() => setActiveTooth(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Condição */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Condição</label>
                    <select
                      value={toothMap[activeTooth]?.condition || 'higido'}
                      onChange={(e) => updateToothData(activeTooth, { condition: e.target.value as ToothCondition })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm font-bold outline-none"
                    >
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>

                  {/* Faces afetadas */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Faces Afetadas</label>
                    <div className="flex gap-1.5">
                      {['M','D','V','L','O'].map(face => {
                        const isSelected = toothMap[activeTooth]?.faces?.includes(face)
                        return (
                          <button
                            key={face}
                            onClick={() => {
                              const current = toothMap[activeTooth]?.faces || []
                              const next = isSelected ? current.filter(f => f !== face) : [...current, face]
                              updateToothData(activeTooth, { faces: next })
                            }}
                            className={cn(
                              "w-10 h-10 rounded-xl text-xs font-black border-2 transition-all",
                              isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-300"
                            )}
                          >
                            {face}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[9px] text-gray-300 mt-1">M=Mesial D=Distal V=Vestibular L=Lingual O=Oclusal</p>
                  </div>

                  {/* Procedimento planejado */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Procedimento Planejado</label>
                    <input
                      value={toothMap[activeTooth]?.procedimento_planejado || ''}
                      onChange={(e) => updateToothData(activeTooth, { procedimento_planejado: e.target.value })}
                      placeholder="Ex: Restauração classe II em resina"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs outline-none"
                    />
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Observação</label>
                    <textarea
                      value={toothMap[activeTooth]?.observacao || ''}
                      onChange={(e) => updateToothData(activeTooth, { observacao: e.target.value })}
                      placeholder="Notas sobre este dente..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs outline-none resize-none min-h-[60px]"
                    />
                  </div>

                  {toothMap[activeTooth] && (
                    <button onClick={() => removeTooth(activeTooth)} className="w-full py-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 flex items-center justify-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Remover Registro
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Info className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Selecione uma condição na legenda e clique em um dente</p>
              </div>
            )}

            {/* Resumo rápido */}
            {registeredCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumo</h4>
                <div className="space-y-1.5">
                  {CONDITIONS.filter(c => Object.values(toothMap).some(t => t.condition === c.value)).map(c => {
                    const count = Object.values(toothMap).filter(t => t.condition === c.value).length
                    return (
                      <div key={c.value} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span style={{ color: c.color }}>{c.icon}</span>
                          <span className="text-gray-600 font-medium">{c.label}</span>
                        </span>
                        <span className="font-black" style={{ color: c.color }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Periodontal Tab */}
      {activeTab === 'periodontal' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Avaliação Periodontal</h3>
            <p className="text-xs text-gray-400 mt-1">Profundidade de sondagem, sangramento, mobilidade e recessão</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="text-left py-3 px-2">Dente</th>
                  <th className="py-3 px-2">Prof. V (mm)</th>
                  <th className="py-3 px-2">Prof. L (mm)</th>
                  <th className="py-3 px-2">Sangramento</th>
                  <th className="py-3 px-2">Mobilidade</th>
                  <th className="py-3 px-2">Recessão (mm)</th>
                </tr>
              </thead>
              <tbody>
                {[...QUADRANTS[0].teeth, ...QUADRANTS[1].teeth].map(t => (
                  <tr key={t} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-2 font-black text-gray-700">{t}</td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.profundidade?.[0] || ''} onChange={(e) => updatePerio(t, { profundidade: [parseInt(e.target.value) || 0, perioMap[t]?.profundidade?.[1] || 0] })} /></td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.profundidade?.[1] || ''} onChange={(e) => updatePerio(t, { profundidade: [perioMap[t]?.profundidade?.[0] || 0, parseInt(e.target.value) || 0] })} /></td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => updatePerio(t, { sangramento: !perioMap[t]?.sangramento })} className={cn("w-6 h-6 rounded-full border-2 transition-all mx-auto", perioMap[t]?.sangramento ? "bg-red-500 border-red-500" : "bg-white border-gray-200")} />
                    </td>
                    <td className="py-2 px-2">
                      <select className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 outline-none" value={perioMap[t]?.mobilidade || 0} onChange={(e) => updatePerio(t, { mobilidade: parseInt(e.target.value) })}>
                        {[0,1,2,3].map(v => <option key={v} value={v}>Grau {v}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2"><input type="number" min={0} max={15} className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-center outline-none" value={perioMap[t]?.recessao || ''} onChange={(e) => updatePerio(t, { recessao: parseInt(e.target.value) || 0 })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> = Sangramento</span>
              <span>V = Vestibular · L = Lingual</span>
            </div>
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary py-2 px-5 text-xs flex items-center gap-2">
              {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Periodontal
            </button>
          </div>
        </div>
      )}

      {/* Plano de Tratamento Tab */}
      {activeTab === 'plano' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Plano de Tratamento</h3>
              <p className="text-xs text-gray-400 mt-1">Defina as etapas e prioridades do tratamento</p>
            </div>
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary py-2 px-5 text-xs flex items-center gap-2">
              {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Plano
            </button>
          </div>

          {/* Procedimentos detectados automaticamente */}
          {registeredCount > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Procedimentos Sugeridos (do Odontograma)
              </h4>
              <div className="space-y-2">
                {Object.values(toothMap).filter(t => t.condition !== 'higido' && t.condition !== 'ausente').map(t => (
                  <div key={t.tooth} className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-900">Dente {t.tooth}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: `${CONDITIONS.find(c => c.value === t.condition)?.color}15`, color: CONDITIONS.find(c => c.value === t.condition)?.color }}>
                        {CONDITIONS.find(c => c.value === t.condition)?.label}
                      </span>
                    </div>
                    <span className="text-gray-500 font-medium">{t.procedimento_planejado || t.faces?.join(',') || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={planoTexto}
            onChange={(e) => setPlanoTexto(e.target.value)}
            placeholder={"1. Urgência: Restauração do dente 36 (cárie extensa)\n2. Tratamento endodôntico dente 46\n3. Exodontia do 38 (terceiro molar incluso)\n4. Profilaxia e raspagem\n5. Moldagem para prótese parcial\n\nPrazo estimado: 3 meses\nRetorno: 15 dias após cada procedimento"}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none min-h-[250px] transition-all"
            rows={12}
          />
        </div>
      )}

      {/* Histórico de Sessões */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6 opacity-80">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Histórico de Avaliações Odontológicas</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-500">{sessions.length} registro(s)</span>
        </div>
        <div className="space-y-3">
          {sessions.length > 0 ? sessions.map((s: any) => {
            const map = s.mapeamento && typeof s.mapeamento === 'object' ? s.mapeamento : {}
            const dentes = map.dentes ? Object.keys(map.dentes).length : 0
            const isOpen = expandedSession === s.id
            return (
              <div key={s.id}>
                <div onClick={() => setExpandedSession(isOpen ? null : s.id)} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">{new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{(s.profiles as any)?.nome_completo || 'Profissional'} · {dentes} dente(s)</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-gray-600 transition-transform", isOpen && "rotate-180")} />
                </div>
                {isOpen && (
                  <div className="mt-2 p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 animate-fade-in text-xs">
                    {map.dentes && Object.values(map.dentes).map((d: any) => (
                      <div key={d.tooth} className="flex items-center justify-between">
                        <span className="font-bold text-blue-400">Dente {d.tooth}</span>
                        <span className="text-gray-400">{d.condition} {d.faces?.length ? `(${d.faces.join(',')})` : ''} {d.procedimento_planejado ? `→ ${d.procedimento_planejado}` : ''}</span>
                      </div>
                    ))}
                    {map.plano_tratamento && <p className="text-gray-400 mt-2 whitespace-pre-line border-t border-white/10 pt-2">{map.plano_tratamento}</p>}
                    {map.observacoes && <p className="text-gray-500 italic">{map.observacoes}</p>}
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="py-8 text-center opacity-40">
              <p className="text-xs font-bold uppercase tracking-widest">Nenhuma avaliação anterior registrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  function applyConditionTo(tooth: number) {
    setToothMap(prev => ({
      ...prev,
      [tooth]: { ...prev[tooth], tooth, condition: activeCondition }
    }))
  }
}

// ─── Sub-componentes ─────────────────────────────────────────────────

function ToothButton({ tooth, color, isActive, data, onClick }: { tooth: number; color: string; isActive: boolean; data?: ToothData; onClick: () => void }) {
  const condIcon = data ? CONDITIONS.find(c => c.value === data.condition)?.icon : ''
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-9 h-12 rounded-lg flex flex-col items-center justify-center text-[10px] font-black border-2 transition-all hover:scale-110 active:scale-95 relative",
        isActive ? "ring-2 ring-blue-400 ring-offset-2 scale-110" : ""
      )}
      style={{ borderColor: color, backgroundColor: `${color}15`, color: data ? color : '#9ca3af' }}
      title={`Dente ${tooth} - ${TOOTH_TYPES[tooth] || ''}`}
    >
      <span>{tooth}</span>
      {condIcon && <span className="text-[8px] leading-none">{condIcon}</span>}
    </button>
  )
}

function KpiCard({ label, value, total, color }: { label: string; value: string | number; total?: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    green: 'bg-green-50 text-green-700 border-green-100',
  }
  return (
    <div className={cn("p-4 rounded-2xl border", colors[color])}>
      <p className="text-2xl font-black">{value}{total ? <span className="text-sm opacity-50">/{total}</span> : null}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">{label}</p>
    </div>
  )
}
