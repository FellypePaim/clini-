import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Settings,
  User,
  Building,
  Shield,
  Bell,
  Globe,
  PlusSquare
} from 'lucide-react'

export function ConfiguracoesLayout() {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname.includes(path)

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="px-6 py-6 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Settings className="text-indigo-600" />
            Configurações do Sistema
          </h1>
          <p className="text-slate-500">Ajustes da conta, permissões e preferências globais</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 p-4 space-y-1 overflow-y-auto">
          <NavItem active={isActive('clinica')} icon={<Building size={18} />} title="Dados da Clínica" to="/configuracoes/clinica" />
          <NavItem active={isActive('profissionais')} icon={<User size={18} />} title="Profissionais" to="/configuracoes/profissionais" />
          <NavItem active={isActive('procedimentos')} icon={<PlusSquare size={18} />} title="Procedimentos" to="/configuracoes/procedimentos" />
          <div className="h-px bg-slate-200 my-4" />
          <NavItem active={isActive('integracoes')} icon={<Globe size={18} />} title="Integrações" to="/configuracoes/integracoes" />
          <NavItem active={isActive('notificacoes')} icon={<Bell size={18} />} title="Notificações" to="/configuracoes/notificacoes" />
          <NavItem active={isActive('seguranca')} icon={<Shield size={18} />} title="Segurança & Acessos" to="/configuracoes/seguranca" />
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({ active, icon, title, to }: { active: boolean, icon: React.ReactNode, title: string, to: string }) {
  return (
    <Link 
      to={to}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm transition-all
        ${active 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      {title}
    </Link>
  )
}
