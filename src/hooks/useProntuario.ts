import { useState, useCallback } from 'react'
import type { 
  EvolutionRecord, 
  Prescription, 
  PrescriptionItem,
  CID10, 
  HarmonizationSession, 
  HarmonizationZone,
  SignedTerm
} from '../types/prontuario'

// ─────────────────────────────────────────────────────────────────────────────
// CID-10 MOCK (10 exemplos)
// ─────────────────────────────────────────────────────────────────────────────
export const CID10_MOCK: CID10[] = [
  { codigo: 'Z00.0', nome: 'Exame médico geral' },
  { codigo: 'I10',    nome: 'Hipertensão essencial' },
  { codigo: 'E11',    nome: 'Diabetes mellitus tipo 2' },
  { codigo: 'R51',    nome: 'Cefaléia' },
  { codigo: 'M54.5',  nome: 'Dor lombar baixa' },
  { codigo: 'J01',    nome: 'Sinusite aguda' },
  { codigo: 'G43',    nome: 'Enxaqueca' },
  { codigo: 'K21',    nome: 'Doença do refluxo gastroesofágico' },
  { codigo: 'F41.1',  nome: 'Ansiedade generalizada' },
  { codigo: 'N39.0',  nome: 'Infecção do trato urinário' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA HISTÓRICO
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_EVOLUTIONS_MOCK: EvolutionRecord[] = [
  {
    id: 'evo-001',
    pacienteId: 'pac-001',
    consultaId: 'apt-001',
    data: '2026-03-10',
    profissionalId: 'pro-001',
    texto: '<p>Paciente relata melhora nas dores lombares. Realizado ajuste na medicação.</p>',
    cid10: 'M54.5',
    resumoIA: {
      queixa: 'Dor lombar',
      diagnostico: 'Lombalgia mecânica',
      conduta: 'Ajuste medicamentoso',
      retorno: '15 dias'
    }
  },
  {
    id: 'evo-002',
    pacienteId: 'pac-002',
    consultaId: 'apt-002',
    data: '2026-03-05',
    profissionalId: 'pro-002',
    texto: '<p>Paciente apresenta quadro de sinusite aguda. Prescrito antibiótico.</p>',
    cid10: 'J01',
    resumoIA: {
      queixa: 'Congestão nasal e cefaleia',
      diagnostico: 'Sinusite Bacteriana',
      conduta: 'Antibioticoterapia',
      retorno: '10 dias'
    }
  },
  {
    id: 'evo-003',
    pacienteId: 'pac-003',
    consultaId: 'apt-003',
    data: '2026-02-28',
    profissionalId: 'pro-003',
    texto: '<p>Pós-operatório de preenchimento labial. Edema leve, sem sinais inflamatórios.</p>',
    cid10: 'Z00.0',
    resumoIA: {
      queixa: 'Acompanhamento pós-procedimento',
      diagnostico: 'Recuperação normal',
      conduta: 'Compressas frias',
      retorno: 'A desejar'
    }
  }
]

const INITIAL_PRESCRIPTIONS_MOCK: Prescription[] = [
  {
    id: 'rx-001',
    pacienteId: 'pac-001',
    profissionalId: 'pro-001',
    data: '2026-03-10',
    itens: [
      { id: 'item-1', medicamento: 'Amoxicilina 500mg', dosagem: '1 comprimido', frequencia: '8/8h', duracao: '7 dias' },
      { id: 'item-2', medicamento: 'Dipirona 1g', dosagem: '1 comprimido', frequencia: 'Se dor', duracao: '3 dias' }
    ],
    assinada: true,
    qrCode: 'mock-qr-001'
  },
  {
    id: 'rx-002',
    pacienteId: 'pac-002',
    profissionalId: 'pro-002',
    data: '2026-03-05',
    itens: [
      { id: 'item-3', medicamento: 'Ibuprofeno 600mg', dosagem: '1 comprimido', frequencia: '12/12h', duracao: '5 dias' }
    ],
    assinada: true,
    qrCode: 'mock-qr-002'
  }
]

const INITIAL_SESSIONS_MOCK: HarmonizationSession[] = [
  {
    id: 'hs-001',
    pacienteId: 'pac-001',
    data: '2026-01-20',
    profissionalId: 'pro-003',
    zones: [
      { id: 'z1', label: 'Lábio Superior', procedimento: 'preenchimento', produto: 'Restylane', quantidade: '0.5ml' },
      { id: 'z2', label: 'Glabela', procedimento: 'botox', produto: 'Botox Allergan', quantidade: '10 UI' }
    ]
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// useProntuario Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useProntuario() {
  const [evolutions, setEvolutions] = useState<EvolutionRecord[]>(INITIAL_EVOLUTIONS_MOCK)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS_MOCK)
  const [sessions, setSessions] = useState<HarmonizationSession[]>(INITIAL_SESSIONS_MOCK)
  const [isLoading, setIsLoading] = useState(false)

  // ── Salvar Evolução ──────────────────────────────────────────────────────────
  const saveEvolution = useCallback(async (data: Partial<EvolutionRecord>) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const novo: EvolutionRecord = {
      ...(data as EvolutionRecord),
      id: `evo-${Date.now()}`
    }
    setEvolutions(prev => [novo, ...prev])
    setIsLoading(false)
    return novo
  }, [])

  // ── Transcrever Áudio por IA (Mock) ───────────────────────────────────────────
  const transcribeAudio = useCallback(async () => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsLoading(false)
    return "Paciente relata queixa principal de dor intensa na região da face há aproximadamente 3 dias, associada a cansaço e irritabilidade. Nega febre, mas relata dificuldade para dormir."
  }, [])

  // ── Gerar Resumo Automático (Mock IA) ─────────────────────────────────────────
  const generateAISummary = useCallback(async (texto: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsLoading(false)
    return {
      queixa: 'Dor facial intensa (3 dias)',
      diagnostico: 'Provável cefaleia tensional ou neuropatia trigeminal leve',
      conduta: 'Solicitado exames, prescrito analgésicos',
      retorno: '7 dias'
    }
  }, [])

  // ── Salvar Mapeamento de Harmonização ──────────────────────────────────────────
  const saveHarmonizationSession = useCallback(async (pacienteId: string, zones: HarmonizationZone[]) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const nova: HarmonizationSession = {
      id: `hs-${Date.now()}`,
      pacienteId,
      data: new Date().toISOString().split('T')[0],
      profissionalId: 'pro-003',
      zones
    }
    setSessions(prev => [nova, ...prev])
    setIsLoading(false)
    return nova
  }, [])

  // ── Gerar Prescrição ──────────────────────────────────────────────────────────
  const generatePrescription = useCallback(async (pacienteId: string, items: PrescriptionItem[]) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const nova: Prescription = {
      id: `rx-${Date.now()}`,
      pacienteId,
      profissionalId: 'pro-001',
      data: new Date().toISOString().split('T')[0],
      itens: items,
      assinada: true,
      qrCode: `val-${Date.now()}`
    }
    setPrescriptions(prev => [nova, ...prev])
    setIsLoading(false)
    return nova
  }, [])

  return {
    evolutions,
    prescriptions,
    sessions,
    isLoading,
    saveEvolution,
    transcribeAudio,
    generateAISummary,
    saveHarmonizationSession,
    generatePrescription,
    CID10_MOCK
  }
}
