import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateRawMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
  active: z.boolean().optional(),
})

const updateStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTE']),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  reason: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: params.id },
      include: {
        usage: {
          include: {
            menuItem: true,
          },
        },
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!rawMaterial) {
      return NextResponse.json(
        { error: 'Raw material not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rawMaterial)
  } catch (error) {
    console.error('Error fetching raw material:', error)
    return NextResponse.json(
      { error: 'Failed to fetch raw material' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRawMaterialSchema.parse(body)

    const rawMaterial = await prisma.rawMaterial.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(rawMaterial)
  } catch (error) {
    console.error('Error updating raw material:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update raw material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete by marking as inactive
    const rawMaterial = await prisma.rawMaterial.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json(rawMaterial)
  } catch (error) {
    console.error('Error deleting raw material:', error)
    return NextResponse.json(
      { error: 'Failed to delete raw material' },
      { status: 500 }
    )
  }
}