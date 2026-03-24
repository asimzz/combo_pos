import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Get all employees with their current month salary info
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Get all users with their salary info
    const employees = await prisma.user.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        monthlySalary: true,
        salaryDueDay: true,
        salaryPayments: {
          where: {
            month: currentMonth,
            year: currentYear
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Calculate current month totals for each employee
    const employeesWithSalaryInfo = employees.map(employee => {
      const totalPaid = employee.salaryPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const balance = (employee.monthlySalary || 0) - totalPaid

      // Calculate next due date
      const dueDay = employee.salaryDueDay || 1
      const now = new Date()
      let dueDate = new Date(currentYear, currentMonth - 1, dueDay)
      // If already past this month's due day and fully paid, show next month
      if (now > dueDate && balance <= 0) {
        dueDate = new Date(currentYear, currentMonth, dueDay)
      }

      return {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        monthlySalary: employee.monthlySalary || 0,
        salaryDueDay: dueDay,
        dueDate: dueDate.toISOString(),
        totalPaid,
        balance,
        payments: employee.salaryPayments
      }
    })

    return NextResponse.json({
      employees: employeesWithSalaryInfo,
      currentMonth,
      currentYear
    })
  } catch (error) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update employee monthly salary
const updateSalarySchema = z.object({
  userId: z.string(),
  monthlySalary: z.number().min(0),
  salaryDueDay: z.number().int().min(1).max(31).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, monthlySalary, salaryDueDay } = updateSalarySchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monthlySalary,
        ...(salaryDueDay !== undefined && { salaryDueDay }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        monthlySalary: true,
        salaryDueDay: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating salary:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}