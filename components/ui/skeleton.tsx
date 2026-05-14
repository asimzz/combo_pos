import { cn } from '@/lib/utils'

type Variant = 'rect' | 'circle' | 'text'

type SkeletonProps = {
  className?: string
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  rect: 'rounded',
  circle: 'rounded-full',
  text: 'h-3 rounded-md',
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse bg-gray-200', variantClasses[variant], className)}
    />
  )
}
