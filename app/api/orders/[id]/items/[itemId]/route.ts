import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { broadcastOrderEvent } from '@/lib/order-events'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const voidSchema = z.object({
  reason: z.string().optional(),
})

const ORDER_INCLUDE = {
  orderItems: {
    include: {
      menuItem: { include: { category: true } },
    },
  },
  payments: true,
  user: { select: { name: true, phone: true } },
} as const

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth instanceof NextResponse) return auth

    if (auth.role !== 'MANAGER' && auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Manager or admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason } = voidSchema.parse(body)

    const orderItem = await prisma.orderItem.findFirst({
      where: { id: params.itemId, orderId: params.id },
      include: { menuItem: true, order: true },
    })

    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    if (orderItem.order.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only void items from pending orders' }, { status: 400 })
    }

    const sibling = await prisma.orderItem.count({ where: { orderId: params.id } })
    if (sibling <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last item — cancel the order instead' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItemVoid.create({
        data: {
          orderId: params.id,
          itemName: orderItem.menuItem.name,
          originalQty: orderItem.quantity,
          voidedQty: orderItem.quantity,
          reason,
          voidedById: auth.userId,
        },
      })

      await tx.orderItem.delete({ where: { id: params.itemId } })

      const remaining = await tx.orderItem.findMany({ where: { orderId: params.id } })
      const subtotal = remaining.reduce((sum, item) => sum + Number(item.total), 0)
      const order = orderItem.order
      const total = Math.max(0, subtotal + Number(order.serviceCharge) - Number(order.discount))

      return tx.order.update({
        where: { id: params.id },
        data: { subtotal, total },
        include: ORDER_INCLUDE,
      })
    })

    broadcastOrderEvent('order.updated', updatedOrder)
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error voiding order item:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to void order item' }, { status: 500 })
  }
}
