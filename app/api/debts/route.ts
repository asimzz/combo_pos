import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createDebtSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  contactType: z.enum(['phone', 'momo']).optional().nullable(),
  contactValue: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
})

const paymentSchema = z.object({
  debtId: z.string().min(1),
  amount: z.number().positive('Amount must be positive'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showSettled = searchParams.get('settled') === 'true'
    const search = searchParams.get('search') || ''

    const where: any = { settled: showSettled }

    if (search) {
      where.OR = [
        { supplierName: { contains: search, mode: 'insensitive' } },
        { contactValue: { contains: search, mode: 'insensitive' } },
      ]
    }

    const debts = await prisma.debtEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    // Group by supplier name (case-insensitive)
    const supplierMap: Record<string, {
      supplierName: string
      contactType: string | null
      contactValue: string | null
      totalOwed: number
      totalPaid: number
      balance: number
      debts: typeof debts
    }> = {}

    for (const debt of debts) {
      const key = debt.supplierName.toLowerCase()
      if (!supplierMap[key]) {
        supplierMap[key] = {
          supplierName: debt.supplierName,
          contactType: debt.contactType,
          contactValue: debt.contactValue,
          totalOwed: 0,
          totalPaid: 0,
          balance: 0,
          debts: [],
        }
      }
      if (debt.contactValue && !supplierMap[key].contactValue) {
        supplierMap[key].contactType = debt.contactType
        supplierMap[key].contactValue = debt.contactValue
      }
      supplierMap[key].totalOwed += debt.amount
      supplierMap[key].totalPaid += debt.paidAmount
      supplierMap[key].balance += (debt.amount - debt.paidAmount)
      supplierMap[key].debts.push(debt)
    }

    const suppliers = Object.values(supplierMap).sort((a, b) => b.balance - a.balance)
    const totalOwed = suppliers.reduce((sum, s) => sum + s.balance, 0)

    // Get unique supplier names for autocomplete (unsettled only)
    const existingSuppliers = showSettled ? [] : (
      await prisma.debtEntry.findMany({
        where: { settled: false },
        select: { supplierName: true, contactType: true, contactValue: true },
        distinct: ['supplierName'],
      })
    )

    return NextResponse.json({ suppliers, totalOwed, existingSuppliers })
  } catch (error) {
    console.error('Error fetching debts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debts' },
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
    const validatedData = createDebtSchema.parse(body)

    const debt = await prisma.debtEntry.create({
      data: {
        supplierName: validatedData.supplierName,
        contactType: validatedData.contactType || null,
        contactValue: validatedData.contactValue || null,
        amount: validatedData.amount,
        description: validatedData.description || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(debt, { status: 201 })
  } catch (error) {
    console.error('Error creating debt:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create debt entry' },
      { status: 500 }
    )
  }
}

// Record a partial or full payment
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { debtId, amount } = paymentSchema.parse(body)

    const debt = await prisma.debtEntry.findUnique({ where: { id: debtId } })
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    const remaining = debt.amount - debt.paidAmount
    if (amount > remaining) {
      return NextResponse.json(
        { error: `Payment exceeds remaining balance of ${remaining}` },
        { status: 400 }
      )
    }

    const newPaidAmount = debt.paidAmount + amount
    const isFullyPaid = newPaidAmount >= debt.amount

    await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          amount,
          debtEntryId: debtId,
        },
      }),
      prisma.debtEntry.update({
        where: { id: debtId },
        data: {
          paidAmount: newPaidAmount,
          settled: isFullyPaid,
          settledAt: isFullyPaid ? new Date() : null,
        },
      }),
    ])

    return NextResponse.json({ success: true, settled: isFullyPaid })
  } catch (error) {
    console.error('Error recording payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record payment' },
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
      return NextResponse.json({ error: 'Debt ID required' }, { status: 400 })
    }

    await prisma.debtEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json(
      { error: 'Failed to delete debt entry' },
      { status: 500 }
    )
  }
}
