import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTE']),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  reason: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateStockSchema.parse(body)

    // Get current raw material
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: params.id },
    })

    if (!rawMaterial) {
      return NextResponse.json(
        { error: 'Raw material not found' },
        { status: 404 }
      )
    }

    // Calculate new stock based on operation type
    let newStock = rawMaterial.stock.toNumber()

    switch (validatedData.type) {
      case 'IN':
        newStock += validatedData.quantity
        break
      case 'OUT':
      case 'WASTE':
        newStock -= validatedData.quantity
        break
      case 'ADJUSTMENT':
        newStock = validatedData.quantity
        break
    }

    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update stock and create log in transaction
    const result = await prisma.$transaction(async (prisma) => {
      const updatedMaterial = await prisma.rawMaterial.update({
        where: { id: params.id },
        data: { stock: newStock },
      })

      const stockLog = await prisma.rawMaterialStockLog.create({
        data: {
          type: validatedData.type,
          quantity: validatedData.quantity,
          reason: validatedData.reason,
          rawMaterialId: params.id,
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      return { material: updatedMaterial, log: stockLog }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating stock:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}