'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type DateRangeData = {
  totalOrders: number
  totalRevenue: number
  totalSubtotal: number
  totalTax: number
  totalServiceCharge: number
  totalDiscount: number
  byCategory: { category: string; revenue: number; items: number }[]
  byPaymentMethod: { method: string; amount: number; count: number }[]
}

function exportCsv(data: DateRangeData, start: string, end: string) {
  const rows: string[][] = [
    ['Date Range Report', `${start} to ${end}`, '', ''],
    [],
    ['Summary'],
    ['Total Orders', data.totalOrders.toString()],
    ['Total Revenue', data.totalRevenue.toString()],
    ['Subtotal', data.totalSubtotal.toString()],
    ['Tax', data.totalTax.toString()],
    ['Service Charge', data.totalServiceCharge.toString()],
    ['Discounts', data.totalDiscount.toString()],
    [],
    ['Revenue by Category'],
    ['Category', 'Revenue', 'Items Sold'],
    ...data.byCategory.map((c) => [c.category, c.revenue.toString(), c.items.toString()]),
    [],
    ['Revenue by Payment Method'],
    ['Method', 'Amount', 'Orders'],
    ...data.byPaymentMethod.map((p) => [p.method, p.amount.toString(), p.count.toString()]),
  ]

  const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${start}-to-${end}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface DateRangeReportProps {
  startDate: string
  endDate: string
}

export function DateRangeReport({ startDate, endDate }: DateRangeReportProps) {
  const [data, setData] = useState<DateRangeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!startDate || !endDate) return
    setLoading(true)
    setData(null)
    fetch(`/api/reports/date-range?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  const summaryCards = [
    { label: 'Total Orders', value: data.totalOrders.toLocaleString(), sub: 'completed orders' },
    { label: 'Total Revenue', value: formatPrice(data.totalRevenue), sub: 'incl. tax & service' },
    { label: 'Net Subtotal', value: formatPrice(data.totalSubtotal), sub: 'before tax & fees' },
    { label: 'Tax Collected', value: formatPrice(data.totalTax), sub: 'from completed orders' },
    { label: 'Service Charge', value: formatPrice(data.totalServiceCharge), sub: 'from completed orders' },
    { label: 'Discounts Given', value: formatPrice(data.totalDiscount), sub: 'total discount applied' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportCsv(data, startDate, endDate)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted">{card.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <div className="divide-y divide-card-border">
            {data.byCategory.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No data for this period</p>
            ) : (
              data.byCategory.map((c) => {
                const pct = data.totalRevenue > 0 ? (c.revenue / data.totalRevenue) * 100 : 0
                return (
                  <div key={c.category} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{c.category}</span>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-xs text-muted">{c.items} items</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatPrice(c.revenue)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
          </CardHeader>
          <div className="divide-y divide-card-border">
            {data.byPaymentMethod.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No data for this period</p>
            ) : (
              data.byPaymentMethod.map((p) => {
                const pct = data.totalRevenue > 0 ? (p.amount / data.totalRevenue) * 100 : 0
                return (
                  <div key={p.method} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{p.method}</span>
                        <div className="flex items-center gap-3 ml-2">
                          <span className="text-xs text-muted">{p.count} orders</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatPrice(p.amount)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
