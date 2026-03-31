import React from 'react'
import { Clock, Zap, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface TrialBannerProps {
  daysLeft: number | null
  plano: string
  onDismiss?: () => void
  className?: string
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  clinic: 'Clinic',
  enterprise: 'Enterprise',
}

export function TrialBanner({ daysLeft, plano, onDismiss, className }: TrialBannerProps) {
  if (daysLeft === null) return null

  const isUrgent = daysLeft <= 2

  return (
    <div className={cn(
      'flex items-center gap-3 px-5 py-3.5 rounded-2xl border font-bold',
      isUrgent
        ? 'bg-red-500/10 border-red-500/30 text-red-300'
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
      className
    )}>
      <Clock className={cn('w-4 h-4 flex-shrink-0', isUrgent ? 'text-red-400' : 'text-indigo-400')} />
      <span className="flex-1 text-sm">
        {daysLeft === 0
          ? <>Seu trial do plano <strong>{PLAN_LABELS[plano] ?? plano}</strong> expira <strong>hoje</strong>. Escolha um plano para continuar.</>
          : <>Seu trial expira em <strong>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</strong>. Aproveite enquanto dura!</>
        }
      </span>
      <Link
        to="/planos"
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 text-white',
          isUrgent
            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
        )}
      >
        <Zap className="w-3 h-3" /> Ver Planos <ArrowRight className="w-3 h-3" />
      </Link>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── Banner de conta suspensa (bloqueia toda a UI) ─────────────────────────
export function SuspensoBanner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-[var(--color-bg-card)] border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-2">
          Conta suspensa
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Seu período de trial expirou ou a assinatura foi cancelada. Escolha um plano para reativar o acesso.
        </p>
        <Link
          to="/planos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20"
        >
          <Zap className="w-4 h-4" /> Escolher Plano <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
