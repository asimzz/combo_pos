import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { broadcastOrderEvent } from '@/lib/order-events'

export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
})

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
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
      include: { orderItems: true },
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

    // For cancellation, look up which items have recipes to restore the right stock
    let recipeItemIds = new Set<string>()
    let recipes: { menuItemId: string; rawMaterialId: string; quantity: number }[] = []
    if (status === 'CANCELLED') {
      const orderItemIds = currentOrder.orderItems.map((i) => i.menuItemId)
      recipes = await prisma.rawMaterialUsage.findMany({
        where: { menuItemId: { in: orderItemIds } },
        select: { menuItemId: true, rawMaterialId: true, quantity: true },
      })
      recipeItemIds = new Set(recipes.map((r) => r.menuItemId))
    }

    const order = await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED') {
        await tx.payment.updateMany({
          where: { orderId: params.id },
          data: { status: 'REFUNDED' },
        })

        const today = new Date().toISOString().split('T')[0]

        // Aggregate pool restorations for recipe items
        const poolRestorations = new Map<string, number>()
        for (const item of currentOrder.orderItems) {
          if (!recipeItemIds.has(item.menuItemId)) continue
          for (const recipe of recipes.filter((r) => r.menuItemId === item.menuItemId)) {
            poolRestorations.set(
              recipe.rawMaterialId,
              (poolRestorations.get(recipe.rawMaterialId) ?? 0) + recipe.quantity * item.quantity,
            )
          }
        }

        await Promise.all([
          // Restore pool stock for recipe items
          ...Array.from(poolRestorations.entries()).map(([rawMaterialId, amount]) =>
            tx.rawMaterialDailyStock.updateMany({
              where: { date: today, rawMaterialId },
              data: { currentStock: { increment: amount } },
            }),
          ),
          // Restore snapshot stock for non-recipe items
          ...currentOrder.orderItems
            .filter((item) => !recipeItemIds.has(item.menuItemId))
            .map((item) =>
              tx.dailyItemStockSnapshot.updateMany({
                where: { date: today, menuItemId: item.menuItemId, currentStock: { not: null } },
                data: { currentStock: { increment: item.quantity } },
              }),
            ),
        ])
      }

      return tx.order.update({
        where: { id: params.id },
        data: {
          status,
          paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : currentOrder.paymentStatus,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
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

    broadcastOrderEvent('order.updated', order)
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
