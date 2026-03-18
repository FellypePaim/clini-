import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'red'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  green:  'bg-green-100 text-green-800 ring-green-200',
  blue:   'bg-blue-100 text-blue-800 ring-blue-200',
  purple: 'bg-purple-100 text-purple-800 ring-purple-200',
  orange: 'bg-orange-100 text-orange-800 ring-orange-200',
  gray:   'bg-gray-100 text-gray-700 ring-gray-200',
  red:    'bg-red-100 text-red-700 ring-red-200',
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
