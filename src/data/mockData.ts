import type {
  ConsultasPorSemana,
  ProcedimentoDistribuicao,
  Appointment,
  Patient,
  Lead,
} from '../types'

// ─── KPIs ──────────────────────────────────────────────
export const mockKpis = [
  {
    id: 'consultas-hoje',
    titulo: 'Consultas Hoje',
    valor: '12',
    variacao: 20,
    icone: 'Calendar',
    cor: 'green',
  },
  {
    id: 'novos-pacientes',
    titulo: 'Novos Pacientes',
    valor: '3',
    variacao: -5,
    icone: 'UserPlus',
    cor: 'blue',
  },
  {
    id: 'faturamento-mes',
    titulo: 'Faturamento do Mês',
    valor: 'R$ 28.400',
    variacao: 12,
    icone: 'DollarSign',
    cor: 'purple',
  },
  {
    id: 'leads-abertos',
    titulo: 'Leads em Aberto',
    valor: '7',
    variacao: 0,
    icone: 'Target',
    cor: 'orange',
  },
] as const

// ─── Gráfico de Linha: Consultas por Semana ─────────────
export const mockConsultasPorSemana: ConsultasPorSemana[] = [
  { semana: '24/fev', consultas: 38 },
  { semana: '03/mar', consultas: 52 },
  { semana: '10/mar', consultas: 45 },
  { semana: '17/mar', consultas: 61 },
]

// ─── Gráfico de Pizza: Distribuição por Procedimento ────
export const mockProcedimentos: ProcedimentoDistribuicao[] = [
  { nome: 'Consulta',   valor: 42, cor: '#16A34A' },
  { nome: 'Botox',      valor: 22, cor: '#22C55E' },
  { nome: 'Limpeza',    valor: 19, cor: '#4ADE80' },
  { nome: 'Ortodontia', valor: 17, cor: '#86EFAC' },
]

// ─── Agendamentos de Hoje ───────────────────────────────
export const mockAgendamentosHoje: Appointment[] = [
  {
    id: 'apt-001',
    pacienteId: 'pac-001',
    pacienteNome: 'Maria Fernanda Costa',
    profissionalId: 'usr-002',
    profissionalNome: 'Dra. Camila Souza',
    data: '2026-03-18',
    horaInicio: '08:00',
    horaFim: '08:30',
    procedimento: 'consulta',
    status: 'concluido',
    valor: 250,
    criadoEm: '2026-03-10T10:00:00Z',
    atualizadoEm: '2026-03-18T08:30:00Z',
  },
  {
    id: 'apt-002',
    pacienteId: 'pac-002',
    pacienteNome: 'João Paulo Alves',
    profissionalId: 'usr-002',
    profissionalNome: 'Dra. Camila Souza',
    data: '2026-03-18',
    horaInicio: '09:00',
    horaFim: '10:00',
    procedimento: 'botox',
    status: 'confirmado',
    valor: 800,
    criadoEm: '2026-03-12T14:00:00Z',
    atualizadoEm: '2026-03-17T16:00:00Z',
  },
  {
    id: 'apt-003',
    pacienteId: 'pac-003',
    pacienteNome: 'Beatriz Oliveira',
    profissionalId: 'usr-001',
    profissionalNome: 'Dr. Rafael Mendes',
    data: '2026-03-18',
    horaInicio: '10:30',
    horaFim: '11:00',
    procedimento: 'retorno',
    status: 'agendado',
    valor: 150,
    criadoEm: '2026-03-14T09:00:00Z',
    atualizadoEm: '2026-03-14T09:00:00Z',
  },
  {
    id: 'apt-004',
    pacienteId: 'pac-004',
    pacienteNome: 'Carlos Eduardo Lima',
    profissionalId: 'usr-001',
    profissionalNome: 'Dr. Rafael Mendes',
    data: '2026-03-18',
    horaInicio: '11:00',
    horaFim: '11:30',
    procedimento: 'limpeza',
    status: 'em_atendimento',
    valor: 200,
    criadoEm: '2026-03-15T11:00:00Z',
    atualizadoEm: '2026-03-18T11:00:00Z',
  },
  {
    id: 'apt-005',
    pacienteId: 'pac-005',
    pacienteNome: 'Fernanda Rodrigues',
    profissionalId: 'usr-002',
    profissionalNome: 'Dra. Camila Souza',
    data: '2026-03-18',
    horaInicio: '14:00',
    horaFim: '14:30',
    procedimento: 'consulta',
    status: 'agendado',
    valor: 250,
    criadoEm: '2026-03-16T08:00:00Z',
    atualizadoEm: '2026-03-16T08:00:00Z',
  },
]

// ─── Pacientes Recentes ─────────────────────────────────
export const mockPacientesRecentes: Partial<Patient>[] = [
  {
    id: 'pac-001',
    nome: 'Maria Fernanda Costa',
    dataNascimento: '1985-04-12',
    contato: { telefone: '(11) 98765-4321' },
    ultimaConsulta: '2026-03-18',
    totalConsultas: 8,
  },
  {
    id: 'pac-002',
    nome: 'João Paulo Alves',
    dataNascimento: '1990-07-23',
    contato: { telefone: '(11) 91234-5678' },
    ultimaConsulta: '2026-03-10',
    totalConsultas: 3,
  },
  {
    id: 'pac-003',
    nome: 'Beatriz Oliveira',
    dataNascimento: '1978-11-05',
    contato: { telefone: '(11) 97654-3210' },
    ultimaConsulta: '2026-02-28',
    totalConsultas: 15,
  },
  {
    id: 'pac-006',
    nome: 'Luciana Martins',
    dataNascimento: '1995-02-14',
    contato: { telefone: '(11) 95555-9999' },
    ultimaConsulta: '2026-03-17',
    totalConsultas: 1,
  },
]

// ─── Leads (Verdesk) ────────────────────────────────────
export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    nome: 'Priscila Nascimento',
    telefone: '(11) 99988-7766',
    email: 'priscila@email.com',
    interesse: 'Botox',
    status: 'novo',
    valorEstimado: 1200,
    criadoEm: '2026-03-17T10:00:00Z',
    atualizadoEm: '2026-03-17T10:00:00Z',
  },
  {
    id: 'lead-002',
    nome: 'Roberto Freitas',
    telefone: '(11) 98877-6655',
    interesse: 'Ortodontia',
    status: 'em_contato',
    valorEstimado: 3500,
    criadoEm: '2026-03-15T14:00:00Z',
    atualizadoEm: '2026-03-16T09:00:00Z',
  },
  {
    id: 'lead-003',
    nome: 'Tatiane Gomes',
    telefone: '(11) 97766-5544',
    email: 'tatiane@email.com',
    interesse: 'Limpeza + Clareamento',
    status: 'proposta',
    valorEstimado: 800,
    criadoEm: '2026-03-12T16:00:00Z',
    atualizadoEm: '2026-03-17T11:00:00Z',
  },
]
