import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
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
  Settings,
  Stethoscope,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Definição da navegação ───────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard, group: 'principal' },
  { path: '/agenda',       label: 'Agenda',       icon: Calendar,        group: 'principal' },
  { path: '/pacientes',    label: 'Pacientes',    icon: Users,           group: 'principal' },
  { path: '/prontuario',   label: 'Prontuário',   icon: FileText,        group: 'principal' },
  { path: '/ovyva',        label: 'OVYVA',        icon: MessageSquare,   group: 'principal' },
  { path: '/verdesk',      label: 'Verdesk CRM',  icon: Briefcase,       group: 'gestao'   },
  { path: '/financeiro',   label: 'Financeiro',   icon: DollarSign,      group: 'gestao'   },
  { path: '/estoque',      label: 'Estoque',      icon: Package,         group: 'gestao'   },
  { path: '/prescricoes',  label: 'Prescrições',  icon: ClipboardList,   group: 'gestao'   },
  { path: '/relatorios',   label: 'Relatórios',   icon: BarChart3,       group: 'gestao'   },
  { path: '/configuracoes',label: 'Configurações', icon: Settings,       group: 'sistema'  },
] as const

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation()

  const groups = [
    { key: 'principal', label: 'Principal' },
    { key: 'gestao',    label: 'Gestão'    },
    { key: 'sistema',   label: 'Sistema'   },
  ]

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-30 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-gray-100 shrink-0',
        collapsed ? 'h-16 justify-center px-0' : 'h-16 gap-3 px-5'
      )}>
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-none">
            <div className="text-sm font-bold text-gray-900">Prontuário</div>
            <div className="text-sm font-light text-green-600">Verde</div>
          </div>
        )}
      </div>

      {/* ── Navegação ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map(({ key, label }) => {
          const items = NAV_ITEMS.filter((i) => i.group === key)
          return (
            <div key={key}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-2">
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
                            isActive ? 'text-green-600' : 'text-gray-400'
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{itemLabel}</span>
                        )}
                        {!collapsed && isActive && (
                          <ChevronRight className="w-3 h-3 text-green-400" />
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

      {/* ── Rodapé versão ───────────────────────────── */}
      {!collapsed && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center">
            v1.0.0 · Prontuário Verde
          </p>
        </div>
      )}
    </aside>
  )
}
