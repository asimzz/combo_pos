'use client'

import { OrderWithItems } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RecentOrdersProps {
  orders: OrderWithItems[]
}

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

function statusVariant(status: string): Variant {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-card-border bg-white">
      <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
        <Clock className="h-4 w-4 text-primary-600" />
        <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted">No orders yet</div>
      ) : (
        <div className="divide-y divide-card-border">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                  <Badge variant={statusVariant(order.status)} size="sm">
                    {order.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{formatDate(new Date(order.createdAt))}</span>
                  {order.customerName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.customerName}
                    </span>
                  )}
                  <span>{order.orderItems.length} items</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-900 tabular-nums">
                  {formatPrice(Number(order.total))}
                </div>
                <div className="text-xs capitalize text-muted">
                  {order.paymentMethod.toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
