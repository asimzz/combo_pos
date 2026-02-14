import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber, calculateTax, calculateServiceCharge } from '@/lib/utils'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    notes: z.string().optional(),
  })),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'MOMO']),
  discount: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // Get menu items to calculate totals and check stock
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: data.items.map(item => item.menuItemId) }
      }
    })

    // Validate stock availability and calculate totals
    let subtotal = 0
    const orderItems = data.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`)
      if (!menuItem.active) throw new Error(`Menu item ${menuItem.name} is not available`)

      const currentStock = menuItem.stock || 0
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${menuItem.name}. Available: ${currentStock}, Requested: ${item.quantity}`)
      }

      const itemTotal = Number(menuItem.price) * item.quantity
      subtotal += itemTotal

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        total: itemTotal,
        notes: item.notes,
      }
    })

    const total = subtotal - data.discount

    // Create order without deducting stock (stock will be deducted when order is SERVED)
    const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.user.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          notes: data.notes,
          subtotal,
          taxAmount: 0,
          serviceCharge: 0,
          discount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'COMPLETED',
          status: 'PREPARING',
          orderItems: {
            create: orderItems
          },
          payments: {
            create: {
              amount: total,
              method: data.paymentMethod,
              status: 'COMPLETED'
            }
          }
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
          user: true
        }
      })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}