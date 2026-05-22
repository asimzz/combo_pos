'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

type DayData = {
  date: string
  label: string
  total: number
  orders: number
}

interface SalesLineChartProps {
  data: DayData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-card-border bg-white p-3 shadow-sm text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-600">
          {p.name === 'total' ? `Revenue: ${formatPrice(p.value)}` : `Orders: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function SalesLineChart({ data }: SalesLineChartProps) {
  const thinned = data.filter((_, i) => i % 3 === 0 || i === data.length - 1)

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Daily Revenue — Last 30 Days</CardTitle>
      </CardHeader>
      <div className="p-5 pt-3">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              ticks={thinned.map((d) => d.label)}
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
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
