import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Size = 'xs' | 'sm' | 'md' | 'lg'
type Tone = 'accent' | 'muted' | 'current'

type SpinnerProps = {
  size?: Size
  tone?: Tone
  className?: string
}

const sizeClasses: Record<Size, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
}

const toneClasses: Record<Tone, string> = {
  accent: 'text-primary-500',
  muted: 'text-muted',
  current: 'text-current',
}

export function Spinner({ size = 'md', tone = 'accent', className }: SpinnerProps) {
  return (
    <Loader2
      aria-hidden
      className={cn('animate-spin', sizeClasses[size], toneClasses[tone], className)}
    />
  )
}
