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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = todayDate()
    const yesterday = previousDate(today)

    const startOfToday = new Date(today + 'T00:00:00Z')
    const startOfTomorrow = new Date(today + 'T00:00:00Z')
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1)

    const [materials, snapshotCount, yesterdaySnapshots, todaySnapshots, todayLogs] = await Promise.all([
      prisma.rawMaterial.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.dailyStockSnapshot.count(),
      prisma.dailyStockSnapshot.findMany({ where: { date: yesterday } }),
      prisma.dailyStockSnapshot.findMany({ where: { date: today } }),
      prisma.rawMaterialStockLog.findMany({
        where: { createdAt: { gte: startOfToday, lt: startOfTomorrow } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const isBootstrapped = snapshotCount > 0
    const yesterdayClosed = !isBootstrapped || yesterdaySnapshots.length > 0
    const todayClosed = todaySnapshots.length > 0

    const yesterdayClosingByMaterial = new Map<string, number>()
    for (const snap of yesterdaySnapshots) {
      yesterdayClosingByMaterial.set(snap.rawMaterialId, snap.closingStock)
    }

    const movementsByMaterial = new Map<string, { IN: number; OUT: number; WASTE: number; ADJUSTMENT: number }>()
    const logsByMaterial = new Map<string, typeof todayLogs>()
    for (const log of todayLogs) {
      let mvs = movementsByMaterial.get(log.rawMaterialId)
      if (!mvs) {
        mvs = { IN: 0, OUT: 0, WASTE: 0, ADJUSTMENT: 0 }
        movementsByMaterial.set(log.rawMaterialId, mvs)
      }
      mvs[log.type] += log.quantity

      let logs = logsByMaterial.get(log.rawMaterialId)
      if (!logs) {
        logs = []
        logsByMaterial.set(log.rawMaterialId, logs)
      }
      logs.push(log)
    }

    const result = materials.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      currentStock: m.stock,
      openingStock: yesterdayClosingByMaterial.get(m.id) ?? 0,
      movements: movementsByMaterial.get(m.id) ?? { IN: 0, OUT: 0, WASTE: 0, ADJUSTMENT: 0 },
      todayLogs: (logsByMaterial.get(m.id) ?? []).map((l) => ({
        id: l.id,
        type: l.type,
        quantity: l.quantity,
        reason: l.reason,
        createdAt: l.createdAt,
        user: l.user,
      })),
    }))

    return NextResponse.json({
      today,
      yesterday,
      isBootstrapped,
      yesterdayClosed,
      todayClosed,
      materials: result,
    })
  } catch (error) {
    console.error('Error fetching stock view:', error)
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 })
  }
}
