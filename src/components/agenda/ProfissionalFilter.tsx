import { cn } from '../../lib/utils'

interface Profissional {
  id: string
  nome: string
  especialidade: string
  cor: string
}

interface ProfissionalFilterProps {
  selected: string
  onChange: (id: string) => void
  profissionais: Profissional[]
}

export function ProfissionalFilter({ selected, onChange, profissionais }: ProfissionalFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange('todos')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
          selected === 'todos'
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-gray-300 hover:text-[var(--color-text-primary)]'
        )}
      >
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Todos
      </button>

      {profissionais.map((prof) => (
        <button
          key={prof.id}
          onClick={() => onChange(prof.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
            selected === prof.id
              ? 'text-white border-transparent'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-gray-300'
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
            selected === prof.id ? 'text-white/70' : 'text-[var(--color-text-muted)]'
          )}>
            {prof.especialidade}
          </span>
        </button>
      ))}
    </div>
  )
}
