import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'danger' | 'primary'
type Size = 'sm' | 'md'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  'aria-label': string
}

const SIZE: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
}

const VARIANT: Record<Variant, string> = {
  default: 'text-gray-500 hover:bg-surface hover:text-gray-900',
  danger: 'text-gray-500 hover:bg-red-50 hover:text-red-600',
  primary: 'text-primary-600 hover:bg-primary-50',
}

export function IconButton({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50',
        SIZE[size],
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}
