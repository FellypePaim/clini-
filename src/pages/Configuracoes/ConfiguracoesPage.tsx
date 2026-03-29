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
    <div className="flex flex-col h-full bg-[var(--color-bg-card)]">
      <header className="px-6 py-6 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
            <Settings className="text-indigo-600" />
            Configurações do Sistema
          </h1>
          <p className="text-[var(--color-text-muted)]">Ajustes da conta, permissões e preferências globais</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-[var(--color-bg-card)] border-r border-[var(--color-border)] flex-shrink-0 p-4 space-y-1 overflow-y-auto">
          <NavItem active={isActive('clinica')} icon={<Building size={18} />} title="Dados da Clínica" to="/configuracoes/clinica" />
          <NavItem active={isActive('profissionais')} icon={<User size={18} />} title="Profissionais" to="/configuracoes/profissionais" />
          <NavItem active={isActive('procedimentos')} icon={<PlusSquare size={18} />} title="Procedimentos" to="/configuracoes/procedimentos" />
          <div className="h-px bg-[var(--color-border)] my-4" />
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
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'}
      `}
    >
      <span className={active ? 'text-indigo-600' : 'text-[var(--color-text-muted)]'}>{icon}</span>
      {title}
    </Link>
  )
}
