import { useState, useEffect } from 'react'
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
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Activity,
  UserCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { useProntuario } from '../../hooks/useProntuario'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabase'
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
import { DentalMapping } from '../../components/pacientes/DentalMapping'

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'resumo' | 'anamnese' | 'odontograma' | 'documentos' | 'financeiro' | 'harmonizacao' | 'termos'>('resumo')
  const { getPatientById, getPatientHistory, getPatientDocuments, getPatientFinancial, sendAnamnesisLink, deleteConsulta, deleteAnamnese, createOrcamento } = usePatients()
  const { saveEvolution, saveHarmonizationSession, generatePrescription } = useProntuario()
  const { toast } = useToast()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<Appointment[]>([])
  const [_docs, setDocs] = useState<PatientDocument[]>([])
  const [financial, setFinancial] = useState<PatientFinancial[]>([])
  
  const [isAnamnesisModalOpen, setIsAnamnesisModalOpen] = useState(false)
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [anamnesisLink, setAnamnesisLink] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingAnamnesis, setIsSavingAnamnesis] = useState(false)
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false)
  const [orcamentoForm, setOrcamentoForm] = useState({ descricao: '', valor: '' })
  const { updatePatient } = usePatients()

  const [anamneseForm, setAnamneseForm] = useState({
    historicoMedico: '',
    medicamentosEmUso: '',
    alergias: '',
    antecedentesFamiliares: '',
    habitos: { fumante: false, etilista: false, atividadeFisica: 'Nenhuma' }
  })

  // Histórico de anamneses preenchidas (tabela anamneses)
  const [anamneseHistory, setAnamneseHistory] = useState<any[]>([])

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

      // Carregar histórico de anamneses da tabela anamneses
      const { data: anamData } = await supabase
        .from('anamneses')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false })
      setAnamneseHistory(anamData || [])

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
        {(['resumo', 'anamnese', 'odontograma', 'documentos', 'financeiro', 'harmonizacao', 'termos'] as const).map(tab => (
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
            {tab === 'odontograma' && <Stethoscope className="w-4 h-4" />}
            {tab === 'documentos' && <FileText className="w-4 h-4" />}
            {tab === 'financeiro' && <Wallet className="w-4 h-4" />}
            {tab === 'harmonizacao' && <Sparkles className="w-4 h-4" />}
            {tab === 'termos' && <UserCheck className="w-4 h-4" />}
            {tab.replace('harmonizacao', 'Harmonização').replace('odontograma', 'Odontograma')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 font-medium">Total Consultas</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{history.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 font-medium">Última Visita</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {history.length > 0
                    ? (() => { const d = history[0].data.split('-'); return `${d[2]}/${d[1]}/${d[0]}` })()
                    : '—'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 font-medium">Convênio</p>
                <p className="text-sm font-bold text-green-600 mt-1">{patient.convenio || 'Particular'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 font-medium">Alergias</p>
                <p className="text-sm font-bold mt-1 truncate" title={patient.alergias?.join(', ')}>
                  {patient.alergias?.length ? (
                    <span className="text-red-600">{patient.alergias.join(', ')}</span>
                  ) : (
                    <span className="text-gray-400">Nenhuma</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Info lateral */}
              <div className="lg:col-span-1 space-y-4">
                {/* Contato */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contato</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Telefone</p>
                        <p className="font-medium text-gray-900">{patient.contato?.telefone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">E-mail</p>
                        <p className="font-medium text-gray-900 truncate">{patient.contato?.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                {patient.endereco && (patient.endereco.logradouro || patient.endereco.cidade) && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Endereço</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {patient.endereco.logradouro && (
                        <p>{patient.endereco.logradouro}{patient.endereco.numero ? `, ${patient.endereco.numero}` : ''}</p>
                      )}
                      {(patient.endereco.bairro || patient.endereco.cidade) && (
                        <p>{[patient.endereco.bairro, patient.endereco.cidade, patient.endereco.estado].filter(Boolean).join(' — ')}</p>
                      )}
                      {patient.endereco.cep && (
                        <p className="text-xs text-gray-400">CEP: {patient.endereco.cep}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações rápidas */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ações Rápidas</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/agenda')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                    >
                      <Calendar className="w-4 h-4" /> Agendar consulta
                    </button>
                    {patient.contato?.telefone && (
                      <a
                        href={`https://wa.me/${patient.contato.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                      >
                        <Phone className="w-4 h-4" /> Enviar WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => setIsPrescriptionModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Nova prescrição
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Linha do Tempo
                  </h3>
                  <span className="text-xs text-gray-400">{history.length} registro{history.length !== 1 ? 's' : ''}</span>
                </div>

                {history.length > 0 ? (
                  <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                    {history.map((apt, idx) => {
                      const dateParts = apt.data.split('-')
                      const dataFormatada = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                      return (
                        <div key={apt.id} className="relative group/apt">
                          <div className={cn(
                            "absolute -left-[22px] top-1 w-5 h-5 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm z-10 transition-all group-hover/apt:scale-110",
                            idx === 0 ? "bg-green-500 ring-2 ring-green-100" : "bg-gray-200 group-hover/apt:bg-green-400"
                          )}>
                            {idx === 0 && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                          </div>

                          <div className="group-hover/apt:translate-x-0.5 transition-transform">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-gray-900">{dataFormatada}</span>
                                <span className="text-[10px] font-semibold text-gray-400">{apt.horaInicio}</span>
                                <Badge variant="gray" className="text-[10px] px-2 py-0 h-4">{apt.procedimento}</Badge>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover/apt:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setSelectedApt(apt); setIsEvolutionModalOpen(true); }}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Editar evolução"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Excluir este atendimento?')) return
                                    await deleteConsulta(apt.id)
                                    const h = await getPatientHistory(id!)
                                    setHistory(h)
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 mb-2">
                              <User className="w-3 h-3 inline mr-1" />
                              {apt.profissionalNome}
                            </p>

                            <div
                              onClick={() => { setSelectedApt(apt); setIsEvolutionModalOpen(true); }}
                              className="p-3 bg-gray-50 group-hover/apt:bg-green-50/40 rounded-xl text-xs text-gray-600 border border-gray-100/50 leading-relaxed transition-all cursor-pointer"
                            >
                              <p className={apt.observacoes ? '' : 'italic text-gray-400'}>
                                {apt.observacoes || 'Sem evolução — clique para adicionar'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Clock className="w-10 h-10 mb-3 text-gray-200" />
                    <p className="text-sm font-medium">Nenhum atendimento registrado</p>
                    <p className="text-xs mt-1">Os atendimentos aparecerão aqui conforme forem realizados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anamnese' && (
          <div className="space-y-6">
            {/* Status da anamnese */}
            {anamneseHistory.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Anamnese preenchida pelo paciente</p>
                  <p className="text-xs text-green-600">{anamneseHistory.length} formulário{anamneseHistory.length > 1 ? 's' : ''} recebido{anamneseHistory.length > 1 ? 's' : ''} via link</p>
                </div>
              </div>
            )}

            {/* Formulário do profissional */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-green-600" /> Anamnese Clínica
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Preenchido pelo profissional durante a consulta</p>
                </div>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  onClick={handleSaveAnamnesis}
                  disabled={isSavingAnamnesis}
                >
                  {isSavingAnamnesis ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna esquerda */}
                  <div className="space-y-5">
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
                      placeholder="Ex: Losartana 50mg, Metformina..."
                    />
                    <AnamneseField
                      label="Alergias Conhecidas"
                      value={anamneseForm.alergias}
                      onChange={(e) => setAnamneseForm(prev => ({...prev, alergias: e.target.value}))}
                      placeholder="Separe por vírgula: Dipirona, Penicilina..."
                    />
                  </div>

                  {/* Coluna direita */}
                  <div className="space-y-5">
                    <AnamneseField
                      label="Histórico Familiar"
                      value={anamneseForm.antecedentesFamiliares}
                      onChange={(e) => setAnamneseForm(prev => ({...prev, antecedentesFamiliares: e.target.value}))}
                      placeholder="Doenças na família: diabetes, câncer..."
                    />

                    {/* Hábitos */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Estilo de Vida</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <AnamneseToggle
                            label="Tabagista"
                            active={anamneseForm.habitos.fumante}
                            onToggle={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, fumante: !prev.habitos.fumante}}))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <AnamneseToggle
                            label="Etilista"
                            active={anamneseForm.habitos.etilista}
                            onToggle={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, etilista: !prev.habitos.etilista}}))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-2 block">Atividade Física</label>
                          <div className="flex gap-2">
                            {['Nenhuma', 'Ocasional', 'Regular'].map(l => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setAnamneseForm(prev => ({...prev, habitos: {...prev.habitos, atividadeFisica: l as any}}))}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center",
                                  anamneseForm.habitos.atividadeFisica.toLowerCase() === l.toLowerCase()
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                                )}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Respostas do Paciente */}
            {anamneseHistory.length > 0 && (
              <AnamneseHistorySection history={anamneseHistory} onDelete={async (anamId: string) => {
                await deleteAnamnese(anamId)
                const { data } = await supabase.from('anamneses').select('*').eq('paciente_id', id!).order('created_at', { ascending: false })
                setAnamneseHistory(data || [])
              }} />
            )}
          </div>
        )}

        {activeTab === 'odontograma' && (
          <DentalMapping pacienteId={patient.id} />
        )}

        {activeTab === 'documentos' && (
          <PatientDocumentsTab pacienteId={patient.id} />
        )}

        {activeTab === 'financeiro' && (() => {
          const totalPendente = financial.filter(f => f.status === 'pendente').reduce((s, f) => s + f.valor, 0)
          const totalConcluido = financial.filter(f => f.status === 'concluido').reduce((s, f) => s + f.valor, 0)
          const formatData = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d }

          return (
          <div className="space-y-5">
            {/* KPIs */}
            {financial.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 font-medium">Total</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {(totalPendente + totalConcluido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 font-medium">Pendente</p>
                  <p className="text-lg font-bold text-yellow-600 mt-1">
                    {totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 font-medium">Pago</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {totalConcluido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" /> Histórico Financeiro
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{financial.length} registro{financial.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setShowOrcamentoModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Novo Orçamento
                </button>
              </div>

              <div className="p-5">
                {financial.length > 0 ? (
                  <div className="space-y-3">
                    {financial.map(f => {
                      const isPago = f.status === 'concluido'
                      const isCancelado = f.status === 'cancelado'
                      return (
                        <div key={f.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              isPago ? "bg-green-50 text-green-600" : isCancelado ? "bg-gray-100 text-gray-400" : "bg-yellow-50 text-yellow-600"
                            )}>
                              {isPago ? <CheckCircle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{f.descricao}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatData(f.data)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-sm font-bold", isCancelado ? "text-gray-400 line-through" : "text-gray-900")}>
                              {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <span className={cn(
                              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1",
                              isPago ? "bg-green-50 text-green-700" : isCancelado ? "bg-gray-100 text-gray-400" : "bg-yellow-50 text-yellow-700"
                            )}>
                              {isPago ? 'Pago' : isCancelado ? 'Cancelado' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center flex flex-col items-center gap-3">
                    <Wallet className="w-12 h-12 text-gray-100" />
                    <p className="text-sm text-gray-400 font-medium">Nenhum orçamento registrado</p>
                    <p className="text-xs text-gray-300">Crie o primeiro orçamento usando o botão acima</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        })()}

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

      {/* Modal Novo Orçamento */}
      {showOrcamentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowOrcamentoModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Novo Orçamento</h3>
              <button onClick={() => setShowOrcamentoModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!orcamentoForm.descricao.trim() || !orcamentoForm.valor) return
              await createOrcamento(patient.id, { descricao: orcamentoForm.descricao, valor: parseFloat(orcamentoForm.valor) })
              const f = await getPatientFinancial(patient.id)
              setFinancial(f)
              setOrcamentoForm({ descricao: '', valor: '' })
              setShowOrcamentoModal(false)
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                <input
                  value={orcamentoForm.descricao}
                  onChange={(e) => setOrcamentoForm(p => ({ ...p, descricao: e.target.value }))}
                  className="input-base"
                  placeholder="Ex: Limpeza + Clareamento..."
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={orcamentoForm.valor}
                  onChange={(e) => setOrcamentoForm(p => ({ ...p, valor: e.target.value }))}
                  className="input-base"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowOrcamentoModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    onClick={() => { navigator.clipboard.writeText(anamnesisLink); toast({ title: 'Link copiado!', description: 'Link de anamnese copiado para a área de transferência.', type: 'success' }) }}
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
          onSave={async (items) => { if (patient) await generatePrescription(patient.id, items) }}
        />
      )}
    </div>
  )
}

const ANAMNESE_PAGE_SIZE = 5

function AnamneseHistorySection({ history, onDelete }: { history: any[], onDelete?: (id: string) => void }) {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalPages = Math.ceil(history.length / ANAMNESE_PAGE_SIZE)
  const paginated = history.slice((page - 1) * ANAMNESE_PAGE_SIZE, page * ANAMNESE_PAGE_SIZE)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-green-600" /> Respostas do Paciente
        </h3>
        <p className="text-sm text-gray-400">{history.length} anamnese(s) preenchida(s) via link</p>
      </div>

      <div className="space-y-3">
        {paginated.map((anam: any, idx: number) => {
          const isExpanded = expandedId === (anam.id || idx.toString())
          const habitos = anam.habitos && typeof anam.habitos === 'object' ? anam.habitos : {}
          const extras = anam.dados_extras && typeof anam.dados_extras === 'object' ? anam.dados_extras : {}
          const dateLabel = anam.preenchido_em
            ? new Date(anam.preenchido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : new Date(anam.created_at).toLocaleDateString('pt-BR')

          return (
            <div key={anam.id || idx} className="rounded-2xl border border-gray-100 overflow-hidden">
              {/* Linha resumida - sempre visível */}
              <div className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">{dateLabel}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[250px]">{anam.queixa_principal || 'Sem queixa informada'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : (anam.id || idx.toString()))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5"
                    style={isExpanded
                      ? { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }
                      : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                    }
                  >
                    {isExpanded ? (
                      <><ChevronLeft className="w-3.5 h-3.5 rotate-90" /> Ocultar</>
                    ) : (
                      <><FileText className="w-3.5 h-3.5" /> Ver Detalhes</>
                    )}
                  </button>
                  {onDelete && anam.id && (
                    <button
                      onClick={() => { if (confirm('Excluir esta anamnese?')) onDelete(anam.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
                      title="Excluir anamnese"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Detalhes expandidos */}
              {isExpanded && (
                <div className="p-5 bg-green-50/30 border-t border-green-100 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Queixa Principal</p>
                      <p className="text-gray-800 font-medium">{anam.queixa_principal || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medicamentos em Uso</p>
                      <p className="text-gray-800 font-medium">{anam.medicamentos_uso || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alergias</p>
                      <p className="text-gray-800 font-medium">{anam.alergias || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Histórico Médico</p>
                      <p className="text-gray-800 font-medium">{anam.historico_medico || '—'}</p>
                    </div>
                    {(habitos.fuma !== undefined || habitos.alcool !== undefined || habitos.atividade_fisica) && (
                      <div className="col-span-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Hábitos</p>
                        <div className="flex flex-wrap gap-2">
                          {habitos.fuma && <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Fumante</span>}
                          {habitos.alcool && <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-100">Etilista</span>}
                          {habitos.atividade_fisica && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">Ativ. Física: {habitos.atividade_fisica}</span>}
                          {!habitos.fuma && <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100">Não fuma</span>}
                          {!habitos.alcool && <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100">Não etilista</span>}
                        </div>
                      </div>
                    )}
                    {(extras.alergia_medicamentos || extras.problemas_cardiacos || extras.diabetes_hipertensao) && (
                      <div className="col-span-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Condições Informadas</p>
                        <div className="flex flex-wrap gap-2">
                          {extras.alergia_medicamentos && <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Alergia a Medicamentos</span>}
                          {extras.problemas_cardiacos && <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Problemas Cardíacos</span>}
                          {extras.diabetes_hipertensao && <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Diabetes/Hipertensão</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>Mostrando {(page - 1) * ANAMNESE_PAGE_SIZE + 1}–{Math.min(page * ANAMNESE_PAGE_SIZE, history.length)} de {history.length}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
