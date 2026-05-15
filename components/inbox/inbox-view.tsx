'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  type InboxEvent,
  type Mode,
  type WireMessage,
  useInboxEvents,
} from '@/lib/hooks/use-inbox-events'
import { ThreadList } from './thread-list'
import { ThreadPane } from './thread-pane'
import type { Message, Thread, ThreadState } from './types'

type State = {
  threads: Thread[]
  listLoading: boolean
  selected: string | null
  byPhone: Record<string, ThreadState>
}

type Action =
  | { type: 'list/seed'; threads: Thread[] }
  | { type: 'list/loading'; loading: boolean }
  | { type: 'thread/select'; phone: string | null }
  | { type: 'thread/loading'; phone: string; loading: boolean }
  | { type: 'thread/seed'; phone: string; messages: Message[]; mode: Mode }
  | { type: 'event'; event: InboxEvent }
  | { type: 'send/optimistic'; phone: string; message: Message }
  | { type: 'send/failed'; phone: string; clientMsgId: string }

const initial: State = {
  threads: [],
  listLoading: true,
  selected: null,
  byPhone: {},
}

function bumpThread(threads: Thread[], patch: Partial<Thread> & { customer_id: string }): Thread[] {
  const idx = threads.findIndex((t) => t.customer_id === patch.customer_id)
  if (idx === -1) {
    const created: Thread = {
      customer_id: patch.customer_id,
      last_message_preview: patch.last_message_preview ?? '',
      last_message_at: patch.last_message_at ?? null,
      last_message_role: patch.last_message_role ?? null,
      mode: patch.mode ?? 'auto',
      unread: patch.unread ?? 0,
    }
    return sortByRecency([created, ...threads])
  }
  const merged: Thread = { ...threads[idx], ...stripUndefined(patch) }
  const next = threads.slice()
  next[idx] = merged
  return sortByRecency(next)
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v
  }
  return out
}

function sortByRecency(threads: Thread[]): Thread[] {
  return threads.slice().sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'list/loading':
      return { ...state, listLoading: action.loading }
    case 'list/seed':
      return { ...state, threads: sortByRecency(action.threads), listLoading: false }
    case 'thread/select':
      return { ...state, selected: action.phone }
    case 'thread/loading': {
      const existing = state.byPhone[action.phone] ?? { messages: [], mode: 'auto', loading: false }
      return {
        ...state,
        byPhone: { ...state.byPhone, [action.phone]: { ...existing, loading: action.loading } },
      }
    }
    case 'thread/seed':
      return {
        ...state,
        byPhone: {
          ...state.byPhone,
          [action.phone]: { messages: action.messages, mode: action.mode, loading: false },
        },
      }
    case 'send/optimistic': {
      const existing = state.byPhone[action.phone] ?? { messages: [], mode: 'auto', loading: false }
      return {
        ...state,
        byPhone: {
          ...state.byPhone,
          [action.phone]: { ...existing, messages: [...existing.messages, action.message] },
        },
      }
    }
    case 'send/failed': {
      const existing = state.byPhone[action.phone]
      if (!existing) return state
      const messages = existing.messages.map((m) =>
        m.client_msg_id === action.clientMsgId ? { ...m, pending: false, failed: true } : m,
      )
      return {
        ...state,
        byPhone: { ...state.byPhone, [action.phone]: { ...existing, messages } },
      }
    }
    case 'event':
      return applyEvent(state, action.event)
  }
}

