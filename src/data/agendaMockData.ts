import type { AgendaAppointment, Profissional, PacienteResumido } from '../types/agenda'

// ─────────────────────────────────────────────────────
// PROFISSIONAIS
// ─────────────────────────────────────────────────────
export const PROFISSIONAIS: Profissional[] = [
  {
    id: 'pro-001',
    nome: 'Dra. Ana Lima',
    especialidade: 'Clínica Geral',
    crm: 'CRM-SP 12345',
    cor: '#16A34A',
  },
  {
    id: 'pro-002',
    nome: 'Dr. Carlos Melo',
    especialidade: 'Odontologia',
    crm: 'CRO-SP 54321',
    cor: '#2563EB',
  },
  {
    id: 'pro-003',
    nome: 'Dra. Julia Ramos',
    especialidade: 'Estética',
    crm: 'CRM-SP 98765',
    cor: '#9333EA',
  },
]

// ─────────────────────────────────────────────────────
// PACIENTES (para autocomplete)
// ─────────────────────────────────────────────────────
export const PACIENTES_MOCK: PacienteResumido[] = [
  { id: 'pac-001', nome: 'Maria Fernanda Costa',   telefone: '(11) 98765-4321', dataNascimento: '1985-04-12' },
  { id: 'pac-002', nome: 'João Paulo Alves',        telefone: '(11) 91234-5678', dataNascimento: '1990-07-23' },
  { id: 'pac-003', nome: 'Beatriz Oliveira',        telefone: '(11) 97654-3210', dataNascimento: '1978-11-05' },
  { id: 'pac-004', nome: 'Carlos Eduardo Lima',     telefone: '(11) 93456-7890', dataNascimento: '1982-03-17' },
  { id: 'pac-005', nome: 'Fernanda Rodrigues',      telefone: '(11) 95555-9999', dataNascimento: '1995-06-30' },
  { id: 'pac-006', nome: 'Luciana Martins',         telefone: '(11) 94444-8888', dataNascimento: '1998-02-14' },
  { id: 'pac-007', nome: 'Roberto Nascimento',      telefone: '(11) 93333-7777', dataNascimento: '1975-09-08' },
  { id: 'pac-008', nome: 'Patrícia Santos',         telefone: '(11) 92222-6666', dataNascimento: '1988-12-01' },
  { id: 'pac-009', nome: 'André Souza',             telefone: '(11) 91111-5555', dataNascimento: '1993-05-25' },
  { id: 'pac-010', nome: 'Tatiane Ferreira',        telefone: '(11) 96666-1111', dataNascimento: '2000-08-19' },
  { id: 'pac-011', nome: 'Bruno Cavalcanti',        telefone: '(11) 97777-2222', dataNascimento: '1980-01-30' },
  { id: 'pac-012', nome: 'Isabela Carvalho',        telefone: '(11) 98888-3333', dataNascimento: '1992-11-14' },
  { id: 'pac-013', nome: 'Diego Pereira',           telefone: '(11) 99999-4444', dataNascimento: '1987-04-03' },
  { id: 'pac-014', nome: 'Camila Nogueira',         telefone: '(11) 90000-5555', dataNascimento: '1996-07-22' },
  { id: 'pac-015', nome: 'Thiago Barros',           telefone: '(11) 98901-2345', dataNascimento: '1983-10-11' },
]

// ─────────────────────────────────────────────────────
// HELPERS para datas relativas à semana atual
// Data de referência: 2026-03-18 (quarta-feira)
// ─────────────────────────────────────────────────────
function weekDay(dayOffset: number): string {
  // Segunda = -2, Terça = -1, Quarta = 0, Quinta = +1, Sexta = +2, Sáb = +3
  const base = new Date('2026-03-18')
  base.setDate(base.getDate() + dayOffset)
  return base.toISOString().split('T')[0]
}

const SEG = weekDay(-2) // 2026-03-16
const TER = weekDay(-1) // 2026-03-17
const QUA = weekDay(0)  // 2026-03-18 (hoje)
const QUI = weekDay(1)  // 2026-03-19
const SEX = weekDay(2)  // 2026-03-20
const SAB = weekDay(3)  // 2026-03-21

