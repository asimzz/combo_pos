import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    // Today's orders and sales
    const todayStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart },
        status: { not: 'CANCELLED' }
      },
      _count: true,
      _sum: {
        total: true
      }
    })

    // Week sales
    const weekStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: weekStart },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        total: true
      }
    })

    // Month sales
    const monthStats = await prisma.order.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        total: true
      }
    })

    // Popular items (top 5)
    const popularItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: popularItems.map(item => item.menuItemId) }
      }
    })

    const popularItemsWithNames = popularItems.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
      return {
        name: menuItem?.name || 'Unknown',
        quantity: item._sum.quantity || 0
      }
    })

    return NextResponse.json({
      todayOrders: todayStats._count || 0,
      todaySales: Number(todayStats._sum.total || 0),
      weekSales: Number(weekStats._sum.total || 0),
      monthSales: Number(monthStats._sum.total || 0),
      popularItems: popularItemsWithNames
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}