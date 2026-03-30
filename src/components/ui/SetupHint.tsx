import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle } from 'lucide-react'

interface SetupHintProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  actionPath: string
}

export function SetupHint({ icon, title, description, actionLabel, actionPath }: SetupHintProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/20 mb-4" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
      </div>
      <button onClick={() => navigate(actionPath)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors shrink-0">
        {actionLabel} <ArrowRight size={14} />
      </button>
    </div>
  )
}
