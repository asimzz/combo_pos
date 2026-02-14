import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sortSchema = z.object({
  direction: z.enum(['up', 'down']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { direction } = sortSchema.parse(body)

    // Get current category
    const currentCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!currentCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    let targetCategory
    if (direction === 'up') {
      // Find category with the next lower sortOrder
      targetCategory = await prisma.category.findFirst({
        where: {
          sortOrder: { lt: currentCategory.sortOrder }
        },
        orderBy: { sortOrder: 'desc' }
      })
    } else {
      // Find category with the next higher sortOrder
      targetCategory = await prisma.category.findFirst({
        where: {
          sortOrder: { gt: currentCategory.sortOrder }
        },
        orderBy: { sortOrder: 'asc' }
      })
    }

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Cannot move category in that direction' },
        { status: 400 }
      )
    }

    // Swap sort orders
    await prisma.$transaction([
      prisma.category.update({
        where: { id: currentCategory.id },
        data: { sortOrder: targetCategory.sortOrder }
      }),
      prisma.category.update({
        where: { id: targetCategory.id },
        data: { sortOrder: currentCategory.sortOrder }
      })
    ])

    return NextResponse.json({ message: 'Category order updated successfully' })
  } catch (error) {
    console.error('Error updating category sort order:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update category order' },
      { status: 500 }
    )
  }
}