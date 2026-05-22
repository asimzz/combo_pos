import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const startStr = searchParams.get('startDate')
    const endStr = searchParams.get('endDate')

    if (!startStr || !endStr) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const start = startOfDay(parseISO(startStr))
    const end = endOfDay(parseISO(endStr))

    const [orders, orderItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        select: {
          total: true,
          subtotal: true,
          taxAmount: true,
          serviceCharge: true,
          discount: true,
          paymentMethod: true,
          payments: { select: { amount: true, method: true } },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { not: 'CANCELLED' },
          },
        },
        select: {
          total: true,
          quantity: true,
          menuItem: {
            select: { category: { select: { name: true } } },
          },
        },
      }),
    ])

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalTax = orders.reduce((s, o) => s + o.taxAmount, 0)
    const totalServiceCharge = orders.reduce((s, o) => s + o.serviceCharge, 0)
    const totalDiscount = orders.reduce((s, o) => s + o.discount, 0)
    const totalSubtotal = orders.reduce((s, o) => s + o.subtotal, 0)

    // Revenue by category
    const categoryMap: Record<string, { revenue: number; items: number }> = {}
    for (const item of orderItems) {
      const cat = item.menuItem.category.name
      if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, items: 0 }
      categoryMap[cat].revenue += item.total
      categoryMap[cat].items += item.quantity
    }
    const byCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({ category, revenue: Math.round(data.revenue * 100) / 100, items: data.items }))
      .sort((a, b) => b.revenue - a.revenue)

    // Revenue by payment method
    const paymentMap: Record<string, { amount: number; count: number }> = {}
    for (const order of orders) {
      const method = order.paymentMethod
      if (!paymentMap[method]) paymentMap[method] = { amount: 0, count: 0 }
      paymentMap[method].amount += order.total
      paymentMap[method].count += 1
    }
    const byPaymentMethod = Object.entries(paymentMap).map(([method, data]) => ({
      method,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
    }))

    return NextResponse.json({
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSubtotal: Math.round(totalSubtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalServiceCharge: Math.round(totalServiceCharge * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      byCategory,
      byPaymentMethod,
    })
  } catch (error) {
    console.error('Error fetching date-range report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
