import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  description: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const existing = await prisma.rawMaterial.findUnique({ where: { name: data.name } })
    if (existing) {
      return NextResponse.json(
        { error: 'A material with this name already exists' },
        { status: 400 },
      )
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name: data.name,
        unit: data.unit,
        description: data.description,
        stock: 0,
        cost: 0,
        active: true,
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error creating raw material:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const { id, ...updates } = data
    const material = await prisma.rawMaterial.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating raw material:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}
