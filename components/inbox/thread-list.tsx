'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyConversations, NoSearchResults } from './empty-states'
import { ThreadListItem } from './thread-list-item'
import { ThreadListSkeleton } from './skeletons'
import type { StatusFilter, Thread } from './types'

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
]

function matchesFilter(thread: Thread, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'unread':
      return thread.unread > 0
    case 'auto':
      return thread.mode === 'auto'
    case 'manual':
      return thread.mode === 'manual'
  }
}

export function ThreadList({
  threads,
  loading,
  selected,
  onSelect,
}: {
  threads: Thread[]
  loading: boolean
  selected: string | null
  onSelect: (phone: string) => void
}) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: threads.length,
      unread: threads.filter((t) => t.unread > 0).length,
      auto: threads.filter((t) => t.mode === 'auto').length,
      manual: threads.filter((t) => t.mode === 'manual').length,
    }),
    [threads],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads
      .filter((t) => matchesFilter(t, filter))
      .filter((t) => {
        if (!q) return true
        return (
          t.customer_id.toLowerCase().includes(q) ||
          (t.last_message_preview ?? '').toLowerCase().includes(q)
        )
      })
  }, [threads, filter, query])

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-card-border bg-white">
      <div className="border-b border-card-border px-3 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-lg border border-card-border bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <nav className="mt-2 flex items-center gap-1 overflow-x-auto" aria-label="Filter">
          {TABS.map((tab) => {
            const active = filter === tab.id
            const count = counts[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  '-mb-px inline-flex items-center gap-1.5 border-b-2 px-2 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary-500 text-primary-700'
                    : 'border-transparent text-muted hover:text-gray-700',
                )}
              >
                {tab.label}
                {count > 0 ? (
                  <span
                    className={cn(
                      'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                      active
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ThreadListSkeleton />
        ) : threads.length === 0 ? (
          <EmptyConversations />
        ) : filtered.length === 0 ? (
          <NoSearchResults />
        ) : (
          <ul className="divide-y divide-card-border/60">
            {filtered.map((t) => (
              <li key={t.customer_id}>
                <ThreadListItem
                  thread={t}
                  selected={selected === t.customer_id}
                  onSelect={() => onSelect(t.customer_id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
