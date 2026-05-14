import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
})

const VALID_TRANSITIONS: Record<string, string[]> = {
  COMPLETED: ['CANCELLED'],
  CANCELLED: [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)

    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const allowed = VALID_TRANSITIONS[currentOrder.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change from ${currentOrder.status} to ${status}` },
        { status: 400 }
      )
    }

    const order = await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED') {
        await tx.payment.updateMany({
          where: { orderId: params.id },
          data: { status: 'REFUNDED' },
        })
      }

      return tx.order.update({
        where: { id: params.id },
        data: {
          status,
          paymentStatus:
            status === 'CANCELLED' ? 'REFUNDED' : currentOrder.paymentStatus,
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                include: {
                  category: true,
                },
              },
            },
          },
          payments: true,
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      })
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order status:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
