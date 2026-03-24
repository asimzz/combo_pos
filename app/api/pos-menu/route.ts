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
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching POS menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}