import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  materials: z.array(
    z.object({
      rawMaterialId: z.string().min(1),
      soldQuantity: z.number().min(0),
      wasteQuantity: z.number().min(0),
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
    const { date, materials } = schema.parse(body)
    const today = date ?? todayDate()

    const now = new Date()

    await Promise.all(
      materials.map(async (m) => {
        const record = await prisma.rawMaterialDailyStock.findUnique({
          where: { date_rawMaterialId: { date: today, rawMaterialId: m.rawMaterialId } },
          select: { openingStock: true },
        })
        if (!record) return

        const closingStock = Math.max(0, record.openingStock - m.soldQuantity - m.wasteQuantity)

        return prisma.rawMaterialDailyStock.update({
          where: { date_rawMaterialId: { date: today, rawMaterialId: m.rawMaterialId } },
          data: {
            wasteQuantity: m.wasteQuantity,
            closingStock,
            closedAt: now,
            closedById: session.user.id,
          },
        })
      }),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error closing pool stock:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to close pool stock' }, { status: 500 })
  }
}
