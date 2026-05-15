import type { WireMessage } from '@/lib/hooks/use-inbox-events'

export type MessageLike = WireMessage & {
  pending?: boolean
  failed?: boolean
}

const CONSECUTIVE_WINDOW_MS = 2 * 60_000

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, (Date.now() - then) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d`
  const d = new Date(then)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDateDivider(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  const sameYear = d.getFullYear() === today.getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}

function dayKey(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function isConsecutive(
  prev: MessageLike | undefined,
  current: MessageLike | undefined,
): boolean {
  if (!prev || !current) return false
  if (prev.role !== current.role) return false
  if (prev.role === 'tool' || current.role === 'tool') return false
  if (!prev.created_at || !current.created_at) return false
  const prevT = Date.parse(prev.created_at)
  const curT = Date.parse(current.created_at)
  if (Number.isNaN(prevT) || Number.isNaN(curT)) return false
  return curT - prevT <= CONSECUTIVE_WINDOW_MS
}

export function shouldShowDateDivider(
  prev: MessageLike | undefined,
  current: MessageLike,
): boolean {
  if (!current.created_at) return false
  if (!prev) return true
  return dayKey(prev.created_at) !== dayKey(current.created_at)
}

export function initialsFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 2) return digits.slice(-2)
  if (digits.length === 1) return digits
  const letters = phone.replace(/[^a-zA-Z]/g, '')
  return letters.slice(0, 2).toUpperCase() || '#'
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+') && cleaned.length > 4) {
    const cc = cleaned.slice(0, cleaned.length - 9 > 0 ? cleaned.length - 9 : 4)
    const rest = cleaned.slice(cc.length)
    const grouped = rest.replace(/(\d{3})(?=\d)/g, '$1 ')
    return `${cc} ${grouped}`.trim()
  }
  return phone
}
