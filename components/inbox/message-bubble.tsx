'use client'

import { AlertCircle, Check, Clock, FileText, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttachmentWire, Message } from './types'
import { formatTime } from './utils'

export function MessageBubble({
  message,
  consecutive,
  isLastInGroup,
}: {
  message: Message
  consecutive: boolean
  isLastInGroup: boolean
}) {
  const isInbound = message.role === 'customer'
  const isStaff = message.role === 'staff'
  const isAgent = message.role === 'agent'
  const attachment = message.attachment ?? null
  const hasText = !!message.text && message.text.trim().length > 0
  const isMediaOnly = !!attachment && !hasText
  const isSticker = attachment?.kind === 'sticker'

  const bubbleClasses = cn(
    'inline-block max-w-full text-sm shadow-sm',
    isMediaOnly && !isSticker ? 'overflow-hidden rounded-2xl' : 'rounded-3xl',
    !isMediaOnly && 'px-3.5 py-2',
    isSticker && 'bg-transparent shadow-none',
    !isSticker &&
      isInbound &&
      cn(
        'border border-card-border bg-white text-gray-900',
        consecutive ? 'rounded-bl-3xl' : 'rounded-bl-md',
      ),
    !isSticker &&
      isStaff &&
      cn(
        'border border-secondary-200 bg-secondary-50 text-gray-900',
        consecutive ? 'rounded-br-3xl' : 'rounded-br-md',
      ),
    !isSticker &&
      isAgent &&
      cn(
        'bg-primary-500 text-white',
        consecutive ? 'rounded-br-3xl' : 'rounded-br-md',
      ),
    message.pending && 'opacity-70',
    message.failed && 'ring-1 ring-red-400',
  )

  return (
    <div
      className={cn(
        'flex w-full',
        isInbound ? 'justify-start' : 'justify-end',
        consecutive ? 'mt-0.5' : 'mt-3',
      )}
    >
      <div className={cn('flex max-w-[78%] flex-col', isInbound ? 'items-start' : 'items-end')}>
        {isStaff && message.staff_name && !consecutive ? (
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {message.staff_name}
          </span>
        ) : null}
        {isAgent && !consecutive ? (
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary-600">
            AI Agent
          </span>
        ) : null}

        <div className={bubbleClasses}>
          {attachment ? <Attachment attachment={attachment} /> : null}
          {hasText ? (
            <p
              dir="auto"
              className={cn(
                'whitespace-pre-wrap break-words leading-relaxed [unicode-bidi:plaintext]',
                attachment && !isSticker && 'px-3 py-2',
              )}
            >
              {message.text}
            </p>
          ) : null}
        </div>

        {isLastInGroup ? (
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-[10px] tabular-nums text-muted',
              isInbound ? 'justify-start' : 'justify-end',
            )}
          >
            {message.created_at ? <span>{formatTime(message.created_at)}</span> : null}
            {message.pending ? (
              <Clock aria-hidden className="h-3 w-3" />
            ) : message.failed ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-red-500">
                <AlertCircle aria-hidden className="h-3 w-3" />
                failed
              </span>
            ) : !isInbound ? (
              <Check aria-hidden className="h-3 w-3 text-primary-500" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Attachment({ attachment }: { attachment: AttachmentWire }) {
  const src = `/api/inbox/media/${encodeURIComponent(attachment.media_id)}`

  if (attachment.kind === 'image' || attachment.kind === 'sticker') {
    const isSticker = attachment.kind === 'sticker'
    return (
      <img
        src={src}
        alt={attachment.caption ?? ''}
        loading="lazy"
        className={cn(
          'block h-auto w-full object-cover',
          isSticker ? 'max-w-[160px] bg-transparent' : 'max-w-[320px]',
        )}
      />
    )
  }

  if (attachment.kind === 'video') {
    return (
      <video
        controls
        preload="metadata"
        src={src}
        className="block h-auto w-full max-w-[320px]"
      />
    )
  }

  if (attachment.kind === 'audio') {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        {attachment.voice ? <Mic aria-hidden className="h-4 w-4 text-muted" /> : null}
        <audio controls preload="metadata" src={src} className="w-full" />
      </div>
    )
  }

  if (attachment.kind === 'document') {
    return (
      <a
        href={src}
        download={attachment.filename ?? undefined}
        className="flex items-center gap-2 px-3 py-2 text-current underline-offset-2 hover:underline"
      >
        <FileText aria-hidden className="h-5 w-5 shrink-0" />
        <span className="min-w-0 truncate">
          {attachment.filename ?? attachment.mime_type}
        </span>
      </a>
    )
  }

  return null
}
