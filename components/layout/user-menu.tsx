'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'

export function UserMenu() {
  const { data: session } = useSession()
  const [signingOut, setSigningOut] = useState(false)

  const name = session?.user?.name ?? 'User'
  const role = session?.user?.role ?? ''
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut({ callbackUrl: '/auth/signin' })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center gap-3 rounded-lg p-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{name}</div>
          {role && <div className="truncate text-xs text-white/50">{role}</div>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-busy={signingOut || undefined}
          aria-label="Sign out"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {signingOut ? <Spinner size="sm" tone="current" /> : <LogOut className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
