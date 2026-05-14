'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PillOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

type PillsProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: PillOption<T>[]
  size?: 'sm' | 'md'
  className?: string
}

const SIZE: Record<NonNullable<PillsProps<string>['size']>, string> = {
  sm: 'min-w-13 px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function Pills<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  className,
}: PillsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2 pb-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30',
              SIZE[size],
              active
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-card-border bg-white text-gray-700 hover:border-primary-500/40',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
