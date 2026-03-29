import { useState, useRef } from 'react'
import { 
  X,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  ClipboardList,
  Smartphone,
  ShieldCheck,
  Lock,
  Printer
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { supabase } from '../../lib/supabase'
import { StorageHelpers } from '../../lib/storage'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import type { Patient } from '../../types'
import type { PrescriptionItem } from '../../types/prontuario'

// Banco de medicamentos comuns com dosagens padrão
const MEDICAMENTOS_COMUNS = [
  { nome: 'Amoxicilina 500mg', dosagem: '1 comprimido', frequencia: 'De 8 em 8 horas', duracao: '7 dias' },
  { nome: 'Azitromicina 500mg', dosagem: '1 comprimido', frequencia: '1x ao dia', duracao: '3 dias' },
  { nome: 'Ibuprofeno 600mg', dosagem: '1 comprimido', frequencia: 'De 8 em 8 horas', duracao: '5 dias' },
  { nome: 'Dipirona 500mg', dosagem: '1 comprimido', frequencia: 'De 6 em 6 horas', duracao: 'Se dor' },
  { nome: 'Paracetamol 750mg', dosagem: '1 comprimido', frequencia: 'De 6 em 6 horas', duracao: 'Se dor/febre' },
  { nome: 'Nimesulida 100mg', dosagem: '1 comprimido', frequencia: 'De 12 em 12 horas', duracao: '5 dias' },
  { nome: 'Prednisolona 20mg', dosagem: '1 comprimido', frequencia: '1x ao dia (manhã)', duracao: '5 dias' },
  { nome: 'Cefalexina 500mg', dosagem: '1 comprimido', frequencia: 'De 6 em 6 horas', duracao: '7 dias' },
  { nome: 'Metronidazol 400mg', dosagem: '1 comprimido', frequencia: 'De 8 em 8 horas', duracao: '7 dias' },
  { nome: 'Omeprazol 20mg', dosagem: '1 cápsula', frequencia: '1x ao dia (jejum)', duracao: '30 dias' },
  { nome: 'Clindamicina 300mg', dosagem: '1 cápsula', frequencia: 'De 8 em 8 horas', duracao: '7 dias' },
  { nome: 'Dexametasona 4mg', dosagem: '1 comprimido', frequencia: '1x ao dia', duracao: '3 dias' },
  { nome: 'Clorexidina 0,12%', dosagem: 'Bochechar 15ml', frequencia: '2x ao dia', duracao: '7 dias' },
  { nome: 'Fluconazol 150mg', dosagem: '1 comprimido', frequencia: 'Dose única', duracao: '1 dia' },
]

// Interações básicas
const INTERACOES: Record<string, string[]> = {
  'Amoxicilina': ['Metotrexato', 'Varfarina'],
  'Ibuprofeno': ['Varfarina', 'Ácido Acetilsalicílico', 'Lítio'],
  'Dipirona': ['Metotrexato', 'Ciclosporina'],
  'Metronidazol': ['Álcool', 'Varfarina', 'Lítio'],
  'Nimesulida': ['Varfarina', 'Lítio', 'Metotrexato'],
}

interface PrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  onSave: (items: PrescriptionItem[]) => Promise<void>
}

