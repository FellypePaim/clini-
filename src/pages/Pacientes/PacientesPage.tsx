import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, User, X, Upload, Loader2, FileText, CheckCircle, Users, UserPlus, CalendarClock, Phone, MessageCircle, Calendar } from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import type { Patient, Sexo } from '../../types'

const PAGE_SIZE = 10

interface NovoPatienteForm {
  nome: string
  dataNascimento: string
  cpf: string
  sexo: Sexo
  telefone: string
  email: string
  convenio: string
}

const formVazio: NovoPatienteForm = {
  nome: '',
  dataNascimento: '',
  cpf: '',
  sexo: 'outro',
  telefone: '',
  email: '',
  convenio: '',
}

// ── Helpers ──────────────────────────────────────────────
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return phone
}

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  return cpf
}

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr + 'T00:00')
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function PacientesPage() {
  const navigate = useNavigate()
  const { patients, getPatients, createPatient, isLoading } = usePatients()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterConvenio, setFilterConvenio] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const [form, setForm] = useState<NovoPatienteForm>(formVazio)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getPatients()
  }, [getPatients])

  // ── KPIs ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = patients.length
    const thisMonth = patients.filter(p => isThisMonth(p.criadoEm)).length
    const withAppointment = patients.filter(p => p.ultimaConsulta).length
    const withoutReturn = patients.filter(p => {
      if (!p.ultimaConsulta) return false
      const days = Math.floor((Date.now() - new Date(p.ultimaConsulta).getTime()) / (1000 * 3600 * 24))
      return days > 90
    }).length
    return { total, thisMonth, withAppointment, withoutReturn }
  }, [patients])

  // ── Filtragem ──────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        p.nome.toLowerCase().includes(q) ||
        p.cpf?.includes(search) ||
        p.contato?.telefone?.includes(search)
      const matchConvenio = filterConvenio === 'todos' || p.convenio === filterConvenio
      return matchSearch && matchConvenio
    })
  }, [patients, search, filterConvenio])

  // ── Convênios únicos ───────────────────────────────────
  const convenios = useMemo(() => {
    return Array.from(new Set(patients.map(p => p.convenio).filter(Boolean)))
  }, [patients])

  // ── Paginação ──────────────────────────────────────────
  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handlePatientClick = (id: string) => {
    navigate(`/pacientes/${id}`)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    const novo = await createPatient({
      nome: form.nome,
      dataNascimento: form.dataNascimento,
      cpf: form.cpf,
      sexo: form.sexo,
      contato: { telefone: form.telefone, email: form.email },
      convenio: form.convenio,
      endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
      totalConsultas: 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
    } as Partial<Patient>)
    setSaving(false)
    if (novo) {
      setShowModal(false)
      setForm(formVazio)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
            {search && ` encontrado${filteredPatients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" /> Novo Paciente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpis.total}</p>
              <p className="text-xs text-gray-500">Total de pacientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpis.thisMonth}</p>
              <p className="text-xs text-gray-500">Novos este mês</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpis.withAppointment}</p>
              <p className="text-xs text-gray-500">Com consultas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpis.withoutReturn}</p>
              <p className="text-xs text-gray-500">Sem retorno (+90d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            className="input-base pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
            {['todos', ...convenios].map(c => (
              <button
                key={c}
                onClick={() => { setFilterConvenio(c); setCurrentPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 capitalize',
                  filterConvenio === c ? 'bg-white text-green-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {c === 'todos' ? 'Todos' : c}
              </button>
            ))}
          </div>
          <button className="btn-secondary text-xs px-3 py-1.5">
            <Filter className="w-4 h-4" /> Mais Filtros
          </button>
        </div>
      </div>

      {/* Tabela de pacientes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading && patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Carregando pacientes...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 tracking-wider">
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Contato</th>
                <th className="px-5 py-3">Convênio</th>
                <th className="px-5 py-3">Última Consulta</th>
                <th className="px-5 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map(p => {
                  const age = calcAge(p.dataNascimento)
                  const phone = p.contato?.telefone
                  const lastDays = p.ultimaConsulta
                    ? Math.floor((Date.now() - new Date(p.ultimaConsulta).getTime()) / (1000 * 3600 * 24))
                    : null

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                      onClick={() => handlePatientClick(p.id)}
                    >
                      {/* Paciente — nome, idade, CPF */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar nome={p.nome} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                              {p.nome}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {age !== null ? `${age} anos` : ''}
                              {age !== null && p.cpf ? ' · ' : ''}
                              {p.cpf ? formatCPF(p.cpf) : ''}
                              {!age && !p.cpf ? `Desde ${new Date(p.criadoEm).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contato — telefone formatado + email */}
                      <td className="px-5 py-3.5">
                        <div className="text-sm">
                          {phone ? (
                            <p className="text-gray-700 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {formatPhone(phone)}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs">Sem telefone</p>
                          )}
                          {p.contato?.email && (
                            <p className="text-gray-400 text-xs truncate max-w-[200px]">{p.contato.email}</p>
                          )}
                        </div>
                      </td>

                      {/* Convênio */}
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={p.convenio === 'Particular' || !p.convenio ? 'gray' : 'green'}
                          className={cn(
                            p.convenio === 'Unimed' && 'bg-green-50 text-green-700 border-green-100',
                            p.convenio === 'Bradesco Saúde' && 'bg-blue-50 text-blue-700 border-blue-100'
                          )}
                        >
                          {p.convenio || 'Particular'}
                        </Badge>
                      </td>

                      {/* Última Consulta */}
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-600">
                          {p.ultimaConsulta ? (
                            <div className="flex flex-col">
                              <span>{new Date(p.ultimaConsulta).toLocaleDateString()}</span>
                              <span className={cn(
                                'text-[10px] font-medium',
                                lastDays !== null && lastDays > 90 ? 'text-amber-500' : 'text-gray-400'
                              )}>
                                Há {lastDays} dia{lastDays !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Nenhuma</span>
                          )}
                        </div>
                      </td>

                      {/* Ações rápidas */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {phone && (
                            <a
                              href={`https://wa.me/55${phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                              title="WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => navigate(`/agenda?paciente=${p.id}`)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            title="Agendar consulta"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/pacientes/${p.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                            title="Ver prontuário"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 text-gray-200" />
                      <p className="text-gray-500 font-medium">Nenhum paciente encontrado.</p>
                      <button onClick={() => setShowModal(true)} className="btn-primary mt-2 text-sm">
                        <Plus className="w-4 h-4" /> Cadastrar primeiro paciente
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Paginação — sempre visível */}
        <div className="px-5 py-3 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>
            {filteredPatients.length > 0
              ? <>Mostrando <b>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPatients.length)}</b> de <b>{filteredPatients.length}</b> paciente{filteredPatients.length !== 1 ? 's' : ''}</>
              : 'Nenhum resultado'
            }
          </p>
          {totalPages > 1 && (
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors border-r border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-4 font-semibold text-gray-900">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors border-l border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Novo Paciente ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Novo Paciente</h2>
              <button onClick={() => { setShowModal(false); setForm(formVazio); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  type="text"
                  required
                  className="input-base"
                  placeholder="Ex: Maria Silva"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
                  <input
                    type="date"
                    className="input-base"
                    value={form.dataNascimento}
                    onChange={e => setForm(f => ({ ...f, dataNascimento: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    className="input-base"
                    value={form.sexo}
                    onChange={e => setForm(f => ({ ...f, sexo: e.target.value as Sexo }))}
                  >
                    <option value="outro">Não informado</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  className="input-base"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    className="input-base"
                    placeholder="(11) 99999-9999"
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    className="input-base"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Convênio</label>
                <select
                  className="input-base"
                  value={form.convenio}
                  onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))}
                >
                  <option value="">Particular</option>
                  <option value="Unimed">Unimed</option>
                  <option value="Bradesco Saúde">Bradesco Saúde</option>
                  <option value="Amil">Amil</option>
                  <option value="SulAmérica">SulAmérica</option>
                  <option value="Porto Seguro">Porto Seguro</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(formVazio); }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.nome.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportData([]); setImportResult(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Upload className="w-4 h-4 text-green-600" /> Importar Pacientes (CSV)</h3>
              <button onClick={() => { setShowImportModal(false); setImportData([]); setImportResult(null) }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {importResult ? (
                <div className="text-center space-y-4 py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <h4 className="text-lg font-bold text-gray-900">Importação concluída!</h4>
                  <p className="text-sm text-gray-500">{importResult.success} paciente(s) importado(s){importResult.errors > 0 ? `, ${importResult.errors} erro(s)` : ''}</p>
                  <button onClick={() => { setShowImportModal(false); setImportData([]); setImportResult(null); getPatients() }} className="btn-primary">Fechar</button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                    <p className="font-semibold mb-1">Formato esperado do CSV:</p>
                    <code className="text-[10px] text-blue-600">nome,cpf,telefone,email,data_nascimento,convenio</code>
                    <p className="mt-1 text-blue-500">A primeira linha deve ser o cabeçalho. Separador: vírgula ou ponto-e-vírgula.</p>
                  </div>

                  <div>
                    <input type="file" accept=".csv,.txt" onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string
                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
                        if (lines.length < 2) return
                        const sep = lines[0].includes(';') ? ';' : ','
                        const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
                        const rows = lines.slice(1).map(line => {
                          const vals = line.split(sep).map(v => v.trim().replace(/['"]/g, ''))
                          const obj: any = {}
                          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
                          return obj
                        }).filter(r => r.nome)
                        setImportData(rows)
                      }
                      reader.readAsText(file, 'UTF-8')
                    }} className="w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
                  </div>

                  {importData.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">{importData.length} paciente(s) encontrado(s)</p>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                            <th className="py-2 px-3 text-left">Nome</th><th className="py-2 px-3">CPF</th><th className="py-2 px-3">Telefone</th>
                          </tr></thead>
                          <tbody>
                            {importData.slice(0, 10).map((r, i) => (
                              <tr key={i} className="border-b border-gray-50"><td className="py-1.5 px-3 font-medium">{r.nome}</td><td className="py-1.5 px-3 text-gray-500">{r.cpf || '—'}</td><td className="py-1.5 px-3 text-gray-500">{r.telefone || '—'}</td></tr>
                            ))}
                            {importData.length > 10 && <tr><td colSpan={3} className="py-1.5 px-3 text-gray-400 text-center">+{importData.length - 10} mais...</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!importResult && importData.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between shrink-0">
                <button onClick={() => { setImportData([]); setShowImportModal(false) }} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button disabled={importing} onClick={async () => {
                  setImporting(true)
                  let success = 0, errors = 0
                  for (const row of importData) {
                    try {
                      await createPatient({
                        nome: row.nome,
                        cpf: row.cpf || '',
                        dataNascimento: row.data_nascimento || '',
                        sexo: 'outro',
                        contato: { telefone: row.telefone || '', email: row.email || '' },
                        endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
                        convenio: row.convenio || '',
                      } as any)
                      success++
                    } catch { errors++ }
                  }
                  setImporting(false)
                  setImportResult({ success, errors })
                }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Importar {importData.length} paciente(s)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
