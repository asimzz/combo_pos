'use client'

import { Check, ChevronDown } from 'lucide-react'
import { DropdownMenu } from './dropdown-menu'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

export type SelectOption<T extends string> = {
  value: T
  label: string
  disabled?: boolean
}

type SelectProps<T extends string> = {
  value: T | ''
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  className?: string
  align?: 'start' | 'end'
  size?: 'sm' | 'md'
}

const SIZE: Record<NonNullable<SelectProps<string>['size']>, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  loading = false,
  disabled,
  className,
  align = 'start',
  size = 'md',
}: SelectProps<T>) {
  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder
  const isPlaceholder = !selected

  return (
    <DropdownMenu className="block">
      <DropdownMenu.Trigger
        disabled={disabled || loading}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-lg border border-card-border bg-white transition-colors hover:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60',
          SIZE[size],
          isPlaceholder || loading ? 'text-muted' : 'text-gray-900',
          className,
        )}
      >
        {loading ? (
          <span className="flex flex-1 items-center justify-center">
            <Spinner size="sm" tone="accent" />
          </span>
        ) : (
          <span className="truncate text-left">{label}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align={align} width="trigger">
        {options.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted">No options</div>
        ) : (
          options.map((opt) => (
            <DropdownMenu.Item
              key={opt.value}
              disabled={opt.disabled}
              onSelect={() => onChange(opt.value)}
              className={opt.value === value ? 'bg-primary-50/60 text-primary-700' : undefined}
            >
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.value === value ? <Check className="h-4 w-4 text-primary-600" /> : null}
            </DropdownMenu.Item>
          ))
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
