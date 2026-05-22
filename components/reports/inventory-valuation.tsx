'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type InventoryItem = {
  id: string
  name: string
  unit: string
  category: string
  stock: number
  costPerUnit: number
  totalValue: number
}

type CategorySummary = {
  category: string
  totalValue: number
  items: number
}

type TrendPoint = {
  date: string
  value: number
}

type InvData = {
  totalValue: number
  items: InventoryItem[]
  trend: TrendPoint[]
  byCategory: CategorySummary[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-card-border bg-white p-3 shadow-sm text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-600">Value: {formatPrice(payload[0].value)}</p>
    </div>
  )
}

export function InventoryValuation() {
  const [data, setData] = useState<InvData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/inventory-valuation')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Inventory Value</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums">
            {data ? formatPrice(data.totalValue) : '—'}
          </p>
          <p className="text-xs text-muted mt-0.5">current stock × cost per unit</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Materials</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.items.length ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Categories</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.byCategory.length ?? '—'}</p>
        </Card>
      </div>

      {data && data.trend.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Inventory Value Trend — Last 30 Days</CardTitle>
          </CardHeader>
          <div className="p-5 pt-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#invGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Value by Category</CardTitle>
          </CardHeader>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {(data?.byCategory ?? []).map((cat) => {
                const pct = data && data.totalValue > 0 ? (cat.totalValue / data.totalValue) * 100 : 0
                return (
                  <div key={cat.category} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">{cat.items} items</span>
                        <span className="text-sm font-semibold tabular-nums">{formatPrice(cat.totalValue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <CardTitle>All Materials</CardTitle>
          </CardHeader>
          <div className="max-h-80 overflow-y-auto divide-y divide-card-border">
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse" />)}
              </div>
            ) : (data?.items ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted text-center">No materials found</p>
            ) : (
              (data?.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-muted">{item.stock} {item.unit} × {formatPrice(item.costPerUnit)}/{item.unit}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-900">{formatPrice(item.totalValue)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
