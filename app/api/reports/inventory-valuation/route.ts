import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const materials = await prisma.rawMaterial.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        unit: true,
        stock: true,
        cost: true,
        materialCategories: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const items = materials.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      category: m.materialCategories?.name ?? 'Uncategorised',
      stock: m.stock,
      costPerUnit: m.cost,
      totalValue: Math.round(m.stock * m.cost * 100) / 100,
    }))

    const totalValue = Math.round(items.reduce((s, i) => s + i.totalValue, 0) * 100) / 100

    // Build 30-day historical trend from daily snapshots
    const since = format(subDays(new Date(), 29), 'yyyy-MM-dd')
    const snapshots = await prisma.dailyStockSnapshot.findMany({
      where: { date: { gte: since } },
      select: {
        date: true,
        closingStock: true,
        rawMaterial: { select: { cost: true } },
      },
    })

    const trendMap: Record<string, number> = {}
    for (const snap of snapshots) {
      if (!trendMap[snap.date]) trendMap[snap.date] = 0
      trendMap[snap.date] += snap.closingStock * snap.rawMaterial.cost
    }

    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))

    // Group by category for summary
    const byCategory: Record<string, { category: string; totalValue: number; items: number }> = {}
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = { category: item.category, totalValue: 0, items: 0 }
      byCategory[item.category].totalValue += item.totalValue
      byCategory[item.category].items += 1
    }

    return NextResponse.json({
      totalValue,
      items,
      trend,
      byCategory: Object.values(byCategory).sort((a, b) => b.totalValue - a.totalValue),
    })
  } catch (error) {
    console.error('Error fetching inventory valuation:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
