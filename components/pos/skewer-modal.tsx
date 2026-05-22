'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { KOFTA_RM_ID, SHEESH_RM_ID, SkewerType, SKEWER_TYPES } from '@/lib/skewer-config'
import type { MenuItem } from '@prisma/client'

export interface SkewerSelection {
  counts: Record<SkewerType, number>
  deductions: Array<{ rawMaterialId: string; amount: number }>
}

interface SkewerModalProps {
  item: MenuItem
  skewerCount: number
  onConfirm: (item: MenuItem, selection: SkewerSelection) => void
  onClose: () => void
}

const RM_IDS: Record<SkewerType, string> = {
  Kofta:  KOFTA_RM_ID,
  Sheesh: SHEESH_RM_ID,
}

const COLORS: Record<SkewerType, { border: string; bg: string; text: string; dot: string }> = {
  Kofta:  { border: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-800',  dot: 'bg-amber-400' },
  Sheesh: { border: 'border-primary-400', bg: 'bg-primary-50', text: 'text-primary-800', dot: 'bg-primary-400' },
}

export function SkewerModal({ item, skewerCount, onConfirm, onClose }: SkewerModalProps) {
  const [counts, setCounts] = useState<Record<SkewerType, number>>({ Kofta: skewerCount, Sheesh: 0 })

  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0)
  const remaining = skewerCount - total

  const adjust = (type: SkewerType, delta: number) => {
    setCounts(prev => {
      const next = prev[type] + delta
      if (next < 0 || next > skewerCount) return prev
      // Redistribute the opposite type so total stays ≤ skewerCount
      const other = SKEWER_TYPES.find(t => t !== type)!
      const otherNext = Math.max(0, prev[other] - Math.max(0, (prev[type] + delta + prev[other]) - skewerCount))
      return { ...prev, [type]: next, [other]: otherNext }
    })
  }

  const handleConfirm = () => {
    const deductions = SKEWER_TYPES
      .filter(t => counts[t] > 0)
      .map(t => ({ rawMaterialId: RM_IDS[t], amount: counts[t] }))
    onConfirm(item, { counts, deductions })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Choose skewer types — ${item.name}`}
      description={`Pick ${skewerCount} skewer${skewerCount > 1 ? 's' : ''}`}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={remaining !== 0}>
            {remaining === 0 ? 'Continue to Sides' : `${remaining} left to assign`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {SKEWER_TYPES.map(type => {
          const c = COLORS[type]
          const count = counts[type]
          return (
            <div
              key={type}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${count > 0 ? `${c.border} ${c.bg}` : 'border-card-border bg-white'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${count > 0 ? c.dot : 'bg-gray-300'}`} />
                <span className={`font-semibold ${count > 0 ? c.text : 'text-gray-500'}`}>{type}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjust(type, -1)}
                  disabled={count === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className={`w-6 text-center text-lg font-bold tabular-nums ${count > 0 ? c.text : 'text-gray-400'}`}>
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => adjust(type, 1)}
                  disabled={total >= skewerCount}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}

        {remaining > 0 && (
          <p className="text-center text-xs text-muted">
            {remaining} more skewer{remaining > 1 ? 's' : ''} to assign
          </p>
        )}
      </div>
    </Modal>
  )
}
