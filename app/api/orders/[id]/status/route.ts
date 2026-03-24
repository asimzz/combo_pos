import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']),
})

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED'],
  SERVED: [],
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
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentOrder.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change from ${currentOrder.status} to ${status}` },
        { status: 400 }
      )
    }

    // CANCELLED: refund stock since it was deducted at creation
    if (status === 'CANCELLED') {
      await Promise.all(
        currentOrder.orderItems.map((orderItem) =>
          prisma.menuItem.update({
            where: { id: orderItem.menuItemId },
            data: { stock: { increment: orderItem.quantity } }
          })
        )
      )
    }

    // SERVED: mark payment as completed
    if (status === 'SERVED') {
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: params.id }
      })

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            amount: currentOrder.total,
            method: currentOrder.paymentMethod,
            status: 'COMPLETED',
            orderId: params.id,
          }
        })
      } else {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'COMPLETED' }
        })
      }
    }

    // Update the order status and payment status
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        paymentStatus: status === 'SERVED' ? 'COMPLETED' :
                       status === 'CANCELLED' ? 'REFUNDED' :
                       currentOrder.paymentStatus,
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        },
        payments: true,
        user: {
          select: {
            name: true,
            phone: true
          }
        }
      }
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
