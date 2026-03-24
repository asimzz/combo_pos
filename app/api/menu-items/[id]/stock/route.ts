import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateMenuItemStockSchema = z.object({
  stock: z.number().min(0, 'Stock cannot be negative'),
  lowStockAlert: z.number().min(0, 'Alert level cannot be negative').optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateMenuItemStockSchema.parse(body)

    const updateData: any = { stock: validatedData.stock }
    if (validatedData.lowStockAlert !== undefined) {
      updateData.lowStockAlert = validatedData.lowStockAlert
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error updating menu item stock:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update menu item stock' },
      { status: 500 }
    )
  }
}