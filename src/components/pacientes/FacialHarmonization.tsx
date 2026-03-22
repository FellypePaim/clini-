import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Sparkles,
  MapPin,
  Trash2,
  Save,
  History,
  ChevronDown,
  Activity,
  Camera
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { cn } from '../../lib/utils'
import { FileUpload } from '../ui/FileUpload'
import type { StorageFile } from '../../lib/storage'
import { StorageHelpers } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import type { HarmonizationZone, ProcedureHarmonization } from '../../types/prontuario'

interface FacialHarmonizationProps {
  pacienteId: string
  onSave: (zones: HarmonizationZone[]) => Promise<void>
  initialZones?: HarmonizationZone[]
}

const ZONES_CONFIG = [
  { id: 'testa',      label: 'Testa',           cx: 150, cy: 50, r: 25 },
  { id: 'glabela',    label: 'Glabela',         cx: 150, cy: 90, r: 15 },
  { id: 'olhos_d',    label: 'Olhos (D)',       cx: 100, cy: 110, r: 20 },
  { id: 'olhos_e',    label: 'Olhos (E)',       cx: 200, cy: 110, r: 20 },
  { id: 'macas_d',    label: 'Maçã do Rosto (D)', cx: 80,  cy: 160, r: 25 },
  { id: 'macas_e',    label: 'Maçã do Rosto (E)', cx: 220, cy: 160, r: 25 },
  { id: 'nariz',      label: 'Nariz',           cx: 150, cy: 160, r: 20 },
  { id: 'labios',     label: 'Lábios',          cx: 150, cy: 220, r: 30 },
  { id: 'queixo',     label: 'Queixo',          cx: 150, cy: 270, r: 20 },
  { id: 'mandibula',  label: 'Mandíbula',       cx: 150, cy: 300, r: 40 },
  { id: 'pescoco',    label: 'Pescoço',         cx: 150, cy: 360, r: 40 },
]

