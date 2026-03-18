import { Phone, ChevronRight } from 'lucide-react'
import { mockPacientesRecentes } from '../../data/mockData'

export function PacientesRecentes() {
  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Pacientes Recentes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Últimas consultas registradas</p>
        </div>
        <button className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors">
          Ver todos <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {mockPacientesRecentes.map((pac, idx) => {
          const initials = pac.nome!
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()

          const bgColors = [
            'bg-green-100 text-green-700',
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-orange-100 text-orange-700',
          ]

          return (
            <div
              key={pac.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${bgColors[idx % bgColors.length]}`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{pac.nome}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-gray-300" />
                  <p className="text-xs text-gray-400">{pac.contato?.telefone}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-gray-700">
                  {pac.totalConsultas} consulta{pac.totalConsultas !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {pac.ultimaConsulta
                    ? new Date(pac.ultimaConsulta + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    : '-'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
