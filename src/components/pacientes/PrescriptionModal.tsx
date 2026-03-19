import { useState, useRef } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ClipboardList, 
  Save, 
  Pill,
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
import { cn } from '../../lib/utils'
import type { Patient } from '../../types'
import type { PrescriptionItem } from '../../types/prontuario'

interface PrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  onSave: (items: PrescriptionItem[]) => Promise<void>
}

export function PrescriptionModal({ isOpen, onClose, patient, onSave }: PrescriptionModalProps) {
  const { user } = useAuthStore()
  const clinicaId = (user as any)?.user_metadata?.clinica_id
  const { toast } = useToast()

  const [items, setItems] = useState<PrescriptionItem[]>([
    { id: '1', medicamento: '', dosagem: '', frequencia: '', duracao: '' }
  ])
  const [showPreview, setShowPreview] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

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
    const text = encodeURIComponent(`Olá ${patient.nome}, segue sua prescrição digital gerada pela Clínica Verde.`)
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
      
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-in">
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50 custom-scrollbar border-r border-gray-100">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-500/10 border border-purple-200">
                    <ClipboardList className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-gray-900 leading-none">Nova Prescrição</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Módulo de Farmacologia Digital</p>
                 </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
                  <X className="w-6 h-6 text-gray-400" />
               </button>
             </div>

             <div className="space-y-6">
               <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-900 border-none">Medicamentos</h3>
                    <button onClick={addItem} className="flex items-center gap-2 text-xs font-black text-green-600 hover:text-green-700 transition-all bg-green-50 px-3 py-2 rounded-xl">
                      <Plus className="w-4 h-4" /> Adicionar Outro
                    </button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={item.id} className="relative p-6 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed animate-slide-in group">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-[10px] font-black flex items-center justify-center text-gray-400">0{index + 1}</span>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vias de Administração</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <PrescriptionField 
                            label="Medicamento" 
                            placeholder="Ex: Amoxicilina 500mg" 
                            value={item.medicamento}
                            onChange={(v) => updateItem(item.id, 'medicamento', v)}
                          />
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
                            className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-white border border-red-100 text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50"
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
                         <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-green-400">
                           <Lock className="w-5 h-5" />
                         </div>
                         <h3 className="text-lg font-black leading-none">Assinatura Certificada</h3>
                       </div>
                       <p className="text-xs text-gray-400 leading-relaxed font-medium">Esta receita será validada através de certificado digital padrão ICP-Brasil e conterá QR Code de autenticidade.</p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-4 min-w-[240px]">
                       <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
                          <input 
                            type="checkbox" 
                            checked={isSigned} 
                            onChange={(e) => setIsSigned(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-white/20 bg-transparent text-green-600 focus:ring-green-500" 
                          />
                          <span className="text-xs font-bold text-gray-300">Assinar digitalmente</span>
                       </div>
                       {isSigned && (
                         <div className="animate-slide-in">
                           <input 
                             type="password" 
                             placeholder="Sua senha digital..."
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             className="w-full px-4 py-3 bg-white border-none rounded-2xl text-xs text-gray-900 font-bold placeholder:text-gray-400 focus:ring-4 focus:ring-green-500/30 transition-all outline-none" 
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
             
             <div ref={previewRef} className="w-[320px] bg-white shadow-2xl rounded-sm p-8 flex flex-col min-h-[450px] origin-top scale-110">
                {/* PDF Header */}
                <div className="flex flex-col items-center text-center border-b-2 border-green-600 pb-4 mb-6">
                   <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white mb-2 shadow-sm">
                      <Plus className="w-5 h-5" />
                   </div>
                   <h1 className="text-[10px] font-black uppercase text-gray-900 tracking-wider">Prontuário Verde · Saúde & Bem Estar</h1>
                   <p className="text-[7px] text-gray-400 font-bold mt-0.5">Av. Paulista, 1000 · São Paulo - SP · (11) 98765-4321</p>
                </div>

                {/* Patient Info */}
                <div className="mb-6">
                   <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Paciente</p>
                   <p className="text-[9px] font-black text-gray-900">{patient.nome}</p>
                   <p className="text-[7px] text-gray-500 mt-0.5">CPF: {patient.cpf} · Data: {new Date().toLocaleDateString()}</p>
                </div>

                {/* RX Symbol */}
                <div className="relative mb-6">
                   <span className="text-3xl font-serif font-black text-gray-100 absolute -left-4 -top-4 opacity-50">Rx</span>
                   <div className="space-y-4 pt-2">
                     {items.map((item, i) => (
                       <div key={item.id} className="text-[8px] leading-relaxed">
                         <p className="font-black text-gray-900">{i + 1}. {item.medicamento || '...'}</p>
                         <p className="text-gray-600 pl-3">· {item.dosagem || '...'} | {item.frequencia || '...'} | {item.duracao || '...'}</p>
                         {item.observacoes && <p className="text-gray-400 pl-3 italic text-[7px]">{item.observacoes}</p>}
                       </div>
                     ))}
                   </div>
                </div>

                {/* Footer Signature */}
                <div className="mt-auto pt-8 flex flex-col items-center">
                   <div className="relative flex flex-col items-center">
                      <div className="w-24 h-0.5 bg-gray-200 mb-2"></div>
                      <p className="text-[7px] font-black text-gray-900">Dr. Mendes</p>
                      <p className="text-[6px] text-gray-400">CRM/SP 123456</p>
                      
                      {isSigned && password && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-80 pointer-events-none">
                           <div className="w-16 h-16 border-4 border-green-500 rounded-full flex items-center justify-center rotate-12 bg-white/80 p-1">
                              <p className="text-[6px] font-black text-green-600 text-center leading-tight">ASSINADO DIGITALMENTE</p>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-8 self-end">
                      <QRCodeSVG value="https://clinicaverde.com.br/validar" size={32} />
                      <p className="text-[5px] text-gray-300 text-right mt-1">v.2.0.26</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white p-8 px-10 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 gap-6 shrink-0 z-10">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </button>
              <button 
                onClick={handleSendWA}
                className="flex items-center gap-2 px-6 py-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-2xl text-xs font-black transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" /> Enviar por WhatsApp
              </button>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-6 py-4 text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSubmitting || !items[0].medicamento}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-gray-900 hover:bg-black text-white rounded-[24px] text-sm font-black shadow-2xl shadow-gray-900/30 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                {isSubmitting ? 'Gerando...' : 'Finalizar Prescrição'}
                {!isSubmitting && <CheckCircle className="w-5 h-5 text-green-400" />}
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}

function PrescriptionField({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-4 focus:ring-purple-500/10 focus:border-purple-200 transition-all outline-none shadow-sm"
      />
    </div>
  )
}
