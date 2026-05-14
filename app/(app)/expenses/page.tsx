'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { MaterialManagement } from '@/components/manage/material-management'
import { ExpenseManagement } from '@/components/manage/expense-management'
import { useTabs, type TabDef } from '@/lib/use-tabs'

type TabType = 'raw-materials' | 'general'

function ExpensesPageInner() {
  const tabs: TabDef<TabType>[] = [
    { id: 'raw-materials', label: 'Raw Materials' },
    { id: 'general', label: 'General Expenses' },
  ]

  const { strip, activeTab } = useTabs<TabType>({
    tabs,
    defaultTab: 'raw-materials',
  })

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-muted">
            Track raw material purchases and general business expenses.
          </p>
        </div>

        <div className="mb-6">{strip}</div>

        <div className="rounded-xl border border-card-border bg-white">
          {activeTab === 'raw-materials' && <MaterialManagement />}
          {activeTab === 'general' && <ExpenseManagement />}
        </div>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
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
      <ExpensesPageInner />
    </Suspense>
  )
}
