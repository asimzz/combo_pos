import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcastOrderEvent } from '@/lib/order-events'

export const dynamic = 'force-dynamic'

const ORDER_INCLUDE = {
  orderItems: {
    include: {
      menuItem: { include: { category: true } },
    },
  },
  payments: true,
  user: { select: { name: true, phone: true } },
} as const

// No auth required — kitchen displays are always-on tablets on the LAN
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({ where: { id: params.id } })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'PENDING') {
    return NextResponse.json({ error: 'Order is not pending' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: ORDER_INCLUDE,
  })

  broadcastOrderEvent('order.updated', updated)
  return NextResponse.json(updated)
}
