import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y_FREE']),
  value: z.number().min(0).default(0),
  minOrderAmount: z.number().min(0).optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  applicableItemIds: z.array(z.string()).default([]),
  buyQuantity: z.number().int().min(1).optional().nullable(),
  getQuantity: z.number().int().min(1).optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      applicableItems: {
        include: { menuItem: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(promotions)
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { applicableItemIds, ...data } = createSchema.parse(body)

    const promotion = await prisma.promotion.create({
      data: {
        ...data,
        applicableItems: applicableItemIds.length
          ? { create: applicableItemIds.map((menuItemId) => ({ menuItemId })) }
          : undefined,
      },
      include: {
        applicableItems: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
