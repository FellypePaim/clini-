import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  LogOut,
  ChevronRight,
  User,
  Settings,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Briefcase,
  DollarSign,
  Package,
  ClipboardList,
  BarChart3,
  Menu,
  UserPlus,
  CalendarClock,
  PackageX,
  X,
} from 'lucide-react'
import { useAuthStore, usePermissions } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

// ─── Mapa de rota → breadcrumb ────────────────────────
const ROUTE_INFO: Record<string, { label: string; icon: React.ElementType }> = {
  '/dashboard':     { label: 'Dashboard',    icon: LayoutDashboard },
  '/agenda':        { label: 'Agenda',        icon: Calendar         },
  '/pacientes':     { label: 'Pacientes',     icon: Users            },
  '/prontuario':    { label: 'Prontuário',    icon: FileText         },
  '/ovyva':         { label: 'OVYVA',         icon: MessageSquare    },
  '/verdesk':       { label: 'Verdesk CRM',   icon: Briefcase        },
  '/financeiro':    { label: 'Financeiro',    icon: DollarSign       },
  '/estoque':       { label: 'Estoque',       icon: Package          },
  '/prescricoes':   { label: 'Prescrições',   icon: ClipboardList    },
  '/relatorios':    { label: 'Relatórios',    icon: BarChart3        },
  '/configuracoes': { label: 'Configurações', icon: Settings         },
}

const ROLE_LABELS = {
  administrador: 'Administrador',
  profissional:  'Profissional',
  recepção:      'Recepção',
  superadmin:    'SuperAdmin',
}

interface SystemAlert {
  id: string
  type: 'lead' | 'consulta_pendente' | 'estoque_baixo' | 'consulta_hoje'
  title: string
  description: string
  icon: React.ElementType
  color: string
  link: string
  time?: string
}

interface HeaderProps {
  sidebarWidth?: number
  onMenuClick?: () => void
}

