import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await prisma.menuItem.findMany({
      where: { active: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      select: {
        id: true,
        name: true,
        category: { select: { id: true, name: true } },
        rawMaterialUsage: {
          select: {
            id: true,
            quantity: true,
            rawMaterial: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    })

    const rawMaterials = await prisma.rawMaterial.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, unit: true },
    })

    return NextResponse.json({ items, rawMaterials })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

const createSchema = z.object({
  menuItemId: z.string().min(1),
  rawMaterialId: z.string().min(1),
  quantity: z.number().positive('Quantity must be positive'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const existing = await prisma.rawMaterialUsage.findFirst({
      where: { menuItemId: data.menuItemId, rawMaterialId: data.rawMaterialId },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This ingredient is already in the recipe. Edit its quantity instead.' },
        { status: 400 }
      )
    }

    const usage = await prisma.rawMaterialUsage.create({
      data,
      include: {
        rawMaterial: { select: { id: true, name: true, unit: true } },
      },
    })

    return NextResponse.json(usage, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe entry:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create recipe entry' }, { status: 500 })
  }
}
