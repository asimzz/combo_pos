import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
    const schema = z.object({
      name: z.string().min(1, 'Name cannot be empty').max(100),
    })
    const { name } = schema.parse(body)

    const updated = await prisma.expenseCategory.update({
      where: { id: params.id },
      data: { name },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating expense category:', error)

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

    const expenseCount = await prisma.expense.count({
      where: { categoryId: params.id },
    })

    if (expenseCount > 0) {
      await prisma.expenseCategory.update({
        where: { id: params.id },
        data: { active: false },
      })
    } else {
      await prisma.expenseCategory.delete({ where: { id: params.id } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting expense category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
