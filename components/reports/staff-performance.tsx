'use client'

import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'


type StaffMember = {
  name: string
  role: string
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
}

interface StaffPerformanceProps {
  startDate: string
  endDate: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-700',
  MANAGER: 'bg-amber-50 text-amber-700',
  STAFF: 'bg-blue-50 text-blue-700',
}

export function StaffPerformance({ startDate, endDate }: StaffPerformanceProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!startDate || !endDate) return
    setLoading(true)
    fetch(`/api/reports/staff?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((d) => setStaff(d.staff ?? []))
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  const topRevenue = staff.reduce((max, s) => Math.max(max, s.totalRevenue), 0)

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Staff Performance</CardTitle>
        <span className="text-xs text-muted">{startDate} → {endDate}</span>
      </CardHeader>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted text-center">No orders in this period</p>
      ) : (
        <div className="divide-y divide-card-border">
          {staff.map((member, idx) => {
            const pct = topRevenue > 0 ? (member.totalRevenue / topRevenue) * 100 : 0
            return (
              <div key={member.name} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{member.name}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 mb-2">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>{member.totalOrders} orders</span>
                    <span>Avg {formatPrice(member.avgOrderValue)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatPrice(member.totalRevenue)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
