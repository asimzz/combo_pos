'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { BusinessSettings } from '@/components/settings/business-settings'
import { PaymentSettings } from '@/components/settings/payment-settings'
import { ReceiptSettings } from '@/components/settings/receipt-settings'
import { CategoriesSettings } from '@/components/settings/categories-settings'
import { HoursSettings } from '@/components/settings/hours-settings'
import { PromotionsSettings } from '@/components/settings/promotions-settings'
import { useTabs, type TabDef } from '@/lib/use-tabs'

type TabType = 'business' | 'payments' | 'receipt' | 'categories' | 'hours' | 'promotions'

function SettingsPageInner() {
  const tabs: TabDef<TabType>[] = [
    { id: 'business', label: 'Business' },
    { id: 'payments', label: 'Payments' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'categories', label: 'Categories' },
    { id: 'hours', label: 'Hours' },
    { id: 'promotions', label: 'Promotions' },
  ]

  const { strip, activeTab } = useTabs<TabType>({ tabs, defaultTab: 'business' })

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Configure restaurant preferences and system settings.
          </p>
        </div>

        <div className="mb-6">{strip}</div>

        <div className="rounded-xl border border-card-border bg-white">
          {activeTab === 'business' && <BusinessSettings />}
          {activeTab === 'payments' && <PaymentSettings />}
          {activeTab === 'receipt' && <ReceiptSettings />}
          {activeTab === 'categories' && <CategoriesSettings />}
          {activeTab === 'hours' && <HoursSettings />}
          {activeTab === 'promotions' && <PromotionsSettings />}
        </div>
      </div>
    </div>
  )
}

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
    <Suspense fallback={<PageSkeleton rows={3} columns={2} />}>
      <SettingsPageInner />
    </Suspense>
  )
}
