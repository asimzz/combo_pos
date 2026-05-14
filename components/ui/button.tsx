import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'destructive' | 'ghost' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-secondary-500 text-gray-900 hover:bg-secondary-600',
  success: 'bg-green-500 text-white hover:bg-green-600',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-gray-700 hover:bg-surface',
  outline: 'bg-white border border-card-border text-gray-700 hover:bg-surface',
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2 py-1 text-[11px]',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
    >
      {loading ? <Spinner size={size === 'sm' || size === 'xs' ? 'xs' : 'sm'} tone="current" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
