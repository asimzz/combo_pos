import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRawMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  unit: z.string().min(1, 'Unit is required'),
  stock: z.number().min(0, 'Stock cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawMaterials = await prisma.rawMaterial.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        usage: {
          include: {
            menuItem: true,
          },
        },
        _count: {
          select: { usage: true },
        },
      },
    })

    return NextResponse.json(rawMaterials)
  } catch (error) {
    console.error('Error fetching raw materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch raw materials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRawMaterialSchema.parse(body)

    const rawMaterial = await prisma.rawMaterial.create({
      data: validatedData,
    })

    // Create initial stock log
    await prisma.rawMaterialStockLog.create({
      data: {
        type: 'IN',
        quantity: validatedData.stock,
        reason: 'Initial stock',
        rawMaterialId: rawMaterial.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(rawMaterial, { status: 201 })
  } catch (error) {
    console.error('Error creating raw material:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create raw material' },
      { status: 500 }
    )
  }
}