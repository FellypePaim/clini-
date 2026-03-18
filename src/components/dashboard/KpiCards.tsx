import React from 'react'
import {
  Calendar,
  UserPlus,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { mockKpis } from '../../data/mockData'
import { cn } from '../../lib/utils'

const ICON_MAP = {
  Calendar,
  UserPlus,
  DollarSign,
  Target,
}

const COLOR_MAP = {
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'hover:border-green-200'  },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'hover:border-blue-200'   },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'hover:border-purple-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'hover:border-orange-200' },
}

export function KpiCards() {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {mockKpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.icone as keyof typeof ICON_MAP] ?? Calendar
          const colors = COLOR_MAP[kpi.cor]
          const variacao = kpi.variacao ?? 0
          const TrendIcon = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : Minus
          const trendColor = variacao > 0 ? 'text-green-600' : variacao < 0 ? 'text-red-500' : 'text-gray-400'
          const trendBg   = variacao > 0 ? 'bg-green-50' : variacao < 0 ? 'bg-red-50' : 'bg-gray-50'

          return (
            <article
              key={kpi.id}
              className={cn(
                'kpi-card group cursor-default',
                colors.border
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
                {variacao !== 0 && (
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', trendBg, trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    {Math.abs(variacao)}%
                  </div>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1">
                  {kpi.valor}
                </p>
                <p className="text-sm text-gray-500">{kpi.titulo}</p>
              </div>

              {/* Barra decorativa inferior */}
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', colors.icon.replace('text-', 'bg-'))}
                  style={{ width: '60%' }}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
