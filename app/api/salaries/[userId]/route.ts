import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get detailed salary information for a specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get employee basic info
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        monthlySalary: true,
        createdAt: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get salary payments for the year grouped by month
    const payments = await prisma.salaryPayment.findMany({
      where: {
        userId,
        year
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate monthly summaries
    const monthlySummaries = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const monthPayments = payments.filter(p => p.month === month)
      const totalPaid = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const monthlySalary = employee.monthlySalary || 0
      const balance = monthlySalary - totalPaid

      return {
        month,
        monthName: new Date(year, index, 1).toLocaleString('default', { month: 'long' }),
        monthlySalary,
        totalPaid,
        balance,
        payments: monthPayments,
        paymentCount: monthPayments.length
      }
    })

    // Calculate yearly totals
    const yearlyTotalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const yearlyTotalSalary = (employee.monthlySalary || 0) * 12
    const yearlyBalance = yearlyTotalSalary - yearlyTotalPaid

    return NextResponse.json({
      employee,
      year,
      monthlySummaries,
      yearlyTotals: {
        totalSalary: yearlyTotalSalary,
        totalPaid: yearlyTotalPaid,
        balance: yearlyBalance
      },
      allPayments: payments
    })
  } catch (error) {
    console.error('Error fetching employee salary details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}