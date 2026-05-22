'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

type CategoryData = {
  category: string
  total: number
  orders: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-card-border bg-white p-3 shadow-sm text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-600">
          {p.name === 'total' ? `Revenue: ${formatPrice(p.value)}` : `Items: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue by Category — Last 30 Days</CardTitle>
      </CardHeader>
      <div className="p-5 pt-3">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
