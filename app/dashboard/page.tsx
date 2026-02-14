'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardStats, OrderWithItems } from '@/types'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { PopularItems } from '@/components/dashboard/popular-items'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role === 'STAFF') {
      redirect('/pos')
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
        <div className="space-y-8">
          {/* Stats Cards */}
          {stats && <StatsCards stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Items */}
            {stats && <PopularItems items={stats.popularItems} />}

            {/* Recent Orders */}
            <RecentOrders orders={orders.slice(0, 10)} />
          </div>
        </div>
      </div>
    </div>
  )
}