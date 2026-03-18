import { cn } from '../../lib/utils'

interface AvatarProps {
  nome: string
  url?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
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
