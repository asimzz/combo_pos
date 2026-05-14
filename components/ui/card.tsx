import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn('rounded-xl border border-card-border bg-white p-5', className)}
    />
  )
}

export function CardHeader({ className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn('flex items-center justify-between gap-3 border-b border-card-border px-5 py-4', className)}
    />
  )
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cn('text-sm font-semibold text-gray-900', className)}
    />
  )
}

export function CardBody({ className, ...rest }: CardProps) {
  return <div {...rest} className={cn('p-5', className)} />
}
