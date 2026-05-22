import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      soldQuantity: z.number().min(0),
      wasteQuantity: z.number().min(0),
    })
  ).min(1),
})

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, items } = schema.parse(body)
    const today = date ?? todayDate()

    // Load opening stocks for all items
    const snapshots = await prisma.dailyItemStockSnapshot.findMany({
      where: { date: today, menuItemId: { in: items.map((i) => i.menuItemId) } },
      select: { menuItemId: true, openingStock: true },
    })
    const openingMap = new Map(snapshots.map((s) => [s.menuItemId, s.openingStock ?? 0]))

    const now = new Date()

    await Promise.all(
      items.map((item) => {
        const openingStock = openingMap.get(item.menuItemId) ?? 0
        const closingStock = Math.max(0, openingStock - item.soldQuantity - item.wasteQuantity)

        return prisma.dailyItemStockSnapshot.upsert({
          where: { date_menuItemId: { date: today, menuItemId: item.menuItemId } },
          create: {
            date: today,
            menuItemId: item.menuItemId,
            soldQuantity: item.soldQuantity,
            wasteQuantity: item.wasteQuantity,
            closingStock,
            closedAt: now,
            closedById: session.user.id,
          },
          update: {
            soldQuantity: item.soldQuantity,
            wasteQuantity: item.wasteQuantity,
            closingStock,
            closedAt: now,
            closedById: session.user.id,
          },
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error confirming closing stock:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to confirm closing stock' }, { status: 500 })
  }
}
