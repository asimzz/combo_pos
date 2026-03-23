import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataSync } from '@/lib/sync'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await DataSync.exportData()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data,
      recordCounts: {
        users: data.users.length,
        categories: data.categories.length,
        menuItems: data.menuItems.length,
        orders: data.orders.length,
        orderItems: data.orderItems.length,
        payments: data.payments.length,
        dailySales: data.dailySales.length,
        rawMaterials: data.rawMaterials.length,
        rawMaterialUsage: data.rawMaterialUsage.length,
        rawMaterialStockLogs: data.rawMaterialStockLogs.length
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Data export endpoint - use POST to export data',
    requiredRole: 'ADMIN or MANAGER'
  })
}