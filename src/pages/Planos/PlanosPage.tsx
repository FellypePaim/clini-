import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, X, Zap, Star, Building2, Rocket,
  MessageSquare, Wifi, Users, LayoutDashboard,
  Calendar, UserRound, FileText, Pill, DollarSign,
  Sparkles, ChevronDown, ChevronUp, ShieldCheck,
  HeadphonesIcon, Package, BarChart3,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

// ─── Types ─────────────────────────────────────────────
type BillingCycle = 'monthly' | 'annual'

interface Plan {
  id: string
  name: string
  icon: React.ElementType
  color: string
  glow: string
  monthlyPrice: number
  annualMonthlyPrice: number
  maxPacientes: string
  maxUsers: string
  lyra: string
  whatsapp: string
  badge?: string
  description: string
}

interface Feature {
  label: string
  icon: React.ElementType
  plans: ('starter' | 'professional' | 'clinic' | 'enterprise')[]
}

interface FaqItem {
  q: string
  a: string
}

// ─── Plans Data ─────────────────────────────────────────
const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    color: '#0891b2',
    glow: 'rgba(8,145,178,0.25)',
    monthlyPrice: 97,
    annualMonthlyPrice: 78,
    maxPacientes: '500 pacientes',
    maxUsers: '1 usuário',
    lyra: '—',
    whatsapp: '—',
    description: 'Ideal para profissionais autônomos que estão começando.',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Star,
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)',
    monthlyPrice: 197,
    annualMonthlyPrice: 158,
    maxPacientes: 'Ilimitado',
    maxUsers: '2 usuários',
    lyra: '200 msgs/mês',
    whatsapp: '1 instância',
    description: 'Para clínicas em crescimento com IA integrada.',
  },
  {
    id: 'clinic',
    name: 'Clinic',
    icon: Building2,
    color: '#7c3aed',
    glow: 'rgba(124,58,237,0.35)',
    monthlyPrice: 397,
    annualMonthlyPrice: 318,
    maxPacientes: 'Ilimitado',
    maxUsers: '8 usuários',
    lyra: '1.000 msgs/mês',
    whatsapp: '2 instâncias',
    badge: 'Mais Popular',
    description: 'A escolha certa para clínicas multi-profissional.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Rocket,
    color: '#0891b2',
    glow: 'rgba(8,145,178,0.20)',
    monthlyPrice: 797,
    annualMonthlyPrice: 638,
    maxPacientes: 'Ilimitado',
    maxUsers: 'Ilimitado',
    lyra: 'Ilimitado',
    whatsapp: '5 instâncias',
    description: 'Tudo ilimitado com suporte dedicado e SLA garantido.',
  },
]

