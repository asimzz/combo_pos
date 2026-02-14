'use client'

import { TrendingUp } from 'lucide-react'

interface PopularItemsProps {
  items: { name: string; quantity: number }[]
}

export function PopularItems({ items }: PopularItemsProps) {
  if (items.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Popular Items</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          No sales data available yet
        </div>
      </div>
    )
  }

  const maxQuantity = Math.max(...items.map(item => item.quantity))

  return (
    <div className="card p-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Popular Items</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
                <span className="text-sm text-gray-600">
                  {item.quantity} sold
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.quantity / maxQuantity) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}