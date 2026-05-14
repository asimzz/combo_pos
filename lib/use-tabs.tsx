'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TabDef<T extends string> = {
  id: T
  label: string
  count?: number
  icon?: ReactNode
}

type UseTabsArgs<T extends string> = {
  tabs: readonly TabDef<T>[]
  defaultTab: T
  paramKey?: string
  rightSlot?: ReactNode
}

export function useTabs<T extends string>({
  tabs,
  defaultTab,
  paramKey = 'tab',
  rightSlot,
}: UseTabsArgs<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = useMemo<T>(() => {
    const raw = searchParams?.get(paramKey)
    const found = tabs.find((t) => t.id === raw)
    return found ? found.id : defaultTab
  }, [searchParams, paramKey, tabs, defaultTab])

  const setTab = useCallback(
    (id: T) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '')
      next.set(paramKey, id)
      router.replace(`?${next.toString()}`, { scroll: false })
    },
    [router, searchParams, paramKey],
  )

  const tabButtons = tabs.map((t) => {
    const isActive = t.id === activeTab
    return (
      <button
        key={t.id}
        role="tab"
        type="button"
        aria-selected={isActive}
        onClick={() => setTab(t.id)}
        className={cn(
          '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors focus:outline-none',
          isActive
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-muted hover:text-gray-700',
        )}
      >
        {t.icon}
        {t.label}
        {t.count !== undefined ? (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted tabular-nums">
            {t.count}
          </span>
        ) : null}
      </button>
    )
  })

  const strip = rightSlot ? (
    <div
      role="tablist"
      className="flex items-center justify-between gap-6 border-b border-card-border overflow-x-auto"
    >
      <div className="flex items-center gap-6">{tabButtons}</div>
      <div className="pb-2">{rightSlot}</div>
    </div>
  ) : (
    <div
      role="tablist"
      className="flex items-center gap-6 border-b border-card-border overflow-x-auto"
    >
      {tabButtons}
    </div>
  )

  return { strip, activeTab, setTab }
}
