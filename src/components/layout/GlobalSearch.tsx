import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  DollarSign,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LifeBuoy,
  User,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { usePermissions } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface SearchItem {
  id: string
  label: string
  description?: string
  icon: any
  path: string
  group: string
}

const PAGES: SearchItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', group: 'Paginas', description: 'Visao geral da clinica' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda', group: 'Paginas', description: 'Consultas e agendamentos' },
  { id: 'pacientes', label: 'Pacientes / PEP', icon: Users, path: '/pacientes', group: 'Paginas', description: 'Prontuario eletronico' },
  { id: 'lyra', label: 'LYRA', icon: MessageSquare, path: '/lyra', group: 'Paginas', description: 'Assistente IA WhatsApp' },
  { id: 'nexus', label: 'Nexus CRM', icon: Briefcase, path: '/nexus', group: 'Paginas', description: 'Leads e pipeline de vendas' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro', group: 'Paginas', description: 'Lancamentos e receitas' },
  { id: 'estoque', label: 'Estoque', icon: Package, path: '/estoque', group: 'Paginas', description: 'Produtos e movimentacoes' },
  { id: 'prescricoes', label: 'Prescricoes', icon: ClipboardList, path: '/prescricoes', group: 'Paginas', description: 'Receitas e prescricoes' },
  { id: 'relatorios', label: 'Relatorios', icon: BarChart3, path: '/relatorios', group: 'Paginas', description: 'Relatorios e metricas' },
  { id: 'configuracoes', label: 'Configuracoes', icon: Settings, path: '/configuracoes', group: 'Paginas', description: 'Configuracoes da clinica' },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy, path: '/suporte', group: 'Paginas', description: 'Tickets de suporte' },
  { id: 'perfil', label: 'Meu Perfil', icon: User, path: '/perfil', group: 'Paginas', description: 'Dados pessoais e avatar' },
]

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [patients, setPatients] = useState<SearchItem[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { role } = usePermissions()

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setPatients([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search patients when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setPatients([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearchingPatients(true)
      try {
        const { data } = await supabase
          .from('pacientes')
          .select('id, nome, cpf, telefone')
          .ilike('nome', `%${query}%`)
          .limit(5)

        if (data) {
          setPatients(data.map((p) => ({
            id: `pac-${p.id}`,
            label: p.nome,
            description: p.cpf || p.telefone || undefined,
            icon: Users,
            path: `/pacientes/${p.id}`,
            group: 'Pacientes',
          })))
        }
      } catch {}
      setSearchingPatients(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  // Filter pages
  const filteredPages = useMemo(() => {
    if (!query.trim()) return PAGES
    const q = query.toLowerCase()
    return PAGES.filter((p) =>
      p.label.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q))
    )
  }, [query])

  const allResults = useMemo(() => [...filteredPages, ...patients], [filteredPages, patients])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allResults[selectedIndex]) {
        navigate(allResults[selectedIndex].path)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [allResults, selectedIndex, navigate, onClose])

  // Global Ctrl+K listener
  useEffect(() => {
    function handleGlobal(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onClose() // parent toggles
      }
    }
    // Only handle escape when open
    if (!open) return
    return undefined
  }, [open, onClose])

  if (!open) return null

  // Group results
  const groups: Record<string, SearchItem[]> = {}
  for (const item of allResults) {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push(item)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-base)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <Search size={18} className="text-[var(--color-text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar paginas, pacientes..."
            className="flex-1 bg-transparent text-[var(--color-text-primary)] text-sm outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-dim)] border border-[var(--color-border)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {allResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-muted)]">
              <Search size={32} className="mb-2 text-[var(--color-text-dim)]" />
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
          ) : (
            Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName}>
                <p className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {groupName}
                </p>
                {items.map((item) => {
                  const globalIndex = allResults.indexOf(item)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => { navigate(item.path); onClose() }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-cyan-500/10 text-cyan-500'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]',
                      )}
                    >
                      <Icon size={16} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          globalIndex === selectedIndex ? 'text-[var(--color-text-primary)]' : '',
                        )}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-[var(--color-text-muted)] truncate">{item.description}</p>
                        )}
                      </div>
                      {globalIndex === selectedIndex && (
                        <kbd className="text-[10px] text-[var(--color-text-dim)] border border-[var(--color-border)] rounded px-1.5 py-0.5">
                          Enter
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)]">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">Enter</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}
