import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket, ArrowRight,
  PartyPopper,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useOnboarding, type OnboardingStep } from '../../hooks/useOnboarding'

export function OnboardingChecklist() {
  const { steps, completedCount, totalCount, allDone, progress, loading, dismissed, dismiss, refresh } = useOnboarding()
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()

  if (loading || dismissed || totalCount === 0) return null

  // All done — show celebration then auto-dismiss
  if (allDone) {
    return (
      <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--color-bg-base)' }}>
        <div className="p-5 text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <PartyPopper size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Tudo pronto!</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sua clinica esta configurada. Bom trabalho!
          </p>
          <button onClick={dismiss}
            className="px-4 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fade-in"
      style={{ background: 'var(--color-bg-base)' }}>

      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] cursor-pointer" onClick={() => setExpanded(!expanded)}
        style={{ background: 'var(--color-bg-card)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Rocket size={16} className="text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Configure sua clinica</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">{completedCount} de {totalCount} concluidos</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); dismiss() }}
              className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors" title="Minimizar">
              <X size={14} />
            </button>
            {expanded ? <ChevronDown size={16} className="text-[var(--color-text-muted)]" /> : <ChevronUp size={16} className="text-[var(--color-text-muted)]" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-deep)' }}>
          <div className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {steps.map((step) => (
            <StepItem key={step.id} step={step} onNavigate={(path) => { navigate(path); refresh() }} />
          ))}
        </div>
      )}
    </div>
  )
}

function StepItem({ step, onNavigate }: { step: OnboardingStep; onNavigate: (path: string) => void }) {
  return (
    <button
      onClick={() => !step.completed && onNavigate(step.path)}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
        step.completed
          ? 'opacity-60'
          : 'hover:bg-[var(--color-bg-card-hover)] cursor-pointer',
      )}
    >
      {step.completed ? (
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <Circle size={18} className="text-[var(--color-text-dim)] shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          step.completed ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text-primary)]',
        )}>
          {step.title}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{step.description}</p>
      </div>
      {!step.completed && (
        <ArrowRight size={14} className="text-cyan-500 shrink-0 mt-1" />
      )}
    </button>
  )
}
