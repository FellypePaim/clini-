import React from 'react'
import { Lock, Zap, ArrowRight } from 'lucide-react'
import { usePlan } from '../../hooks/usePlan'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  clinic: 'Clinic',
  enterprise: 'Enterprise',
}

const PLAN_PRICES: Record<string, string> = {
  starter: 'R$ 97/mês',
  professional: 'R$ 197/mês',
  clinic: 'R$ 397/mês',
  enterprise: 'R$ 797/mês',
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'cyan',
  professional: 'indigo',
  clinic: 'violet',
  enterprise: 'amber',
}

// ─── Prompt de upgrade ────────────────────────────────────────────────────────
interface UpgradePromptProps {
  featureLabel: string
  requiredPlan: string
  compact?: boolean
  className?: string
}

export function UpgradePrompt({ featureLabel, requiredPlan, compact = false, className }: UpgradePromptProps) {
  const color = PLAN_COLORS[requiredPlan] ?? 'indigo'

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold',
        `bg-${color}-500/10 border-${color}-500/20 text-${color}-400`,
        className
      )}>
        <Lock className="w-3 h-3" />
        Plano {PLAN_LABELS[requiredPlan]}+
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border text-center',
      `bg-${color}-500/5 border-${color}-500/20`,
      className
    )}>
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', `bg-${color}-500/10`)}>
        <Lock className={cn('w-7 h-7', `text-${color}-400`)} />
      </div>
      <div>
        <p className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">
          {featureLabel}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Disponível a partir do plano <span className={cn('font-black', `text-${color}-400`)}>{PLAN_LABELS[requiredPlan]}</span>
          {' '}({PLAN_PRICES[requiredPlan]})
        </p>
      </div>
      <Link
        to="/planos"
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all',
          `bg-${color}-500 hover:bg-${color}-600 text-white shadow-lg shadow-${color}-500/25`
        )}
      >
        <Zap className="w-4 h-4" /> Ver Planos <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// ─── Gate component ───────────────────────────────────────────────────────────
interface PlanGateProps {
  /** Planos que têm acesso: ex. ['professional', 'clinic', 'enterprise'] */
  plansAllowed: string[]
  children: React.ReactNode
  /** Label da feature bloqueada para exibir no UpgradePrompt */
  featureLabel?: string
  /** Componente customizado quando bloqueado */
  fallback?: React.ReactNode
  /** Modo compacto: mostra badge em vez de card */
  compact?: boolean
  className?: string
}

export function PlanGate({
  plansAllowed,
  children,
  featureLabel = 'Funcionalidade',
  fallback,
  compact = false,
  className,
}: PlanGateProps) {
  const { plano, isSuperAdmin } = usePlan()

  // SuperAdmin e planos permitidos têm acesso livre
  if (isSuperAdmin || plansAllowed.includes(plano)) {
    return <>{children}</>
  }

  // Plano mínimo necessário (primeiro da lista)
  const requiredPlan = plansAllowed[0] ?? 'professional'

  if (fallback) return <>{fallback}</>

  return (
    <UpgradePrompt
      featureLabel={featureLabel}
      requiredPlan={requiredPlan}
      compact={compact}
      className={className}
    />
  )
}
