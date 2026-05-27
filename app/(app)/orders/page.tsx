import { OrderManagement } from '@/components/manage/order-management'

export default function OrdersPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-muted">Track and update order statuses</p>
        </div>

        <div className="rounded-xl border border-card-border bg-white">
          <OrderManagement />
        </div>
      </div>
    </div>
  )
}
