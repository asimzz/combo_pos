'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function SettingsPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <PageSkeleton rows={3} columns={2} />
  }

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/sell')
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Configure restaurant preferences and system settings.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Settings</h3>
          <p className="mt-1 text-sm text-muted">Settings management coming soon…</p>
        </div>
      </div>
    </div>
  )
}
