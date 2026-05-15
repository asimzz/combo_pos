'use client'

import { useEffect, useRef } from 'react'
import { EmptyThread } from './empty-states'
import { MessageBubble } from './message-bubble'
import { MessageListSkeleton } from './skeletons'
import { SystemChip } from './system-chip'
import type { Message } from './types'
import { formatDateDivider, isConsecutive, shouldShowDateDivider } from './utils'

const PINNED_THRESHOLD_PX = 120

export function MessageList({
  messages,
  loading,
  resetKey,
}: {
  messages: Message[]
  loading: boolean
  resetKey: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  useEffect(() => {
    pinnedRef.current = true
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [resetKey])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (pinnedRef.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
  }, [messages.length])

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    pinnedRef.current = distanceFromBottom < PINNED_THRESHOLD_PX
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50/60">
        <MessageListSkeleton />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50/60">
        <EmptyThread />
      </div>
    )
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto bg-gray-50/60 px-5 py-3"
    >
      {messages.map((m, i) => {
        const prev = messages[i - 1]
        const next = messages[i + 1]
        const showDate = shouldShowDateDivider(prev, m)
        const consecutive = isConsecutive(prev, m)
        const isLastInGroup = !isConsecutive(m, next)
        const key = m.client_msg_id ?? `${i}-${m.created_at ?? ''}`

        if (m.role === 'tool') {
          return (
            <div key={key}>
              {showDate ? (
                <div className="my-3 text-center text-[11px] text-muted">
                  {formatDateDivider(m.created_at)}
                </div>
              ) : null}
              <SystemChip>tool: {m.tool_name ?? 'call'}</SystemChip>
            </div>
          )
        }

        return (
          <div key={key}>
            {showDate ? (
              <div className="my-3 text-center text-[11px] text-muted">
                {formatDateDivider(m.created_at)}
              </div>
            ) : null}
            <MessageBubble
              message={m}
              consecutive={consecutive && !showDate}
              isLastInGroup={isLastInGroup}
            />
          </div>
        )
      })}
    </div>
  )
}
