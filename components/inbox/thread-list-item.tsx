'use client'

import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { ChannelBadge } from './channel-badge'
import type { Thread } from './types'
import { formatPhoneDisplay, formatRelativeTime } from './utils'

export function ThreadListItem({
  thread,
  selected,
  onSelect,
}: {
  thread: Thread
  selected: boolean
  onSelect: () => void
}) {
  const youSent =
    thread.last_message_role === 'staff' || thread.last_message_role === 'agent'
  const preview = thread.last_message_preview || 'No messages yet'

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex w-full items-start gap-3 border-l-2 px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-primary-500 bg-primary-50/40'
          : 'border-transparent hover:bg-gray-50',
      )}
    >
      <div className="relative">
        <Avatar phone={thread.customer_id} size="sm" />
        <ChannelBadge variant="dot" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate text-sm font-semibold text-gray-900">
            {formatPhoneDisplay(thread.customer_id)}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted">
            {formatRelativeTime(thread.last_message_at)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <p
            dir="auto"
            className={cn(
              'flex-1 truncate text-xs',
              thread.unread > 0 ? 'font-medium text-gray-800' : 'text-gray-600',
            )}
          >
            {youSent ? <span className="text-muted">You: </span> : null}
            {preview}
          </p>
          {thread.unread > 0 ? (
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">
              {thread.unread > 99 ? '99+' : thread.unread}
            </span>
          ) : thread.mode === 'manual' ? (
            <span className="shrink-0 rounded-full border border-amber-100 bg-amber-50 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-700">
              Manual
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
