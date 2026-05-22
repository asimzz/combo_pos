'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type FoodCostItem = {
  id: string
  name: string
  category: string
  sellingPrice: number
  theoreticalCost: number
  grossMargin: number
  grossMarginPct: number
  foodCostPct: number
  hasRecipe: boolean
  ingredients: { name: string; quantity: number; unit: string; cost: number }[]
}

export function FoodCostReport() {
  const [items, setItems] = useState<FoodCostItem[]>([])
  const [avgFoodCostPct, setAvgFoodCostPct] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/reports/food-cost')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setAvgFoodCostPct(d.avgFoodCostPct ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  function marginColor(pct: number) {
    if (pct >= 70) return 'success'
    if (pct >= 50) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Menu Items</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">With Recipe</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{items.filter((i) => i.hasRecipe).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg Food Cost %</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{avgFoodCostPct}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg Gross Margin</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{(100 - avgFoodCostPct).toFixed(1)}%</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Food Cost by Menu Item</CardTitle>
          <span className="text-xs text-muted">Based on current recipes &amp; material costs</span>
        </CardHeader>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {items.map((item) => (
              <div key={item.id}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-surface text-left"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                      <span className="text-xs text-muted">{item.category}</span>
                      {!item.hasRecipe && (
                        <Badge variant="neutral" size="sm">No recipe</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>Sell: {formatPrice(item.sellingPrice)}</span>
                      {item.hasRecipe && (
                        <>
                          <span>Cost: {formatPrice(item.theoreticalCost)}</span>
                          <span>Margin: {formatPrice(item.grossMargin)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.hasRecipe && (
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted">Food cost</p>
                        <p className="text-sm font-semibold tabular-nums">{item.foodCostPct}%</p>
                      </div>
                      <Badge variant={marginColor(item.grossMarginPct)} size="sm">
                        {item.grossMarginPct}% margin
                      </Badge>
                    </div>
                  )}
                </button>
                {expanded === item.id && item.ingredients.length > 0 && (
                  <div className="bg-surface px-5 pb-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Ingredients</p>
                    <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                      {item.ingredients.map((ing) => (
                        <div key={ing.name} className="flex items-center justify-between rounded-lg bg-white border border-card-border px-3 py-2">
                          <div>
                            <p className="text-xs font-medium text-gray-800">{ing.name}</p>
                            <p className="text-xs text-muted">{ing.quantity} {ing.unit}</p>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 tabular-nums">{formatPrice(ing.cost)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
