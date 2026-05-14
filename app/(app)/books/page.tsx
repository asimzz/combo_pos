'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { CreditBook } from '@/components/manage/credit-book'
import { DebtBook } from '@/components/manage/debt-book'
import { useTabs, type TabDef } from '@/lib/use-tabs'

type TabType = 'credits' | 'debts'

function BooksPageInner() {
  const tabs: TabDef<TabType>[] = [
    { id: 'credits', label: 'Credits' },
    { id: 'debts', label: 'Debts' },
  ]

  const { strip, activeTab } = useTabs<TabType>({
    tabs,
    defaultTab: 'credits',
  })

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Books</h1>
          <p className="mt-1 text-sm text-muted">
            Track customer credits and outstanding debts.
          </p>
        </div>

        <div className="mb-6">{strip}</div>

        <div className="rounded-xl border border-card-border bg-white">
          {activeTab === 'credits' && <CreditBook />}
          {activeTab === 'debts' && <DebtBook />}
        </div>
      </div>
    </div>
  )
}

export default function BooksPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <PageSkeleton columns={4} />
  }

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/sell')
  }

  return (
    <Suspense fallback={<PageSkeleton columns={4} />}>
      <BooksPageInner />
    </Suspense>
  )
}
