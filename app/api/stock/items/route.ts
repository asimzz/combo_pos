import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function previousDate(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const today = searchParams.get('date') ?? todayDate()
    const yesterday = previousDate(today)

    const startOfToday = new Date(today + 'T00:00:00Z')
    const startOfTomorrow = new Date(today + 'T00:00:00Z')
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1)

    const itemSelect = {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
      rawMaterialUsage: {
        select: {
          quantity: true,
          rawMaterial: { select: { id: true, stock: true } },
        },
      },
    } as const

    const [nonRecipeItems, recipeItemsWithSnapshot, todaySnapshots, yesterdaySnapshots, todayOrderItems, rawMaterials] = await Promise.all([
      // Non-recipe items — always shown
      prisma.menuItem.findMany({
        where: { active: true, rawMaterialUsage: { none: {} } },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        select: itemSelect,
      }),
      // Recipe items that have been converted (have snapshot for today)
      prisma.menuItem.findMany({
        where: { active: true, rawMaterialUsage: { some: {} }, dailyItemSnapshots: { some: { date: today } } },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        select: itemSelect,
      }),
      prisma.dailyItemStockSnapshot.findMany({ where: { date: today } }),
      prisma.dailyItemStockSnapshot.findMany({ where: { date: yesterday } }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: { order: { createdAt: { gte: startOfToday, lt: startOfTomorrow }, status: 'COMPLETED' } },
        _sum: { quantity: true },
      }),
      prisma.rawMaterial.findMany({
        where: { active: true },
        select: { id: true, stock: true },
      }),
    ])

    const rawMaterialStockMap = new Map(rawMaterials.map((r) => [r.id, r.stock]))
    const todaySnapshotMap = new Map(todaySnapshots.map((s) => [s.menuItemId, s]))
    const yesterdaySnapshotMap = new Map(yesterdaySnapshots.map((s) => [s.menuItemId, s]))
    const soldTodayMap = new Map(todayOrderItems.map((o) => [o.menuItemId, o._sum.quantity ?? 0]))

    const isOpenConfirmed = todaySnapshots.some((s) => s.openingStock !== null)
    const isCloseConfirmed = todaySnapshots.some((s) => s.closingStock !== null)

    // Deduplicate: recipe items may already appear in non-recipe list (shouldn't, but guard)
    const nonRecipeIds = new Set(nonRecipeItems.map((i) => i.id))
    const menuItems = [
      ...nonRecipeItems,
      ...recipeItemsWithSnapshot.filter((i) => !nonRecipeIds.has(i.id)),
    ]

    const items = menuItems.map((item) => {
      const todaySnap = todaySnapshotMap.get(item.id)
      const yesterdaySnap = yesterdaySnapshotMap.get(item.id)

      // Calculate projected count from raw material stock using recipe
      let projected: number | null = null
      if (item.rawMaterialUsage.length > 0) {
        let minPortions = Infinity
        for (const usage of item.rawMaterialUsage) {
          const available = rawMaterialStockMap.get(usage.rawMaterial.id) ?? 0
          const portions = usage.quantity > 0 ? available / usage.quantity : 0
          if (portions < minPortions) minPortions = portions
        }
        projected = Math.floor(minPortions === Infinity ? 0 : minPortions)
      }

      return {
        menuItemId: item.id,
        name: item.name,
        category: item.category.name,
        categoryId: item.category.id,
        lastClosed: yesterdaySnap?.closingStock ?? null,
        projected,
        openingStock: todaySnap?.openingStock ?? null,
        soldQuantity: todaySnap?.soldQuantity ?? soldTodayMap.get(item.id) ?? null,
        wasteQuantity: todaySnap?.wasteQuantity ?? 0,
        closingStock: todaySnap?.closingStock ?? null,
        hasRecipe: item.rawMaterialUsage.length > 0,
      }
    })

    return NextResponse.json({ today, isOpenConfirmed, isCloseConfirmed, items })
  } catch (error) {
    console.error('Error fetching item stock:', error)
    return NextResponse.json({ error: 'Failed to fetch item stock' }, { status: 500 })
  }
}
