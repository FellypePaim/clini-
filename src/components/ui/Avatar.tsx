import { cn } from '../../lib/utils'

interface AvatarProps {
  nome: string
  url?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = [
  'bg-cyan-500/10 text-cyan-500',
  'bg-indigo-500/10 text-indigo-400',
  'bg-purple-500/10 text-purple-400',
  'bg-amber-500/10 text-amber-400',
  'bg-pink-500/10 text-pink-400',
  'bg-blue-500/10 text-blue-400',
]

export function Avatar({ nome, url, className, size = 'md' }: AvatarProps) {
  const initials = nome
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  // Deterministic color based on name
  const colorIndex = nome.length % COLORS.length
  const colorClass = COLORS[colorIndex]

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0',
      colorClass,
      sizeClasses[size],
      className
    )}>
      {url ? (
        <img src={url} alt={nome} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
