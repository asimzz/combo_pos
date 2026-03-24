import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Always return categorized menu for POS (staff/public view)
    const categories = await prisma.category.findMany({
      where: { active: true },
      include: {
        items: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Fetch stock groups and map to items
    const stockGroups = await prisma.stockGroup.findMany({
      include: { items: { select: { id: true } } }
    })

    const itemGroupMap = new Map<string, { stock: number; lowStockAlert: number }>()
    stockGroups.forEach((sg) => {
      sg.items.forEach((item) => {
        itemGroupMap.set(item.id, { stock: sg.stock, lowStockAlert: sg.lowStockAlert })
      })
    })

    // Attach stockGroup data to items
    const result = categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({
        ...item,
        stockGroup: itemGroupMap.get(item.id) || null,
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching POS menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}