import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

type LoadingStateProps = {
  size?: Size
  className?: string
}

const containerClasses: Record<Size, string> = {
  sm: 'py-2',
  md: 'py-6',
  lg: 'py-12',
}

const spinnerSize: Record<Size, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

export function LoadingState({ size = 'md', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn('flex w-full items-center justify-center', containerClasses[size], className)}
    >
      <Spinner size={spinnerSize[size]} tone="accent" />
    </div>
  )
}