function applyEvent(state: State, event: InboxEvent): State {
  switch (event.type) {
    case 'hello':
      return state
    case 'message.new': {
      const { customer_id, message } = event.data
      const existing = state.byPhone[customer_id]
      let byPhone = state.byPhone
      if (existing) {
        const cid = message.client_msg_id ?? null
        let replaced = false
        const messages = existing.messages.map((m) => {
          if (replaced) return m
          if (cid && m.client_msg_id === cid && m.pending) {
            replaced = true
            return { ...message }
          }
          if (
            m.pending &&
            m.role === message.role &&
            m.text === message.text
          ) {
            replaced = true
            return { ...message }
          }
          return m
        })
        if (!replaced) {
          const isDup = messages.some(
            (m) =>
              m.role === message.role &&
              m.text === message.text &&
              m.created_at === message.created_at &&
              !m.pending,
          )
          if (!isDup) messages.push({ ...message })
        }
        byPhone = { ...byPhone, [customer_id]: { ...existing, messages } }
      }
      return { ...state, byPhone }
    }
    case 'thread.updated': {
      const threads = bumpThread(state.threads, event.data)
      const next: State = { ...state, threads }
      if (event.data.mode !== undefined) {
        const existing = state.byPhone[event.data.customer_id]
        if (existing) {
          next.byPhone = {
            ...state.byPhone,
            [event.data.customer_id]: { ...existing, mode: event.data.mode },
          }
        }
      }
      return next
    }
    case 'mode.changed': {
      const threads = bumpThread(state.threads, {
        customer_id: event.data.customer_id,
        mode: event.data.mode,
      })
      const existing = state.byPhone[event.data.customer_id]
      const byPhone = existing
        ? {
            ...state.byPhone,
            [event.data.customer_id]: { ...existing, mode: event.data.mode },
          }
        : state.byPhone
      return { ...state, threads, byPhone }
    }
    case 'read.updated':
      return {
        ...state,
        threads: bumpThread(state.threads, {
          customer_id: event.data.customer_id,
          unread: 0,
        }),
      }
  }
}

async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch('/api/inbox', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.threads) ? data.threads : []
}

async function fetchMessages(phone: string): Promise<{ messages: WireMessage[]; mode: Mode }> {
  const res = await fetch(`/api/inbox/${encodeURIComponent(phone)}`, { cache: 'no-store' })
  if (!res.ok) return { messages: [], mode: 'auto' }
  const data = await res.json()
  return {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    mode: (data?.mode as Mode) ?? 'auto',
  }
}

async function postRead(phone: string): Promise<void> {
  try {
    await fetch(`/api/inbox/${encodeURIComponent(phone)}/read`, { method: 'POST' })
  } catch {
    /* SSE will reconcile */
  }
}

export function InboxView() {
  const [state, dispatch] = useReducer(reducer, initial)
  const selectedRef = useRef(state.selected)
  selectedRef.current = state.selected

  const reseedList = useCallback(async () => {
    const threads = await fetchThreads()
    dispatch({ type: 'list/seed', threads })
  }, [])

  const reseedThread = useCallback(async (phone: string) => {
    dispatch({ type: 'thread/loading', phone, loading: true })
    const { messages, mode } = await fetchMessages(phone)
    dispatch({ type: 'thread/seed', phone, messages, mode })
  }, [])

  useEffect(() => {
    reseedList()
  }, [reseedList])

  useEffect(() => {
    if (!state.selected) return
    const phone = state.selected
    reseedThread(phone)
    postRead(phone)
  }, [state.selected, reseedThread])

  const onEvent = useCallback((event: InboxEvent) => {
    dispatch({ type: 'event', event })
    if (
      event.type === 'message.new' &&
      event.data.message.role === 'customer' &&
      event.data.customer_id === selectedRef.current &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      postRead(event.data.customer_id)
    }
  }, [])

  const onResync = useCallback(() => {
    reseedList()
    if (selectedRef.current) reseedThread(selectedRef.current)
  }, [reseedList, reseedThread])

  useInboxEvents(onEvent, onResync)

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] gap-4">
      <div className="w-80 shrink-0">
        <ThreadList
          threads={state.threads}
          loading={state.listLoading}
          selected={state.selected}
          onSelect={(phone) => dispatch({ type: 'thread/select', phone })}
        />
      </div>
      <ThreadPane
        phone={state.selected}
        threadState={state.selected ? state.byPhone[state.selected] : undefined}
        onOptimistic={(phone, message) => dispatch({ type: 'send/optimistic', phone, message })}
        onSendFailed={(phone, clientMsgId) => dispatch({ type: 'send/failed', phone, clientMsgId })}
      />
    </div>
  )
}
