import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal, User } from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 10

export function PacientesPage() {
  const navigate = useNavigate()
  const { patients } = usePatients()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterConvenio, setFilterConvenio] = useState<'todos' | 'Unimed' | 'Bradesco Saúde' | 'Particular'>('todos')

  // ── Filtragem dos dados ──────────────────────────────
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || 
                          p.cpf.includes(search) || 
                          p.contato.telefone.includes(search)
      
      const matchConvenio = filterConvenio === 'todos' || p.convenio === filterConvenio
      
      return matchSearch && matchConvenio
    })
  }, [patients, search, filterConvenio])

  // ── Paginação ─────────────────────────────────────────
  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handlePatientClick = (id: string) => {
    navigate(`/pacientes/${id}`)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">Gestão e prontuário completo dos seus pacientes</p>
        </div>
        <button className="btn-primary" onClick={() => {/* TODO: Modal Novo Paciente */}}>
          <Plus className="w-5 h-5" /> Novo Paciente
        </button>
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
            {(['todos', 'Unimed', 'Bradesco Saúde', 'Particular'] as const).map(c => (
              <button
                key={c}
                onClick={() => { setFilterConvenio(c); setCurrentPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 capitalize',
                  filterConvenio === c ? 'bg-white text-green-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {c}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 tracking-wider">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">CPF / Nascimento</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Convênio</th>
                <th className="px-6 py-4">Última Consulta</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map(p => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                    onClick={() => handlePatientClick(p.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nome={p.nome} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{p.nome}</p>
                          <p className="text-[11px] text-gray-400">Desde {new Date(p.criadoEm).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-700">{p.cpf}</p>
                        <p className="text-gray-400 text-xs">{new Date(p.dataNascimento).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-700">{p.contato.telefone}</p>
                        <p className="text-gray-400 text-xs font-medium">{p.contato.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={p.convenio === 'Particular' ? 'gray' : 'green'}
                        className={cn(
                          p.convenio === 'Unimed' && 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
                          p.convenio === 'Bradesco Saúde' && 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                        )}
                      >
                        {p.convenio}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {p.ultimaConsulta ? (
                          <div className="flex flex-col">
                            <span>{new Date(p.ultimaConsulta).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Há {Math.floor((new Date().getTime() - new Date(p.ultimaConsulta).getTime()) / (1000 * 3600 * 24))} dias</span>
                          </div>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 text-gray-200" />
                      <p className="text-gray-500 font-medium">Nenhum paciente encontrado com esses termos.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <p>Mostrando <b>{(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filteredPatients.length)}</b> de <b>{filteredPatients.length}</b> pacientes</p>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors border-r border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-4 font-semibold text-gray-900">
                Página {currentPage} de {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors border-l border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
