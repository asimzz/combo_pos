'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SyncManager } from '@/components/admin/sync-manager'

export default function SyncPage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role === 'STAFF') {
      redirect('/pos')
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Data Synchronization</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your offline data and sync to the cloud when internet is available.
          </p>
        </div>

        <SyncManager />
      </div>
    </div>
  )
}