function pro(id: string): { profissionalId: string; profissionalNome: string; profissionalEspecialidade: string; profissionalCor: string } {
  const p = PROFISSIONAIS.find(p => p.id === id)!
  return {
    profissionalId: p.id,
    profissionalNome: p.nome,
    profissionalEspecialidade: p.especialidade,
    profissionalCor: p.cor,
  }
}

// ─────────────────────────────────────────────────────
// 15 CONSULTAS — SEMANA ATUAL
// ─────────────────────────────────────────────────────
export const AGENDA_MOCK: AgendaAppointment[] = [
  // ── SEGUNDA (16/mar) ──────────────────────────────
  {
    id: 'apt-101',
    pacienteId: 'pac-001',
    pacienteNome: 'Maria Fernanda Costa',
    pacienteTelefone: '(11) 98765-4321',
    ...pro('pro-001'),
    data: SEG,
    horaInicio: '08:00', horaFim: '08:40',
    procedimento: 'consulta',
    status: 'confirmado',
    valor: 280,
    observacoes: 'Revisão anual. Paciente hipertensa.',
    criadoEm: '2026-03-10T09:00:00Z', atualizadoEm: '2026-03-15T10:00:00Z',
  },
  {
    id: 'apt-102',
    pacienteId: 'pac-007',
    pacienteNome: 'Roberto Nascimento',
    pacienteTelefone: '(11) 93333-7777',
    ...pro('pro-002'),
    data: SEG,
    horaInicio: '09:00', horaFim: '10:00',
    procedimento: 'ortodontia',
    status: 'confirmado',
    valor: 350,
    observacoes: 'Ajuste de aparelho fixo.',
    criadoEm: '2026-03-08T14:00:00Z', atualizadoEm: '2026-03-14T08:00:00Z',
  },
  {
    id: 'apt-103',
    pacienteId: 'pac-010',
    pacienteNome: 'Tatiane Ferreira',
    pacienteTelefone: '(11) 96666-1111',
    ...pro('pro-003'),
    data: SEG,
    horaInicio: '14:00', horaFim: '15:30',
    procedimento: 'botox',
    status: 'agendado',
    valor: 950,
    criadoEm: '2026-03-12T11:00:00Z', atualizadoEm: '2026-03-12T11:00:00Z',
  },

  // ── TERÇA (17/mar) ────────────────────────────────
  {
    id: 'apt-104',
    pacienteId: 'pac-003',
    pacienteNome: 'Beatriz Oliveira',
    pacienteTelefone: '(11) 97654-3210',
    ...pro('pro-001'),
    data: TER,
    horaInicio: '08:30', horaFim: '09:00',
    procedimento: 'retorno',
    status: 'concluido',
    valor: 150,
    criadoEm: '2026-03-05T09:00:00Z', atualizadoEm: '2026-03-17T09:05:00Z',
  },
  {
    id: 'apt-105',
    pacienteId: 'pac-011',
    pacienteNome: 'Bruno Cavalcanti',
    pacienteTelefone: '(11) 97777-2222',
    ...pro('pro-002'),
    data: TER,
    horaInicio: '10:00', horaFim: '11:00',
    procedimento: 'limpeza',
    status: 'concluido',
    valor: 200,
    criadoEm: '2026-03-09T10:00:00Z', atualizadoEm: '2026-03-17T11:05:00Z',
  },
  {
    id: 'apt-106',
    pacienteId: 'pac-014',
    pacienteNome: 'Camila Nogueira',
    pacienteTelefone: '(11) 90000-5555',
    ...pro('pro-003'),
    data: TER,
    horaInicio: '15:00', horaFim: '16:30',
    procedimento: 'botox',
    status: 'cancelado',
    valor: 1100,
    observacoes: 'Paciente cancelou por motivo de saúde.',
    criadoEm: '2026-03-11T13:00:00Z', atualizadoEm: '2026-03-16T18:00:00Z',
  },

  // ── QUARTA (18/mar — HOJE) ────────────────────────
  {
    id: 'apt-107',
    pacienteId: 'pac-002',
    pacienteNome: 'João Paulo Alves',
    pacienteTelefone: '(11) 91234-5678',
    ...pro('pro-001'),
    data: QUA,
    horaInicio: '08:00', horaFim: '08:30',
    procedimento: 'consulta',
    status: 'em_atendimento',
    valor: 280,
    criadoEm: '2026-03-14T08:00:00Z', atualizadoEm: '2026-03-18T08:00:00Z',
  },
  {
    id: 'apt-108',
    pacienteId: 'pac-004',
    pacienteNome: 'Carlos Eduardo Lima',
    pacienteTelefone: '(11) 93456-7890',
    ...pro('pro-002'),
    data: QUA,
    horaInicio: '09:30', horaFim: '10:30',
    procedimento: 'limpeza',
    status: 'confirmado',
    valor: 200,
    criadoEm: '2026-03-15T11:00:00Z', atualizadoEm: '2026-03-17T14:00:00Z',
  },
  {
    id: 'apt-109',
    pacienteId: 'pac-012',
    pacienteNome: 'Isabela Carvalho',
    pacienteTelefone: '(11) 98888-3333',
    ...pro('pro-003'),
    data: QUA,
    horaInicio: '14:00', horaFim: '15:30',
    procedimento: 'botox',
    status: 'confirmado',
    valor: 850,
    observacoes: 'Testa + região periorbital.',
    criadoEm: '2026-03-10T16:00:00Z', atualizadoEm: '2026-03-17T16:00:00Z',
  },

  // ── QUINTA (19/mar) ───────────────────────────────
  {
    id: 'apt-110',
    pacienteId: 'pac-005',
    pacienteNome: 'Fernanda Rodrigues',
    pacienteTelefone: '(11) 95555-9999',
    ...pro('pro-001'),
    data: QUI,
    horaInicio: '08:00', horaFim: '08:30',
    procedimento: 'consulta',
    status: 'confirmado',
    valor: 280,
    criadoEm: '2026-03-16T09:00:00Z', atualizadoEm: '2026-03-17T10:00:00Z',
  },
  {
    id: 'apt-111',
    pacienteId: 'pac-008',
    pacienteNome: 'Patrícia Santos',
    pacienteTelefone: '(11) 92222-6666',
    ...pro('pro-002'),
    data: QUI,
    horaInicio: '11:00', horaFim: '12:00',
    procedimento: 'ortodontia',
    status: 'agendado',
    valor: 350,
    criadoEm: '2026-03-16T11:30:00Z', atualizadoEm: '2026-03-16T11:30:00Z',
  },
  {
    id: 'apt-112',
    pacienteId: 'pac-015',
    pacienteNome: 'Thiago Barros',
    pacienteTelefone: '(11) 98901-2345',
    ...pro('pro-003'),
    data: QUI,
    horaInicio: '16:00', horaFim: '17:00',
    procedimento: 'outro',
    status: 'agendado',
    valor: 600,
    observacoes: 'Fio de sustentação facial. Avaliação inicial.',
    criadoEm: '2026-03-17T10:00:00Z', atualizadoEm: '2026-03-17T10:00:00Z',
  },

  // ── SEXTA (20/mar) ────────────────────────────────
  {
    id: 'apt-113',
    pacienteId: 'pac-006',
    pacienteNome: 'Luciana Martins',
    pacienteTelefone: '(11) 94444-8888',
    ...pro('pro-001'),
    data: SEX,
    horaInicio: '09:00', horaFim: '09:30',
    procedimento: 'retorno',
    status: 'agendado',
    valor: 150,
    criadoEm: '2026-03-17T08:00:00Z', atualizadoEm: '2026-03-17T08:00:00Z',
  },
  {
    id: 'apt-114',
    pacienteId: 'pac-013',
    pacienteNome: 'Diego Pereira',
    pacienteTelefone: '(11) 99999-4444',
    ...pro('pro-002'),
    data: SEX,
    horaInicio: '10:00', horaFim: '11:30',
    procedimento: 'cirurgia',
    status: 'confirmado',
    valor: 1800,
    observacoes: 'Extração de siso inferior esquerdo.',
    criadoEm: '2026-03-14T14:00:00Z', atualizadoEm: '2026-03-17T14:00:00Z',
  },

  // ── SÁBADO (21/mar) ───────────────────────────────
  {
    id: 'apt-115',
    pacienteId: 'pac-009',
    pacienteNome: 'André Souza',
    pacienteTelefone: '(11) 91111-5555',
    ...pro('pro-003'),
    data: SAB,
    horaInicio: '09:00', horaFim: '10:30',
    procedimento: 'botox',
    status: 'agendado',
    valor: 750,
    criadoEm: '2026-03-18T08:00:00Z', atualizadoEm: '2026-03-18T08:00:00Z',
  },
]
