'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { OrderWithItems } from '@/types'
import { CheckCircle, Clock, UtensilsCrossed, Wifi, WifiOff } from 'lucide-react'

function minutesAgo(createdAt: Date | string, now: Date): number {
  return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000)
}

type KitchenEvent =
  | { type: 'initial'; data: OrderWithItems[] }
  | { type: 'order.new'; data: OrderWithItems }
  | { type: 'order.updated'; data: OrderWithItems }

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [now, setNow] = useState(() => new Date())
  const [connected, setConnected] = useState(false)
  const [markingReady, setMarkingReady] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clock tick every 30 seconds to update wait times
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // SSE connection with auto-reconnect
  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/orders/events')
      esRef.current = es

      es.onopen = () => setConnected(true)

      es.onmessage = (e: MessageEvent) => {
        const event = JSON.parse(e.data) as KitchenEvent
        if (event.type === 'initial') {
          setOrders(event.data)
        } else if (event.type === 'order.new') {
          setOrders(prev => [...prev, event.data])
        } else if (event.type === 'order.updated') {
          const updated = event.data
          if (updated.status !== 'PENDING') {
            setOrders(prev => prev.filter(o => o.id !== updated.id))
          } else {
            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
          }
        }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        reconnectTimer.current = setTimeout(connect, 3_000)
      }
    }

    connect()
    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [])

  const markReady = useCallback(async (orderId: string) => {
    setMarkingReady(orderId)
    try {
      await fetch(`/api/kitchen/orders/${orderId}/ready`, { method: 'PATCH' })
    } finally {
      setMarkingReady(null)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-orange-400" />
            <h1 className="text-lg font-bold tracking-widest uppercase">Kitchen Display</h1>
            {orders.length > 0 && (
              <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold">
                {orders.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {connected ? (
              <span className="flex items-center gap-1.5 text-green-400">
                <Wifi className="h-4 w-4" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-400">
                <WifiOff className="h-4 w-4" />
                Reconnecting…
              </span>
            )}
            <span className="tabular-nums text-gray-400">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Orders grid */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-gray-600">
            <CheckCircle className="mb-4 h-16 w-16" />
            <p className="text-2xl font-semibold">All clear!</p>
            <p className="mt-2 text-sm">No pending orders right now</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map(order => {
              const wait = minutesAgo(order.createdAt, now)
              const urgency = wait >= 20 ? 'high' : wait >= 10 ? 'medium' : 'low'
              const isMarking = markingReady === order.id

              const itemsByCategory = order.orderItems.reduce<Record<string, typeof order.orderItems>>(
                (acc, item) => {
                  const cat = item.menuItem.category?.name ?? 'Other'
                  ;(acc[cat] ??= []).push(item)
                  return acc
                },
                {},
              )

              return (
                <div
                  key={order.id}
                  className={[
                    'flex flex-col rounded-xl border-2 bg-gray-900 p-4 transition-colors',
                    urgency === 'high'
                      ? 'border-red-500'
                      : urgency === 'medium'
                        ? 'border-amber-400'
                        : 'border-gray-700',
                  ].join(' ')}
                >
                  {/* Order header */}
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold">#{order.orderNumber}</h2>
                    <span
                      className={[
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        urgency === 'high'
                          ? 'bg-red-900 text-red-300'
                          : urgency === 'medium'
                            ? 'bg-amber-900 text-amber-300'
                            : 'bg-gray-800 text-gray-400',
                      ].join(' ')}
                    >
                      <Clock className="h-3 w-3" />
                      {wait}m
                    </span>
                  </div>

                  {order.customerName && (
                    <p className="mb-2 text-xs text-gray-400">{order.customerName}</p>
                  )}

                  {/* Items by category */}
                  <div className="mb-4 flex-1 space-y-3">
                    {Object.entries(itemsByCategory).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {cat}
                        </div>
                        {items.map(item => (
                          <div key={item.id} className="py-0.5">
                            <div className="text-sm font-medium">
                              {item.quantity}× {item.menuItem.name}
                            </div>
                            {item.notes && (
                              <div className="mt-0.5 text-xs text-amber-400">⚠ {item.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mb-3 rounded-md bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
                      {order.notes}
                    </div>
                  )}

                  <button
                    onClick={() => markReady(order.id)}
                    disabled={isMarking}
                    className="mt-auto w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-500 active:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isMarking ? 'Marking ready…' : '✓ Ready'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
