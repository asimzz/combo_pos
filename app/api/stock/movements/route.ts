import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const movementSchema = z.object({
  rawMaterialId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'WASTE', 'ADJUSTMENT']),
  quantity: z.number(),
  reason: z.string().optional(),
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
    const data = movementSchema.parse(body)

    if (data.type !== 'ADJUSTMENT' && data.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than zero for IN/OUT/WASTE entries' },
        { status: 400 },
      )
    }
    if (data.type === 'ADJUSTMENT' && data.quantity === 0) {
      return NextResponse.json(
        { error: 'Adjustment quantity cannot be zero' },
        { status: 400 },
      )
    }

    // Reject movements for a closed day so the snapshot stays trustworthy
    const today = todayDate()
    const todaySnapshotCount = await prisma.dailyStockSnapshot.count({
      where: { date: today },
    })
    if (todaySnapshotCount > 0) {
      return NextResponse.json(
        { error: 'Today is already closed — open tomorrow to continue' },
        { status: 400 },
      )
    }

    const material = await prisma.rawMaterial.findUnique({
      where: { id: data.rawMaterialId },
      select: { id: true, stock: true, active: true },
    })
    if (!material || !material.active) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const delta =
      data.type === 'IN'
        ? data.quantity
        : data.type === 'OUT' || data.type === 'WASTE'
          ? -data.quantity
          : data.quantity // ADJUSTMENT can be positive or negative

    const newStock = material.stock + delta
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Insufficient stock — available ${material.stock}` },
        { status: 400 },
      )
    }

    const userId = session.user.id

    const [, updated] = await prisma.$transaction([
      prisma.rawMaterialStockLog.create({
        data: {
          rawMaterialId: data.rawMaterialId,
          type: data.type,
          quantity: Math.abs(data.quantity),
          reason: data.reason,
          userId,
        },
      }),
      prisma.rawMaterial.update({
        where: { id: data.rawMaterialId },
        data: { stock: newStock },
        select: { id: true, stock: true },
      }),
    ])

    return NextResponse.json({ success: true, currentStock: updated.stock })
  } catch (error) {
    console.error('Error recording stock movement:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Failed to record movement' }, { status: 500 })
  }
}
