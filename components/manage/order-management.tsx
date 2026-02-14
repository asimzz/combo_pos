'use client'

import { useState, useEffect } from 'react'
import { OrderWithItems } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Clock, User, Search, Filter, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderManagementProps {}

export function OrderManagement({}: OrderManagementProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update order status')

      toast.success(`Order status updated to ${newStatus.toLowerCase()}`)
      await fetchOrders()
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SERVED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getNextStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['PREPARING', 'CANCELLED']
      case 'PREPARING':
        return ['READY', 'CANCELLED']
      case 'READY':
        return ['SERVED']
      case 'SERVED':
        return []
      case 'CANCELLED':
        return []
      default:
        return []
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery)

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Order Management</h3>
          <p className="text-sm text-gray-600">Track and update order statuses</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn btn-outline px-4 py-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input pl-10"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria'
                : 'Orders will appear here once customers place them'
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <h4 className="text-lg font-semibold text-gray-900">
                    #{order.orderNumber}
                  </h4>
                  <div className="relative">
                    {getNextStatuses(order.status).length > 0 && updatingOrder !== order.id ? (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border cursor-pointer bg-white hover:shadow-md ${getStatusColor(
                          order.status
                        )}`}
                        style={{ minWidth: '120px' }}
                      >
                        <option value={order.status} className="bg-white text-black">
                          {order.status}
                        </option>
                        {getNextStatuses(order.status).map((status) => (
                          <option key={status} value={status} className="bg-white text-black">
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {updatingOrder === order.id ? 'Updating...' : order.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(Number(order.total))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(new Date(order.createdAt))}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {(order.customerName || order.customerPhone) && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    {order.customerName && order.customerPhone
                      ? `${order.customerName} • ${order.customerPhone}`
                      : order.customerName || order.customerPhone
                    }
                  </span>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                <h5 className="font-medium text-gray-900">Items:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.menuItem.name}</span>
                        {item.notes && (
                          <p className="text-xs text-gray-600 italic">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">×{item.quantity}</div>
                        <div className="text-xs text-gray-600">
                          {formatPrice(Number(item.total))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-1">Order Notes:</h5>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              {/* Payment Info */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  Payment: <span className="font-medium capitalize">{order.paymentMethod.toLowerCase()}</span>
                </span>
                <span className="text-sm text-gray-600">
                  Staff: <span className="font-medium">{order.user.name}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}