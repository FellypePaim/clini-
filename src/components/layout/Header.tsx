import React from 'react'
import { useLocation } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

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

interface HeaderProps {
  sidebarWidth: number
}

export function Header({ sidebarWidth }: HeaderProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [notifications] = React.useState(3)

  const currentRoute = Object.entries(ROUTE_INFO).find(([path]) =>
    location.pathname.startsWith(path)
  )
  const routeInfo = currentRoute?.[1]

  const initials = user?.nome
    ? user.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center px-6 z-20 transition-all duration-200"
      style={{ left: sidebarWidth }}
    >
      {/* ── Breadcrumb ────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm flex-1">
        <span className="text-gray-400">Clínica Verde</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        {routeInfo && (
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <routeInfo.icon className="w-4 h-4 text-green-600" />
            {routeInfo.label}
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
        <button
          id="header-notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg 
                     hover:bg-gray-100 transition-colors text-gray-500"
        >
          <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full animate-pulse-green" />
          )}
        </button>

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
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 
                               hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 
                               hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    id="header-logout"
                    onClick={logout}
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