export function Header({ sidebarWidth: _sidebarWidth, onMenuClick }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { canManageStock, canViewFinancial, isAdmin } = usePermissions()
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [alerts, setAlerts] = React.useState<SystemAlert[]>([])
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pv-dismissed-alerts')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  // ── Carregar alertas de sistema ───────────────────────
  React.useEffect(() => {
    if (!user?.clinicaId) return

    const loadAlerts = async () => {
      const newAlerts: SystemAlert[] = []
      const clinicaId = user.clinicaId

      try {
        // Buscar config de notificações da clínica
        const { data: clinica } = await supabase
          .from('clinicas')
          .select('configuracoes')
          .eq('id', clinicaId)
          .single()

        const config = (clinica?.configuracoes as any)?.notificacoes ?? {}

        const hoje = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`

        // 1. Consultas agendadas hoje (sempre ativo)
        const { count: consultasHoje } = await supabase
          .from('consultas')
          .select('*', { count: 'exact', head: true })
          .eq('clinica_id', clinicaId)
          .eq('status', 'agendado')
          .gte('data_hora_inicio', `${hojeStr}T00:00:00`)
          .lt('data_hora_inicio', `${hojeStr}T23:59:59`)

        if (consultasHoje && consultasHoje > 0) {
          newAlerts.push({
            id: 'consultas_hoje',
            type: 'consulta_hoje',
            title: `${consultasHoje} consulta${consultasHoje > 1 ? 's' : ''} hoje`,
            description: 'Agendadas para hoje, aguardando atendimento',
            icon: Calendar,
            color: 'text-blue-600 bg-blue-50',
            link: '/agenda',
          })
        }

        // 2. Pré-agendamentos OVYVA (status agendado + observações com marcador)
        if (config.sistema_consulta_pendente !== false) {
          const { data: pendentes } = await supabase
            .from('consultas')
            .select('id, data_hora_inicio, observacoes')
            .eq('clinica_id', clinicaId)
            .eq('status', 'agendado')
            .ilike('observacoes', '%PRÉ-AGENDAMENTO OVYVA%')

          const pendenteCount = pendentes?.length ?? 0
          if (pendenteCount > 0) {
            newAlerts.push({
              id: 'consultas_pendentes',
              type: 'consulta_pendente',
              title: `${pendenteCount} pré-agendamento${pendenteCount > 1 ? 's' : ''}`,
              description: 'Criados pela OVYVA, aguardando aprovação',
              icon: CalendarClock,
              color: 'text-amber-600 bg-amber-50',
              link: '/agenda',
              time: pendentes?.[0]?.data_hora_inicio ? new Date(pendentes[0].data_hora_inicio).toLocaleDateString() : undefined,
            })
          }
        }

        // 3. Novos leads (últimas 24h)
        if (config.sistema_novo_lead !== false) {
          const ontem = new Date(Date.now() - 86400000).toISOString()
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('clinica_id', clinicaId)
            .gte('created_at', ontem)

          if (leadsCount && leadsCount > 0) {
            newAlerts.push({
              id: 'novos_leads',
              type: 'lead',
              title: `${leadsCount} novo${leadsCount > 1 ? 's' : ''} lead${leadsCount > 1 ? 's' : ''}`,
              description: 'Contatos recebidos nas últimas 24h',
              icon: UserPlus,
              color: 'text-green-600 bg-green-50',
              link: '/verdesk',
            })
          }
        }

        // 4. Estoque abaixo do mínimo (somente se user tem acesso a estoque)
        if (config.sistema_estoque_baixo !== false && canManageStock) {
          const { data: produtosBaixos } = await supabase
            .from('produtos_estoque')
            .select('id, nome, estoque_atual, estoque_minimo')
            .eq('clinica_id', clinicaId)

          const criticos = (produtosBaixos ?? []).filter(
            (p: any) => (p.estoque_atual ?? 0) < (p.estoque_minimo ?? 0)
          )

          if (criticos.length > 0) {
            const zerados = criticos.filter((p: any) => (p.estoque_atual ?? 0) === 0).length
            newAlerts.push({
              id: 'estoque_baixo',
              type: 'estoque_baixo',
              title: `${criticos.length} produto${criticos.length > 1 ? 's' : ''} em estoque crítico`,
              description: zerados > 0 ? `${zerados} zerado${zerados > 1 ? 's' : ''}` : 'Abaixo do mínimo configurado',
              icon: PackageX,
              color: 'text-red-600 bg-red-50',
              link: '/estoque/alertas',
            })
          }
        }

        setAlerts(newAlerts)
      } catch { /* silently ignore */ }
    }

    loadAlerts()
    // Recarregar a cada 2 min
    const interval = setInterval(loadAlerts, 120000)
    return () => clearInterval(interval)
  }, [user?.clinicaId])

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))
  const alertCount = visibleAlerts.length

  const dismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev).add(id)
      try { localStorage.setItem('pv-dismissed-alerts', JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const currentRoute = Object.entries(ROUTE_INFO).find(([path]) =>
    location.pathname.startsWith(path)
  )
  const routeInfo = currentRoute?.[1]

  const initials = user?.nome
    ? user.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-[240px] h-16 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 z-20 transition-all duration-200"
    >
      <div className="flex items-center gap-2 text-sm flex-1">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="text-gray-400 hidden sm:inline">{user?.clinicaNome || 'Clínica'}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
        {routeInfo && (
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <routeInfo.icon className="w-4 h-4 text-green-600" />
            <span className="truncate max-w-[120px] sm:max-w-none">{routeInfo.label}</span>
          </div>
        )}
      </div>

      {/* ── Ações do header ───────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Busca rápida */}
        <button
          id="header-search"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200
                     text-gray-500 text-sm hover:border-green-300 hover:text-green-700
                     transition-all duration-150 hidden sm:flex"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs text-gray-400">Buscar...</span>
          <kbd className="text-[10px] text-gray-300 border border-gray-200 rounded px-1">⌘K</kbd>
        </button>

        {/* Notificações */}
        <div className="relative">
          <button
            id="header-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg
                       hover:bg-gray-100 transition-colors text-gray-500"
          >
            <Bell className="w-[18px] h-[18px]" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
                {alertCount}
              </span>
            )}
          </button>

          {/* Dropdown de alertas */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-xl z-50 shadow-xl shadow-gray-200/50 animate-fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Alertas do Sistema</h3>
                  {alertCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                      {alertCount}
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {visibleAlerts.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">Nenhum alerta no momento</p>
                      <p className="text-xs text-gray-300 mt-1">Tudo está funcionando normalmente</p>
                    </div>
                  ) : (
                    visibleAlerts.map(alert => (
                      <div key={alert.id}
                        className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex items-start gap-3 group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.color}`}>
                          <alert.icon className="w-4 h-4" />
                        </div>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => { navigate(alert.link); setShowNotifications(false) }}
                        >
                          <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{alert.description}</p>
                        </div>
                        <button
                          onClick={() => dismiss(alert.id)}
                          className="p-1 text-gray-300 hover:text-gray-500 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          title="Dispensar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {isAdmin && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={() => { navigate('/configuracoes/notificacoes'); setShowNotifications(false) }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Configurar notificações
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar + menu do usuário */}
        <div className="relative ml-1">
          <button
            id="header-user-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
                       hover:bg-gray-50 transition-colors cursor-pointer border border-transparent
                       hover:border-gray-200"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none truncate max-w-[120px]">
                {user?.nome.split(' ')[0] + ' ' + user?.nome.split(' ').slice(-1)[0]}
              </p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                {user?.role ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-xl py-1 z-50 shadow-lg shadow-gray-100/50 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user?.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/configuracoes') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600
                                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/configuracoes') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600
                                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Configurações
                      </button>
                    </>
                  )}
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    id="header-logout"
                    onClick={async () => { await logout(); navigate('/login') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                               hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
