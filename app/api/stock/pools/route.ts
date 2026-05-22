import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
    const date = searchParams.get('date') ?? todayDate()
    const yesterday = previousDate(date)

    // Find all raw materials that are used in at least one recipe
    const rawMaterials = await prisma.rawMaterial.findMany({
      where: { active: true, usage: { some: {} } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        unit: true,
        usage: {
          select: {
            quantity: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                active: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        dailyPoolStocks: {
          where: { date },
          select: { openingStock: true, currentStock: true, wasteQuantity: true, closingStock: true },
          take: 1,
        },
      },
    })

    const rawMaterialIds = rawMaterials.map((rm) => rm.id)
    const yesterdayStocks = await prisma.rawMaterialDailyStock.findMany({
      where: { date: yesterday, rawMaterialId: { in: rawMaterialIds } },
      select: { rawMaterialId: true, closingStock: true },
    })
    const yesterdayMap = new Map(yesterdayStocks.map((s) => [s.rawMaterialId, s.closingStock]))

    const pools = rawMaterials.map((rm) => {
      const dailyStock = rm.dailyPoolStocks[0] ?? null
      const currentStock = dailyStock?.currentStock ?? null
      const lastClosingStock = yesterdayMap.get(rm.id) ?? null

      return {
        rawMaterialId: rm.id,
        name: rm.name,
        unit: rm.unit,
        openingStock: dailyStock?.openingStock ?? null,
        currentStock,
        wasteQuantity: dailyStock?.wasteQuantity ?? 0,
        closingStock: dailyStock?.closingStock ?? null,
        lastClosingStock,
        menuItems: rm.usage
          .filter((u) => u.menuItem.active)
          .map((u) => ({
            menuItemId: u.menuItem.id,
            name: u.menuItem.name,
            categoryId: u.menuItem.categoryId,
            categoryName: u.menuItem.category.name,
            portionSize: u.quantity,
            canMake: currentStock !== null && u.quantity > 0
              ? Math.max(0, Math.floor(currentStock / u.quantity))
              : null,
          }))
          .sort((a, b) => a.portionSize - b.portionSize),
      }
    })

    const openPools = pools.filter((p) => p.openingStock !== null)

    return NextResponse.json({
      today: date,
      isOpen: openPools.length > 0,
      isClosed: openPools.length > 0 && openPools.every((p) => p.closingStock !== null),
      pools,
    })
  } catch (error) {
    console.error('Error fetching stock pools:', error)
    return NextResponse.json({ error: 'Failed to fetch stock pools' }, { status: 500 })
  }
}

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  materials: z.array(
    z.object({
      rawMaterialId: z.string().min(1),
      stock: z.number().min(0),
    }),
  ).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, materials } = postSchema.parse(body)
    const today = date ?? todayDate()

    // Check if already opened for this date
    const existing = await prisma.rawMaterialDailyStock.findFirst({
      where: { date: today, rawMaterialId: { in: materials.map((m) => m.rawMaterialId) } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Pool stock already set for this date. Cannot re-open.' },
        { status: 400 },
      )
    }

    await Promise.all(
      materials.map((m) =>
        prisma.rawMaterialDailyStock.create({
          data: {
            date: today,
            rawMaterialId: m.rawMaterialId,
            openingStock: m.stock,
            currentStock: m.stock,
            setById: session.user.id,
          },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting pool stock:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to set pool stock' }, { status: 500 })
  }
}
