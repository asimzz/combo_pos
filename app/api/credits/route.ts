import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCreditSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
})

const paymentSchema = z.object({
  creditId: z.string().min(1),
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
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const credits = await prisma.creditEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    // Group by customer name (case-insensitive)
    const customerMap: Record<string, {
      customerName: string
      customerPhone: string | null
      totalOwed: number
      totalPaid: number
      balance: number
      credits: typeof credits
    }> = {}

    for (const credit of credits) {
      const key = credit.customerName.toLowerCase()
      if (!customerMap[key]) {
        customerMap[key] = {
          customerName: credit.customerName,
          customerPhone: credit.customerPhone,
          totalOwed: 0,
          totalPaid: 0,
          balance: 0,
          credits: [],
        }
      }
      // Use latest phone if available
      if (credit.customerPhone && !customerMap[key].customerPhone) {
        customerMap[key].customerPhone = credit.customerPhone
      }
      customerMap[key].totalOwed += credit.amount
      customerMap[key].totalPaid += credit.paidAmount
      customerMap[key].balance += (credit.amount - credit.paidAmount)
      customerMap[key].credits.push(credit)
    }

    const customers = Object.values(customerMap).sort((a, b) => b.balance - a.balance)
    const totalOwed = customers.reduce((sum, c) => sum + c.balance, 0)

    // Get unique customer names for autocomplete (unsettled only)
    const existingCustomers = showSettled ? [] : (
      await prisma.creditEntry.findMany({
        where: { settled: false },
        select: { customerName: true, customerPhone: true },
        distinct: ['customerName'],
      })
    )

    return NextResponse.json({ customers, totalOwed, existingCustomers })
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
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
    const validatedData = createCreditSchema.parse(body)

    const credit = await prisma.creditEntry.create({
      data: {
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone || null,
        amount: validatedData.amount,
        description: validatedData.description || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(credit, { status: 201 })
  } catch (error) {
    console.error('Error creating credit:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create credit entry' },
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
    const { creditId, amount } = paymentSchema.parse(body)

    const credit = await prisma.creditEntry.findUnique({ where: { id: creditId } })
    if (!credit) {
      return NextResponse.json({ error: 'Credit not found' }, { status: 404 })
    }

    const remaining = credit.amount - credit.paidAmount
    if (amount > remaining) {
      return NextResponse.json(
        { error: `Payment exceeds remaining balance of ${remaining}` },
        { status: 400 }
      )
    }

    const newPaidAmount = credit.paidAmount + amount
    const isFullyPaid = newPaidAmount >= credit.amount

    await prisma.$transaction([
      prisma.creditPayment.create({
        data: {
          amount,
          creditEntryId: creditId,
        },
      }),
      prisma.creditEntry.update({
        where: { id: creditId },
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
      return NextResponse.json({ error: 'Credit ID required' }, { status: 400 })
    }

    await prisma.creditEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit:', error)
    return NextResponse.json(
      { error: 'Failed to delete credit entry' },
      { status: 500 }
    )
  }
}
