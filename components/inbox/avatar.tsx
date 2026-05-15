import { cn } from '@/lib/utils'
import { initialsFromPhone } from './utils'

type Size = 'sm' | 'md'

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
}

export function Avatar({ phone, size = 'sm' }: { phone: string; size?: Size }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700 tabular-nums',
        sizeClasses[size],
      )}
    >
      {initialsFromPhone(phone)}
    </span>
  )
}
