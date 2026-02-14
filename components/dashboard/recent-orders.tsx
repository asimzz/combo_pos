'use client'

import { OrderWithItems } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Clock, User } from 'lucide-react'

interface RecentOrdersProps {
  orders: OrderWithItems[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'SERVED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <div className="card p-6">
      <div className="flex items-center mb-6">
        <Clock className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders yet
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">
                    #{order.orderNumber}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>{formatDate(new Date(order.createdAt))}</span>
                  {order.customerName && (
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {order.customerName}
                    </div>
                  )}
                  <span>{order.orderItems.length} items</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatPrice(Number(order.total))}
                </div>
                <div className="text-sm text-gray-600 capitalize">
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