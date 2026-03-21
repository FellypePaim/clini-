import { useState, useRef, useEffect, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { 
  FileCheck, 
  Plus, 
  Send, 
  Calendar, 
  User, 
  CheckCircle, 
  X, 
  Download, 
  Maximize2,
  Lock,
  Stamp,
  ClipboardList,
  Sparkles,
  Activity
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { StorageHelpers } from '../../lib/storage'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { usePatients } from '../../hooks/usePatients'

const TERMS_TEMPLATES = [
  { id: '1', titulo: 'Consentimento de Aplicação de Toxina Botulínica', desc: 'Autorização específica para procedimentos estéticos com botox.' },
  { id: '2', titulo: 'Termo de Responsabilidade LGPD', desc: 'Autorização para tratamento de dados pessoais sensíveis.' },
  { id: '3', titulo: 'Autorização Cirúrgica de Pequeno Porte', desc: 'Consentimento para procedimentos invasivos simples.' }
]

export function PatientTerms({ pacienteId }: { pacienteId: string }) {
  const [showSignModal, setShowSignModal] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<typeof TERMS_TEMPLATES[0] | null>(null)
  const sigPad = useRef<SignatureCanvas>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [termos, setTermos] = useState<any[]>([])
  const [viewingTermo, setViewingTermo] = useState<any | null>(null)

  // IA - Gerar termo personalizado
  const [iaPrompt, setIaPrompt] = useState('')
  const [iaGenerating, setIaGenerating] = useState(false)
  const [iaResult, setIaResult] = useState<{ titulo: string; conteudo: string } | null>(null)

  const { user } = useAuthStore()
  const clinicaId = user?.clinicaId
  const { toast } = useToast()
  const { getPatientById } = usePatients()

  // Carregar termos reais do banco
  const loadTermos = useCallback(async () => {
    if (!pacienteId) return
    const { data, error } = await supabase
      .from('termos_consentimento')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erro ao carregar termos:', error.message)
      // Fallback: tentar sem filtro de RLS
    }
    setTermos(data || [])
  }, [pacienteId])

  useEffect(() => { loadTermos() }, [pacienteId, loadTermos])

  const handleGenerateWithAI = async () => {
    if (!iaPrompt.trim() || !clinicaId) return
    setIaGenerating(true)
    setIaResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: {
          action: 'generate_summary',
          payload: {
            texto_clinico: `INSTRUÇÃO: Você é um advogado especialista em termos de consentimento para clínicas de saúde no Brasil.
Gere um termo de consentimento COMPLETO e PROFISSIONAL com base na solicitação abaixo.

SOLICITAÇÃO DO PROFISSIONAL:
"${iaPrompt}"

Responda APENAS com JSON válido nesta estrutura:
{
  "queixa_principal": "TÍTULO DO TERMO (ex: Termo de Consentimento para Preenchimento Labial)",
  "diagnostico": "CONTEÚDO COMPLETO DO TERMO com parágrafos separados por \\n\\n, incluindo: 1) Identificação do procedimento, 2) Riscos e complicações possíveis, 3) Cuidados pós-procedimento, 4) Declaração de ciência do paciente, 5) Cláusula de autorização, 6) Cláusula LGPD"
}`,
          },
          clinica_id: clinicaId,
        }
      })
      if (error) throw error
      const resumo = data?.resumo || data?.data?.resumo
      if (resumo) {
        setIaResult({
          titulo: resumo.queixa_principal || 'Termo Gerado por IA',
          conteudo: resumo.diagnostico || resumo.conduta || 'Erro ao extrair conteúdo.'
        })
        toast({ title: 'Termo gerado', description: 'Revise o conteúdo e use como modelo.', type: 'success' })
      } else {
        throw new Error('Resposta vazia da IA')
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao gerar termo.', type: 'error' })
    } finally {
      setIaGenerating(false)
    }
  }

  const handleUseAITerm = () => {
    if (!iaResult) return
    setActiveTemplate({ id: 'ia', titulo: iaResult.titulo, desc: iaResult.conteudo })
    setShowSignModal(true)
  }

  const handleSendWhatsApp = async (e: React.MouseEvent, tpl: any) => {
    e.stopPropagation()
    try {
      if (!pacienteId || !clinicaId) return
      setIsSaving(true)

      const paciente = await getPatientById(pacienteId)
      if (!paciente?.contato?.telefone) {
        toast({ title: 'Aviso', description: 'Paciente não possui telefone cadastrado.', type: 'warning' })
        setIsSaving(false)
        return
      }

      // Encodes identifying details as a base64 obfuscated token
      const tokenPayload = { pid: pacienteId, cid: clinicaId, tid: tpl.id }
      const token = btoa(JSON.stringify(tokenPayload))
      const baseUrl = window.location.origin
      const link = `${baseUrl}/anamnese/${token}`

      // Call whatsapp-send Edge Function
      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          numero: paciente.contato.telefone,
          texto: `Olá ${paciente.nome.split(' ')[0]},\n\nPor favor, assine o termo *${tpl.titulo}* acessando o link seguro abaixo:\n\n${link}\n\nAtenciosamente,\nClínica Clini+`,
          tipo: 'texto',
          clinica_id: clinicaId
        }
      })

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Link enviado com sucesso pelo WhatsApp.', type: 'success' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao enviar.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSign = async () => {
    if (sigPad.current?.isEmpty() || !clinicaId || !pacienteId) {
      toast({ title: 'Aviso', description: 'Por favor, assine o documento.', type: 'warning' })
      return
    }

    try {
      setIsSaving(true)
      // Usar getCanvas() em vez de getTrimmedCanvas() para evitar
      // bug de interop do trim-canvas com Vite 8 / rolldown
      const canvas = sigPad.current?.getCanvas()
      if (!canvas) throw new Error('Não foi possível capturar a assinatura.')

      // Converter canvas para Blob (PNG como fallback universal)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Falha ao converter assinatura para imagem.'))
        }, 'image/png')
      })

      const file = new File([blob], `assinatura_${activeTemplate?.titulo || 'termo'}_${Date.now()}.png`, { type: 'image/png' })

      // Upload to storage
      const stored = await StorageHelpers.uploadTermo(clinicaId, pacienteId, file)

      // Save to DB
      const { error: dbErr } = await supabase.from('termos_consentimento').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        tipo: 'consentimento',
        titulo: activeTemplate?.titulo || 'Termo de Consentimento',
        conteudo: activeTemplate?.desc || null,
        assinatura_url: stored.url,
        assinado_em: new Date().toISOString()
      } as any)

      if (dbErr) throw dbErr

      await loadTermos()
      toast({ title: 'Sucesso', description: 'Termo assinado e salvo com sucesso.', type: 'success' })
      setShowSignModal(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Falha ao salvar termo.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const clearSig = () => {
    sigPad.current?.clear()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      {/* Templates List */}
      <div className="lg:col-span-1 space-y-6">
         <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <ClipboardList className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-gray-900 border-none">Modelos Disponíveis</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Selecione para solicitar assinatura</p>
               </div>
            </div>

            <div className="space-y-4">
               {TERMS_TEMPLATES.map(tpl => (
                 <div 
                  key={tpl.id} 
                  className="w-full text-left p-6 bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-blue-100 rounded-3xl transition-all group flex flex-col gap-3"
                 >
                    <p className="text-xs font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-widest">{tpl.titulo}</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{tpl.desc}</p>
                    <div className="flex items-center gap-3 mt-2 opacity-10 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => { setActiveTemplate(tpl); setShowSignModal(true); }}
                         className="flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                       >
                         <Plus className="w-3.5 h-3.5 text-blue-500" />
                         <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Apenas Assinar</span>
                       </button>

                       <button 
                         onClick={(e) => handleSendWhatsApp(e, tpl)}
                         disabled={isSaving}
                         className="flex items-center gap-2 hover:bg-green-50 px-3 py-1.5 rounded-xl transition-colors active:scale-95 ml-auto"
                       >
                         <Send className="w-3.5 h-3.5 text-green-500" />
                         <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">
                           {isSaving ? 'Enviando...' : 'Enviar Termo WhatsApp'}
                         </span>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Gerar Termo com IA */}
         <div className="bg-white rounded-[40px] border border-purple-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-gray-900 border-none">Criar Termo com IA</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Descreva o procedimento e a IA gera o termo</p>
               </div>
            </div>

            <div className="space-y-4">
               <textarea
                 value={iaPrompt}
                 onChange={(e) => setIaPrompt(e.target.value)}
                 placeholder="Ex: Termo de consentimento para aplicação de ácido hialurônico nos lábios com lista de riscos e cuidados pós-procedimento..."
                 className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none resize-none shadow-sm min-h-[80px]"
                 rows={3}
               />
               <button
                 onClick={handleGenerateWithAI}
                 disabled={iaGenerating || !iaPrompt.trim()}
                 className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-purple-600/20"
               >
                 {iaGenerating ? (
                   <><Activity className="w-4 h-4 animate-spin" /> Gerando termo...</>
                 ) : (
                   <><Sparkles className="w-4 h-4" /> Gerar com Gemini</>
                 )}
               </button>

               {/* Resultado da IA */}
               {iaResult && (
                 <div className="mt-4 bg-purple-50/50 border border-purple-100 rounded-3xl p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-700 uppercase tracking-widest">{iaResult.titulo}</h4>
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-100 px-2 py-1 rounded-lg">Gerado por IA</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-purple-100 p-5 max-h-48 overflow-y-auto custom-scrollbar">
                       <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{iaResult.conteudo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button
                         onClick={handleUseAITerm}
                         className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-600/10"
                       >
                         <FileCheck className="w-4 h-4" /> Usar e Solicitar Assinatura
                       </button>
                       <button
                         onClick={() => setIaResult(null)}
                         className="py-3 px-4 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                       >
                         Descartar
                       </button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* History Area */}
      <div className="flex-1 space-y-6">
         <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2 opacity-60">
                  <Stamp className="w-5 h-5" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] border-none">Termos Gerados & Assinados</h3>
               </div>
               <span className="text-[10px] font-bold text-gray-400">{termos.length} termo(s)</span>
            </div>

            <div className="space-y-4">
               {termos.length > 0 ? termos.map((st: any) => {
                 const isAssinado = !!st.assinado_em
                 return (
                   <div key={st.id} className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all hover:scale-[1.01] group">
                    <div className="flex items-center gap-6">
                       <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        isAssinado ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                       )}>
                          <FileCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-gray-900 mb-1">{st.titulo || 'Termo de Consentimento'}</p>
                          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-medium">
                             <span className="flex items-center gap-1.5">
                               <Calendar className="w-3.5 h-3.5" />
                               {new Date(st.assinado_em || st.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                             </span>
                             <span className="flex items-center gap-1.5">
                               <User className="w-3.5 h-3.5" /> {st.tipo || 'consentimento'}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                        isAssinado ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                       )}>
                          {isAssinado ? 'Assinado' : 'Pendente'}
                       </span>

                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Visualizar assinatura */}
                          {st.assinatura_url && (
                            <button
                              onClick={() => setViewingTermo(st)}
                              className="p-2.5 bg-blue-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-blue-600/10"
                              title="Visualizar assinatura"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Download */}
                          {st.assinatura_url && (
                            <a
                              href={st.assinatura_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-gray-900 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-gray-900/10 inline-flex"
                              title="Baixar assinatura"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {/* Excluir */}
                          <button
                            onClick={async () => {
                              if (!confirm('Excluir este termo?')) return
                              await supabase.from('termos_consentimento').delete().eq('id', st.id)
                              await loadTermos()
                              toast({ title: 'Sucesso', description: 'Termo removido.', type: 'success' })
                            }}
                            className="p-2.5 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-red-500/10"
                            title="Excluir termo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 </div>
                 )
               }) : (
                 <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 select-none">
                    <Stamp className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhum termo registrado</p>
                    <p className="text-[10px] text-gray-300 mt-1">Selecione um modelo ao lado para gerar</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Modal de Visualização — Estilo Documento PDF */}
      {viewingTermo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-fade-in" onClick={() => setViewingTermo(null)} />
          <div className="relative bg-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-in flex flex-col">
            {/* Toolbar */}
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white">
                <FileCheck className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold truncate">{viewingTermo.titulo || 'Termo de Consentimento'}</span>
                <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase", viewingTermo.assinado_em ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                  {viewingTermo.assinado_em ? 'Assinado' : 'Pendente'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {viewingTermo.assinatura_url && (
                  <a href={viewingTermo.assinatura_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Baixar">
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => setViewingTermo(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Documento */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
              <div className="bg-white w-full max-w-xl shadow-xl rounded-sm border border-gray-200" style={{ minHeight: '600px' }}>
                {/* Header do documento */}
                <div className="border-b-2 border-green-600 p-8 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight">Prontuario Verde</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sistema de Gestao Clinica</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento Digital</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">ID: {viewingTermo.id?.substring(0, 8) || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Titulo do termo */}
                <div className="px-8 pt-8 pb-4">
                  <h3 className="text-base font-black text-gray-900 text-center uppercase tracking-wider leading-relaxed">
                    {viewingTermo.titulo || 'Termo de Consentimento'}
                  </h3>
                  <div className="w-16 h-0.5 bg-green-500 mx-auto mt-3" />
                </div>

                {/* Conteudo */}
                {viewingTermo.conteudo && (
                  <div className="px-8 py-4">
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{viewingTermo.conteudo}</p>
                  </div>
                )}

                {/* Info */}
                <div className="px-8 py-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Data</p>
                      <p className="text-gray-700 font-bold mt-1">
                        {new Date(viewingTermo.assinado_em || viewingTermo.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Horario</p>
                      <p className="text-gray-700 font-bold mt-1">
                        {new Date(viewingTermo.assinado_em || viewingTermo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tipo</p>
                      <p className="text-gray-700 font-bold mt-1 capitalize">{viewingTermo.tipo || 'Consentimento'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Profissional</p>
                      <p className="text-gray-700 font-bold mt-1">{user?.nome || 'Profissional'}</p>
                    </div>
                  </div>
                </div>

                {/* Assinatura */}
                <div className="px-8 py-6 mt-4">
                  {viewingTermo.assinatura_url ? (
                    <div className="border-t-2 border-dashed border-gray-200 pt-6">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Assinatura Digital do Paciente</p>
                      <div className="flex justify-center">
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 inline-block">
                          <img src={viewingTermo.assinatura_url} alt="Assinatura" className="max-h-32 object-contain" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                        <Lock className="w-3.5 h-3.5" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Documento Assinado Digitalmente</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t-2 border-dashed border-yellow-200 pt-6 text-center">
                      <p className="text-xs font-bold text-yellow-600">Aguardando assinatura do paciente</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                  <p className="text-[8px] text-gray-400 leading-relaxed">
                    Este documento foi gerado eletronicamente pelo sistema Prontuario Verde.
                    Possui validade juridica conforme Lei 14.063/2020.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignModal && activeTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in" onClick={() => setShowSignModal(false)} />
           
           <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
              <div className="bg-blue-600 p-8 text-white relative flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Maximize2 className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black leading-tight">Assinatura no Local</h3>
                    <p className="text-xs text-blue-100 font-medium">{activeTemplate.titulo}</p>
                 </div>
                 <button onClick={() => setShowSignModal(false)} className="ml-auto p-2 hover:bg-white/10 rounded-xl">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                 <div className="bg-gray-50 p-8 rounded-[32px] border border-dashed border-gray-200 mb-8 h-48 overflow-y-auto text-xs text-gray-500 leading-relaxed font-medium">
                    {activeTemplate.desc} <br/><br/>
                    Este é um simulador de termo de consentimento. Ao assinar abaixo, o paciente confirma ter lido e compreendido todos os riscos e benefícios do procedimento descrito acima. A assinatura será criptografada e armazenada com o IP e data/hora do evento.
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Assinatura do Paciente</label>
                       <button onClick={clearSig} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">Limpar</button>
                    </div>
                    <div className="bg-gray-100 rounded-3xl border-2 border-gray-100 h-48 overflow-hidden touch-none relative group">
                       <SignatureCanvas 
                        ref={sigPad}
                        penColor='#111827'
                        canvasProps={{ className: 'w-full h-full' }} 
                       />
                       <div className="absolute left-1/2 -translate-x-1/2 bottom-4 opacity-5 pointer-events-none text-center">
                          <Stamp className="w-24 h-24 mx-auto" />
                          <p className="text-[10px] uppercase font-black tracking-widest mt-2">ÁREA DE ASSINATURA</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-gray-50/80 p-8 px-12 flex items-center justify-between border-t border-gray-100 shrink-0">
                 <div className="flex items-center gap-3 text-green-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ambiente Seguro</span>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowSignModal(false)}
                      className="text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSign}
                      disabled={isSaving}
                      className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl shadow-gray-900/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : 'Concluir e Salvar'} <CheckCircle className="w-5 h-5 text-green-400" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
