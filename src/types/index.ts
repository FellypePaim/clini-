// ─────────────────────────────────────────────
// ROLES E PERMISSÕES
// ─────────────────────────────────────────────
export type Role = 'administrador' | 'profissional' | 'recepção' | 'superadmin'

export interface Permission {
  canViewAllSchedules: boolean
  canManagePatients: boolean
  canViewFinancial: boolean
  canManageStock: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canWritePrescriptions: boolean
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  administrador: {
    canViewAllSchedules: true,
    canManagePatients: true,
    canViewFinancial: true,
    canManageStock: true,
    canManageUsers: true,
    canViewReports: true,
    canWritePrescriptions: true,
  },
  profissional: {
    canViewAllSchedules: false,
    canManagePatients: true,
    canViewFinancial: false,
    canManageStock: false,
    canManageUsers: false,
    canViewReports: false,
    canWritePrescriptions: true,
  },
  recepção: {
    canViewAllSchedules: true,
    canManagePatients: false,
    canViewFinancial: false,
    canManageStock: false,
    canManageUsers: false,
    canViewReports: false,
    canWritePrescriptions: false,
  },
  superadmin: {
    canViewAllSchedules: true,
    canManagePatients: true,
    canViewFinancial: true,
    canManageStock: true,
    canManageUsers: true,
    canViewReports: true,
    canWritePrescriptions: true,
  },
}

// ─────────────────────────────────────────────
// USUÁRIO
// ─────────────────────────────────────────────
export interface User {
  id: string
  nome: string
  email: string
  role: Role
  avatar?: string
  especialidade?: string
  crm?: string
  clinicaId: string
  clinicaNome?: string
  ativo: boolean
  criadoEm: string
}

// ─────────────────────────────────────────────
// PACIENTE
// ─────────────────────────────────────────────
export type Sexo = 'masculino' | 'feminino' | 'outro'
export type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viúvo' | 'outro'

export interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

export interface Contato {
  telefone: string
  celular?: string
  whatsapp?: string
  email?: string
}

export interface Patient {
  id: string
  nome: string
  dataNascimento: string
  cpf: string
  rg?: string
  sexo: Sexo
  estadoCivil?: EstadoCivil
  profissao?: string
  convenio?: string
  numeroConvenio?: string
  endereco: Endereco
  contato: Contato
  observacoes?: string
  alergias?: string[]
  antecedentesFamiliares?: string
  historicoMedico?: string
  medicamentosEmUso?: string
  habitos?: {
    fumante: boolean
    etilista: boolean
    atividadeFisica: 'nenhuma' | 'ocasional' | 'regular'
  }
  ativo: boolean
  criadoEm: string
  ultimaConsulta?: string
  totalConsultas: number
}

export interface PatientDocument {
  id: string
  pacienteId: string
  nome: string
  tipo: 'pdf' | 'imagem'
  url: string
  dataUpload: string
  tamanho: string
}

export interface PatientFinancial {
  id: string
  pacienteId: string
  tipo: 'pagamento' | 'orcamento'
  valor: number
  data: string
  descricao: string
  status: 'concluido' | 'pendente' | 'cancelado'
}

// ─────────────────────────────────────────────
// AGENDAMENTO
// ─────────────────────────────────────────────
export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export type ProcedimentoTipo =
  | 'consulta'
  | 'retorno'
  | 'botox'
  | 'limpeza'
  | 'ortodontia'
  | 'exame'
  | 'cirurgia'
  | 'outro'

export interface Appointment {
  id: string
  pacienteId: string
  pacienteNome: string
  profissionalId: string
  profissionalNome: string
  data: string
  horaInicio: string
  horaFim: string
  procedimento: ProcedimentoTipo
  status: AppointmentStatus
  observacoes?: string
  valor?: number
  convenio?: string
  sala?: string
  criadoEm: string
  atualizadoEm: string
}

// ─────────────────────────────────────────────
// PRONTUÁRIO
// ─────────────────────────────────────────────
export interface Prontuario {
  id: string
  pacienteId: string
  consultaId: string
  profissionalId: string
  data: string
  queixaPrincipal: string
  historicoDoenca?: string
  exameFisico?: string
  hipoteseDiagnostica?: string
  diagnostico?: string
  planoTerapeutico?: string
  prescricoes?: string[]
  examesSolicitados?: string[]
  observacoes?: string
  criadoEm: string
}

// ─────────────────────────────────────────────
// FINANCEIRO
// ─────────────────────────────────────────────
export type TransacaoTipo = 'receita' | 'despesa'
export type TransacaoStatus = 'pago' | 'pendente' | 'cancelado'

export interface Transacao {
  id: string
  tipo: TransacaoTipo
  descricao: string
  valor: number
  data: string
  status: TransacaoStatus
  categoria: string
  pacienteId?: string
  profissionalId?: string
  formaPagamento?: string
}

// ─────────────────────────────────────────────
// CRM LEAD (Verdesk)
// ─────────────────────────────────────────────
export type LeadStatus = 'novo' | 'em_contato' | 'proposta' | 'ganho' | 'perdido'

export interface Lead {
  id: string
  nome: string
  telefone: string
  email?: string
  interesse: string
  status: LeadStatus
  responsavelId?: string
  valorEstimado?: number
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
}

// ─────────────────────────────────────────────
// KPIs DASHBOARD
// ─────────────────────────────────────────────
export interface KpiCard {
  titulo: string
  valor: string | number
  variacao?: number
  icone: string
  cor: 'green' | 'blue' | 'purple' | 'orange'
}

export interface ConsultasPorSemana {
  semana: string
  consultas: number
}

export interface ProcedimentoDistribuicao {
  nome: string
  valor: number
  cor: string
}

// ─────────────────────────────────────────────
// CONTRATOS DE IA (Stubs para integração futura)
// ─────────────────────────────────────────────
export interface IAAnaliseTexto {
  texto: string
  contexto?: 'prontuario' | 'prescricao' | 'relatorio'
}

export interface IAAnaliseResultado {
  sugestoes: string[]
  alertas: string[]
  resumo?: string
}

export interface IAChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Stubs — implementação real será configurada externamente
export type IAAnalisarTexto = (input: IAAnaliseTexto) => Promise<IAAnaliseResultado>
export type IAEnviarMensagem = (messages: IAChatMessage[]) => Promise<string>

// ─────────────────────────────────────────────
// SUPABASE TYPES (Stubs — cliente configurado externamente)
// ─────────────────────────────────────────────
export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface DatabaseSchema {
  users: User
  patients: Patient
  appointments: Appointment
  prontuarios: Prontuario
  transacoes: Transacao
  leads: Lead
}
