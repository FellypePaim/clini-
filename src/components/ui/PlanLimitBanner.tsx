import React from 'react'
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface PlanLimitBannerProps {
  resource: 'pacientes' | 'usuarios'
  current: number
  max: number
  className?: string
}

const RESOURCE_LABELS: Record<string, string> = {
  pacientes: 'pacientes',
  usuarios: 'usuários',
}

export function PlanLimitBanner({ resource, current, max, className }: PlanLimitBannerProps) {
  const percent = Math.min(100, Math.round((current / max) * 100))
  const isAtLimit = current >= max
  const isNearLimit = percent >= 80

  if (!isNearLimit) return null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold',
      isAtLimit
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      className
    )}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">
        {isAtLimit
          ? `Limite de ${RESOURCE_LABELS[resource]} atingido (${current}/${max}). Faça upgrade para continuar cadastrando.`
          : `${current}/${max} ${RESOURCE_LABELS[resource]} utilizados (${percent}%). Você está chegando no limite do plano.`
        }
      </span>
      <Link
        to="/planos"
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-all flex-shrink-0"
      >
        <Zap className="w-3 h-3" /> Upgrade <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
