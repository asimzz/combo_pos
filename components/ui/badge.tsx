import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
type Size = 'sm' | 'md'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  success: 'bg-green-50 text-green-700 border border-green-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  danger: 'bg-red-50 text-red-700 border border-red-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
  brand: 'bg-primary-50 text-primary-700 border border-primary-100',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  leftIcon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {leftIcon}
      {children}
    </span>
  )
}
