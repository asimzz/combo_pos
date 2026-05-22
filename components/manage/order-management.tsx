'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { OrderWithItems } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Clock, User, Search, RefreshCw, Printer, Receipt, Truck, UtensilsCrossed, Trash2 } from 'lucide-react'
import { CustomerReceipt } from '@/components/receipts/customer-receipt'
import { KitchenReceipt } from '@/components/receipts/kitchen-receipt'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Pills } from '@/components/ui/pills'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

function statusVariant(status: string): Variant {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

function paymentVariant(status: string): Variant {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'REFUNDED':
      return 'danger'
    default:
      return 'warning'
  }
}

type VoidTarget = { orderId: string; itemId: string; itemName: string }

export function OrderManagement() {
  const { data: session } = useSession()
  const canVoid = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN'

  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [printingOrder, setPrintingOrder] = useState<OrderWithItems | null>(null)
  const [printType, setPrintType] = useState<'customer' | 'kitchen' | null>(null)
  const [voidTarget, setVoidTarget] = useState<VoidTarget | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidingItem, setVoidingItem] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
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
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order status')

      const updatedOrder = await response.json()
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o))
      toast.success(newStatus === 'CANCELLED' ? 'Order cancelled' : 'Order completed')
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery)

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handlePrintReceipt = (order: OrderWithItems, type: 'customer' | 'kitchen') => {
    setPrintingOrder(order)
    setPrintType(type)
  }

  const handlePrintComplete = () => {
    setPrintingOrder(null)
    setPrintType(null)
  }

  const voidOrderItem = async () => {
    if (!voidTarget) return
    setVoidingItem(true)
    try {
      const response = await fetch(
        `/api/orders/${voidTarget.orderId}/items/${voidTarget.itemId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: voidReason || undefined }),
        }
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to void item')
      }
      const updatedOrder: OrderWithItems = await response.json()
      setOrders(prev => prev.map(o => o.id === voidTarget.orderId ? updatedOrder : o))
      toast.success(`${voidTarget.itemName} voided`)
      setVoidTarget(null)
      setVoidReason('')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to void item')
    } finally {
      setVoidingItem(false)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Pills
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="text"
          placeholder="Search by order number, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
            Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-white py-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted" />
            <h3 className="text-base font-semibold text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-muted">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter'
                : 'Orders will appear here once customers place them'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING'
            const isDelivery = order.notes?.includes('Takeaway:') ?? false
            return (
              <div
                key={order.id}
                className="rounded-xl border border-card-border bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-base font-semibold text-gray-900">#{order.orderNumber}</h4>
                    <Badge variant={statusVariant(order.status)} size="sm">
                      {updatingOrder === order.id ? 'Updating…' : statusLabel(order.status)}
                    </Badge>
                    <Badge variant={isDelivery ? 'info' : 'neutral'} size="sm">
                      {isDelivery ? (
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> For delivery</span>
                      ) : (
                        <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" /> In house</span>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 tabular-nums">
                        {formatPrice(Number(order.total))}
                      </div>
                      <div className="text-xs text-muted">
                        {order.status === 'COMPLETED' && order.completedAt ? (
                          <>
                            <span>Done in {Math.round((new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime()) / 60000)} min</span>
                            <span className="mx-1">·</span>
                            <span>{formatDate(new Date(order.completedAt))}</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-1">Created</span>
                            <span>{formatDate(new Date(order.createdAt))}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {isPending && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updatingOrder === order.id}
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={updatingOrder === order.id}
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {(order.customerName || order.customerPhone) && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                    <User className="h-4 w-4" />
                    <span>
                      {order.customerName && order.customerPhone
                        ? `${order.customerName} • ${order.customerPhone}`
                        : order.customerName || order.customerPhone}
                    </span>
                  </div>
                )}

                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-surface p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {item.menuItem.name}
                        </span>
                        {item.notes && (
                          <p className="mt-0.5 text-xs italic text-muted">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <div className="text-sm font-semibold tabular-nums">×{item.quantity}</div>
                          <div className="text-xs text-muted tabular-nums">
                            {formatPrice(Number(item.total))}
                          </div>
                        </div>
                        {isPending && canVoid && (
                          <button
                            type="button"
                            title="Void item"
                            onClick={() => setVoidTarget({ orderId: order.id, itemId: item.id, itemName: item.menuItem.name })}
                            className="rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-3 rounded-md border border-amber-100 bg-amber-50 p-3">
                    <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Notes
                    </h5>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Receipt className="h-4 w-4" />}
                    onClick={() => handlePrintReceipt(order, 'customer')}
                  >
                    Customer receipt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={() => handlePrintReceipt(order, 'kitchen')}
                  >
                    Kitchen order
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span>
                      Payment <span className="font-medium capitalize text-gray-900">{order.paymentMethod.toLowerCase()}</span>
                    </span>
                    <Badge variant={paymentVariant(order.paymentStatus)} size="sm">
                      {order.paymentStatus === 'COMPLETED'
                        ? 'Paid'
                        : order.paymentStatus === 'REFUNDED'
                          ? 'Refunded'
                          : 'Unpaid'}
                    </Badge>
                  </div>
                  <span>
                    Staff <span className="font-medium text-gray-900">{order.user.name}</span>
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal
        open={!!voidTarget}
        onClose={() => { setVoidTarget(null); setVoidReason('') }}
        title="Void Item"
        footer={
          <>
            <Button variant="outline" disabled={voidingItem} onClick={() => { setVoidTarget(null); setVoidReason('') }}>
              Cancel
            </Button>
            <Button variant="danger" loading={voidingItem} disabled={voidingItem} onClick={voidOrderItem}>
              {voidingItem ? 'Voiding…' : 'Void Item'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Remove <span className="font-semibold">{voidTarget?.itemName}</span> from this order? This will be logged for accountability.
        </p>
        <Input
          type="text"
          placeholder="Reason (optional)"
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          className="mt-3"
        />
      </Modal>

      <Modal
        open={!!printingOrder}
        onClose={handlePrintComplete}
        title={printType === 'kitchen' ? 'Kitchen Order' : 'Customer Receipt'}
        width="md"
      >
        {printingOrder && printType === 'customer' && (
          <CustomerReceipt order={printingOrder} onPrint={handlePrintComplete} showPrintButton={true} />
        )}
        {printingOrder && printType === 'kitchen' && (
          <KitchenReceipt order={printingOrder} onPrint={handlePrintComplete} showPrintButton={true} />
        )}
      </Modal>
    </div>
  )
}
