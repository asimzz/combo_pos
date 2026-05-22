'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type WasteItem = {
  name: string
  category: string
  totalWaste: number
  totalOpening: number
  wastePercent: number
  days: number
}

type WasteData = {
  items: WasteItem[]
  totalWaste: number
  totalOpening: number
  overallWastePct: number
  days: number
}

interface WasteAnalysisProps {
  days?: number
}

function wasteBadge(pct: number): 'success' | 'warning' | 'danger' {
  if (pct <= 3) return 'success'
  if (pct <= 8) return 'warning'
  return 'danger'
}

export function WasteAnalysis({ days = 30 }: WasteAnalysisProps) {
  const [data, setData] = useState<WasteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/waste?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overall Waste %</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.overallWastePct ?? '—'}%</p>
          <p className="text-xs text-muted mt-0.5">of opening stock</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Waste</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.totalWaste ?? '—'}</p>
          <p className="text-xs text-muted mt-0.5">units</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Items Tracked</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.items.length ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Period</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{days}</p>
          <p className="text-xs text-muted mt-0.5">days</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Waste by Menu Item</CardTitle>
          <span className="text-xs text-muted">Worst offenders first</span>
        </CardHeader>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted text-center">No stock snapshot data found for this period</p>
        ) : (
          <div className="divide-y divide-card-border">
            {data.items.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <span className="text-xs text-muted">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-red-400"
                        style={{ width: `${Math.min(item.wastePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right text-xs text-muted">
                    <p>{item.totalWaste} wasted</p>
                    <p>of {item.totalOpening} opening</p>
                  </div>
                  <Badge variant={wasteBadge(item.wastePercent)} size="sm">
                    {item.wastePercent}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