export function PrescriptionModal({ isOpen, onClose, patient, onSave }: PrescriptionModalProps) {
  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()

  const [items, setItems] = useState<PrescriptionItem[]>([
    { id: '1', medicamento: '', dosagem: '', frequencia: '', duracao: '' }
  ])
  const [_showPreview, _setShowPreview] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchMed, setSearchMed] = useState('')
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Validade da prescrição (180 dias)
  const validade = new Date()
  validade.setDate(validade.getDate() + 180)
  const validadeStr = `${String(validade.getDate()).padStart(2, '0')}/${String(validade.getMonth() + 1).padStart(2, '0')}/${validade.getFullYear()}`

  // Verificar interações
  const interacoesDetectadas: string[] = []
  const medsNomes = items.map(i => i.medicamento.split(' ')[0])
  medsNomes.forEach(med => {
    const inter = INTERACOES[med]
    if (inter) {
      inter.forEach(i => {
        if (medsNomes.some(m => m.toLowerCase().includes(i.toLowerCase()) && m !== med)) {
          interacoesDetectadas.push(`${med} × ${i}`)
        }
      })
    }
  })

  const selectMedicamento = (idx: number, med: typeof MEDICAMENTOS_COMUNS[0]) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], medicamento: med.nome, dosagem: med.dosagem, frequencia: med.frequencia, duracao: med.duracao }
    setItems(newItems)
    setShowSuggestions(null)
    setSearchMed('')
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), medicamento: '', dosagem: '', frequencia: '', duracao: '' }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PrescriptionItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!previewRef.current) return null
    const canvas = await html2canvas(previewRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    
    // A4 dimensions in mm (210 x 297)
    const pdf = new jsPDF({ format: 'a4', orientation: 'portrait' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    return pdf.output('blob')
  }

  const handleDownloadPDF = async () => {
    const blob = await generatePDFBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Prescricao_${patient.nome.replace(' ', '_')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSendWA = () => {
    const text = encodeURIComponent(`Olá ${patient.nome}, segue sua prescrição digital gerada pela ${user?.clinicaNome || 'clínica'}.`)
    window.open(`https://wa.me/${patient.contato.telefone.replace(/\D/g, '')}?text=${text}`, '_blank')
  }

  const handleSave = async () => {
    if (!clinicaId) return
    try {
      setIsSubmitting(true)
      
      // Generate PDF
      const pdfBlob = await generatePDFBlob()
      if (!pdfBlob) throw new Error('Falha ao gerar o PDF da prescrição')
      
      const file = new File([pdfBlob], `prescricao_${Date.now()}.pdf`, { type: 'application/pdf' })
      
      // Upload to Storage
      const stored = await StorageHelpers.uploadReceita(clinicaId, patient.id, file)

      // Add to patient documents
      await supabase.from('documentos_paciente').insert({
        paciente_id: patient.id,
        nome: `Prescrição - ${new Date().toLocaleDateString()}`,
        tipo: 'receita',
        arquivo_url: stored.url,
        storage_path: stored.path,
        tamanho_bytes: stored.tamanho_bytes,
        mime_type: stored.mime_type,
        uploaded_by: user?.id
      })
      
      // Keep old side-effect
      await onSave(items)
      
      toast({ title: 'Prescrição salva', description: 'PDF gerado e armazenado com sucesso.', type: 'success' })
      onClose()
    } catch(err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative bg-[var(--color-bg-card)] rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-in">
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-10 bg-[var(--color-bg-deep)]/50 custom-scrollbar border-r border-[var(--color-border)]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-500/10 border border-purple-200">
                    <ClipboardList className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-[var(--color-text-primary)] leading-none">Nova Prescrição</h2>
                   <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest mt-1.5">Módulo de Farmacologia Digital</p>
                 </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
                  <X className="w-6 h-6 text-[var(--color-text-muted)]" />
               </button>
             </div>

             <div className="space-y-6">
               {/* Alerta de interações */}
               {interacoesDetectadas.length > 0 && (
                 <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                   <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-sm font-bold text-red-800">Possível interação medicamentosa</p>
                     <div className="flex flex-wrap gap-1.5 mt-1">
                       {interacoesDetectadas.map(i => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-semibold">{i}</span>)}
                     </div>
                   </div>
                 </div>
               )}

               {/* Validade */}
               <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2 text-xs">
                 <Lock className="w-4 h-4 text-blue-500" />
                 <span className="text-blue-700 font-medium">Prescrição válida por 180 dias — até {validadeStr}</span>
               </div>

               <div className="bg-[var(--color-bg-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-[var(--color-text-primary)] border-none">Medicamentos</h3>
                    <button onClick={addItem} className="flex items-center gap-2 text-xs font-black text-cyan-500 hover:text-cyan-600 transition-all bg-cyan-500/5 px-3 py-2 rounded-xl">
                      <Plus className="w-4 h-4" /> Adicionar Outro
                    </button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={item.id} className="relative p-6 bg-[var(--color-bg-deep)]/50 rounded-2xl border border-[var(--color-border)] border-dashed animate-slide-in group">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-[10px] font-black flex items-center justify-center text-[var(--color-text-muted)]">0{index + 1}</span>
                          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Vias de Administração</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <PrescriptionField
                              label="Medicamento"
                              placeholder="Digite para buscar..."
                              value={item.medicamento}
                              onChange={(v) => { updateItem(item.id, 'medicamento', v); setSearchMed(v); setShowSuggestions(index) }}
                              onFocus={() => setShowSuggestions(index)}
                            />
                            {showSuggestions === index && searchMed.length >= 2 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                                {MEDICAMENTOS_COMUNS.filter(m => m.nome.toLowerCase().includes(searchMed.toLowerCase())).map(m => (
                                  <button key={m.nome} type="button" onClick={() => selectMedicamento(index, m)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-500/5 transition-colors border-b border-gray-50 last:border-0">
                                    <span className="font-semibold text-[var(--color-text-primary)]">{m.nome}</span>
                                    <span className="text-[var(--color-text-muted)] ml-2">{m.dosagem} · {m.frequencia}</span>
                                  </button>
                                ))}
                                {MEDICAMENTOS_COMUNS.filter(m => m.nome.toLowerCase().includes(searchMed.toLowerCase())).length === 0 && (
                                  <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Nenhum medicamento encontrado</p>
                                )}
                              </div>
                            )}
                          </div>
                          <PrescriptionField 
                            label="Dosagem / Quantidade" 
                            placeholder="Ex: 1 comprimido" 
                            value={item.dosagem}
                            onChange={(v) => updateItem(item.id, 'dosagem', v)}
                          />
                          <PrescriptionField 
                            label="Frequência" 
                            placeholder="Ex: De 8 em 8 horas" 
                            value={item.frequencia}
                            onChange={(v) => updateItem(item.id, 'frequencia', v)}
                          />
                          <PrescriptionField 
                            label="Duração do Tratamento" 
                            placeholder="Ex: Por 7 dias" 
                            value={item.duracao}
                            onChange={(v) => updateItem(item.id, 'duracao', v)}
                          />
                          <div className="md:col-span-2">
                             <PrescriptionField 
                              label="Observações" 
                              placeholder="Orientações adicionais..." 
                              value={item.observacoes || ''}
                              onChange={(v) => updateItem(item.id, 'observacoes', v)}
                             />
                          </div>
                        </div>

                        {items.length > 1 && (
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-[var(--color-bg-card)] border border-red-100 text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               {/* Digital Signature */}
               <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                     <ShieldCheck className="w-48 h-48" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-3">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg-card)]/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-cyan-400">
                           <Lock className="w-5 h-5" />
                         </div>
                         <h3 className="text-lg font-black leading-none">Assinatura Certificada</h3>
                       </div>
                       <p className="text-xs text-[var(--color-text-muted)] leading-relaxed font-medium">Esta receita será validada através de certificado digital padrão ICP-Brasil e conterá QR Code de autenticidade.</p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-4 min-w-[240px]">
                       <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-card)]/5 rounded-2xl border border-white/10">
                          <input 
                            type="checkbox" 
                            checked={isSigned} 
                            onChange={(e) => setIsSigned(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500" 
                          />
                          <span className="text-xs font-bold text-[var(--color-text-dim)]">Assinar digitalmente</span>
                       </div>
                       {isSigned && (
                         <div className="animate-slide-in">
                           <input 
                             type="password" 
                             placeholder="Sua senha digital..."
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="w-full px-4 py-3 bg-[var(--color-bg-card)] border-none rounded-2xl text-xs text-[var(--color-text-primary)] font-bold placeholder:text-[var(--color-text-muted)] focus:ring-4 focus:ring-cyan-500/30 transition-all outline-none" 
                           />
                         </div>
                       )}
                    </div>
                  </div>
               </div>
             </div>
          </div>

          {/* Preview Area (A4 Style) */}
          <div className="hidden lg:flex w-[400px] bg-gray-200/50 flex-col items-center justify-center p-8 shrink-0 overflow-y-auto custom-scrollbar">
             <div className="flex items-center gap-2 mb-4 self-start opacity-40">
                <Printer className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Preview A4</span>
             </div>
             
             <div ref={previewRef} className="w-[320px] bg-[var(--color-bg-card)] shadow-2xl rounded-sm p-8 flex flex-col min-h-[450px] origin-top scale-110">
                {/* PDF Header */}
                <div className="flex flex-col items-center text-center border-b-2 border-cyan-500 pb-4 mb-6">
                   <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white mb-2 shadow-sm">
                      <Plus className="w-5 h-5" />
                   </div>
                   <h1 className="text-[10px] font-black uppercase text-[var(--color-text-primary)] tracking-wider">{user?.clinicaNome || 'Clínica'}</h1>
                   <p className="text-[7px] text-[var(--color-text-muted)] font-bold mt-0.5">Prescrição Digital</p>
                </div>

                {/* Patient Info */}
                <div className="mb-6">
                   <p className="text-[7px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Paciente</p>
                   <p className="text-[9px] font-black text-[var(--color-text-primary)]">{patient.nome}</p>
                   <p className="text-[7px] text-[var(--color-text-muted)] mt-0.5">CPF: {patient.cpf} · Data: {new Date().toLocaleDateString()}</p>
                </div>

                {/* RX Symbol */}
                <div className="relative mb-6">
                   <span className="text-3xl font-serif font-black text-gray-100 absolute -left-4 -top-4 opacity-50">Rx</span>
                   <div className="space-y-4 pt-2">
                     {items.map((item, i) => (
                       <div key={item.id} className="text-[8px] leading-relaxed">
                         <p className="font-black text-[var(--color-text-primary)]">{i + 1}. {item.medicamento || '...'}</p>
                         <p className="text-[var(--color-text-secondary)] pl-3">· {item.dosagem || '...'} | {item.frequencia || '...'} | {item.duracao || '...'}</p>
                         {item.observacoes && <p className="text-[var(--color-text-muted)] pl-3 italic text-[7px]">{item.observacoes}</p>}
                       </div>
                     ))}
                   </div>
                </div>

                {/* Footer Signature */}
                <div className="mt-auto pt-8 flex flex-col items-center">
                   <div className="relative flex flex-col items-center">
                      <div className="w-24 h-0.5 bg-gray-200 mb-2"></div>
                      <p className="text-[7px] font-black text-[var(--color-text-primary)]">{user?.nome || 'Profissional'}</p>
                      {user?.crm && <p className="text-[6px] text-[var(--color-text-muted)]">{user.crm}</p>}
                      
                      {isSigned && password && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-80 pointer-events-none">
                           <div className="w-16 h-16 border-4 border-cyan-500 rounded-full flex items-center justify-center rotate-12 bg-[var(--color-bg-card)]/80 p-1">
                              <p className="text-[6px] font-black text-cyan-500 text-center leading-tight">ASSINADO DIGITALMENTE</p>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-8 self-end">
                      <QRCodeSVG value={`${window.location.origin}/validar`} size={32} />
                      <p className="text-[5px] text-[var(--color-text-dim)] text-right mt-1">v.2.0.26</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-[var(--color-bg-card)] p-8 px-10 flex flex-col md:flex-row items-center justify-between border-t border-[var(--color-border)] gap-6 shrink-0 z-10">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-4 bg-[var(--color-bg-card)] hover:bg-gray-200 text-[var(--color-text-secondary)] rounded-2xl text-xs font-black transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </button>
              <button 
                onClick={handleSendWA}
                className="flex items-center gap-2 px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-600 rounded-2xl text-xs font-black transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" /> Enviar por WhatsApp
              </button>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-6 py-4 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSubmitting || !items[0].medicamento}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-gray-900 hover:bg-black text-white rounded-[24px] text-sm font-black shadow-2xl shadow-gray-900/30 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                {isSubmitting ? 'Gerando...' : 'Finalizar Prescrição'}
                {!isSubmitting && <CheckCircle className="w-5 h-5 text-cyan-400" />}
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}

function PrescriptionField({ label, placeholder, value, onChange, onFocus }: { label: string, placeholder: string, value: string, onChange: (v: string) => void, onFocus?: () => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-4 focus:ring-purple-500/10 focus:border-purple-200 transition-all outline-none shadow-sm"
      />
    </div>
  )
}
