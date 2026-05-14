'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { MenuManagement } from '@/components/manage/menu-management'
import { CategoryManagement } from '@/components/manage/category-management'
import { useTabs, type TabDef } from '@/lib/use-tabs'

type TabType = 'items' | 'categories'

function CatalogPageInner() {
  const tabs: TabDef<TabType>[] = [
    { id: 'items', label: 'Items' },
    { id: 'categories', label: 'Categories' },
  ]

  const { strip, activeTab } = useTabs<TabType>({
    tabs,
    defaultTab: 'items',
  })

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="mt-1 text-sm text-muted">
            Manage menu items and categories.
          </p>
        </div>

        <div className="mb-6">{strip}</div>

        <div className="rounded-xl border border-card-border bg-white">
          {activeTab === 'items' && <MenuManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <PageSkeleton columns={5} />
  }

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role === 'STAFF') {
    redirect('/sell')
  }

  return (
    <Suspense fallback={<PageSkeleton columns={5} />}>
      <CatalogPageInner />
    </Suspense>
  )
}
