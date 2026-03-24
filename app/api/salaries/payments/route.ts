import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Record a salary payment
const paymentSchema = z.object({
  userId: z.string(),
  amount: z.number().min(0.01),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  notes: z.string().optional().or(z.literal(null)).transform(val => val === null ? undefined : val)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const currentDate = new Date()
    const data = {
      ...body,
      month: body.month || currentDate.getMonth() + 1,
      year: body.year || currentDate.getFullYear()
    }

    const { userId, amount, month, year, notes } = paymentSchema.parse(data)

    // Get employee info
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        monthlySalary: true,
        salaryPayments: {
          where: {
            month,
            year
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if payment would exceed monthly salary
    const totalPaid = employee.salaryPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const newTotal = totalPaid + amount
    const monthlySalary = employee.monthlySalary || 0

    if (newTotal > monthlySalary && monthlySalary > 0) {
      return NextResponse.json({
        error: 'Payment exceeds monthly salary',
        details: {
          monthlySalary,
          totalPaid,
          requestedAmount: amount,
          balance: monthlySalary - totalPaid
        }
      }, { status: 400 })
    }

    // Create the salary payment
    const payment = await prisma.salaryPayment.create({
      data: {
        userId,
        amount,
        month,
        year,
        notes,
        paidBy: session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error recording salary payment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get salary payments history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let whereClause: any = {}

    if (userId) whereClause.userId = userId
    if (month) whereClause.month = parseInt(month)
    if (year) whereClause.year = parseInt(year)

    const payments = await prisma.salaryPayment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to recent 100 payments
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching salary payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}