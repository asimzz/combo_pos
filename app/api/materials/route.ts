import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createMaterialSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let dateFilter: any = {}

    if (dateParam) {
      const start = new Date(dateParam)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateParam)
      end.setHours(23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (from && to) {
      const start = new Date(from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    }

    const entries = await prisma.materialEntry.findMany({
      where: dateFilter,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        user: {
          select: { name: true },
        },
      },
    })

    const total = entries.reduce((sum, e) => sum + e.amount, 0)

    const byCategory: Record<string, number> = {}
    for (const entry of entries) {
      const catName = entry.category.name
      byCategory[catName] = (byCategory[catName] || 0) + entry.amount
    }

    return NextResponse.json({ entries, total, byCategory })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
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
    const validatedData = createMaterialSchema.parse(body)

    const entry = await prisma.materialEntry.create({
      data: {
        quantity: validatedData.quantity || null,
        amount: validatedData.amount,
        description: validatedData.description || null,
        categoryId: validatedData.categoryId,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        userId: session.user.id,
      },
      include: {
        category: true,
        user: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating material entry:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create material entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    await prisma.materialEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete material entry' },
      { status: 500 }
    )
  }
}
