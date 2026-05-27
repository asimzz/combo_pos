'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { StockManagement } from '@/components/manage/stock-management'

function StockPageInner() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="mt-1 text-sm text-muted">
            Daily menu item counts — open at the start of service, close at the end.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-white">
          <StockManagement />
        </div>
      </div>
    </div>
  )
}

export default function StockPage() {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <PageSkeleton columns={4} />
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    redirect('/sell')
  }

  return (
    <Suspense fallback={<PageSkeleton columns={4} />}>
      <StockPageInner />
    </Suspense>
  )
}
