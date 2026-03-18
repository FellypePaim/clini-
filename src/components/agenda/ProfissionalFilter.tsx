import { PROFISSIONAIS } from '../../data/agendaMockData'
import { cn } from '../../lib/utils'

interface ProfissionalFilterProps {
  selected: string
  onChange: (id: string) => void
}

export function ProfissionalFilter({ selected, onChange }: ProfissionalFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange('todos')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
          selected === 'todos'
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
        )}
      >
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Todos
      </button>

      {PROFISSIONAIS.map((prof) => (
        <button
          key={prof.id}
          onClick={() => onChange(prof.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
            selected === prof.id
              ? 'text-white border-transparent'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          )}
          style={selected === prof.id ? { background: prof.cor, borderColor: prof.cor } : {}}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: prof.cor }}
          />
          {prof.nome}
          <span className={cn(
            'text-[10px] font-normal',
            selected === prof.id ? 'text-white/70' : 'text-gray-400'
          )}>
            {prof.especialidade}
          </span>
        </button>
      ))}
    </div>
  )
}
