import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'red'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  green:  'bg-cyan-500/10 text-cyan-500 ring-cyan-500/20',
  blue:   'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  gray:   'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] ring-[var(--color-border)]',
  red:    'bg-red-500/10 text-red-400 ring-red-500/20',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ children, variant = 'gray', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
