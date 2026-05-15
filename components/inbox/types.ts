import type {
  AttachmentKind,
  AttachmentWire,
  Mode,
  Role,
  WireMessage,
} from '@/lib/hooks/use-inbox-events'

export type { AttachmentKind, AttachmentWire }

export type Message = WireMessage & {
  pending?: boolean
  failed?: boolean
}

export type Thread = {
  customer_id: string
  last_message_preview: string
  last_message_at: string | null
  last_message_role: Role | null
  mode: Mode
  unread: number
}

export type ThreadState = {
  messages: Message[]
  mode: Mode
  loading: boolean
}

export type StatusFilter = 'all' | 'auto' | 'manual' | 'unread'
