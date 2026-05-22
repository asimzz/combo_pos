'use client'

import { useState } from 'react'
import { CategoryWithItems } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Plus, Star } from 'lucide-react'
import { Pills } from '@/components/ui/pills'
import { Badge } from '@/components/ui/badge'

interface MenuGridProps {
  categories: CategoryWithItems[]
  onAddToCart: (item: CategoryWithItems['items'][0]) => void
}

function stockBadgeClass(stock: number): string {
  if (stock > 10) return 'bg-green-100 text-green-700'
  if (stock >= 5) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export function MenuGrid({ categories, onAddToCart }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const filteredCategories = selectedCategory
    ? categories.filter((category) => category.id === selectedCategory)
    : categories

  const pillOptions = [
    { value: '', label: 'All Items' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-6">
      <Pills value={selectedCategory} onChange={setSelectedCategory} options={pillOptions} size="sm" />

      {filteredCategories.map((category) => (
        <div key={category.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
            {category.description ? (
              <p className="text-xs text-muted">{category.description}</p>
            ) : null}
          </div>

          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
            {category.items.map((item) => {
              const outOfStock = item.stock !== null && item.stock === 0
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !outOfStock && onAddToCart(item)}
                  disabled={outOfStock}
                  className={[
                    'group flex h-full flex-col rounded-xl border p-3 text-left transition-all focus:outline-none',
                    outOfStock
                      ? 'border-card-border bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-card-border bg-white hover:border-primary-500/40 hover:shadow-sm cursor-pointer focus:ring-2 focus:ring-primary-500/30',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    {item.featured && !outOfStock ? (
                      <Badge variant="warning" size="sm" leftIcon={<Star className="h-3 w-3" />}>
                        Popular
                      </Badge>
                    ) : null}
                  </div>

                  {item.description ? (
                    <p className="mt-1 text-xs text-muted line-clamp-2">{item.description}</p>
                  ) : null}

                  <div className="mt-3 text-xl font-bold text-primary-600 tabular-nums">
                    {formatPrice(Number(item.price))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    {item.stock !== null ? (
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${outOfStock ? 'bg-gray-100 text-gray-400' : stockBadgeClass(item.stock)}`}>
                        {item.stock}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-white transition-colors ${outOfStock ? 'bg-gray-300' : 'bg-primary-500 group-hover:bg-primary-600'}`}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
          No menu items available
        </div>
      ) : null}
    </div>
  )
}
