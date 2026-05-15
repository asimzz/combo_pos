'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { InboxView } from '@/components/inbox/inbox-view'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'

export default function InboxPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <PageSkeleton columns={2} />
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="mt-1 text-sm text-muted">
            WhatsApp conversations with customers. Toggle auto-reply off to take
            over manually.
          </p>
        </div>

        <InboxView />
      </div>
    </div>
  )
}
