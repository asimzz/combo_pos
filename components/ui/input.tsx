import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        {...rest}
        className={cn(
          'w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
      />
    )
  },
)
