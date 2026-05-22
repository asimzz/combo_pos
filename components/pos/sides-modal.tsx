'use client'

import { useState } from 'react'
import { CategoryWithItems } from '@/types'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import {
  SIDE_GROUPS,
  SANDWICH_DEFAULT_SIDE,
  FRIES_DEDUCTION,
  EXTRA_PRICE,
  getFreeQty,
} from '@/lib/sides-config'
import type { MenuItem } from '@prisma/client'

export type GroupSelection = { key: string; selected: string[] }

interface SidesModalProps {
  item: MenuItem
  isSandwich: boolean
  sidesCategories: CategoryWithItems[]
  onConfirm: (item: MenuItem, groupSelections: GroupSelection[]) => void
  onClose: () => void
}

export function SidesModal({ item, isSandwich, sidesCategories, onConfirm, onClose }: SidesModalProps) {
  const freeQty = getFreeQty(item.name)

  // Sandwich mode state
  const [withChips, setWithChips] = useState(true)

  // Regular mode state
  const groupItems = SIDE_GROUPS.map(group => ({
    group,
    items: sidesCategories
      .filter(c => group.categoryNames.includes(c.name))
      .flatMap(c => c.items),
  })).filter(({ items }) => items.length > 0)

  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const { group, items } of groupItems) {
      init[group.key] = items.some(i => i.name === group.defaultItem) ? [group.defaultItem] : []
    }
    return init
  })

  // --- Sandwich mode ---
  if (isSandwich) {
    const sandwichPriceLabel = withChips
      ? 'Add to Order'
      : `Add to Order (−${formatPrice(FRIES_DEDUCTION)})`

    return (
      <Modal
        open
        onClose={onClose}
        title={`Add ${item.name}`}
        description="Chips included by default"
        width="sm"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirm(item, [{ key: 'carbs', selected: withChips ? [SANDWICH_DEFAULT_SIDE] : [] }])}>
              {sandwichPriceLabel}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setWithChips(true)}
            className={`flex-1 rounded-lg border px-4 py-5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
              withChips
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-card-border bg-white text-gray-600 hover:border-primary-300 hover:text-gray-800'
            }`}
          >
            With Chips
          </button>
          <button
            type="button"
            onClick={() => setWithChips(false)}
            className={`flex-1 rounded-lg border px-4 py-5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
              !withChips
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-card-border bg-white text-gray-600 hover:border-amber-300 hover:text-gray-800'
            }`}
          >
            No Chips
            <span className={`block text-xs mt-0.5 ${!withChips ? 'text-amber-600' : 'text-muted'}`}>
              −{formatPrice(FRIES_DEDUCTION)}
            </span>
          </button>
        </div>
      </Modal>
    )
  }

  // --- Regular mode ---
  const toggle = (groupKey: string, name: string) => {
    setSelections(prev => {
      const current = prev[groupKey] ?? []
      const count = current.filter(n => n === name).length
      if (count >= freeQty) {
        return { ...prev, [groupKey]: current.filter(n => n !== name) }
      }
      return { ...prev, [groupKey]: [...current, name] }
    })
  }

  const groupExtraCost = (groupKey: string) =>
    Math.max(0, (selections[groupKey]?.length ?? 0) - freeQty) * EXTRA_PRICE

  const totalExtrasCost = SIDE_GROUPS.reduce((sum, g) => sum + groupExtraCost(g.key), 0)

  const priceLabel =
    totalExtrasCost > 0
      ? `Add to Order (+${formatPrice(totalExtrasCost)})`
      : 'Add to Order'

  const handleConfirm = () => {
    const groupSelections: GroupSelection[] = groupItems.map(({ group }) => ({
      key: group.key,
      selected: selections[group.key] ?? [],
    }))
    onConfirm(item, groupSelections)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Sides for ${item.name}`}
      description={freeQty === 2 ? '2 free per group (large)' : '1 free per group'}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>{priceLabel}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {groupItems.length === 0 && (
          <p className="text-sm text-muted">
            No sides found. Add items to the Salads, Carbs, or Sauces categories in Catalog.
          </p>
        )}

        {groupItems.map(({ group, items }) => {
          const selected = selections[group.key] ?? []
          const extraCost = groupExtraCost(group.key)

          return (
            <div key={group.key}>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {group.label}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-green-600">
                    {Math.min(selected.length, freeQty)}/{freeQty} free
                  </span>
                  {extraCost > 0 && (
                    <span className="font-medium text-amber-600">
                      +{formatPrice(extraCost)} extras
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {items.map(side => {
                  const count = selected.filter(n => n === side.name).length
                  const isSelected = count > 0
                  const firstIndex = selected.indexOf(side.name)
                  const isPaid = isSelected && firstIndex >= freeQty

                  return (
                    <button
                      key={side.id}
                      type="button"
                      onClick={() => toggle(group.key, side.name)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
                        isPaid
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-card-border bg-white text-gray-600 hover:border-primary-300 hover:text-gray-800'
                      }`}
                    >
                      {side.name}
                      {count === 2 && (
                        <span className="ml-1 text-xs opacity-70">×2</span>
                      )}
                      {isPaid && (
                        <span className="ml-1.5 text-xs text-amber-600">
                          +{formatPrice(EXTRA_PRICE)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
