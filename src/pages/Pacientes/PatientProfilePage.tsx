import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Wallet, 
  ClipboardList, 
  Share2, 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Activity,
  UserCheck,
  Sparkles
} from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { useProntuario } from '../../hooks/useProntuario'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import type { Patient, Appointment, PatientDocument, PatientFinancial } from '../../types'
import { QRCodeSVG } from 'qrcode.react'

// Novos componentes
import { EvolutionModal } from '../../components/pacientes/EvolutionModal'
import { PrescriptionModal } from '../../components/pacientes/PrescriptionModal'
import { FacialHarmonization } from '../../components/pacientes/FacialHarmonization'
import { PatientTerms } from '../../components/pacientes/PatientTerms'
import { PatientDocumentsTab } from '../../components/pacientes/PatientDocumentsTab'
import type { EvolutionRecord, PrescriptionItem } from '../../types/prontuario'

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'resumo' | 'anamnese' | 'documentos' | 'financeiro' | 'harmonizacao' | 'termos'>('resumo')
  const { getPatientById, getPatientHistory, getPatientDocuments, getPatientFinancial, sendAnamnesisLink } = usePatients()
  const { saveEvolution, saveHarmonizationSession } = useProntuario()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<Appointment[]>([])
  const [docs, setDocs] = useState<PatientDocument[]>([])
  const [financial, setFinancial] = useState<PatientFinancial[]>([])
  
  const [isAnamnesisModalOpen, setIsAnamnesisModalOpen] = useState(false)
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [anamnesisLink, setAnamnesisLink] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingAnamnesis, setIsSavingAnamnesis] = useState(false)
  const { updatePatient } = usePatients()

  const [anamneseForm, setAnamneseForm] = useState({
    historicoMedico: '',
    medicamentosEmUso: '',
    alergias: '',
    antecedentesFamiliares: '',
    habitos: { fumante: false, etilista: false, atividadeFisica: 'Nenhuma' }
  })

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setIsLoading(true)
      const [p, h, d, f] = await Promise.all([
        getPatientById(id),
        getPatientHistory(id),
        getPatientDocuments(id),
        getPatientFinancial(id)
      ])
      setPatient(p)
      setHistory(h)
      setDocs(d)
      setFinancial(f)
      setAnamneseForm({
        historicoMedico: p?.historicoMedico || '',
        medicamentosEmUso: p?.medicamentosEmUso || '',
        alergias: p?.alergias?.join(', ') || '',
        antecedentesFamiliares: p?.antecedentesFamiliares || '',
        habitos: p?.habitos || { fumante: false, etilista: false, atividadeFisica: 'Nenhuma' }
      })
      setIsLoading(false)
    }
    loadData()
  }, [id, getPatientById, getPatientHistory, getPatientDocuments, getPatientFinancial])

  const handleSendAnamnesis = async () => {
    if (!id) return
    const link = await sendAnamnesisLink(id)
    setAnamnesisLink(link)
    setIsAnamnesisModalOpen(true)
  }

  const handleSaveAnamnesis = async () => {
    if (!id || !patient) return
    setIsSavingAnamnesis(true)
    await updatePatient(id, {
      historicoMedico: anamneseForm.historicoMedico,
      medicamentosEmUso: anamneseForm.medicamentosEmUso,
      alergias: anamneseForm.alergias.split(',').map(s => s.trim()).filter(Boolean),
      antecedentesFamiliares: anamneseForm.antecedentesFamiliares,
      habitos: anamneseForm.habitos as any
    })
    setIsSavingAnamnesis(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <Clock className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-gray-500 font-medium">Carregando prontuário...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertCircle className="w-16 h-16 text-red-100" />
        <p className="text-gray-500 font-medium">Paciente não encontrado.</p>
        <button className="btn-secondary" onClick={() => navigate('/pacientes')}>Voltar para lista</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Header com Navegação e Ações */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/pacientes')} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar para Pacientes
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Avatar nome={patient.nome} size="lg" className="border-4 border-white shadow-xl shadow-gray-200/50" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{patient.nome}</h1>
                <Badge 
                  variant={patient.ativo ? 'green' : 'gray'}
                  className={patient.ativo ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-500'}
                >
                  {patient.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {patient.dataNascimento ? `${new Date(patient.dataNascimento).toLocaleDateString('pt-BR')} (${Math.floor((new Date().getTime() - new Date(patient.dataNascimento).getTime()) / (1000 * 3600 * 24 * 365.25))} anos)` : 'Data Nasc. Não Informada'}</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> CPF: {patient.cpf || 'Não Informado'}</span>
                {patient.convenio && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-green-600 font-medium">{patient.convenio}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button className="btn-primary" onClick={handleSendAnamnesis}>
            <Share2 className="w-4 h-4" /> Enviar Anamnese por Link
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100 shrink-0 overflow-x-auto">
        {(['resumo', 'anamnese', 'documentos', 'financeiro', 'harmonizacao', 'termos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold capitalize flex items-center gap-2 transition-all duration-200 whitespace-nowrap',
              activeTab === tab ? 'bg-white text-green-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'resumo' && <Activity className="w-4 h-4" />}
            {tab === 'anamnese' && <ClipboardList className="w-4 h-4" />}
            {tab === 'documentos' && <FileText className="w-4 h-4" />}
            {tab === 'financeiro' && <Wallet className="w-4 h-4" />}
            {tab === 'harmonizacao' && <Sparkles className="w-4 h-4" />}
            {tab === 'termos' && <UserCheck className="w-4 h-4" />}
            {tab.replace('harmonizacao', 'Harmonização')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'resumo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Demographic Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm shadow-gray-100/50">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Informações de Contato</h3>
                <div className="space-y-4 text-sm">
                  <InfoRow label="Telefone" value={patient.contato.telefone} />
                  <InfoRow label="Email" value={patient.contato.email || '-'} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm shadow-gray-100/50">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Endereço</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{patient.endereco.logradouro}, {patient.endereco.numero}</p>
                  <p>{patient.endereco.bairro} - {patient.endereco.cidade}, {patient.endereco.estado}</p>
                  <p className="text-xs text-gray-400 mt-1">CEP: {patient.endereco.cep}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> Linha do Tempo de Atendimentos
                </h3>
                <span className="text-xs text-gray-400">{history.length} atendimentos registrados</span>
              </div>
              
              <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {history.length > 0 ? (
                  history.map((apt, idx) => (
                    <div 
                      key={apt.id} 
                      className="relative group/apt cursor-pointer"
                      onClick={() => { setSelectedApt(apt); setIsEvolutionModalOpen(true); }}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-transform group-hover/apt:scale-125 z-10",
                        idx === 0 ? "bg-green-500 ring-2 ring-green-100" : "bg-gray-200 group-hover/apt:bg-green-400"
                      )}>
                        {idx === 0 && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                      </div>
                      
                      <div className="group-hover/apt:translate-x-1 transition-transform">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-gray-900">{new Date(apt.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{apt.horaInicio}</span>
                          <Badge variant="gray" className="text-[10px] px-2 py-0 h-4">{apt.procedimento}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <User className="w-3.5 h-3.5" />
                          <span>Atendido por <span className="font-semibold text-gray-700">{apt.profissionalNome}</span></span>
                        </div>
                        <div className="p-4 bg-gray-50 group-hover/apt:bg-green-50/50 group-hover/apt:border-green-100 rounded-2xl text-xs text-gray-600 border border-gray-100/50 leading-relaxed transition-all">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                               <FileText className="w-3 h-3" /> Evolução Clínica
                             </span>
                             <span className="text-[9px] font-bold text-green-600 opacity-0 group-hover/apt:opacity-100">Clique para editar</span>
                          </div>
                          <p className="italic">"Consulta realizada com sucesso. Paciente relata melhora nos sintomas..."</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-gray-400 text-sm italic">Nenhum atendimento anterior encontrado.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anamnese' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Anamnese Digital</h3>
                <p className="text-sm text-gray-400">Histórico clínico detalhado do paciente</p>
              </div>
              <button className="btn-primary" onClick={handleSaveAnamnesis} disabled={isSavingAnamnesis}>
                {isSavingAnamnesis ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <AnamneseField 
                   label="Queixa Principal / Histórico Médico" 
                   value={anamneseForm.historicoMedico} 
                   onChange={(e) => setAnamneseForm(prev => ({...prev, historicoMedico: e.target.value}))} 
                   placeholder="Descreva os sintomas relatados..." 
                />
                <AnamneseField 
                   label="Medicamentos em Uso" 
                   value={anamneseForm.medicamentosEmUso} 
                   onChange={(e) => setAnamneseForm(prev => ({...prev, medicamentosEmUso: e.target.value}))} 
                />
                <AnamneseField 
                   label="Alergias Conhecidas" 
                   value={anamneseForm.alergias} 
                   onChange={(e) => setAnamneseForm(prev => ({...prev, alergias: e.target.value}))} 
                />
              </div>
              <div className="space-y-6">
                <AnamneseField 
                   label="Histórico Familiar" 
                   value={anamneseForm.antecedentesFamiliares} 
                   onChange={(e) => setAnamneseForm(prev => ({...prev, antecedentesFamiliares: e.target.value}))} 
                />
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estilo de Vida e Hábitos</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <AnamneseToggle 
                       label="Tabagista" 
                       active={anamneseForm.habitos.fumante} 
                       onToggle={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, fumante: !prev.habitos.fumante}}))} 
                    />
                    <AnamneseToggle 
                       label="Etilista" 
                       active={anamneseForm.habitos.etilista} 
                       onToggle={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, etilista: !prev.habitos.etilista}}))} 
                    />
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Atividade Física</label>
                      <div className="flex gap-2">
                        {['Nenhuma', 'Ocasional', 'Regular'].map(l => (
                          <button 
                            key={l}
                            onClick={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, atividadeFisica: l as any}}))}
                            className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                            anamneseForm.habitos.atividadeFisica.toLowerCase() === l.toLowerCase() 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          )}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <PatientDocumentsTab pacienteId={patient.id} />
        )}

        {activeTab === 'financeiro' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Histórico Financeiro</h3>
                <p className="text-sm text-gray-400">Orçamentos e faturas vinculadas ao paciente</p>
              </div>
              <button className="btn-secondary">
                <Plus className="w-4 h-4" /> Novo Orçamento
              </button>
            </div>

            <div className="space-y-4">
              {financial.length > 0 ? (
                financial.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                        f.tipo === 'pagamento' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {f.tipo === 'pagamento' ? <CheckCircle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{f.descricao}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">{f.tipo === 'pagamento' ? 'Fatura Gerada' : 'Orçamento em Aberto'} · {new Date(f.data).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">R$ {f.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <Badge variant="gray" className={cn(
                          "text-[9px] h-4 mt-1 uppercase",
                          f.status === 'concluido' ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                        )}>
                          {f.status}
                        </Badge>
                      </div>
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-xl text-gray-400">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Wallet className="w-12 h-12 text-gray-100" />
                  <p className="text-gray-400 text-sm">Sem movimentações financeiras no momento.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'harmonizacao' && (
          <FacialHarmonization 
            pacienteId={patient.id} 
            onSave={async (zones) => { await saveHarmonizationSession(patient.id, zones); }}
          />
        )}

        {activeTab === 'termos' && (
          <PatientTerms pacienteId={patient.id} />
        )}
      </div>

      {/* Anamnesis Modal (QR Code) */}
      {isAnamnesisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAnamnesisModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
            <div className="bg-green-500 p-8 flex flex-col items-center text-white text-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
                 <QRCodeSVG value={anamnesisLink} size={160} />
              </div>
              <h3 className="text-lg font-black leading-tight">Link de Anamnese Gerado!</h3>
              <p className="text-xs text-green-100 mt-2">O paciente pode escanear o QR Code acima ou receber o link abaixo para preencher o formulário.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Link de Acesso</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <input readOnly value={anamnesisLink} className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate" />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(anamnesisLink); /* TODO: Toast */ }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setIsAnamnesisModalOpen(false)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evolution Modal */}
      {isEvolutionModalOpen && selectedApt && (
        <EvolutionModal 
          isOpen={isEvolutionModalOpen}
          onClose={() => setIsEvolutionModalOpen(false)}
          appointment={selectedApt}
          onSave={async (data) => { await saveEvolution(data); }}
          onGeneratePrescription={() => { setIsEvolutionModalOpen(false); setIsPrescriptionModalOpen(true); }}
        />
      )}

      {/* Prescription Modal */}
      {isPrescriptionModalOpen && (
        <PrescriptionModal 
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          patient={patient}
          onSave={async (items) => { console.log('Prescrição gerada:', items); }}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-900 font-bold">{value}</span>
    </div>
  )
}

function AnamneseField({ label, value, onChange, placeholder }: { label: string, value: string, placeholder?: string, onChange?: (e: any) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <textarea 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        className="input-base min-h-[100px] resize-none text-sm py-3 px-4 focus:ring-4 focus:ring-green-500/10 placeholder:text-gray-300" 
      />
    </div>
  )
}

function AnamneseToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle?: () => void }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      <div className={cn(
        "w-10 h-6 rounded-full p-1 transition-all",
        active ? "bg-green-500" : "bg-gray-200"
      )}>
        <div className={cn(
          "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-4" : "translate-x-0"
        )} />
      </div>
    </div>
  )
}

function MoreHorizontal(props: any) {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}
