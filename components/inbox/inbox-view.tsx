'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type Role = 'customer' | 'agent' | 'staff' | 'tool'
type Mode = 'auto' | 'manual'

type Thread = {
  customer_id: string
  last_message_preview: string
  last_message_at: string | null
  last_message_role: Role | null
  mode: Mode
  unread: number
}

type Message = {
  role: Role
  text: string
  created_at: string | null
  tool_name: string | null
  staff_name: string | null
}

const POLL_LIST_MS = 3000
const POLL_THREAD_MS = 2000

export function InboxView() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setThreads(Array.isArray(data?.threads) ? data.threads : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThreads()
    const id = setInterval(fetchThreads, POLL_LIST_MS)
    return () => clearInterval(id)
  }, [fetchThreads])

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[480px] grid-cols-[320px_1fr]">
      <ThreadList
        threads={threads}
        loading={loading}
        selected={selected}
        onSelect={setSelected}
      />
      <ThreadPane
        phone={selected}
        onSent={fetchThreads}
        onModeChange={fetchThreads}
      />
    </div>
  )
}

function ThreadList({
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
  if (loading) {
    return (
      <div className="flex items-center justify-center border-r border-card-border">
        <Spinner />
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 border-r border-card-border p-6 text-center text-sm text-muted">
        <MessageCircle className="h-6 w-6 text-muted" />
        <span>No conversations yet.</span>
        <span className="text-xs">When customers message on WhatsApp, they&apos;ll show up here.</span>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto border-r border-card-border">
      {threads.map((t) => (
        <button
          key={t.customer_id}
          onClick={() => onSelect(t.customer_id)}
          className={cn(
            'flex w-full flex-col items-start gap-1 border-b border-card-border px-4 py-3 text-left transition-colors',
            selected === t.customer_id ? 'bg-surface' : 'hover:bg-surface/60',
          )}
        >
          <div className="flex w-full items-center gap-2">
            <span className="flex-1 truncate text-sm font-medium text-gray-900">
              {t.customer_id}
            </span>
            <Badge size="sm" variant={t.mode === 'auto' ? 'info' : 'warning'}>
              {t.mode === 'auto' ? 'AUTO' : 'MANUAL'}
            </Badge>
            {t.unread > 0 ? (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-semibold text-white">
                {t.unread > 99 ? '99+' : t.unread}
              </span>
            ) : null}
          </div>
          <div className="w-full truncate text-xs text-muted">
            {t.last_message_preview || '—'}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted">
            {formatRelative(t.last_message_at)}
          </div>
        </button>
      ))}
    </div>
  )
}

function ThreadPane({
  phone,
  onSent,
  onModeChange,
}: {
  phone: string | null
  onSent: () => void
  onModeChange: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [mode, setMode] = useState<Mode>('auto')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!phone) return
    const res = await fetch(`/api/inbox/${encodeURIComponent(phone)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return
    const data = await res.json()
    setMessages(Array.isArray(data?.messages) ? data.messages : [])
    setMode((data?.mode as Mode) ?? 'auto')
  }, [phone])

  useEffect(() => {
    if (!phone) {
      setMessages([])
      return
    }
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))

    // Mark thread read when opening.
    fetch(`/api/inbox/${encodeURIComponent(phone)}/read`, { method: 'POST' })
      .catch(() => undefined)
      .finally(onSent)

    const id = setInterval(() => {
      fetchMessages()
      fetch(`/api/inbox/${encodeURIComponent(phone)}/read`, { method: 'POST' }).catch(
        () => undefined,
      )
    }, POLL_THREAD_MS)
    return () => clearInterval(id)
  }, [phone, fetchMessages, onSent])

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, phone])

  if (!phone) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
        <MessageCircle className="h-7 w-7 text-muted" />
        <span>Pick a conversation to view messages.</span>
      </div>
    )
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/inbox/${encodeURIComponent(phone)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setDraft('')
        await fetchMessages()
        onSent()
      }
    } finally {
      setSending(false)
    }
  }

  const toggleMode = async () => {
    const next: Mode = mode === 'auto' ? 'manual' : 'auto'
    const res = await fetch(`/api/inbox/${encodeURIComponent(phone)}/mode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: next }),
    })
    if (res.ok) {
      setMode(next)
      onModeChange()
    }
  }

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-card-border px-5 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{phone}</div>
          <div className="text-xs text-muted">
            {mode === 'auto' ? 'AI agent is replying automatically.' : 'You are replying manually. Agent paused.'}
          </div>
        </div>
        <Button
          variant={mode === 'auto' ? 'outline' : 'secondary'}
          size="sm"
          onClick={toggleMode}
        >
          Auto-reply: {mode === 'auto' ? 'ON' : 'OFF'}
        </Button>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-surface/30 px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">No messages yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-card-border px-5 py-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Type a reply to send via WhatsApp..."
          disabled={sending}
        />
        <Button onClick={send} loading={sending} leftIcon={<Send className="h-4 w-4" />}>
          Send
        </Button>
      </div>
    </div>
  )
}

function Bubble({ message }: { message: Message }) {
  if (message.role === 'tool') {
    return (
      <div className="self-center rounded-md bg-gray-100 px-3 py-1 text-[11px] text-muted">
        tool: {message.tool_name ?? 'call'}
      </div>
    )
  }

  const isInbound = message.role === 'customer'
  const isStaff = message.role === 'staff'

  return (
    <div className={cn('flex', isInbound ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
          isInbound
            ? 'bg-white text-gray-900 border border-card-border'
            : isStaff
              ? 'bg-secondary-100 text-gray-900'
              : 'bg-primary-500 text-white',
        )}
      >
        {isStaff && message.staff_name ? (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
            {message.staff_name} (staff)
          </div>
        ) : null}
        <div className="whitespace-pre-wrap">{message.text}</div>
        {message.created_at ? (
          <div
            className={cn(
              'mt-1 text-[10px]',
              isInbound ? 'text-muted' : isStaff ? 'text-gray-600' : 'text-white/70',
            )}
          >
            {formatTime(message.created_at)}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, (Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86_400)}d ago`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