export function FacialHarmonization({ pacienteId, onSave, initialZones = [] }: FacialHarmonizationProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [selectedZones, setSelectedZones] = useState<HarmonizationZone[]>(initialZones)
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fotosRegistro, setFotosRegistro] = useState<StorageFile[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Carregar histórico de sessões do banco
  useEffect(() => {
    if (!pacienteId) return
    supabase
      .from('harmonizacoes')
      .select('*, profiles:profissional_id(nome_completo)')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSessions(data) })
  }, [pacienteId])

  const activeZoneConfig = useMemo(() => ZONES_CONFIG.find(z => z.id === activeZoneId), [activeZoneId])
  const activeZoneData   = useMemo(() => selectedZones.find(z => z.id === activeZoneId), [selectedZones, activeZoneId])

  const handleZoneClick = (id: string) => {
    setActiveZoneId(id)
  }

  const updateZone = (data: Partial<HarmonizationZone>) => {
    if (!activeZoneId || !activeZoneConfig) return
    
    const existingIndex = selectedZones.findIndex(z => z.id === activeZoneId)
    if (existingIndex > -1) {
      const newZones = [...selectedZones]
      newZones[existingIndex] = { ...newZones[existingIndex], ...data }
      setSelectedZones(newZones)
    } else {
      setSelectedZones([...selectedZones, { 
        id: activeZoneId, 
        label: activeZoneConfig.label, 
        procedimento: 'botox', 
        produto: '', 
        quantidade: '', 
        ...data 
      } as HarmonizationZone])
    }
  }

  const removeZone = (id: string) => {
    setSelectedZones(selectedZones.filter(z => z.id !== id))
    setActiveZoneId(null)
  }

  const handleSave = async () => {
    if (!clinicaId || !mapRef.current) return
    setIsSubmitting(true)

    try {
      // SVG -> Canvas -> Blob using html2canvas
      // Forçar cores RGB no elemento antes de capturar (html2canvas não suporta oklch do Tailwind 4)
      const el = mapRef.current
      const originalBg = el.style.backgroundColor
      el.style.backgroundColor = '#ffffff'
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        onclone: (doc: Document) => {
          // Patch 1: remover oklch das <style> tags antes do html2canvas parsear
          doc.querySelectorAll('style').forEach(styleEl => {
            if (styleEl.textContent?.includes('oklch')) {
              styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/g, 'transparent')
            }
          })
          // Patch 2: forçar estilos inline nos elementos
          doc.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement
            if (!el.style) return
            try {
              const computed = doc.defaultView?.getComputedStyle(el) ?? window.getComputedStyle(el)
              if (computed.color?.includes('oklch')) el.style.color = '#111827'
              if (computed.backgroundColor?.includes('oklch')) el.style.backgroundColor = 'transparent'
              if (computed.borderColor?.includes('oklch')) el.style.borderColor = '#e5e7eb'
              if (computed.fill?.includes('oklch')) el.style.fill = '#374151'
            } catch { /* ignored */ }
          })
        }
      })
      el.style.backgroundColor = originalBg
      // Usa WebP para melhor compressão e performance
      const dataURL = canvas.toDataURL('image/webp', 0.8)
      const res = await fetch(dataURL)
      const blob = await res.blob()
      
      const file = new File([blob], `harmonizacao_${pacienteId}_${Date.now()}.webp`, { type: 'image/webp' })
      const stored = await StorageHelpers.uploadMapaHarmonizacao(clinicaId, pacienteId, file)

      // Assuming table "harmonizacoes" or similar exists, injecting into DB:
      await supabase.from('harmonizacoes').insert({
        paciente_id: pacienteId,
        profissional_id: user?.id || '00000000-0000-0000-0000-000000000000',
        mapeamento: {
           url: stored.url,
           zonas: selectedZones as any // Escape strict Json intersection mismatch
        },
      })

      // Wait original hook callback if any
      await onSave(selectedZones)
      
      // Recarregar sessões após salvar
      const { data: refreshed } = await supabase
        .from('harmonizacoes')
        .select('*, profiles:profissional_id(nome_completo)')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })
      if (refreshed) setSessions(refreshed)

      toast({ title: 'Sucesso', description: 'Mapeamento facial salvo com sucesso.', type: 'success' })
    } catch(err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      {/* Visual Map Area */}
      <div className="lg:col-span-1 bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm flex flex-col items-center relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500/10 group-hover:bg-green-500/30 transition-all" />
         
         <div className="flex items-center gap-2 mb-8 self-start">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="text-sm font-black text-gray-900 border-none">Mapeamento Facial</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Interativo front-view</p>
            </div>
         </div>

         <div className="relative" ref={mapRef}>
            {/* SVG Silhouette */}
            <svg width="300" height="420" viewBox="0 0 300 420" className="drop-shadow-2xl">
              {/* Silhouette Body */}
              <path d="M150,20 C80,20 40,80 40,150 C40,240 80,300 150,320 C220,300 260,240 260,150 C260,80 220,20 150,20 Z" fill="#fcfcfc" stroke="#eeeeee" strokeWidth="2" />
              <path d="M100,320 Q150,330 200,320 L210,400 Q150,420 90,400 Z" fill="#fcfcfc" stroke="#eeeeee" strokeWidth="2" />
              
              {/* Draw Zones */}
              {ZONES_CONFIG.map(zone => {
                const isSelected = selectedZones.some(z => z.id === zone.id)
                const isActive   = activeZoneId === zone.id
                return (
                  <circle
                    key={zone.id}
                    cx={zone.cx}
                    cy={zone.cy}
                    r={zone.r}
                    onClick={() => handleZoneClick(zone.id)}
                    className={cn(
                      "cursor-pointer transition-all duration-300 stroke-2",
                      isSelected ? "fill-green-500/40 stroke-green-500" : "fill-gray-100/30 stroke-gray-200 hover:stroke-gray-400",
                      isActive && "fill-green-500/60 stroke-green-600 scale-110 shadow-2xl"
                    )}
                    style={{ transformOrigin: `${zone.cx}px ${zone.cy}px` }}
                  />
                )
              })}
            </svg>

            {/* Popover for active zone */}
            {activeZoneId && activeZoneConfig && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-slide-in pointer-events-none">
                 <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-gray-100 w-[280px] pointer-events-auto">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                       <span className="text-xs font-black text-gray-900">{activeZoneConfig.label}</span>
                       <button onClick={() => setActiveZoneId(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                         <X className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <ZoneField label="Procedimento">
                          <select 
                            value={activeZoneData?.procedimento || 'botox'}
                            onChange={(e) => updateZone({ procedimento: e.target.value as ProcedureHarmonization })}
                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-2 px-3 outline-none"
                          >
                             <option value="botox">Botox</option>
                             <option value="preenchimento">Preenchimento</option>
                             <option value="biorevolumizador">Biorevolumizador</option>
                             <option value="fios">Fios</option>
                             <option value="outros">Outros</option>
                          </select>
                       </ZoneField>
                       
                       <ZoneField label="Produto">
                          <input 
                            type="text" 
                            placeholder="Ex: Botox Allergan" 
                            value={activeZoneData?.produto || ''}
                            onChange={(e) => updateZone({ produto: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-2 px-3 placeholder:text-gray-300 outline-none"
                          />
                       </ZoneField>

                       <ZoneField label="Quantidade">
                          <input 
                            type="text" 
                            placeholder="Ex: 10 UI / 0.5ml" 
                            value={activeZoneData?.quantidade || ''}
                            onChange={(e) => updateZone({ quantidade: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-2 px-3 placeholder:text-gray-300 outline-none"
                          />
                       </ZoneField>

                       {activeZoneData && (
                         <button 
                           onClick={() => removeZone(activeZoneId)}
                           className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                         >
                           Remover Registro
                         </button>
                       )}
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Procedures Recap & Sessions Sidebar */}
      <div className="flex-1 space-y-8">
         {/* Current Session Map Summary */}
         <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
               <div>
                 <h3 className="text-sm font-black text-gray-900">Resumo da Sessão Atual</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedZones.length} zonas registradas</p>
               </div>
               <button 
                onClick={handleSave}
                disabled={isSubmitting || selectedZones.length === 0}
                className="btn-primary py-2 px-6 flex items-center gap-2"
               >
                 {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Salvar Mapeamento
               </button>
            </div>

            <div className="space-y-3">
               {selectedZones.length > 0 ? (
                 selectedZones.map(zone => (
                   <div key={zone.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white transition-all group">
                     <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xs font-black">
                         {ZONES_CONFIG.find(z => z.id === zone.id)?.id.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none mb-1">{zone.label}</p>
                         <p className="text-[11px] text-gray-500 font-medium capitalize">{zone.procedimento} · {zone.produto} ({zone.quantidade})</p>
                       </div>
                     </div>
                     <button onClick={() => removeZone(zone.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-300 hover:text-red-500 transition-all rounded-lg">
                        <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               ) : (
                 <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 select-none">
                    <Sparkles className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Clique nas zonas da face para iniciar</p>
                 </div>
               )}
            </div>
         </div>

         {/* History of sessions — Visual Interativo */}
         <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-green-950 rounded-[40px] p-8 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                     <History className="w-5 h-5 text-green-400" />
                   </div>
                   <div>
                     <h3 className="text-sm font-black uppercase tracking-widest">Sessões de Harmonização</h3>
                     <p className="text-[10px] text-gray-500 font-medium mt-0.5">{sessions.length} sessão(ões) registrada(s)</p>
                   </div>
                 </div>
              </div>

              <div className="space-y-4">
                 {sessions.length > 0 ? sessions.map((session: any, sIdx: number) => {
                   const mapeamento = session.mapeamento && typeof session.mapeamento === 'object' ? session.mapeamento : {}
                   const zonas = Array.isArray(mapeamento.zonas) ? mapeamento.zonas : []
                   const profNome = (session.profiles as any)?.nome_completo || 'Profissional'
                   const isExpanded = expandedSession === session.id

                   // Agrupar por procedimento
                   const procGroups: Record<string, number> = {}
                   zonas.forEach((z: any) => { procGroups[z.procedimento || 'outro'] = (procGroups[z.procedimento || 'outro'] || 0) + 1 })

                   const PROC_COLORS: Record<string, string> = { botox: '#22c55e', preenchimento: '#3b82f6', biorevolumizador: '#a855f7', fios: '#f59e0b', outros: '#6b7280' }

                   return (
                     <div key={session.id} className={cn("rounded-2xl border transition-all duration-300 overflow-hidden", isExpanded ? "border-green-500/30 bg-white/[0.03]" : "border-white/5 hover:border-white/10 bg-white/[0.02]")}>
                       <div className="p-5 flex items-start justify-between">
                         <div className="flex items-start gap-4 cursor-pointer flex-1" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/20 shrink-0">
                             {sessions.length - sIdx}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-black">{new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                             <p className="text-[10px] text-gray-400 font-medium mt-0.5">{profNome}</p>
                             {/* Mini badges */}
                             <div className="flex flex-wrap gap-1.5 mt-3">
                               {Object.entries(procGroups).map(([proc, count]) => (
                                 <span key={proc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold capitalize" style={{ backgroundColor: `${PROC_COLORS[proc] || '#666'}20`, color: PROC_COLORS[proc] || '#666' }}>
                                   {count}x {proc}
                                 </span>
                               ))}
                               {zonas.length === 0 && <span className="text-[10px] text-gray-600">Sem zonas registradas</span>}
                             </div>
                           </div>
                         </div>
                         <button onClick={() => setExpandedSession(isExpanded ? null : session.id)} className="p-2 text-gray-500 hover:text-white rounded-lg transition-all shrink-0">
                           <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                         </button>
                       </div>

                       {isExpanded && (
                         <div className="px-5 pb-5 animate-fade-in space-y-3">
                           {zonas.map((z: any, i: number) => {
                             const pc = PROC_COLORS[z.procedimento] || '#666'
                             return (
                               <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                                 <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${pc}20` }}>
                                   <Sparkles className="w-4 h-4" style={{ color: pc }} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <span className="font-bold text-white">{z.label || z.id}</span>
                                   <p className="text-gray-400 text-[10px] mt-0.5">{z.procedimento} · {z.produto || '—'} ({z.quantidade || '—'})</p>
                                 </div>
                               </div>
                             )
                           })}
                           {mapeamento.url && (
                             <a href={mapeamento.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-[10px] font-bold text-green-400 hover:text-green-300 uppercase tracking-widest text-center transition-all hover:bg-green-500/20">
                               Ver Mapa Facial Salvo →
                             </a>
                           )}
                         </div>
                       )}
                     </div>
                   )
                 }) : (
                   <div className="py-12 text-center">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                       <Sparkles className="w-8 h-8 text-gray-700" />
                     </div>
                     <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Nenhuma sessão registrada</p>
                     <p className="text-[10px] text-gray-700 mt-1">Selecione zonas no mapa acima e salve</p>
                   </div>
                 )}
              </div>
            </div>
         </div>

         {/* Record of Photos (Antes/Depois) */}
         <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Camera className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-gray-900 border-none">Registro Fotográfico</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Antes e Depois</p>
               </div>
            </div>

            {clinicaId && (
              <FileUpload 
                bucket="pacientes-fotos" 
                clinica_id={clinicaId}
                paciente_id={pacienteId}
                label="Adicionar Foto (Antes/Depois)"
                accept="image/*"
                multiple
                onUploadComplete={(files) => setFotosRegistro(prev => [...files, ...prev])}
                existingFiles={fotosRegistro}
                onDeleteExisting={(f) => setFotosRegistro(prev => prev.filter(x => x.id !== f.id))}
              />
            )}
         </div>
      </div>
    </div>
  )
}

function ZoneField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</p>
       {children}
    </div>
  )
}

function X(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
