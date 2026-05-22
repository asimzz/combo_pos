import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        category: { select: { name: true } },
        rawMaterialUsage: {
          select: {
            quantity: true,
            rawMaterial: { select: { name: true, cost: true, unit: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const items = menuItems.map((item) => {
      const theoreticalCost = item.rawMaterialUsage.reduce(
        (sum, usage) => sum + usage.quantity * usage.rawMaterial.cost,
        0
      )
      const grossMargin = item.price - theoreticalCost
      const grossMarginPct = item.price > 0 ? (grossMargin / item.price) * 100 : 0
      const foodCostPct = item.price > 0 ? (theoreticalCost / item.price) * 100 : 0

      return {
        id: item.id,
        name: item.name,
        category: item.category.name,
        sellingPrice: item.price,
        theoreticalCost: Math.round(theoreticalCost * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        foodCostPct: Math.round(foodCostPct * 10) / 10,
        hasRecipe: item.rawMaterialUsage.length > 0,
        ingredients: item.rawMaterialUsage.map((u) => ({
          name: u.rawMaterial.name,
          quantity: u.quantity,
          unit: u.rawMaterial.unit,
          cost: Math.round(u.quantity * u.rawMaterial.cost * 100) / 100,
        })),
      }
    })

    const withRecipe = items.filter((i) => i.hasRecipe)
    const avgFoodCostPct =
      withRecipe.length > 0
        ? Math.round((withRecipe.reduce((s, i) => s + i.foodCostPct, 0) / withRecipe.length) * 10) / 10
        : 0

    return NextResponse.json({ items, avgFoodCostPct })
  } catch (error) {
    console.error('Error fetching food cost report:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
