import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Send, ClipboardList, Activity, Heart, Info, Stethoscope } from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { cn } from '../../lib/utils'
import type { Patient } from '../../types'

export function PublicAnamnesisPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('pid')
  const { getPatientById } = usePatients()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (patientId) {
        const p = await getPatientById(patientId)
        setPatient(p)
      }
      setIsLoading(false)
    }
    load()
  }, [patientId, getPatientById])

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
          onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }}
          className="space-y-6"
        >
          {/* Seção 1: Motivo */}
          <Section icon={<Stethoscope className="w-4 h-4" />} title="Motivo Principal">
             <div className="space-y-4">
               <div>
                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">O que você está sentindo hoje?</label>
                 <textarea 
                   rows={3}
                   placeholder="Aperte aqui para escrever..."
                   className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none resize-none shadow-sm"
                 />
               </div>
             </div>
          </Section>

          {/* Seção 2: Saúde Geral */}
          <Section icon={<Heart className="w-4 h-4" />} title="Histórico de Saúde">
             <div className="space-y-5">
               <RadioToggle label="Alergia a Medicamentos?" />
               <RadioToggle label="Problemas Cardíacos?" />
               <RadioToggle label="Diabetes ou Hipertensão?" />
               <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Medicamentos em uso?</label>
                  <input className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none shadow-sm" placeholder="Ex: AAS, Glifage..." />
               </div>
             </div>
          </Section>

          {/* Seção 3: Hábitos */}
          <Section icon={<Activity className="w-4 h-4" />} title="Estilo de Vida">
             <div className="space-y-5">
               <RadioToggle label="Você fuma?" />
               <RadioToggle label="Ingere álcool regularmente?" />
               <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Atividade Física?</label>
                  <div className="flex gap-2">
                    {['Nenhuma', '1-2x semana', 'Todos os dias'].map(l => (
                      <button 
                        key={l}
                        type="button" 
                        className="flex-1 py-3 px-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 focus:bg-green-600 focus:text-white focus:border-green-600 transition-all active:scale-95 shadow-sm"
                      >{l}</button>
                    ))}
                  </div>
               </div>
             </div>
          </Section>

          <button 
            type="submit"
            className="w-full py-5 bg-gray-900 border-b-4 border-gray-700 text-white rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-xl transition-all active:translate-y-1 active:border-b-0"
          >
            Enviar Minha Resposta <Send className="w-4 h-4" />
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

function RadioToggle({ label }: { label: string }) {
  const [active, setActive] = useState(false)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-gray-100">
        <button 
          type="button"
          onClick={() => setActive(true)} 
          className={cn(
            "w-10 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            active ? "bg-green-500 text-white shadow-xl shadow-green-200" : "text-gray-400 hover:bg-gray-50"
          )}
        >SIM</button>
        <button 
          type="button"
          onClick={() => setActive(false)} 
          className={cn(
            "w-10 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            !active ? "bg-gray-400 text-white" : "text-gray-400 hover:bg-gray-50"
          )}
        >NÃO</button>
      </div>
    </div>
  )
}
