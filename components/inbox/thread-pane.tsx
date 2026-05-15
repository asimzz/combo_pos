'use client'

import type { Mode } from '@/lib/hooks/use-inbox-events'
import { Composer } from './composer'
import { NoConversationSelected } from './empty-states'
import { MessageList } from './message-list'
import { ThreadHeader } from './thread-header'
import type { Message, ThreadState } from './types'

export function ThreadPane({
  phone,
  threadState,
  onOptimistic,
  onSendFailed,
}: {
  phone: string | null
  threadState: ThreadState | undefined
  onOptimistic: (phone: string, message: Message) => void
  onSendFailed: (phone: string, clientMsgId: string) => void
}) {
  if (!phone) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-card-border bg-white">
        <NoConversationSelected />
      </div>
    )
  }

  const messages = threadState?.messages ?? []
  const mode: Mode = threadState?.mode ?? 'auto'
  const loading = threadState?.loading ?? true

  const send = async (text: string) => {
    const clientMsgId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    onOptimistic(phone, {
      role: 'staff',
      text,
      created_at: new Date().toISOString(),
      tool_name: null,
      staff_name: null,
      client_msg_id: clientMsgId,
      pending: true,
    })

    try {
      const res = await fetch(`/api/inbox/${encodeURIComponent(phone)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, client_msg_id: clientMsgId }),
      })
      if (!res.ok) onSendFailed(phone, clientMsgId)
    } catch {
      onSendFailed(phone, clientMsgId)
    }
  }

  const onModeChange = async (next: Mode) => {
    await fetch(`/api/inbox/${encodeURIComponent(phone)}/mode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: next }),
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-card-border bg-white">
      <ThreadHeader phone={phone} mode={mode} onModeChange={onModeChange} />
      <MessageList messages={messages} loading={loading} resetKey={phone} />
      <Composer phone={phone} onSend={send} />
    </div>
  )
}
