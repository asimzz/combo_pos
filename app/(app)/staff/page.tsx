'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { StaffManagement } from '@/components/manage/staff-management'
import SalaryManagement from '@/components/manage/salary-management'
import { useTabs, type TabDef } from '@/lib/use-tabs'

type TabType = 'staff' | 'salaries'

function StaffPageInner() {
  const tabs: TabDef<TabType>[] = [
    { id: 'staff', label: 'Staff' },
    { id: 'salaries', label: 'Salaries' },
  ]

  const { strip, activeTab } = useTabs<TabType>({
    tabs,
    defaultTab: 'staff',
  })

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-muted">
            Manage staff accounts and salary payments.
          </p>
        </div>

        <div className="mb-6">{strip}</div>

        <div className="rounded-xl border border-card-border bg-white">
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'salaries' && <SalaryManagement />}
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return <PageSkeleton columns={5} />
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/sell')
  }

  return (
    <Suspense fallback={<PageSkeleton columns={5} />}>
      <StaffPageInner />
    </Suspense>
  )
}
