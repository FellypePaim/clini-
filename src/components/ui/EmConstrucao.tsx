import { type LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '../../lib/utils'

interface EmConstructionProps {
  moduleName: string
  iconName?: string
  description?: string
  eta?: string
}

export function EmConstrucao({
  moduleName,
  iconName = 'Wrench',
  description,
  eta,
}: EmConstructionProps) {
  const FallbackIcon = Icons['Wrench'] as LucideIcon
  const Icon = (Icons[iconName as keyof typeof Icons] as LucideIcon) ?? FallbackIcon

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Ícone animado */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-cyan-500/5 rounded-3xl flex items-center justify-center">
          <Icon className="w-12 h-12 text-cyan-400" />
        </div>
        {/* Ponto pulsante */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
        </div>
      </div>

      {/* Texto */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">{moduleName}</h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        {description ?? 'Este módulo está em desenvolvimento e estará disponível em breve.'}
      </p>

      {eta && (
        <div className="mt-6 inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          Previsão: {eta}
        </div>
      )}

      {/* Decoração visual */}
      <div className="mt-10 flex items-center gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full bg-cyan-200',
              i === 1 ? 'w-8 bg-cyan-500' : 'w-4'
            )}
          />
        ))}
      </div>
    </div>
  )
}
