import type { Patient, PatientDocument, PatientFinancial, Appointment } from '../types'

export const PATIENTS_MOCK: Patient[] = [
  {
    id: 'pac-001',
    nome: 'Maria Fernanda Costa',
    dataNascimento: '1985-04-12',
    cpf: '123.456.789-00',
    sexo: 'feminino',
    convenio: 'Unimed',
    numeroConvenio: '12345678',
    contato: { telefone: '(11) 98765-4321', email: 'maria.costa@email.com' },
    endereco: { cep: '01001-000', logradouro: 'Rua Direita', numero: '123', bairro: 'Sé', cidade: 'São Paulo', estado: 'SP' },
    ativo: true,
    criadoEm: '2025-10-15',
    totalConsultas: 5,
    ultimaConsulta: '2026-03-10',
    alergias: ['Penicilina'],
    medicamentosEmUso: 'Glifage XR 500mg',
    historicoMedico: 'Pré-diabética',
    habitos: { fumante: false, etilista: false, atividadeFisica: 'regular' }
  },
  {
    id: 'pac-002',
    nome: 'João Paulo Alves',
    dataNascimento: '1990-07-23',
    cpf: '234.567.890-11',
    sexo: 'masculino',
    convenio: 'Bradesco Saúde',
    contato: { telefone: '(11) 91234-5678' },
    endereco: { cep: '01234-567', logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
    ativo: true,
    criadoEm: '2025-11-20',
    totalConsultas: 3,
    ultimaConsulta: '2026-03-05'
  },
  {
    id: 'pac-003',
    nome: 'Beatriz Oliveira',
    dataNascimento: '1978-11-05',
    cpf: '345.678.901-22',
    sexo: 'feminino',
    convenio: 'Particular',
    contato: { telefone: '(11) 97654-3210' },
    endereco: { cep: '03456-789', logradouro: 'Rua das Flores', numero: '45', bairro: 'Moema', cidade: 'São Paulo', estado: 'SP' },
    ativo: true,
    criadoEm: '2025-05-10',
    totalConsultas: 8,
    ultimaConsulta: '2026-02-15'
  },
  {
    id: 'pac-004',
    nome: 'Carlos Eduardo Lima',
    dataNascimento: '1982-03-17',
    cpf: '456.789.012-33',
    sexo: 'masculino',
    convenio: 'Unimed',
    contato: { telefone: '(11) 93456-7890' },
    endereco: { cep: '04567-890', logradouro: 'Rua Amarela', numero: '88', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP' },
    ativo: true,
    criadoEm: '2025-12-05',
    totalConsultas: 1,
    ultimaConsulta: '2026-01-20'
  },
  {
    id: 'pac-005',
    nome: 'Fernanda Rodrigues',
    dataNascimento: '1995-06-30',
    cpf: '567.890.123-44',
    sexo: 'feminino',
    convenio: 'Bradesco Saúde',
    contato: { telefone: '(11) 95555-9999' },
    endereco: { cep: '02345-678', logradouro: 'Av. Brasil', numero: '500', bairro: 'Ipanema', cidade: 'Rio de Janeiro', estado: 'RJ' },
    ativo: true,
    criadoEm: '2026-01-10',
    totalConsultas: 4,
    ultimaConsulta: '2026-03-15'
  },
  { id: 'pac-006', nome: 'Luciana Martins', dataNascimento: '1998-02-14', cpf: '678.901.234-55', sexo: 'feminino', convenio: 'Particular', contato: { telefone: '(11) 94444-8888' }, endereco: { cep: '01010-010', logradouro: 'Av. Central', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-02-01', totalConsultas: 0 },
  { id: 'pac-007', nome: 'Roberto Nascimento', dataNascimento: '1975-09-08', cpf: '789.012.345-66', sexo: 'masculino', convenio: 'Unimed', contato: { telefone: '(11) 93333-7777' }, endereco: { cep: '02020-020', logradouro: 'Rua dos Pinheiros', numero: '55', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-08-15', totalConsultas: 12 },
  { id: 'pac-008', nome: 'Patrícia Santos', dataNascimento: '1988-12-01', cpf: '890.123.456-77', sexo: 'feminino', convenio: 'Bradesco Saúde', contato: { telefone: '(11) 92222-6666' }, endereco: { cep: '03030-030', logradouro: 'Av. Paulista', numero: '2000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-09-10', totalConsultas: 5 },
  { id: 'pac-009', nome: 'André Souza', dataNascimento: '1993-05-25', cpf: '901.234.567-88', sexo: 'masculino', convenio: 'Particular', contato: { telefone: '(11) 91111-5555' }, endereco: { cep: '04040-040', logradouro: 'Rua das Palmeiras', numero: '12', bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-01-20', totalConsultas: 2 },
  { id: 'pac-010', nome: 'Tatiane Ferreira', dataNascimento: '2000-08-19', cpf: '012.345.678-99', sexo: 'feminino', convenio: 'Unimed', contato: { telefone: '(11) 96666-1111' }, endereco: { cep: '05050-050', logradouro: 'Rua Augusta', numero: '900', bairro: 'Consolação', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-02-15', totalConsultas: 1 },
  { id: 'pac-011', nome: 'Bruno Cavalcanti', dataNascimento: '1980-01-30', cpf: '123.123.123-12', sexo: 'masculino', convenio: 'Bradesco Saúde', contato: { telefone: '(11) 97777-2222' }, endereco: { cep: '06060-060', logradouro: 'Rua Oscar Freire', numero: '400', bairro: 'Cerqueira César', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-07-01', totalConsultas: 3 },
  { id: 'pac-012', nome: 'Isabela Carvalho', dataNascimento: '1992-11-14', cpf: '234.234.234-23', sexo: 'feminino', convenio: 'Particular', contato: { telefone: '(11) 98888-3333' }, endereco: { cep: '07070-070', logradouro: 'Av. Faria Lima', numero: '3000', bairro: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-10-10', totalConsultas: 4 },
  { id: 'pac-013', nome: 'Diego Pereira', dataNascimento: '1987-04-03', cpf: '345.345.345-34', sexo: 'masculino', convenio: 'Unimed', contato: { telefone: '(11) 99999-4444' }, endereco: { cep: '08080-080', logradouro: 'Rua Teodoro Sampaio', numero: '800', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-11-12', totalConsultas: 2 },
  { id: 'pac-014', nome: 'Camila Nogueira', dataNascimento: '1996-07-22', cpf: '456.456.456-45', sexo: 'feminino', convenio: 'Bradesco Saúde', contato: { telefone: '(11) 90000-5555' }, endereco: { cep: '09090-090', logradouro: 'Rua Domingos de Morais', numero: '200', bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-01-05', totalConsultas: 4 },
  { id: 'pac-015', nome: 'Thiago Barros', dataNascimento: '1983-10-11', cpf: '567.567.567-56', sexo: 'masculino', convenio: 'Particular', contato: { telefone: '(11) 98901-2345' }, endereco: { cep: '10101-101', logradouro: 'Av. Brigadeiro Luis Antonio', numero: '4500', bairro: 'Jardim Paulista', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-12-15', totalConsultas: 1 },
  { id: 'pac-016', nome: 'Juliana Silva', dataNascimento: '1989-12-05', cpf: '678.678.678-67', sexo: 'feminino', convenio: 'Unimed', contato: { telefone: '(11) 97777-1111' }, endereco: { cep: '01234-567', logradouro: 'Rua Manuel da Nóbrega', numero: '100', bairro: 'Paraíso', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-01-20', totalConsultas: 0 },
  { id: 'pac-017', nome: 'Felipe Mendes', dataNascimento: '1977-03-25', cpf: '789.789.789-78', sexo: 'masculino', convenio: 'Bradesco Saúde', contato: { telefone: '(11) 96666-2222' }, endereco: { cep: '03456-789', logradouro: 'Alameda Campinas', numero: '700', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-11-05', totalConsultas: 3 },
  { id: 'pac-018', nome: 'Amanda Castro', dataNascimento: '1994-08-14', cpf: '890.890.890-89', sexo: 'feminino', convenio: 'Particular', contato: { telefone: '(11) 95555-3333' }, endereco: { cep: '04567-890', logradouro: 'Alameda Santos', numero: '1500', bairro: 'Cerqueira César', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-02-10', totalConsultas: 1 },
  { id: 'pac-019', nome: 'Renato Lima', dataNascimento: '1981-11-02', cpf: '901.901.901-90', sexo: 'masculino', convenio: 'Unimed', contato: { telefone: '(11) 94444-4444' }, endereco: { cep: '02345-678', logradouro: 'Rua Pamplona', numero: '1200', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2025-09-25', totalConsultas: 4 },
  { id: 'pac-020', nome: 'Carla Dias', dataNascimento: '1997-01-18', cpf: '012.012.012-01', sexo: 'feminino', convenio: 'Bradesco Saúde', contato: { telefone: '(11) 93333-5555' }, endereco: { cep: '05050-050', logradouro: 'Av. Rebouças', numero: '2500', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP' }, ativo: true, criadoEm: '2026-03-01', totalConsultas: 1 },
]

export const PATIENT_APPOINTMENTS_MOCK: Record<string, Appointment[]> = {
  'pac-001': [
    { id: 'apt-001', pacienteId: 'pac-001', pacienteNome: 'Maria Fernanda Costa', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2026-03-10', horaInicio: '08:00', horaFim: '08:40', procedimento: 'consulta', status: 'concluido', criadoEm: '2026-03-01', atualizadoEm: '2026-03-10' },
    { id: 'apt-002', pacienteId: 'pac-001', pacienteNome: 'Maria Fernanda Costa', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2026-02-15', horaInicio: '09:00', horaFim: '09:40', procedimento: 'retorno', status: 'concluido', criadoEm: '2026-02-01', atualizadoEm: '2026-02-15' },
    { id: 'apt-003', pacienteId: 'pac-001', pacienteNome: 'Maria Fernanda Costa', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2026-01-20', horaInicio: '10:00', horaFim: '10:40', procedimento: 'consulta', status: 'concluido', criadoEm: '2026-01-05', atualizadoEm: '2026-01-20' }
  ],
  'pac-002': [
    { id: 'apt-004', pacienteId: 'pac-002', pacienteNome: 'João Paulo Alves', profissionalId: 'pro-002', profissionalNome: 'Dr. Carlos Melo', data: '2026-03-05', horaInicio: '10:00', horaFim: '11:00', procedimento: 'limpeza', status: 'concluido', criadoEm: '2026-02-20', atualizadoEm: '2026-03-05' },
    { id: 'apt-005', pacienteId: 'pac-002', pacienteNome: 'João Paulo Alves', profissionalId: 'pro-002', profissionalNome: 'Dr. Carlos Melo', data: '2026-01-15', horaInicio: '14:00', horaFim: '15:00', procedimento: 'consulta', status: 'concluido', criadoEm: '2025-12-30', atualizadoEm: '2026-01-15' }
  ],
  'pac-003': [
    { id: 'apt-006', pacienteId: 'pac-003', pacienteNome: 'Beatriz Oliveira', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2026-02-15', horaInicio: '14:00', horaFim: '14:30', procedimento: 'retorno', status: 'concluido', criadoEm: '2026-02-10', atualizadoEm: '2026-02-15' },
    { id: 'apt-007', pacienteId: 'pac-003', pacienteNome: 'Beatriz Oliveira', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2026-01-10', horaInicio: '11:00', horaFim: '11:30', procedimento: 'consulta', status: 'concluido', criadoEm: '2025-12-25', atualizadoEm: '2026-01-10' },
    { id: 'apt-008', pacienteId: 'pac-003', pacienteNome: 'Beatriz Oliveira', profissionalId: 'pro-001', profissionalNome: 'Dra. Ana Lima', data: '2025-12-05', horaInicio: '15:00', horaFim: '15:30', procedimento: 'consulta', status: 'concluido', criadoEm: '2025-11-20', atualizadoEm: '2025-12-05' }
  ]
}

export const PATIENT_DOCUMENTS_MOCK: Record<string, PatientDocument[]> = {
  'pac-001': [
    { id: 'doc-001', pacienteId: 'pac-001', nome: 'Exame de Sangue - Glicemia', tipo: 'pdf', url: 'https://example.com/exame1.pdf', dataUpload: '2026-03-10', tamanho: '1.2 MB' },
    { id: 'doc-002', pacienteId: 'pac-001', nome: 'Hemograma Completo', tipo: 'pdf', url: 'https://example.com/exame2.pdf', dataUpload: '2025-12-15', tamanho: '950 KB' }
  ]
}

export const PATIENT_FINANCIAL_MOCK: Record<string, PatientFinancial[]> = {
  'pac-001': [
    { id: 'fin-001', pacienteId: 'pac-001', tipo: 'pagamento', valor: 280, data: '2026-03-10', descricao: 'Consulta Clínica Geral', status: 'concluido' },
    { id: 'fin-002', pacienteId: 'pac-001', tipo: 'orcamento', valor: 950, data: '2026-03-12', descricao: 'Tratamento Estético', status: 'pendente' }
  ]
}
