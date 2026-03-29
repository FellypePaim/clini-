import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermissions } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import {
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
  Stethoscope,
  ChevronRight,
  Activity,
  Database,
  Sun,
  Moon
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  collapsed?: boolean
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  path: string
  label: string
  icon: any
  group: string
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard, group: 'principal', roles: ['administrador', 'profissional', 'recepção'] },
  { path: '/agenda',       label: 'Agenda',       icon: Calendar,        group: 'principal', roles: ['administrador', 'profissional', 'recepção'] },
  { path: '/pacientes',    label: 'Pacientes / PEP',    icon: Users,           group: 'principal', roles: ['administrador', 'profissional', 'recepção'] },
  { path: '/lyra',        label: 'LYRA',        icon: MessageSquare,   group: 'principal', roles: ['administrador', 'profissional', 'recepção'] },
  { path: '/nexus',      label: 'Nexus CRM',  icon: Briefcase,       group: 'gestao',    roles: ['administrador', 'profissional', 'recepção'] },
  { path: '/financeiro',   label: 'Financeiro',   icon: DollarSign,      group: 'gestao',    roles: ['administrador', 'profissional'] },
  { path: '/estoque',      label: 'Estoque',      icon: Package,         group: 'gestao',    roles: ['administrador', 'profissional'] },
  { path: '/prescricoes',  label: 'Prescrições',  icon: ClipboardList,   group: 'gestao',    roles: ['administrador', 'profissional'] },
  { path: '/relatorios',   label: 'Relatórios',   icon: BarChart3,       group: 'gestao',    roles: ['administrador', 'profissional'] },
  { path: '/configuracoes',label: 'Configurações', icon: Settings,       group: 'sistema',   roles: ['administrador'] },
]

export function Sidebar({ collapsed = false, isOpen = false, onClose }: SidebarProps) {
  const location = useLocation()
  const { role } = usePermissions()
  const { theme, toggleTheme } = useThemeStore()

  const groups = [
    { key: 'principal', label: 'Principal' },
    { key: 'gestao',    label: 'Gestão'    },
    { key: 'sistema',   label: 'Sistema'   },
  ]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen border-r border-[var(--color-border)] flex flex-col z-30 transition-transform duration-300 md:translate-x-0 w-60',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed && 'md:w-16 w-60' // If we ever use collapsed again
      )}
      style={{
        background: 'var(--color-bg-sidebar)',
        boxShadow: theme === 'dark' ? 'none' : '1px 0 8px rgba(0,0,0,0.03)',
      }}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-[var(--color-border)] shrink-0',
        collapsed ? 'h-16 justify-center px-0' : 'h-16 gap-3 px-5'
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-indigo-500 rounded-lg flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-none">
            <div className="text-sm font-bold text-[var(--color-text-primary)]">Prontuário</div>
            <div className="text-sm font-light text-cyan-500">Verde</div>
          </div>
        )}
      </div>

      {/* ── Navegação ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map(({ key, label }) => {
          const items = NAV_ITEMS.filter((i) => i.group === key && (!role || i.roles.includes(role)))
          if (items.length === 0) return null

          return (
            <div key={key}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-2">
                  {label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map(({ path, label: itemLabel, icon: Icon }) => {
                  const isActive = location.pathname.startsWith(path)
                  return (
                    <li key={path}>
                      <NavLink
                        to={path}
                        title={collapsed ? itemLabel : undefined}
                        onClick={onClose}
                        className={cn(
                          'sidebar-item',
                          collapsed && 'justify-center px-0 py-2.5',
                          isActive && 'active'
                        )}
                      >
                        <Icon
                          className={cn(
                            'shrink-0 transition-colors',
                            collapsed ? 'w-5 h-5' : 'w-4 h-4',
                            isActive ? 'text-cyan-500' : 'text-[var(--color-text-muted)]'
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{itemLabel}</span>
                        )}
                        {!collapsed && isActive && (
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* ── Rodapé versão e Diagnóstico DEV ───────────── */}
      {!collapsed && (
        <div className="px-5 py-3 border-t border-[var(--color-border)] flex flex-col items-center gap-2">
          {import.meta.env.DEV && (
            <>
              <NavLink
                to="/dev/diagnostico"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold w-full justify-center transition-colors",
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-[var(--color-text-muted)] hover:text-indigo-500 hover:bg-[var(--color-bg-card)]"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                Diagnóstico DEV
              </NavLink>
              <NavLink
                to="/dev/storage-diagnostico"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold w-full justify-center transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-[var(--color-bg-card)]"
                )}
              >
                <Database className="w-3.5 h-3.5" />
                Storage
              </NavLink>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors mb-2 hover:opacity-80"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>
          <p className="text-[10px] text-[var(--color-text-dim)] text-center w-full">
            v2.1.0 · Prontuário Verde
          </p>
        </div>
      )}
    </aside>
  )
}
