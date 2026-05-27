'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardStats, OrderWithItems } from '@/types'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { PopularItems } from '@/components/dashboard/popular-items'
import { SalesLineChart } from '@/components/reports/sales-line-chart'
import { CategoryBarChart } from '@/components/reports/category-bar-chart'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { toast } from 'sonner'

type ChartData = {
  dailySales: { date: string; label: string; total: number; orders: number }[]
  byCategory: { category: string; total: number; orders: number }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading' || !session) return
    if (session.user.role === 'STAFF') {
      redirect('/sell')
    }
  }, [session, status])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, chartRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/orders'),
        fetch('/api/reports/sales-chart'),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      else toast.error('Failed to load dashboard stats')

      if (ordersRes.ok) setOrders(await ordersRes.json())
      else toast.error('Failed to load orders')

      if (chartRes.ok) setChartData(await chartRes.json())
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

          {chartData && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SalesLineChart data={chartData.dailySales} />
              <CategoryBarChart data={chartData.byCategory} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {stats && <PopularItems items={stats.popularItems} />}
            <RecentOrders orders={orders.slice(0, 10)} />
          </div>
        </div>
      </div>
    </div>
  )
}
