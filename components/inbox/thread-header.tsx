'use client'

import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Mode } from '@/lib/hooks/use-inbox-events'
import { Avatar } from './avatar'
import { ChannelBadge } from './channel-badge'
import { formatPhoneDisplay } from './utils'

export function ThreadHeader({
  phone,
  mode,
  onModeChange,
}: {
  phone: string
  mode: Mode
  onModeChange: (mode: Mode) => void
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-card-border bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative">
          <Avatar phone={phone} size="md" />
          <ChannelBadge variant="dot" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">
            {formatPhoneDisplay(phone)}
          </div>
        </div>
      </div>

      <div
        role="group"
        aria-label="Reply mode"
        className="inline-flex shrink-0 rounded-full border border-card-border bg-gray-50 p-0.5 text-xs"
      >
        <ModeButton
          active={mode === 'auto'}
          onClick={() => mode !== 'auto' && onModeChange('auto')}
          icon={<Bot className="h-3.5 w-3.5" />}
          label="AI Auto"
        />
        <ModeButton
          active={mode === 'manual'}
          onClick={() => mode !== 'manual' && onModeChange('manual')}
          icon={<User className="h-3.5 w-3.5" />}
          label="Manual"
        />
      </div>
    </header>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors',
        active
          ? 'bg-white text-primary-700 shadow-sm ring-1 ring-card-border'
          : 'text-muted hover:text-gray-700',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
