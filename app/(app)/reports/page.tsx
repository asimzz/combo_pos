'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { DateRangeReport } from '@/components/reports/date-range-report'
import { StaffPerformance } from '@/components/reports/staff-performance'
import { FoodCostReport } from '@/components/reports/food-cost-report'
import { WasteAnalysis } from '@/components/reports/waste-analysis'
import { InventoryValuation } from '@/components/reports/inventory-valuation'

type Tab = 'overview' | 'staff' | 'food-cost' | 'waste' | 'inventory'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Date-Range Report' },
  { id: 'staff', label: 'Staff Performance' },
  { id: 'food-cost', label: 'Food Cost' },
  { id: 'waste', label: 'Waste Analysis' },
  { id: 'inventory', label: 'Inventory Value' },
]

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function thirtyDaysAgoStr() {
  return format(subDays(new Date(), 29), 'yyyy-MM-dd')
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<Tab>('overview')
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [reportKey, setReportKey] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role === 'STAFF') {
      redirect('/sell')
    }
  }, [session, status])

  const applyDates = () => setReportKey((k) => k + 1)

  if (status === 'loading') {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse mb-6" />
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-muted">Analytics and performance reports</p>
          </div>

          {(tab === 'overview' || tab === 'staff') && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">From</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={todayStr()}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <button
                onClick={applyDates}
                className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                Apply
              </button>
              <div className="flex gap-1">
                {[
                  { label: '7d', days: 7 },
                  { label: '30d', days: 30 },
                  { label: '90d', days: 90 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setStartDate(format(subDays(new Date(), preset.days - 1), 'yyyy-MM-dd'))
                      setEndDate(todayStr())
                      setReportKey((k) => k + 1)
                    }}
                    className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-surface transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-0 overflow-x-auto border-b border-card-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-muted hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <DateRangeReport key={`dr-${reportKey}-${startDate}-${endDate}`} startDate={startDate} endDate={endDate} />
        )}
        {tab === 'staff' && (
          <StaffPerformance key={`sp-${reportKey}-${startDate}-${endDate}`} startDate={startDate} endDate={endDate} />
        )}
        {tab === 'food-cost' && <FoodCostReport />}
        {tab === 'waste' && <WasteAnalysis days={30} />}
        {tab === 'inventory' && <InventoryValuation />}
      </div>
    </div>
  )
}
