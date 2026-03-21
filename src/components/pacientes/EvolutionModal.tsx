import { useState, useRef, useEffect } from 'react'
import 'react-quill/dist/quill.snow.css'
import { 
  X, 
  Mic, 
  Sparkles, 
  Save, 
  ClipboardList, 
  Search, 
  Stethoscope, 
  Play, 
  Activity,
  AlertCircle,
  PenTool,
  Fingerprint
} from 'lucide-react'
import { useProntuario, CID10_MOCK } from '../../hooks/useProntuario'
import { useEstoqueAutomation } from '../../hooks/useEstoque'
import { SignaturePad } from '../ui/SignaturePad'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import type { Appointment } from '../../types'
import type { CID10, EvolutionRecord } from '../../types/prontuario'

interface EvolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<EvolutionRecord>) => Promise<void>
  onGeneratePrescription: () => void
  appointment: Appointment
}

export function EvolutionModal({ isOpen, onClose, onSave, onGeneratePrescription, appointment }: EvolutionModalProps) {
  const { transcribeAudio, generateAISummary } = useProntuario()
  const { processProcedure } = useEstoqueAutomation()
  const [content, setContent] = useState('')
  const [cidSearch, setCidSearch] = useState('')
  const [selectedCid, setSelectedCid] = useState<CID10 | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  
  const [signature, setSignature] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCids = CID10_MOCK.filter(c => 
    c.codigo.toLowerCase().includes(cidSearch.toLowerCase()) || 
    c.nome.toLowerCase().includes(cidSearch.toLowerCase())
  ).slice(0, 5)

  const handleTranscribe = async () => {
    setIsTranscribing(true)
    const text = await transcribeAudio('')
    setContent(prev => prev + (prev ? '<br/>' : '') + text)
    setIsTranscribing(false)
  }

  const handleGenerateSummary = async () => {
    if (!content || content === '<p><br></p>') return
    setIsSummarizing(true)
    const result = await generateAISummary(content)
    setSummary(result)
    setIsSummarizing(false)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    // Generate a simple hash for audit purposes
    const auditHash = btoa(content.slice(0, 100) + new Date().getTime()).slice(0, 16)

    await onSave({
      consultaId: appointment.id,
      pacienteId: appointment.pacienteId,
      data: new Date().toISOString().split('T')[0],
      profissionalId: appointment.profissionalId,
      texto: content,
      cid10: selectedCid?.codigo,
      resumoIA: summary,
      assinaturaUrl: signature || undefined,
      hashAuditoria: auditHash
    } as any)

    // Automação de estoque: Processa o procedimento para baixar materiais
    if (appointment.procedimento) {
      await processProcedure(
        appointment.procedimento,
        appointment.profissionalNome,
        appointment.pacienteId
      )
    }

    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-green-600 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">Registro de Evolução Clínica</h2>
              <p className="text-xs text-green-100/70 font-medium">Paciente: <b>{appointment.pacienteNome}</b> · {new Date(appointment.data).toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Editor Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Anotações da Consulta</label>
                  
                  {/* AI Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shrink-0",
                        isTranscribing 
                          ? "bg-gray-100 text-gray-400 border-gray-100 animate-pulse" 
                          : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50"
                      )}
                    >
                      {isTranscribing ? <Activity className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      {isTranscribing ? 'Transcrevendo...' : 'Transcrever por IA'}
                    </button>
                    
                    <button 
                      onClick={handleGenerateSummary}
                      disabled={isSummarizing || !content || content === '<p><br></p>'}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shrink-0",
                        isSummarizing 
                          ? "bg-gray-100 text-gray-400 border-gray-100 animate-pulse" 
                          : "bg-white text-purple-600 border-purple-100 hover:bg-purple-50 disabled:opacity-30"
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      {isSummarizing ? 'Analisando...' : 'Resumo Automático'}
                    </button>
                  </div>
                </div>

                <div className="quill-wrapper rounded-[32px] border border-gray-200 overflow-hidden shadow-inner bg-gray-50/20 p-6 min-h-[300px] flex flex-col">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 shrink-0">
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all font-black text-xs uppercase tracking-widest">B</button>
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all italic font-serif">I</button>
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all underline">U</button>
                    <div className="w-px h-4 bg-gray-200 mx-2" />
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all font-black text-xs uppercase tracking-widest">Lista</button>
                  </div>
                  <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="Inicie a evolução do paciente aqui..."
                    className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-gray-600 leading-relaxed font-serif italic"
                  />
                </div>
              </div>

              {/* CID-10 Search */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Classificação ICD-10 (CID)</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por código ou diagnóstico..."
                    value={cidSearch}
                    onChange={(e) => setCidSearch(e.target.value)}
                    className="input-base pl-10"
                  />
                  
                  {cidSearch && !selectedCid && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 py-2 animate-slide-in">
                      {filteredCids.length > 0 ? filteredCids.map(cid => (
                        <button 
                          key={cid.codigo}
                          onClick={() => { setSelectedCid(cid); setCidSearch(cid.codigo); }}
                          className="w-full px-4 py-3 hover:bg-green-50 text-left flex items-center gap-3 group/item transition-colors"
                        >
                          <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-md group-hover/item:bg-white">{cid.codigo}</span>
                          <span className="text-sm font-medium text-gray-700">{cid.nome}</span>
                        </button>
                      )) : (
                        <div className="px-4 py-6 text-center text-gray-400 text-xs italic flex flex-col items-center gap-2">
                           <AlertCircle className="w-5 h-5 text-gray-200" />
                           Nenhum diagnóstico encontrado para "{cidSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedCid && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-xl w-fit">
                    <span className="text-xs font-black text-green-700">{selectedCid.codigo}</span>
                    <span className="text-xs text-green-700/80 font-medium">— {selectedCid.nome}</span>
                    <button onClick={() => { setSelectedCid(null); setCidSearch(''); }} className="ml-1 text-green-300 hover:text-green-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <PenTool className="w-3.5 h-3.5" /> Assinatura Eletrônica 
                   </label>
                   {signature && (
                      <Badge variant="green" className="text-[9px] h-4 bg-green-50 text-green-700 animate-pulse border-none">
                        <Fingerprint size={10} className="mr-1" /> PROTEGIDA COM HASH
                      </Badge>
                   )}
                </div>
                
                <SignaturePad 
                   onSave={(s) => setSignature(s)} 
                   onClear={() => setSignature(null)} 
                />
              </div>
            </div>

            {/* AI Summary Sidebar */}
            <div className="space-y-6">
               <div className="p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 shadow-inner h-full flex flex-col gap-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="text-sm font-black text-gray-900 border-none">Análise da IA</h3>
                  </div>

                  {summary ? (
                    <div className="space-y-5 animate-slide-in">
                       <SummarySection label="Queixa" value={summary.queixa} />
                       <SummarySection label="Diagnóstico" value={summary.diagnostico} />
                       <SummarySection label="Conduta" value={summary.conduta} />
                       <SummarySection label="Retorno" value={summary.retorno} isLast />
                       
                       <div className="pt-4 border-t border-gray-200/50">
                         <div className="p-4 bg-white/70 rounded-2xl flex items-center gap-3">
                            <Activity className="w-5 h-5 text-green-500" />
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">"Resumo gerado automaticamente com base nas anotações clínicas."</p>
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                       <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 ring-8 ring-gray-100/50">
                          <ClipboardList className="w-8 h-8 text-gray-200" />
                       </div>
                       <p className="text-xs text-gray-400 font-medium leading-relaxed">Clique em <b>Resumo Automático</b> para extrair as principais seções da evolução.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 p-6 px-8 flex items-center justify-between border-t border-gray-200 shrink-0">
          <button 
            onClick={onGeneratePrescription}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl text-sm font-bold border border-gray-200 shadow-sm transition-all active:scale-95"
          >
            <ClipboardList className="w-4 h-4 text-purple-500" /> Gerar Prescrição
          </button>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
             >
               Cancelar
             </button>
             <button 
               onClick={handleSave}
               disabled={isSubmitting || !content || content === '<p><br></p>'}
               className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
             >
               {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Salvar Evolução
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummarySection({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) {
  return (
    <div className={cn("space-y-1", !isLast && "pb-4")}>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs text-gray-700 font-semibold leading-relaxed">{value}</p>
    </div>
  )
}
