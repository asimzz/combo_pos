import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  cost: z.number().min(0),
  categoryId: z.string(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // If admin/manager, show all items; if staff/public, show only active items
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

    if (isAdmin) {
      // Admin view: show all menu items with categories
      const menuItems = await prisma.menuItem.findMany({
        include: {
          category: true
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { sortOrder: 'asc' }
        ]
      })
      return NextResponse.json(menuItems)
    } else {
      // Public/Staff view: show categorized menu
      const categories = await prisma.category.findMany({
        where: { active: true },
        include: {
          items: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })
      return NextResponse.json(categories)
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createMenuItemSchema.parse(body)

    // Get the highest sort order in the category
    const lastItem = await prisma.menuItem.findFirst({
      where: { categoryId: data.categoryId },
      orderBy: { sortOrder: 'desc' }
    })

    const menuItem = await prisma.menuItem.create({
      data: {
        ...data,
        sortOrder: (lastItem?.sortOrder || 0) + 1
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error creating menu item:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}