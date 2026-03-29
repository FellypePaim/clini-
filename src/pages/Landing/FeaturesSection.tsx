import { useState } from 'react'
import { LayoutDashboard, Calendar, Users, MessageSquare, Briefcase, DollarSign } from 'lucide-react'
import { useInView } from '../../hooks/useInView'

const MODULES = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Visao completa da clinica em tempo real', color: '#0891b2' },
  { icon: Calendar, title: 'Agenda', desc: 'Drag-and-drop com recorrencia e conflitos', color: '#6366f1' },
  { icon: Users, title: 'Pacientes / PEP', desc: 'Prontuario eletronico completo', color: '#10b981' },
  { icon: MessageSquare, title: 'OVYVA (IA)', desc: 'Secretaria virtual 24/7 via WhatsApp', color: '#f59e0b' },
  { icon: Briefcase, title: 'Verdesk CRM', desc: 'Kanban de leads e campanhas', color: '#ec4899' },
  { icon: DollarSign, title: 'Financeiro', desc: 'Receitas, despesas e DRE', color: '#14b8a6' },
]

function DashboardMock({ color }: { color: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {['Pacientes', 'Receita', 'Agendamentos', 'Ocupacao'].map((label) => (
          <div key={label} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-bold text-white">
              {Math.floor(Math.random() * 900 + 100)}
            </div>
            <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${60 + Math.random() * 30}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-end gap-1.5 h-24">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${20 + Math.random() * 80}%`,
                background: i % 3 === 0 ? color : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgendaMock({ color }: { color: string }) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const hours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00']
  return (
    <div className="space-y-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: '50px repeat(5, 1fr)' }}>
        <div />
        {days.map((d) => (
          <div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>
        ))}
        {hours.map((h, hi) => (
          <>
            <div key={`h-${h}`} className="text-xs text-gray-600 text-right pr-2 py-2">{h}</div>
            {days.map((d, di) => {
              const filled = (hi + di) % 3 === 0
              return (
                <div
                  key={`${h}-${d}`}
                  className="rounded py-2"
                  style={{
                    background: filled ? `${color}33` : 'rgba(255,255,255,0.03)',
                    borderLeft: filled ? `2px solid ${color}` : '2px solid transparent',
                  }}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

function PacientesMock({ color }: { color: string }) {
  const names = ['Maria S.', 'Joao P.', 'Ana C.', 'Carlos R.', 'Julia M.']
  return (
    <div className="space-y-2">
      {names.map((name, i) => (
        <div
          key={name}
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: i === 0 ? color : 'rgba(255,255,255,0.1)' }}
          >
            {name[0]}
          </div>
          <div className="flex-1">
            <div className="text-sm text-white">{name}</div>
            <div className="text-xs text-gray-500">Ultima consulta: {10 + i} Mar</div>
          </div>
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
            Ativo
          </div>
        </div>
      ))}
    </div>
  )
}

function OvyvaMock({ color }: { color: string }) {
  const messages = [
    { from: 'user', text: 'Ola, gostaria de agendar uma consulta' },
    { from: 'bot', text: 'Claro! Temos horarios disponiveis na quarta e quinta. Qual prefere?' },
    { from: 'user', text: 'Quinta as 14h seria otimo' },
    { from: 'bot', text: 'Perfeito! Consulta agendada para quinta, 14h. Enviarei um lembrete!' },
  ]
  return (
    <div className="space-y-3">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
          <div
            className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm"
            style={{
              background: msg.from === 'bot' ? 'rgba(255,255,255,0.06)' : `${color}33`,
              color: msg.from === 'bot' ? '#d1d5db' : 'white',
              borderBottomLeftRadius: msg.from === 'bot' ? '4px' : undefined,
              borderBottomRightRadius: msg.from === 'bot' ? undefined : '4px',
            }}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function VerdeskMock({ color }: { color: string }) {
  const columns = [
    { title: 'Novo', count: 3 },
    { title: 'Contato', count: 2 },
    { title: 'Agendado', count: 4 },
    { title: 'Fechado', count: 1 },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {columns.map((col, ci) => (
        <div key={col.title}>
          <div className="text-xs text-gray-500 mb-2 text-center">
            {col.title} <span className="text-gray-600">({col.count})</span>
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: Math.min(col.count, 3) }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg p-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderTop: ci === 3 ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="h-2 rounded bg-gray-700 w-3/4 mb-1" />
                <div className="h-1.5 rounded bg-gray-800 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FinanceiroMock({ color }: { color: string }) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-end gap-2 h-28">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5">
                <div
                  className="flex-1 rounded-sm"
                  style={{ height: `${40 + i * 12}px`, background: color }}
                />
                <div
                  className="flex-1 rounded-sm"
                  style={{ height: `${20 + i * 8}px`, background: 'rgba(255,255,255,0.08)' }}
                />
              </div>
              <span className="text-[10px] text-gray-600">{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Receita', val: 'R$ 48.500' },
          { label: 'Despesas', val: 'R$ 21.300' },
          { label: 'Lucro', val: 'R$ 27.200' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-sm font-bold text-white mt-1">{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const MOCK_COMPONENTS = [DashboardMock, AgendaMock, PacientesMock, OvyvaMock, VerdeskMock, FinanceiroMock]

export function FeaturesSection() {
  const [active, setActive] = useState(0)
  const { ref, isInView } = useInView({ threshold: 0.1 })

  const activeModule = MODULES[active]
  const ActiveMock = MOCK_COMPONENTS[active]

  return (
    <section
      id="features"
      ref={ref}
      className="py-24 px-6"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo que sua clinica precisa</h2>
          <p className="text-gray-500 mt-3 text-lg">6 modulos integrados, zero complicacao.</p>
        </div>

        {/* Tabs + Mockup */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs - left side */}
          <div className="w-full md:w-80 flex-shrink-0 space-y-1">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon
              const isActive = i === active
              return (
                <button
                  key={mod.title}
                  onClick={() => setActive(i)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-r-lg text-left transition-all duration-200"
                  style={{
                    borderLeft: `3px solid ${isActive ? '#06b6d4' : 'transparent'}`,
                    background: isActive ? 'rgba(8,145,178,0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: isActive ? mod.color : '#6b7280' }}
                  />
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {mod.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{mod.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Mockup area - right side */}
          <div className="flex-1 min-h-[400px]">
            <div
              className="rounded-2xl p-6 h-full transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: `0 0 40px ${activeModule.color}1a`,
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: activeModule.color }} />
                <span className="text-sm font-medium text-gray-400">{activeModule.title}</span>
              </div>
              {MODULES.map((mod, i) => (
                <div
                  key={mod.title}
                  className="transition-all duration-300"
                  style={{
                    opacity: i === active ? 1 : 0,
                    position: i === active ? 'relative' : 'absolute',
                    pointerEvents: i === active ? 'auto' : 'none',
                    height: i === active ? 'auto' : 0,
                    overflow: 'hidden',
                  }}
                >
                  {(() => {
                    const MockComponent = MOCK_COMPONENTS[i]
                    return <MockComponent color={mod.color} />
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
