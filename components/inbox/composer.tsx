'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const MAX_ROWS = 6
const LINE_HEIGHT = 20
const MAX_HEIGHT = LINE_HEIGHT * MAX_ROWS

export function Composer({
  phone,
  disabled,
  onSend,
}: {
  phone: string
  disabled?: boolean
  onSend: (text: string) => Promise<void> | void
}) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft('')
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }, [phone])

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = `${LINE_HEIGHT}px`
    if (draft.length === 0) return
    const next = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${next}px`
  }, [draft])

  const submit = async () => {
    const text = draft.trim()
    if (!text || sending || disabled) return
    setSending(true)
    setDraft('')
    try {
      await onSend(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-card-border bg-white px-4 py-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border border-card-border bg-white px-4 py-2 transition-colors',
          'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
        )}
      >
        <textarea
          ref={textareaRef}
          dir="auto"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          disabled={disabled || sending}
          placeholder="Type a reply…"
          className="block flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-5 text-gray-900 placeholder:text-muted focus:outline-none focus:ring-0 disabled:opacity-60"
          style={{ height: LINE_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || sending || draft.trim().length === 0}
          aria-label="Send"
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            draft.trim().length === 0 || disabled
              ? 'bg-gray-100 text-muted'
              : 'bg-primary-500 text-white hover:bg-primary-600',
            'disabled:cursor-not-allowed',
          )}
        >
          {sending ? <Spinner size="sm" tone="current" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
