import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']),
})

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

    // First get the current order to check previous status
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

    // Update order status and handle stock deduction in a transaction
    const order = await prisma.$transaction(async (prisma) => {
      // If changing status to SERVED, deduct stock
      if (status === 'SERVED' && currentOrder.status !== 'SERVED') {
        for (const orderItem of currentOrder.orderItems) {
          await prisma.menuItem.update({
            where: { id: orderItem.menuItemId },
            data: {
              stock: {
                decrement: orderItem.quantity
              }
            }
          })
        }
      }

      // Update the order status
      return await prisma.order.update({
        where: { id: params.id },
        data: { status },
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
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
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