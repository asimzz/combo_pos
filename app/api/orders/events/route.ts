import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subscribeToOrderEvents } from '@/lib/order-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ORDER_INCLUDE = {
  orderItems: {
    include: {
      menuItem: { include: { category: true } },
    },
  },
  payments: true,
  user: { select: { name: true, phone: true } },
} as const

export async function GET(req: NextRequest) {
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'asc' },
  })

  const enc = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'initial', data: pendingOrders })}\n\n`))
      unsubscribe = subscribeToOrderEvents(ctrl)
    },
    cancel() {
      unsubscribe?.()
    },
  })

  req.signal.addEventListener('abort', () => unsubscribe?.())

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
