import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createExpenseSchema = z.object({
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

    const expenses = await prisma.expense.findMany({
      where: dateFilter,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        user: {
          select: { name: true },
        },
      },
    })

    // Calculate totals
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Group by category
    const byCategory: Record<string, number> = {}
    for (const expense of expenses) {
      const catName = expense.category.name
      byCategory[catName] = (byCategory[catName] || 0) + expense.amount
    }

    return NextResponse.json({ expenses, total, byCategory })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const validatedData = createExpenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
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

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create expense' },
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
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 })
    }

    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
