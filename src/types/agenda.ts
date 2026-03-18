import type { AppointmentStatus, ProcedimentoTipo } from './index'
export type { AppointmentStatus } from './index'

// ─── Visualizações possíveis ──────────────────────────
export type AgendaView = 'dia' | 'semana' | 'mes'

// ─── Recorrência ──────────────────────────────────────
export type RecorrenciaTipo = 'semanal' | 'quinzenal' | 'mensal'

export interface Recorrencia {
  ativa: boolean
  tipo: RecorrenciaTipo
  quantidadeRepeticoes: number
}

// ─── Profissional da clínica ──────────────────────────
export interface Profissional {
  id: string
  nome: string
  especialidade: string
  cor: string // cor para identificação na agenda
  crm?: string
  avatar?: string
}

// ─── Consulta enriquecida com dados de UI ─────────────
export interface AgendaAppointment {
  id: string
  pacienteId: string
  pacienteNome: string
  pacienteTelefone?: string
  profissionalId: string
  profissionalNome: string
  profissionalEspecialidade: string
  profissionalCor: string
  data: string           // 'YYYY-MM-DD'
  horaInicio: string     // 'HH:mm'
  horaFim: string        // 'HH:mm'
  procedimento: ProcedimentoTipo
  status: AppointmentStatus
  observacoes?: string
  valor?: number
  recorrencia?: Recorrencia
  criadoEm: string
  atualizadoEm: string
}

// ─── Form de criação de consulta ─────────────────────
export interface AppointmentFormData {
  pacienteId: string
  pacienteNome: string
  profissionalId: string
  data: string
  horaInicio: string
  horaFim: string
  procedimento: ProcedimentoTipo
  status: AppointmentStatus
  observacoes?: string
  valor?: number
  repetir: boolean
  recorrenciaTipo?: RecorrenciaTipo
  quantidadeRepeticoes?: number
}

// ─── Filtros da agenda ────────────────────────────────
export interface AgendaFiltros {
  profissionalId: string | 'todos'
  status: AppointmentStatus | 'todos'
  data?: string
}

// ─── Paciente resumido (para autocomplete) ─────────────
export interface PacienteResumido {
  id: string
  nome: string
  telefone: string
  dataNascimento?: string
}
