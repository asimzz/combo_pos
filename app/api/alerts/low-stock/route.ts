import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get menu items with low stock
    // First get all active menu items, then filter in code since we need to compare stock against lowStockAlert per item
    const allMenuItems = await prisma.menuItem.findMany({
      where: {
        active: true,
        stock: {
          not: null,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    })

    // Filter items where stock is less than or equal to their individual lowStockAlert
    const lowStockMenuItems = allMenuItems.filter(item => {
      const stock = item.stock || 0
      const lowStockAlert = item.lowStockAlert || 10
      return stock <= lowStockAlert
    })

    // Get raw materials with low stock (less than 5 units)
    const lowStockRawMaterials = await prisma.rawMaterial.findMany({
      where: {
        active: true,
        stock: {
          lte: 5,
        },
      },
      orderBy: {
        stock: 'asc',
      },
    })

    return NextResponse.json({
      menuItems: lowStockMenuItems,
      rawMaterials: lowStockRawMaterials,
      totalAlerts: lowStockMenuItems.length + lowStockRawMaterials.length,
    })
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock alerts' },
      { status: 500 }
    )
  }
}