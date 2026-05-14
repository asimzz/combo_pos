'use client'

import { TrendingUp } from 'lucide-react'

interface PopularItemsProps {
  items: { name: string; quantity: number }[]
}

export function PopularItems({ items }: PopularItemsProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-white">
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Popular Items</h2>
        </div>
        <div className="px-5 py-12 text-center text-sm text-muted">No sales data available yet</div>
      </div>
    )
  }

  const maxQuantity = Math.max(...items.map((item) => item.quantity))

  return (
    <div className="rounded-xl border border-card-border bg-white">
      <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
        <TrendingUp className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-gray-900">Popular Items</h2>
      </div>

      <div className="space-y-3 p-5">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-sm font-medium text-gray-900">{item.name}</span>
                <span className="text-xs text-muted tabular-nums">{item.quantity} sold</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
