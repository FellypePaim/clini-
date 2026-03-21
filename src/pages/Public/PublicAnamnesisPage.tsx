import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Send, ClipboardList, Activity, Heart, Info, Stethoscope, FileCheck, Stamp, Lock, Maximize2 } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'
import { StorageHelpers } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import type { Patient } from '../../types'

const TERMS_TEMPLATES = [
  { id: '1', titulo: 'Consentimento de Aplicação de Toxina Botulínica', desc: 'Autorização específica para procedimentos estéticos com botox.' },
  { id: '2', titulo: 'Termo de Responsabilidade LGPD', desc: 'Autorização para tratamento de dados pessoais sensíveis.' },
  { id: '3', titulo: 'Autorização Cirúrgica de Pequeno Porte', desc: 'Consentimento para procedimentos invasivos simples.' }
]

export function PublicAnamnesisPage() {
  const { token } = useParams<{ token: string }>()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [clinicaId, setClinicaId] = useState<string | null>(null)
  const [termoId, setTermoId] = useState<string | null>(null)

  const sigPad = useRef<SignatureCanvas>(null)

  const [patient, setPatient] = useState<(Patient & { clinica_id?: string, clinicaId?: string }) | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado do formulário de anamnese
  const [formState, setFormState] = useState({
    queixa: '',
    medicamentos: '',
    alergiaMedicamentos: false,
    problemasCardiacos: false,
    diabetesHipertensao: false,
    fuma: false,
    alcool: false,
    atividadeFisica: 'Nenhuma',
  })

  useEffect(() => {
    async function load() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const decoded = JSON.parse(atob(token))
        setPatientId(decoded.pid || null)
        setTermoId(decoded.tid || null)
        setClinicaId(decoded.cid || null)

        // Busca direta sem depender de auth (página pública)
        if (decoded.pid) {
          const { data: pData } = await supabase
            .from('pacientes')
            .select('id, nome_completo, clinica_id')
            .eq('id', decoded.pid)
            .single()

          if (pData) {
            setPatient({
              id: pData.id,
              nome: pData.nome_completo,
              clinicaId: pData.clinica_id,
            } as any)
            setClinicaId(pData.clinica_id || decoded.cid)
          }
        }
      } catch (err) {
        console.error('Falha ao decodificar token de anamnese:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [token])

  const handleSignTerm = async () => {
    const clinica = patient?.clinicaId || patient?.clinica_id;
    if (sigPad.current?.isEmpty() || !clinica || !patientId || !termoId) {
      alert('Por favor, assine o documento.')
      return
    }

    try {
      setIsLoading(true)
      const dataURL = sigPad.current?.getTrimmedCanvas().toDataURL('image/webp', 0.6)
      const res = await fetch(dataURL!)
      const blob = await res.blob()
      
      const activeTemplate = TERMS_TEMPLATES.find(t => t.id === termoId)
      const file = new File([blob], `assinatura_${activeTemplate?.titulo || 'termo'}_publica.webp`, { type: 'image/webp' })

      const stored = await StorageHelpers.uploadTermo(clinica, patientId, file)

      await supabase.from('termos_consentimento').insert({
        clinica_id: clinica,
        paciente_id: patientId,
        tipo: 'consentimento',
        titulo: activeTemplate?.titulo || 'Termo Externo',
        assinatura_url: stored.url,
        assinado_em: new Date().toISOString()
      })

      setIsSubmitted(true)
    } catch (e: any) {
      alert('Erro ao processar termo: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearSig = (e: React.MouseEvent) => {
    e.preventDefault();
    sigPad.current?.clear()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Activity className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-gray-500 font-bold">Iniciando anamnese...</p>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6 bg-white animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white shadow-2xl shadow-green-200">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Pronto, {patient?.nome.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed">Suas informações foram recebidas e agora fazem parte do seu prontuário digital seguro.</p>
        </div>
        <div className="w-full bg-green-50 rounded-2xl p-5 border border-green-100 flex items-start gap-4 text-left">
          <Info className="w-5 h-5 text-green-600 mt-0.5" />
          <p className="text-xs text-green-800 leading-relaxed font-medium">Não é necessário fazer mais nada. Você pode fechar esta aba e aguardar o seu atendimento.</p>
        </div>
      </div>
    )
  }

  const activeTemplate = termoId ? TERMS_TEMPLATES.find(t => t.id === termoId) : null

  if (termoId && activeTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20 overflow-x-hidden">
        <div className="w-full bg-blue-600 px-6 pt-12 pb-24 text-white relative">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-100/70">Assinatura Digital</p>
                <h1 className="text-xl font-black leading-tight text-white mb-1">{activeTemplate.titulo}</h1>
              </div>
            </div>
            <p className="text-sm font-medium text-blue-50 leading-relaxed">Olá, <b>{patient?.nome}</b>! Por favor, leia e assine o termo eletronicamente abaixo.</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-50 rounded-t-[40px]" />
        </div>

        <div className="w-full max-w-md px-6 -mt-6 relative z-10 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-xs text-gray-500 leading-relaxed font-medium">
             {activeTemplate.desc} <br/><br/>
             Ao assinar abaixo, o paciente {patient?.nome} confirma ter lido e compreendido todos os riscos e benefícios do procedimento descrito acima. A assinatura será criptografada e armazenada com segurança em seu prontuário.
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sua Assinatura</label>
                <button type="button" onClick={clearSig} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">Limpar</button>
             </div>
             <div className="bg-white rounded-3xl border-2 border-gray-200 h-64 overflow-hidden touch-none relative group shadow-inner">
                <SignatureCanvas 
                  ref={sigPad}
                  penColor='#111827'
                  canvasProps={{ className: 'w-full h-full' }} 
                />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 opacity-5 pointer-events-none text-center">
                   <Stamp className="w-24 h-24 mx-auto" />
                   <p className="text-[10px] uppercase font-black tracking-widest mt-2">ÁREA DE ASSINATURA</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 text-green-600 justify-center my-6">
             <Lock className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Ambiente Criptografado</span>
          </div>

          <button 
             onClick={handleSignTerm}
             disabled={isLoading}
             className="w-full py-5 bg-blue-600 border-b-4 border-blue-800 text-white rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-xl transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50"
          >
             Concluir Assinatura <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20 overflow-x-hidden">
      {/* Wave Header */}
      <div className="w-full bg-green-600 px-6 pt-12 pb-24 text-white relative">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-green-100/70">Prontuário Verde</p>
              <h1 className="text-xl font-black">Ficha de Anamnese</h1>
            </div>
          </div>
          <p className="text-sm font-medium text-green-50 leading-relaxed">Olá, <b>{patient?.nome}</b>! Por favor, responda às perguntas abaixo para prepararmos o seu atendimento.</p>
        </div>
        
        {/* Curvas decorativas */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-50 rounded-t-[40px]" />
      </div>

      <div className="w-full max-w-md px-6 -mt-6 relative z-10 space-y-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!patientId) return;

            setIsSubmitting(true);
            try {
              const alergias = formState.alergiaMedicamentos ? 'Sim (informado na anamnese)' : 'Nenhuma informada'
              const historico = [
                formState.problemasCardiacos ? 'Problemas cardíacos' : '',
                formState.diabetesHipertensao ? 'Diabetes/Hipertensão' : '',
              ].filter(Boolean).join(', ') || 'Nenhum relatado'

              const habitos = {
                fuma: formState.fuma,
                alcool: formState.alcool,
                atividade_fisica: formState.atividadeFisica,
              }

              // Salvar na tabela anamneses (registro completo)
              const { error: anamErr } = await supabase.from('anamneses').insert({
                paciente_id: patientId,
                queixa_principal: formState.queixa,
                alergias,
                historico_medico: historico,
                medicamentos_uso: formState.medicamentos,
                habitos: habitos as any,
                dados_extras: {
                  alergia_medicamentos: formState.alergiaMedicamentos,
                  problemas_cardiacos: formState.problemasCardiacos,
                  diabetes_hipertensao: formState.diabetesHipertensao,
                } as any,
                preenchido_em: new Date().toISOString(),
                token_link: token || null,
              } as any)

              if (anamErr) throw anamErr

              // Também atualizar campos resumidos no paciente
              await supabase.from('pacientes').update({
                updated_at: new Date().toISOString()
              } as any).eq('id', patientId)

              setIsSubmitted(true);
            } catch (err) {
              alert('Erro ao enviar anamnese. Tente novamente.');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-6"
        >
          {/* Seção 1: Motivo */}
          <Section icon={<Stethoscope className="w-4 h-4" />} title="Motivo Principal">
             <div className="space-y-4">
               <div>
                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">O que você está sentindo hoje?</label>
                  <textarea
                    name="queixa"
                    rows={3}
                    value={formState.queixa}
                    onChange={(e) => setFormState(s => ({ ...s, queixa: e.target.value }))}
                    placeholder="Aperte aqui para escrever..."
                    className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none resize-none shadow-sm"
                  />
               </div>
             </div>
          </Section>

          {/* Seção 2: Saúde Geral */}
          <Section icon={<Heart className="w-4 h-4" />} title="Histórico de Saúde">
             <div className="space-y-5">
               <RadioToggle label="Alergia a Medicamentos?" value={formState.alergiaMedicamentos} onChange={(v) => setFormState(s => ({ ...s, alergiaMedicamentos: v }))} />
               <RadioToggle label="Problemas Cardíacos?" value={formState.problemasCardiacos} onChange={(v) => setFormState(s => ({ ...s, problemasCardiacos: v }))} />
               <RadioToggle label="Diabetes ou Hipertensão?" value={formState.diabetesHipertensao} onChange={(v) => setFormState(s => ({ ...s, diabetesHipertensao: v }))} />
               <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Medicamentos em uso?</label>
                   <input
                     name="medicamentos"
                     value={formState.medicamentos}
                     onChange={(e) => setFormState(s => ({ ...s, medicamentos: e.target.value }))}
                     className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none shadow-sm"
                     placeholder="Ex: AAS, Glifage..."
                   />
               </div>
             </div>
          </Section>

          {/* Seção 3: Hábitos */}
          <Section icon={<Activity className="w-4 h-4" />} title="Estilo de Vida">
             <div className="space-y-5">
               <RadioToggle label="Você fuma?" value={formState.fuma} onChange={(v) => setFormState(s => ({ ...s, fuma: v }))} />
               <RadioToggle label="Ingere álcool regularmente?" value={formState.alcool} onChange={(v) => setFormState(s => ({ ...s, alcool: v }))} />
               <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Atividade Física?</label>
                  <div className="flex gap-2">
                    {['Nenhuma', '1-2x semana', 'Todos os dias'].map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setFormState(s => ({ ...s, atividadeFisica: l }))}
                        className={cn(
                          "flex-1 py-3 px-2 border rounded-xl text-[10px] font-bold transition-all active:scale-95 shadow-sm",
                          formState.atividadeFisica === l
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white border-gray-200 text-gray-500"
                        )}
                      >{l}</button>
                    ))}
                  </div>
               </div>
             </div>
          </Section>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-gray-900 border-b-4 border-gray-700 text-white rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-xl transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Minha Resposta'} <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <footer className="mt-12 py-10 opacity-30 text-center flex flex-col items-center gap-3">
         <div className="w-10 h-10 bg-gray-300 rounded-xl flex items-center justify-center text-white">
           <Heart className="w-6 h-6 fill-current" />
         </div>
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[.2em]">Prontuário Verde · 2026</p>
      </footer>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 animate-slide-in">
       <div className="flex items-center gap-2 px-1">
         <span className="p-1 px-2.5 bg-green-100 text-green-700 rounded-lg text-xs font-black shadow-sm flex items-center gap-2">
           {icon} {title}
         </span>
       </div>
       <div className="bg-gray-100/50 p-6 rounded-[32px] border border-gray-100 shadow-inner">
         {children}
       </div>
    </div>
  )
}

function RadioToggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-gray-100">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "w-10 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            value ? "bg-green-500 text-white shadow-xl shadow-green-200" : "text-gray-400 hover:bg-gray-50"
          )}
        >SIM</button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "w-10 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            !value ? "bg-gray-400 text-white" : "text-gray-400 hover:bg-gray-50"
          )}
        >NÃO</button>
      </div>
    </div>
  )
}
