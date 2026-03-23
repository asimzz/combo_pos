import { NextResponse } from 'next/server'
import { DataSync } from '@/lib/sync'

export async function GET() {
  try {
    const isOnline = await DataSync.checkConnection()

    return NextResponse.json({
      online: isOnline,
      timestamp: new Date().toISOString(),
      database: 'SQLite (offline-first)',
      status: isOnline ? 'Connected - Ready to sync' : 'Offline - Working locally'
    })
  } catch (error) {
    return NextResponse.json({
      online: false,
      timestamp: new Date().toISOString(),
      database: 'SQLite (offline-first)',
      status: 'Offline - Working locally',
      error: 'Connection check failed'
    })
  }
}