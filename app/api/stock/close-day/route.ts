import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function previousDate(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = todayDate()
    const yesterday = previousDate(today)
    const userId = session.user.id

    const alreadyClosed = await prisma.dailyStockSnapshot.count({ where: { date: today } })
    if (alreadyClosed > 0) {
      return NextResponse.json({ error: 'Today is already closed' }, { status: 400 })
    }

    const [materials, yesterdaySnapshots] = await Promise.all([
      prisma.rawMaterial.findMany({
        where: { active: true },
        select: { id: true, stock: true },
        orderBy: { name: 'asc' },
      }),
      prisma.dailyStockSnapshot.findMany({
        where: { date: yesterday },
        select: { rawMaterialId: true, closingStock: true },
      }),
    ])

    if (materials.length === 0) {
      return NextResponse.json(
        { error: 'No active raw materials to snapshot' },
        { status: 400 },
      )
    }

    const yesterdayClosingByMaterial = new Map<string, number>()
    for (const snap of yesterdaySnapshots) {
      yesterdayClosingByMaterial.set(snap.rawMaterialId, snap.closingStock)
    }

    await prisma.dailyStockSnapshot.createMany({
      data: materials.map((m) => ({
        date: today,
        rawMaterialId: m.id,
        openingStock: yesterdayClosingByMaterial.get(m.id) ?? 0,
        closingStock: m.stock,
        closedById: userId,
      })),
    })

    return NextResponse.json({
      success: true,
      date: today,
      snapshotsCreated: materials.length,
    })
  } catch (error) {
    console.error('Error closing day:', error)
    return NextResponse.json({ error: 'Failed to close day' }, { status: 500 })
  }
}
