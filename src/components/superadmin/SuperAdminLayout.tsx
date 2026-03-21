import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Hospital, 
  Users, 
  Activity, 
  DollarSign, 
  Bot, 
  Smartphone, 
  FileSearch, 
  Settings, 
  LifeBuoy, 
  Rocket,
  ShieldCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { ToastProvider } from '../ui/ToastProvider'
import { cn } from '../../lib/utils'

const SIDEBAR_WIDTH = 260

export function SuperAdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
    { icon: Hospital, label: 'Clínicas', path: '/superadmin/clinicas' },
    { icon: Users, label: 'Usuários', path: '/superadmin/usuarios' },
    { icon: Activity, label: 'Saúde Sistema', path: '/superadmin/saude' },
    { icon: DollarSign, label: 'Financeiro', path: '/superadmin/financeiro' },
    { icon: Bot, label: 'IA', path: '/superadmin/ia' },
    { icon: Smartphone, label: 'WhatsApp', path: '/superadmin/whatsapp' },
    { icon: FileSearch, label: 'Logs', path: '/superadmin/logs' },
    { icon: Settings, label: 'Configurações', path: '/superadmin/configuracoes' },
    { icon: LifeBuoy, label: 'Suporte', path: '/superadmin/suporte' },
    { icon: Rocket, label: 'Releases', path: '/superadmin/releases' },
  ]

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans flex">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-[#1E293B] border-r border-slate-800 z-50 transition-transform duration-300 shadow-2xl w-[260px] md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-[#0F172A]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tighter text-white block">PRONTUÁRIO</span>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] -mt-1 block">SuperAdmin</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-purple-400")} />
                  <span className="text-sm font-bold">{item.label}</span>
                  {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800 bg-[#0F172A]/30">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-inner">
                {user?.nome?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.nome || 'SuperAdmin'}</p>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Master Access</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header 
        className="fixed top-0 right-0 left-0 md:left-[260px] h-16 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800 z-30 transition-all duration-300"
      >
        <div className="h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ambiente:</span>
              {import.meta.env.MODE === 'production' ? (
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/20">PRODU&#199;&#195;O</span>
              ) : (
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 animate-pulse">DEV / SANDBOX</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Plataforma</span>
              <span className="text-xs font-bold text-slate-300">v2.1.0-alpha</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] font-black text-purple-400 tracking-wider">⚡ SUPERADMIN ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pt-16 md:pl-[260px] w-full max-w-full overflow-hidden">
        <div className="p-4 md:p-8 animate-fade-in max-w-[1600px] mx-auto overflow-x-auto">
          <Outlet />
        </div>
        <ToastProvider />
      </main>
    </div>
  )
}
