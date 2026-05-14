'use client'

import { DashboardStats } from '@/types'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: ShoppingCart,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: "Today's Sales",
      value: formatPrice(stats.todaySales),
      icon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Week Sales',
      value: formatPrice(stats.weekSales),
      icon: TrendingUp,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-50',
    },
    {
      title: 'Month Sales',
      value: formatPrice(stats.monthSales),
      icon: Calendar,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="flex items-start justify-between p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.title}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
