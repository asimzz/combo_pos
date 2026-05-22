import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 365)

    const since = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')

    const snapshots = await prisma.dailyItemStockSnapshot.findMany({
      where: { date: { gte: since } },
      select: {
        date: true,
        wasteQuantity: true,
        openingStock: true,
        soldQuantity: true,
        menuItem: { select: { name: true, category: { select: { name: true } } } },
      },
    })

    const itemMap: Record<
      string,
      { name: string; category: string; totalWaste: number; totalOpening: number; days: number }
    > = {}

    for (const s of snapshots) {
      const key = s.menuItem.name
      if (!itemMap[key]) {
        itemMap[key] = { name: s.menuItem.name, category: s.menuItem.category.name, totalWaste: 0, totalOpening: 0, days: 0 }
      }
      itemMap[key].totalWaste += s.wasteQuantity ?? 0
      itemMap[key].totalOpening += s.openingStock ?? 0
      itemMap[key].days += 1
    }

    const items = Object.values(itemMap)
      .filter((i) => i.totalOpening > 0)
      .map((i) => ({
        name: i.name,
        category: i.category,
        totalWaste: Math.round(i.totalWaste * 100) / 100,
        totalOpening: Math.round(i.totalOpening * 100) / 100,
        wastePercent: Math.round((i.totalWaste / i.totalOpening) * 1000) / 10,
        days: i.days,
      }))
      .sort((a, b) => b.wastePercent - a.wastePercent)

    const totalWaste = items.reduce((s, i) => s + i.totalWaste, 0)
    const totalOpening = items.reduce((s, i) => s + i.totalOpening, 0)
    const overallWastePct = totalOpening > 0 ? Math.round((totalWaste / totalOpening) * 1000) / 10 : 0

    return NextResponse.json({ items, totalWaste, totalOpening, overallWastePct, days })
  } catch (error) {
    console.error('Error fetching waste report:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
