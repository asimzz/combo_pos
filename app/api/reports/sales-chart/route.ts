import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = startOfDay(subDays(now, 29))

    const [orders, orderItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: thirtyDaysAgo },
            status: { not: 'CANCELLED' },
          },
        },
        select: {
          total: true,
          menuItem: {
            select: { category: { select: { name: true } } },
          },
        },
      }),
    ])

    // Group daily sales
    const salesByDate: Record<string, { total: number; orders: number }> = {}
    for (const order of orders) {
      const key = format(order.createdAt, 'yyyy-MM-dd')
      if (!salesByDate[key]) salesByDate[key] = { total: 0, orders: 0 }
      salesByDate[key].total += order.total
      salesByDate[key].orders += 1
    }

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now })
    const dailySales = days.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      return {
        date: key,
        label: format(day, 'MMM d'),
        total: Math.round((salesByDate[key]?.total ?? 0) * 100) / 100,
        orders: salesByDate[key]?.orders ?? 0,
      }
    })

    // Group by category
    const categoryMap: Record<string, { total: number; orders: number }> = {}
    for (const item of orderItems) {
      const cat = item.menuItem.category.name
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, orders: 0 }
      categoryMap[cat].total += item.total
      categoryMap[cat].orders += 1
    }

    const byCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        total: Math.round(data.total * 100) / 100,
        orders: data.orders,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ dailySales, byCategory })
  } catch (error) {
    console.error('Error fetching sales chart data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
