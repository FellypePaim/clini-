export type ProcedureHarmonization = 'botox' | 'preenchimento' | 'biorevolumizador' | 'fios' | 'outros'

export interface HarmonizationZone {
  id: string
  label: string
  procedimento: ProcedureHarmonization
  produto: string
  quantidade: string
  observacoes?: string
}

export interface HarmonizationSession {
  id: string
  pacienteId: string
  data: string
  profissionalId: string
  zones: HarmonizationZone[]
}

export interface CID10 {
  codigo: string
  nome: string
}

export interface EvolutionRecord {
  id: string
  pacienteId: string
  consultaId: string
  data: string
  profissionalId: string
  texto: string
  cid10?: string
  resumoIA?: {
    queixa: string
    diagnostico: string
    conduta: string
    retorno: string
  }
}

export interface PrescriptionItem {
  id: string
  medicamento: string
  dosagem: string
  frequencia: string
  duracao: string
  observacoes?: string
}

export interface Prescription {
  id: string
  pacienteId: string
  profissionalId: string
  data: string
  itens: PrescriptionItem[]
  assinada: boolean
  qrCode: string
}

export interface TermTemplate {
  id: string
  titulo: string
  conteudo: string
}

export interface SignedTerm {
  id: string
  pacienteId: string
  templateId: string
  data: string
  status: 'assinado' | 'pendente' | 'vencido'
  assinaturaUrl?: string
}
