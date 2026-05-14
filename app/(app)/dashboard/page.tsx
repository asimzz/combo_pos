'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardStats, OrderWithItems } from '@/types'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { PopularItems } from '@/components/dashboard/popular-items'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role === 'STAFF') {
      redirect('/sell')
    }
  }, [session, status])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/orders')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        toast.error('Failed to load dashboard stats')
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Sales overview and recent activity</p>
        </div>
        <div className="space-y-6">
          {stats && <StatsCards stats={stats} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {stats && <PopularItems items={stats.popularItems} />}
            <RecentOrders orders={orders.slice(0, 10)} />
          </div>
        </div>
      </div>
    </div>
  )
}