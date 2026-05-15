'use client'

import { useEffect, useRef } from 'react'

export type Role = 'customer' | 'agent' | 'staff' | 'tool'
export type Mode = 'auto' | 'manual'

export type AttachmentKind = 'image' | 'video' | 'audio' | 'document' | 'sticker'

export type AttachmentWire = {
  kind: AttachmentKind
  url: string
  media_id: string
  mime_type: string
  filename: string | null
  caption: string | null
  voice: boolean | null
}

export type WireMessage = {
  role: Role
  text: string
  created_at: string | null
  tool_name: string | null
  staff_name: string | null
  client_msg_id?: string | null
  attachment?: AttachmentWire | null
}

export type InboxEvent =
  | { type: 'hello'; data: { server_time: string } }
  | { type: 'message.new'; data: { customer_id: string; message: WireMessage } }
  | {
      type: 'thread.updated'
      data: {
        customer_id: string
        last_message_preview?: string
        last_message_at?: string | null
        last_message_role?: Role | null
        mode?: Mode
        unread?: number
      }
    }
  | { type: 'mode.changed'; data: { customer_id: string; mode: Mode } }
  | { type: 'read.updated'; data: { customer_id: string; unread: 0 } }

const EVENT_TYPES = [
  'hello',
  'message.new',
  'thread.updated',
  'mode.changed',
  'read.updated',
] as const

// If the EventSource drops and reopens within this window, skip the resync —
// the data is still fresh and re-fetching everything just floods the agent.
const QUICK_RECONNECT_MS = 3000

type Subscriber = {
  onEvent?: (e: InboxEvent) => void
  onResync?: () => void
}

const subscribers = new Set<Subscriber>()
let sharedEs: EventSource | null = null
let openedOnce = false
let failures = 0
let reconnectTimer: number | null = null
let fallbackTimer: number | null = null
let lastDisconnectAt: number | null = null
let visibilityHandlerInstalled = false

function clearFallback() {
  if (fallbackTimer !== null) {
    window.clearInterval(fallbackTimer)
    fallbackTimer = null
  }
}

function clearReconnect() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function broadcastEvent(e: InboxEvent) {
  subscribers.forEach((sub) => sub.onEvent?.(e))
}

function broadcastResync() {
  subscribers.forEach((sub) => sub.onResync?.())
}

function openSse() {
  if (sharedEs !== null || typeof window === 'undefined') return
  clearReconnect()

  const es = new EventSource('/api/inbox/events')
  sharedEs = es

  es.onopen = () => {
    const quickReconnect =
      lastDisconnectAt !== null && Date.now() - lastDisconnectAt < QUICK_RECONNECT_MS
    failures = 0
    clearFallback()
    if (openedOnce && !quickReconnect) broadcastResync()
    openedOnce = true
    lastDisconnectAt = null
  }

  for (const t of EVENT_TYPES) {
    es.addEventListener(t, (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data)
        broadcastEvent({ type: t, data } as InboxEvent)
      } catch {
        /* malformed event — ignore */
      }
    })
  }

  es.onerror = () => {
    sharedEs?.close()
    sharedEs = null
    lastDisconnectAt = Date.now()
    failures += 1
    if (failures >= 5 && fallbackTimer === null) {
      fallbackTimer = window.setInterval(() => broadcastResync(), 15000)
    }
    if (subscribers.size === 0) return
    const delay = Math.min(30000, 500 * 2 ** Math.min(failures, 6))
    reconnectTimer = window.setTimeout(openSse, delay)
  }
}

function closeSse() {
  clearReconnect()
  clearFallback()
  sharedEs?.close()
  sharedEs = null
  openedOnce = false
  failures = 0
  lastDisconnectAt = null
}

function installVisibilityHandler() {
  if (visibilityHandlerInstalled || typeof document === 'undefined') return
  visibilityHandlerInstalled = true
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      sharedEs === null &&
      subscribers.size > 0
    ) {
      openSse()
    }
  })
}

export function useInboxEvents(
  onEvent?: (e: InboxEvent) => void,
  onResync?: () => void,
) {
  const onEventRef = useRef(onEvent)
  const onResyncRef = useRef(onResync)
  onEventRef.current = onEvent
  onResyncRef.current = onResync

  useEffect(() => {
    installVisibilityHandler()
    const sub: Subscriber = {
      onEvent: (e) => onEventRef.current?.(e),
      onResync: () => onResyncRef.current?.(),
    }
    subscribers.add(sub)
    if (sharedEs === null) openSse()

    return () => {
      subscribers.delete(sub)
      if (subscribers.size === 0) closeSse()
    }
  }, [])
}