// ─── Features per plan ──────────────────────────────────
const FEATURES: Feature[] = [
  { label: 'Dashboard', icon: LayoutDashboard, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Agenda', icon: Calendar, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Pacientes / PEP', icon: UserRound, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Prontuário Eletrônico', icon: FileText, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Prescrições', icon: Pill, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Financeiro', icon: DollarSign, plans: ['starter', 'professional', 'clinic', 'enterprise'] },
  { label: 'Harmonização Facial', icon: Sparkles, plans: ['professional', 'clinic', 'enterprise'] },
  { label: 'IA Insights Dashboard', icon: BarChart3, plans: ['professional', 'clinic', 'enterprise'] },
  { label: 'Ausências Profissionais', icon: Users, plans: ['professional', 'clinic', 'enterprise'] },
  { label: 'Estoque Básico', icon: Package, plans: ['professional', 'clinic', 'enterprise'] },
  { label: 'Estoque Completo', icon: Package, plans: ['clinic', 'enterprise'] },
  { label: 'Nexus CRM Completo', icon: BarChart3, plans: ['clinic', 'enterprise'] },
  { label: 'Campanhas de Marketing', icon: MessageSquare, plans: ['clinic', 'enterprise'] },
  { label: 'Suporte Prioritário WhatsApp 4h', icon: HeadphonesIcon, plans: ['enterprise'] },
]

// ─── FAQ ────────────────────────────────────────────────
const FAQ: FaqItem[] = [
  {
    q: 'Posso trocar de plano a qualquer momento?',
    a: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Upgrades são aplicados imediatamente com cobrança proporcional. Downgrades entram em vigor no próximo ciclo de faturamento.',
  },
  {
    q: 'O que acontece se eu exceder o limite de pacientes?',
    a: 'No plano Starter você receberá um aviso ao se aproximar do limite de 500 pacientes. Não bloqueamos o acesso, mas recomendamos migrar para um plano superior para continuar crescendo sem restrições.',
  },
  {
    q: 'A cobrança anual é feita de uma só vez?',
    a: 'Sim. No plano anual você paga 12 meses de uma vez e economiza 20% em relação ao valor mensal. É a opção mais econômica para quem já decidiu usar o Clini+.',
  },
  {
    q: 'O que é a LYRA?',
    a: 'LYRA é a secretária virtual inteligente do Clini+. Ela responde pacientes via WhatsApp 24/7, agenda consultas, confirma presenças e muito mais — tudo com IA treinada para clínicas de saúde.',
  },
  {
    q: 'Existe período de teste gratuito?',
    a: 'Sim! Todos os planos vêm com 14 dias de trial gratuito, sem necessidade de cartão de crédito. Você explora todas as funcionalidades do plano escolhido sem compromisso.',
  },
  {
    q: 'Os dados da minha clínica ficam seguros?',
    a: 'Absolutamente. Utilizamos Supabase com criptografia em repouso e em trânsito, backups automáticos diários, e seguimos as diretrizes da LGPD para proteção de dados de saúde.',
  },
]

// ─── Plan Card ──────────────────────────────────────────
function PlanCard({
  plan,
  billing,
  isAuthenticated,
  clinicaPlano,
}: {
  plan: Plan
  billing: BillingCycle
  isAuthenticated: boolean
  clinicaPlano: string | null
}) {
  const price = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice
  const isCurrent = isAuthenticated && clinicaPlano === plan.id
  const isPopular = plan.badge === 'Mais Popular'

  const planOrder = ['starter', 'professional', 'clinic', 'enterprise']
  const currentIdx = planOrder.indexOf(clinicaPlano ?? '')
  const thisIdx = planOrder.indexOf(plan.id)
  const isUpgrade = isAuthenticated && currentIdx !== -1 && thisIdx > currentIdx
  const isDowngrade = isAuthenticated && currentIdx !== -1 && thisIdx < currentIdx

  const renderCta = () => {
    if (!isAuthenticated) {
      return (
        <Link
          to={`/register?plano=${plan.id}`}
          className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: isPopular
              ? `linear-gradient(135deg, ${plan.color}, #0891b2)`
              : `rgba(255,255,255,0.06)`,
            color: isPopular ? '#ffffff' : '#e2e8f0',
            border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Começar grátis por 14 dias
        </Link>
      )
    }
    if (isCurrent) {
      return (
        <button
          disabled
          className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center cursor-not-allowed opacity-60"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Plano Atual
        </button>
      )
    }
    if (isUpgrade) {
      return (
        <Link
          to="/suporte"
          className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${plan.color}, #0891b2)`,
            color: '#ffffff',
          }}
        >
          Fazer Upgrade
        </Link>
      )
    }
    if (isDowngrade) {
      return (
        <Link
          to="/suporte"
          className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Ver Plano Atual
        </Link>
      )
    }
    // Not authenticated fallback
    return (
      <Link
        to={`/register?plano=${plan.id}`}
        className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        Escolher Plano
      </Link>
    )
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: isPopular
          ? `linear-gradient(160deg, rgba(124,58,237,0.18) 0%, rgba(8,145,178,0.10) 100%)`
          : 'rgba(255,255,255,0.03)',
        border: isPopular
          ? `1px solid rgba(124,58,237,0.4)`
          : isCurrent
          ? `1px solid rgba(8,145,178,0.4)`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isPopular ? `0 0 40px ${plan.glow}` : 'none',
      }}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wide"
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #0891b2)',
            color: '#ffffff',
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${plan.color}22` }}
        >
          <plan.icon className="w-5 h-5" style={{ color: plan.color }} />
        </div>
        <div>
          <div className="text-base font-bold text-white">{plan.name}</div>
          <div className="text-xs" style={{ color: '#6b7280' }}>{plan.description}</div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>R$</span>
          <span className="text-4xl font-black text-white">{price}</span>
          <span className="text-sm mb-1" style={{ color: '#6b7280' }}>/mês</span>
        </div>
        {billing === 'annual' && (
          <div className="text-xs mt-1" style={{ color: '#0891b2' }}>
            Cobrado anualmente · Economize 20%
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className="space-y-2 mb-5">
        <MetricRow icon={UserRound} label="Pacientes" value={plan.maxPacientes} color={plan.color} />
        <MetricRow icon={Users} label="Usuários" value={plan.maxUsers} color={plan.color} />
        <MetricRow icon={MessageSquare} label="LYRA (IA)" value={plan.lyra} color={plan.color} />
        <MetricRow icon={Wifi} label="WhatsApp" value={plan.whatsapp} color={plan.color} />
      </div>

      {/* Features */}
      <div className="space-y-2 mb-6 flex-1">
        {FEATURES.map((f) => {
          const included = f.plans.includes(plan.id as never)
          return (
            <div key={f.label} className="flex items-center gap-2.5">
              {included ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
              ) : (
                <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#374151' }} />
              )}
              <span
                className="text-xs"
                style={{ color: included ? '#d1d5db' : '#4b5563' }}
              >
                {f.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {renderCta()}
    </div>
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  const isDash = value === '—'
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5" style={{ color: '#6b7280' }}>
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <span
        className="font-medium"
        style={{ color: isDash ? '#374151' : '#e2e8f0' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── FAQ Item ───────────────────────────────────────────
function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        background: open ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: open ? '1px solid rgba(8,145,178,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5 gap-4">
        <span className="text-sm font-medium text-white">{item.q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#0891b2' }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7280' }} />
        }
      </div>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
          {item.a}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────
export function PlanosPage() {
  const { user, isAuthenticated } = useAuthStore()
  const clinicaPlano = user?.clinicaPlano ?? null
  const [billing, setBilling] = useState<BillingCycle>('monthly')

  useEffect(() => {
    document.title = 'Planos & Preços — Clini+'
  }, [])

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: '#030608',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(8,145,178,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative">
        {/* ── Header ── */}
        <section className="pt-20 pb-12 px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'rgba(8,145,178,0.12)',
              border: '1px solid rgba(8,145,178,0.25)',
              color: '#0891b2',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            14 dias grátis · Sem cartão de crédito
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="text-white">Escolha o plano </span>
            <span
              style={{
                background: 'linear-gradient(90deg, #0891b2, #6366f1, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              certo para sua clínica
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg" style={{ color: '#6b7280' }}>
            Do consultório independente à rede de clínicas — temos o plano ideal para cada momento do seu crescimento.
          </p>
        </section>

        {/* ── Billing Toggle ── */}
        <div className="flex justify-center mb-12 px-6">
          <div
            className="inline-flex items-center rounded-xl p-1 gap-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              onClick={() => setBilling('monthly')}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: billing === 'monthly' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: billing === 'monthly' ? '#ffffff' : '#6b7280',
              }}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                background: billing === 'annual' ? 'rgba(8,145,178,0.15)' : 'transparent',
                color: billing === 'annual' ? '#0891b2' : '#6b7280',
              }}
            >
              Anual
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: billing === 'annual' ? 'rgba(8,145,178,0.2)' : 'rgba(255,255,255,0.04)',
                  color: billing === 'annual' ? '#0891b2' : '#4b5563',
                }}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <section className="px-6 pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                isAuthenticated={isAuthenticated}
                clinicaPlano={clinicaPlano}
              />
            ))}
          </div>

          {/* Annual savings note */}
          {billing === 'annual' && (
            <div
              className="mt-6 text-center text-sm"
              style={{ color: '#6b7280' }}
            >
              Todos os preços são por mês, cobrados em parcela única anual.
              Economize até{' '}
              <span style={{ color: '#0891b2', fontWeight: 600 }}>R$ 1.908/ano</span>{' '}
              no plano Enterprise.
            </div>
          )}
        </section>

        {/* ── Feature comparison callout ── */}
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-8 md:p-10 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5" style={{ color: '#0891b2' }} />
              <span className="text-sm font-semibold" style={{ color: '#0891b2' }}>
                Todos os planos incluem
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
              {[
                { icon: LayoutDashboard, label: 'Dashboard' },
                { icon: Calendar, label: 'Agenda' },
                { icon: UserRound, label: 'Pacientes' },
                { icon: FileText, label: 'Prontuário' },
                { icon: Pill, label: 'Prescrições' },
                { icon: DollarSign, label: 'Financeiro' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(8,145,178,0.12)' }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: '#0891b2' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-6 pb-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Perguntas frequentes
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: '#6b7280' }}>
            Tem alguma dúvida? Entre em contato pelo{' '}
            <Link to="/suporte" className="underline" style={{ color: '#0891b2' }}>
              suporte
            </Link>
            .
          </p>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <FaqItem key={item.q} item={item} />
            ))}
          </div>
        </section>

        {/* ── CTA Footer ── */}
        <section className="px-6 pb-24">
          <div
            className="max-w-3xl mx-auto rounded-2xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(8,145,178,0.12) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {/* background shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-5"
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#a78bfa',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Comece hoje sem compromisso
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Transforme sua clínica agora
              </h2>
              <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: '#9ca3af' }}>
                14 dias grátis, sem cartão de crédito. Cancele quando quiser. Nossa equipe está pronta para te ajudar em cada passo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isAuthenticated ? (
                  <Link
                    to="/suporte"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
                      color: '#ffffff',
                    }}
                  >
                    Falar com o Suporte
                    <HeadphonesIcon className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
                        color: '#ffffff',
                      }}
                    >
                      Criar conta grátis
                      <Rocket className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: '#d1d5db',
                      }}
                    >
                      Já tenho conta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
