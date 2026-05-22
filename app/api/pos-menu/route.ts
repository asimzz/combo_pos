import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export async function GET() {
  try {
    const today = todayDate()

    const [categories, itemSnapshots, rawMaterialUsages, poolStocks] = await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        include: {
          items: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // Per-item stock snapshots (non-recipe items)
      prisma.dailyItemStockSnapshot.findMany({
        where: { date: today },
        select: { menuItemId: true, currentStock: true },
      }),
      // Recipes: which raw materials each menu item uses
      prisma.rawMaterialUsage.findMany({
        select: { menuItemId: true, rawMaterialId: true, quantity: true },
      }),
      // Pool stocks: today's raw material daily stock
      prisma.rawMaterialDailyStock.findMany({
        where: { date: today },
        select: { rawMaterialId: true, currentStock: true },
      }),
    ])

    // Build lookup maps
    const snapshotMap = new Map(itemSnapshots.map((s) => [s.menuItemId, s.currentStock]))
    const poolMap = new Map(poolStocks.map((p) => [p.rawMaterialId, p.currentStock]))

    // Group recipe usages by menuItemId
    const usagesByItem = new Map<string, { rawMaterialId: string; quantity: number }[]>()
    for (const u of rawMaterialUsages) {
      if (!usagesByItem.has(u.menuItemId)) usagesByItem.set(u.menuItemId, [])
      usagesByItem.get(u.menuItemId)!.push({ rawMaterialId: u.rawMaterialId, quantity: u.quantity })
    }

    const result = categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const usages = usagesByItem.get(item.id)

        if (usages && usages.length > 0) {
          // Recipe item: derive canMake from pool stocks
          // Only raw materials that have a pool stock entry are limiting; others are unlimited
          let canMake: number | null = null
          for (const usage of usages) {
            const poolCurrent = poolMap.get(usage.rawMaterialId)
            if (poolCurrent !== undefined && usage.quantity > 0) {
              const portions = Math.max(0, Math.floor(poolCurrent / usage.quantity))
              canMake = Math.min(canMake ?? Infinity, portions)
            }
          }
          return { ...item, stock: canMake }
        } else {
          // Per-item: read directly from snapshot
          const current = snapshotMap.get(item.id)
          return {
            ...item,
            stock: current != null ? Math.max(0, current) : null,
          }
        }
      }),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching POS menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}
