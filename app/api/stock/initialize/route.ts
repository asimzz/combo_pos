import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const initSchema = z.object({
  items: z
    .array(
      z.object({
        rawMaterialId: z.string().min(1),
        openingStock: z.number().min(0),
      }),
    )
    .min(1),
})

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function previousDate(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = initSchema.parse(body)

    const alreadyInitialised = await prisma.dailyStockSnapshot.count()
    if (alreadyInitialised > 0) {
      return NextResponse.json(
        { error: 'Stock has already been initialised' },
        { status: 400 },
      )
    }

    const yesterday = previousDate(todayDate())
    const userId = session.user.id

    const materials = await prisma.rawMaterial.findMany({
      where: { id: { in: data.items.map((i) => i.rawMaterialId) }, active: true },
      select: { id: true },
    })
    const validIds = new Set(materials.map((m) => m.id))
    const validItems = data.items.filter((i) => validIds.has(i.rawMaterialId))
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No valid materials to initialise' }, { status: 400 })
    }

    // Seed a "previous day" snapshot so that today's opening = entered value.
    // Also set RawMaterial.stock to the same value as the current running balance.
    await prisma.$transaction([
      prisma.dailyStockSnapshot.createMany({
        data: validItems.map((i) => ({
          date: yesterday,
          rawMaterialId: i.rawMaterialId,
          openingStock: 0,
          closingStock: i.openingStock,
          closedById: userId,
        })),
      }),
      ...validItems.map((i) =>
        prisma.rawMaterial.update({
          where: { id: i.rawMaterialId },
          data: { stock: i.openingStock },
        }),
      ),
    ])

    return NextResponse.json({ success: true, initialised: validItems.length })
  } catch (error) {
    console.error('Error initialising stock:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Failed to initialise stock' }, { status: 500 })
  }
}
