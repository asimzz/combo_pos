import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const startStr = searchParams.get('startDate')
    const endStr = searchParams.get('endDate')

    const start = startStr ? startOfDay(parseISO(startStr)) : startOfDay(subDays(new Date(), 29))
    const end = endStr ? endOfDay(parseISO(endStr)) : new Date()

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      select: {
        total: true,
        userId: true,
        user: { select: { id: true, name: true, role: true } },
      },
    })

    const staffMap: Record<string, { name: string; role: string; totalOrders: number; totalRevenue: number }> = {}
    for (const order of orders) {
      const id = order.userId
      if (!staffMap[id]) {
        staffMap[id] = { name: order.user.name, role: order.user.role, totalOrders: 0, totalRevenue: 0 }
      }
      staffMap[id].totalOrders += 1
      staffMap[id].totalRevenue += order.total
    }

    const staff = Object.values(staffMap)
      .map((s) => ({
        ...s,
        totalRevenue: Math.round(s.totalRevenue * 100) / 100,
        avgOrderValue: s.totalOrders > 0 ? Math.round((s.totalRevenue / s.totalOrders) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error fetching staff performance:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
