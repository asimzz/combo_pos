import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stockGroups = await prisma.stockGroup.findMany({
      include: {
        items: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            category: { select: { name: true } },
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(stockGroups)
  } catch (error) {
    console.error('Error fetching stock groups:', error)
    return NextResponse.json({ error: 'Failed to fetch stock groups' }, { status: 500 })
  }
}

const createGroupSchema = z.object({
  name: z.string().min(1),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(10),
  menuItemIds: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createGroupSchema.parse(body)

    const group = await prisma.stockGroup.create({
      data: {
        name: data.name,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        items: {
          connect: data.menuItemIds.map((id) => ({ id })),
        },
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error creating stock group:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create stock group' }, { status: 500 })
  }
}

const updateGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  menuItemIds: z.array(z.string()).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateGroupSchema.parse(body)

    // If menuItemIds provided, disconnect old items and connect new ones
    if (data.menuItemIds) {
      // Disconnect all existing items from this group
      await prisma.menuItem.updateMany({
        where: { stockGroupId: data.id },
        data: { stockGroupId: null },
      })
    }

    const group = await prisma.stockGroup.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.lowStockAlert !== undefined && { lowStockAlert: data.lowStockAlert }),
        ...(data.menuItemIds && {
          items: {
            connect: data.menuItemIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating stock group:', error)
    return NextResponse.json({ error: 'Failed to update stock group' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    // Disconnect items first
    await prisma.menuItem.updateMany({
      where: { stockGroupId: id },
      data: { stockGroupId: null },
    })

    await prisma.stockGroup.delete({ where: { id } })

    return NextResponse.json({ message: 'Stock group deleted' })
  } catch (error) {
    console.error('Error deleting stock group:', error)
    return NextResponse.json({ error: 'Failed to delete stock group' }, { status: 500 })
  }
}
