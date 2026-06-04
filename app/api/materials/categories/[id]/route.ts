import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UNIT_VALUES = ['kg', 'g', 'L', 'mL', 'pcs', 'box', 'pack', 'bag'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const schema = z
      .object({
        name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
        unit: z.enum(UNIT_VALUES).optional(),
        rawMaterialId: z.string().nullable().optional(),
      })
      .refine(
        (v) => v.name !== undefined || v.unit !== undefined || v.rawMaterialId !== undefined,
        { message: 'Nothing to update' },
      )

    const data = schema.parse(body)

    const updated = await prisma.materialCategory.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.rawMaterialId !== undefined && { rawMaterialId: data.rawMaterialId || null }),
      },
      include: { rawMaterial: { select: { id: true, name: true, unit: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating material category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entryCount = await prisma.materialEntry.count({
      where: { categoryId: params.id },
    })

    if (entryCount > 0) {
      await prisma.materialCategory.update({
        where: { id: params.id },
        data: { active: false },
      })
    } else {
      await prisma.materialCategory.delete({ where: { id: params.id } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting material category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
