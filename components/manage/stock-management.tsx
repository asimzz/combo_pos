'use client'

import { useMemo, useEffect, useState } from 'react'
import { RefreshCw, PackageOpen, Lock, CheckCircle2, Layers, Package, Pencil, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// ── Types ────────────────────────────────────────────────────────────────────

interface ItemStockRow {
  menuItemId: string
  name: string
  category: string
  categoryId: string
  lastClosed: number | null
  projected: number | null
  openingStock: number | null
  soldQuantity: number | null
  wasteQuantity: number
  closingStock: number | null
  hasRecipe: boolean
}

interface StockData {
  today: string
  isOpenConfirmed: boolean
  isCloseConfirmed: boolean
  items: ItemStockRow[]
}

interface PoolMenuItem {
  menuItemId: string
  name: string
  categoryId: string
  categoryName: string
  portionSize: number
  canMake: number | null
}

interface PoolRow {
  rawMaterialId: string
  name: string
  unit: string
  openingStock: number | null
  currentStock: number | null
  wasteQuantity: number
  closingStock: number | null
  lastClosingStock: number | null
  menuItems: PoolMenuItem[]
}

interface PoolData {
  today: string
  isOpen: boolean
  isClosed: boolean
  pools: PoolRow[]
}

type WorkflowPhase = 'idle' | 'opening' | 'open-confirmed' | 'closing' | 'closed'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatQty(n: number | null): string {
  if (n === null) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function derivePhase(itemData: StockData | null, poolData: PoolData | null): WorkflowPhase {
  const isOpen = (itemData?.isOpenConfirmed ?? false) || (poolData?.isOpen ?? false)
  if (!isOpen) return 'idle'

  const hasItems = (itemData?.items.length ?? 0) > 0
  const hasPools = (poolData?.pools.filter((p) => p.openingStock !== null).length ?? 0) > 0

  const itemsClosed = !hasItems || (itemData?.isCloseConfirmed ?? false)
  const poolsClosed = !hasPools || (poolData?.isClosed ?? false)

  if (itemsClosed && poolsClosed) return 'closed'
  return 'open-confirmed'
}

// ── Pool Section ─────────────────────────────────────────────────────────────

interface PoolSectionProps {
  pools: PoolRow[]
  phase: WorkflowPhase
  poolEdits: Record<string, string>
  poolSoldEdits: Record<string, string>
  poolWasteEdits: Record<string, string>
  onPoolEdit: (rawMaterialId: string, value: string) => void
  onPoolSoldEdit: (rawMaterialId: string, value: string) => void
  onPoolWasteEdit: (rawMaterialId: string, value: string) => void
  onConvert: () => void
  canConvert: boolean
}

function PoolSection({
  pools,
  phase,
  poolEdits,
  poolSoldEdits,
  poolWasteEdits,
  onPoolEdit,
  onPoolSoldEdit,
  onPoolWasteEdit,
  onConvert,
  canConvert,
}: PoolSectionProps) {
  if (pools.length === 0) return null

  const showInput = phase === 'opening'
  const showLive = phase === 'open-confirmed'
  const showClose = phase === 'closing' || phase === 'closed'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-semibold text-gray-900">Shared Pool Stock</h3>
        <span className="text-xs text-muted">(recipe-based items — tracked per raw unit)</span>
        {showInput && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
            onClick={onConvert}
            disabled={!canConvert}
            className="ml-auto"
          >
            Convert
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-card-border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Raw Material
              </th>
              {showInput && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">LS</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Today&apos;s Units
                  </th>
                </>
              )}
              {showLive && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Remaining / Set
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Portions Available
                  </th>
                </>
              )}
              {showClose && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-green-700">Opening</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-purple-700">Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Waste</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">Closing</th>
                </>
              )}
              {showInput && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  Portions Preview
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pools.map((pool) => {
              const pct = pool.openingStock
                ? Math.round(((pool.currentStock ?? 0) / pool.openingStock) * 100)
                : null
              const autoSold = pool.openingStock !== null && pool.currentStock !== null
                ? pool.openingStock - pool.currentStock
                : null
              const soldVal = parseFloat(poolSoldEdits[pool.rawMaterialId] || '0') || 0
              const wasteVal = parseFloat(poolWasteEdits[pool.rawMaterialId] || '0') || 0
              const liveClosing = pool.openingStock !== null
                ? Math.max(0, pool.openingStock - soldVal - wasteVal)
                : null
              // For closed view: derive sold from stored values
              const closedSold = pool.openingStock !== null && pool.closingStock !== null
                ? pool.openingStock - pool.closingStock - pool.wasteQuantity
                : autoSold

              return (
                <tr key={pool.rawMaterialId} className="hover:bg-surface/50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{pool.name}</div>
                    <div className="text-xs text-muted">{pool.unit}</div>
                  </td>

                  {showInput && (
                    <>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {pool.lastClosingStock !== null
                          ? <>{formatQty(pool.lastClosingStock)} <span className="text-xs">{pool.unit}</span></>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pool.openingStock !== null ? (
                          <div className="tabular-nums text-right">
                            <span className="font-semibold text-green-700">{formatQty(pool.openingStock)}</span>
                            <span className="ml-1 text-xs text-muted">{pool.unit} (locked)</span>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={poolEdits[pool.rawMaterialId] ?? ''}
                            onChange={(e) => onPoolEdit(pool.rawMaterialId, e.target.value)}
                            className="ml-auto w-28 text-right"
                            placeholder="0"
                          />
                        )}
                      </td>
                    </>
                  )}

                  {showLive && pool.openingStock !== null && (
                    <>
                      <td className="px-4 py-3 text-right">
                        <div className="tabular-nums">
                          <span className={`font-semibold ${pct !== null && pct <= 20 ? 'text-red-600' : pct !== null && pct <= 50 ? 'text-yellow-600' : 'text-green-700'}`}>
                            {formatQty(pool.currentStock)}
                          </span>
                          <span className="text-muted"> / {formatQty(pool.openingStock)} {pool.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {pool.menuItems.map((mi) => {
                            const canMake = pool.currentStock !== null && mi.portionSize > 0
                              ? Math.max(0, Math.floor(pool.currentStock / mi.portionSize))
                              : mi.canMake
                            return (
                              <span key={mi.menuItemId} className="text-xs text-gray-700">
                                <span className="font-medium">{mi.name}</span>
                                <span className="ml-1 text-muted">({mi.portionSize} {pool.unit})</span>
                                {canMake !== null && (
                                  <span className={`ml-1 font-semibold ${canMake === 0 ? 'text-gray-400' : canMake <= 2 ? 'text-red-600' : canMake <= 5 ? 'text-yellow-600' : 'text-green-700'}`}>
                                    → {canMake}
                                  </span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                    </>
                  )}
                  {showLive && pool.openingStock === null && (
                    <td colSpan={2} className="px-4 py-3 text-right text-muted">—</td>
                  )}

                  {showClose && (
                    <>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                        {formatQty(pool.openingStock)} <span className="text-xs font-normal text-muted">{pool.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {phase === 'closing' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={poolSoldEdits[pool.rawMaterialId] ?? '0'}
                              onChange={(e) => onPoolSoldEdit(pool.rawMaterialId, e.target.value)}
                              className="ml-auto w-24 text-right"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted">{pool.unit}</span>
                          </div>
                        ) : (
                          <span className="tabular-nums text-purple-700">
                            {formatQty(closedSold)} <span className="text-xs text-muted">{pool.unit}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {phase === 'closing' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={poolWasteEdits[pool.rawMaterialId] ?? '0'}
                              onChange={(e) => onPoolWasteEdit(pool.rawMaterialId, e.target.value)}
                              className="ml-auto w-24 text-right"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted">{pool.unit}</span>
                          </div>
                        ) : (
                          <span className="tabular-nums text-red-600">
                            {formatQty(pool.wasteQuantity)} <span className="text-xs text-muted">{pool.unit}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                        {phase === 'closing'
                          ? <>{formatQty(liveClosing)} <span className="text-xs font-normal text-muted">{pool.unit}</span></>
                          : <>{formatQty(pool.closingStock)} <span className="text-xs font-normal text-muted">{pool.unit}</span></>
                        }
                      </td>
                    </>
                  )}

                  {showInput && (
                    <td className="px-4 py-3">
                      {pool.menuItems.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {pool.menuItems.map((mi) => {
                            const rawVal = poolEdits[pool.rawMaterialId]
                            const canMake = rawVal && mi.portionSize > 0
                              ? Math.floor(parseFloat(rawVal) / mi.portionSize)
                              : null
                            return (
                              <span key={mi.menuItemId} className="text-xs text-gray-700">
                                <span className="font-medium">{mi.name}</span>
                                <span className="ml-1 text-muted">({mi.portionSize} {pool.unit})</span>
                                {canMake !== null && (
                                  <span className={`ml-1 font-semibold ${canMake === 0 ? 'text-gray-400' : canMake <= 2 ? 'text-red-600' : canMake <= 5 ? 'text-yellow-600' : 'text-green-700'}`}>
                                    → {canMake}
                                  </span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">No active menu items linked</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Per-Item Section ──────────────────────────────────────────────────────────

interface PerItemSectionProps {
  categories: { name: string; items: ItemStockRow[] }[]
  phase: WorkflowPhase
  openEdits: Record<string, string>
  soldEdits: Record<string, string>
  wasteEdits: Record<string, string>
  onOpenEdit: (id: string, v: string) => void
  onSoldEdit: (id: string, v: string) => void
  onWasteEdit: (id: string, v: string) => void
  calcClosing: (id: string, opening: number | null, hasRecipe: boolean) => number | null
}

function PerItemSection({
  categories,
  phase,
  openEdits,
  soldEdits,
  wasteEdits,
  onOpenEdit,
  onSoldEdit,
  onWasteEdit,
  calcClosing,
}: PerItemSectionProps) {
  if (categories.length === 0 || categories.every((c) => c.items.length === 0)) return null

  const showProjected = phase === 'opening'
  const showOpening = phase === 'open-confirmed' || phase === 'closing' || phase === 'closed'
  const showSoldWaste = phase === 'closing' || phase === 'closed'
  const showClosing = phase === 'closing' || phase === 'closed'

  const colCount = 2 + (showProjected ? 1 : 0) + (showOpening ? 1 : 0) + (showSoldWaste ? 2 : 0) + (showClosing ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-semibold text-gray-900">Per-Item Stock</h3>
        <span className="text-xs text-muted">(items tracked individually)</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-card-border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Item</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">LS</th>
              {showProjected && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-600">Opening</th>
              )}
              {showOpening && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-green-700">Opening</th>
              )}
              {showSoldWaste && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-purple-700">Sold</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Waste</th>
                </>
              )}
              {showClosing && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">Closing</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <>
                <tr key={`cat-${cat.name}`} className="bg-surface">
                  <td colSpan={colCount} className="px-4 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{cat.name}</span>
                  </td>
                </tr>
                {cat.items.map((item) => {
                  const liveClosing = phase === 'closing'
                    ? calcClosing(item.menuItemId, item.openingStock, item.hasRecipe)
                    : null
                  return (
                    <tr key={item.menuItemId} className="hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.hasRecipe && (
                          <div className="text-xs text-primary-500">pool item</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {formatQty(item.lastClosed)}
                      </td>
                      {showProjected && (
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={openEdits[item.menuItemId] ?? ''}
                            onChange={(e) => onOpenEdit(item.menuItemId, e.target.value)}
                            className="ml-auto w-24 text-right"
                            placeholder="0"
                          />
                        </td>
                      )}
                      {showOpening && (
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">
                          {formatQty(item.openingStock)}
                        </td>
                      )}
                      {showSoldWaste && (
                        <>
                          <td className="px-4 py-3 text-right">
                            {phase === 'closing' ? (
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={soldEdits[item.menuItemId] ?? ''}
                                onChange={(e) => onSoldEdit(item.menuItemId, e.target.value)}
                                className="ml-auto w-24 text-right"
                                placeholder="0"
                              />
                            ) : (
                              <span className="tabular-nums text-purple-700">{formatQty(item.soldQuantity)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {phase === 'closing' && !item.hasRecipe ? (
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={wasteEdits[item.menuItemId] ?? ''}
                                onChange={(e) => onWasteEdit(item.menuItemId, e.target.value)}
                                className="ml-auto w-24 text-right"
                                placeholder="0"
                              />
                            ) : (
                              <span className="tabular-nums text-red-600">
                                {item.hasRecipe && phase === 'closing' ? (
                                  <span className="text-muted text-xs">— (pool)</span>
                                ) : formatQty(item.wasteQuantity)}
                              </span>
                            )}
                          </td>
                        </>
                      )}
                      {showClosing && (
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">
                          {phase === 'closing' ? formatQty(liveClosing) : formatQty(item.closingStock)}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function StockManagement() {
  const [selectedDate, setSelectedDate] = useState(todayString)
  const [itemData, setItemData] = useState<StockData | null>(null)
  const [poolData, setPoolData] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [phase, setPhase] = useState<WorkflowPhase>('idle')
  const [confirming, setConfirming] = useState(false)

  const [editingFrom, setEditingFrom] = useState<WorkflowPhase | null>(null)
  const [showConvertedRecipeItems, setShowConvertedRecipeItems] = useState(false)

  const [openEdits, setOpenEdits] = useState<Record<string, string>>({})
  const [poolEdits, setPoolEdits] = useState<Record<string, string>>({})
  const [soldEdits, setSoldEdits] = useState<Record<string, string>>({})
  const [wasteEdits, setWasteEdits] = useState<Record<string, string>>({})
  const [poolSoldEdits, setPoolSoldEdits] = useState<Record<string, string>>({})
  const [poolWasteEdits, setPoolWasteEdits] = useState<Record<string, string>>({})

  const fetchData = async (date: string, silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [itemRes, poolRes] = await Promise.all([
        fetch(`/api/stock/items?date=${date}`, { cache: 'no-store' }),
        fetch(`/api/stock/pools?date=${date}`, { cache: 'no-store' }),
      ])
      if (!itemRes.ok || !poolRes.ok) throw new Error('Failed')
      const [itemJson, poolJson]: [StockData, PoolData] = await Promise.all([
        itemRes.json(),
        poolRes.json(),
      ])
      setItemData(itemJson)
      setPoolData(poolJson)
      setPhase(derivePhase(itemJson, poolJson))
    } catch {
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData(selectedDate) }, [selectedDate])

  // Recipe items derived from pool data for the opening phase
  const recipeItemsForOpening = useMemo<ItemStockRow[]>(() => {
    if (!showConvertedRecipeItems || !poolData) return []
    const seen = new Set<string>()
    return poolData.pools.flatMap((pool) =>
      pool.menuItems
        .filter((mi) => {
          if (seen.has(mi.menuItemId)) return false
          seen.add(mi.menuItemId)
          return true
        })
        .map((mi) => ({
          menuItemId: mi.menuItemId,
          name: mi.name,
          category: mi.categoryName,
          categoryId: mi.categoryId,
          hasRecipe: true,
          lastClosed: null,
          projected: null,
          openingStock: null,
          soldQuantity: null,
          wasteQuantity: 0,
          closingStock: null,
        })),
    )
  }, [showConvertedRecipeItems, poolData])

  const handleOpenStock = () => {
    if (!itemData || !poolData) return
    const edits: Record<string, string> = {}
    for (const item of itemData.items) {
      edits[item.menuItemId] = ''
    }
    const pEdits: Record<string, string> = {}
    for (const pool of poolData.pools) {
      if (pool.openingStock !== null) {
        pEdits[pool.rawMaterialId] = String(pool.openingStock)
      } else if (pool.lastClosingStock !== null) {
        pEdits[pool.rawMaterialId] = String(pool.lastClosingStock)
      } else {
        pEdits[pool.rawMaterialId] = ''
      }
    }
    setOpenEdits(edits)
    setPoolEdits(pEdits)
    setShowConvertedRecipeItems(false)
    setPhase('opening')
  }

  const handleConvert = () => {
    if (!poolData) return
    const portionCounts: Record<string, number[]> = {}
    for (const pool of poolData.pools) {
      // Use stored openingStock if already set, otherwise use the entered value
      const poolQty = pool.openingStock !== null
        ? pool.openingStock
        : parseFloat(poolEdits[pool.rawMaterialId] || '0') || 0
      for (const mi of pool.menuItems) {
        if (mi.portionSize > 0) {
          const count = Math.floor(poolQty / mi.portionSize)
          if (!portionCounts[mi.menuItemId]) portionCounts[mi.menuItemId] = []
          portionCounts[mi.menuItemId].push(count)
        }
      }
    }
    const newOpenEdits = { ...openEdits }
    for (const [id, counts] of Object.entries(portionCounts)) {
      newOpenEdits[id] = String(Math.min(...counts))
    }
    setOpenEdits(newOpenEdits)
    setShowConvertedRecipeItems(true)
  }

  const handleConfirmOpening = async () => {
    if (!itemData || !poolData) return
    setConfirming(true)
    try {
      const promises: Promise<Response>[] = []

      // All per-item items (non-recipe from itemData + recipe items from convert)
      const allItemEdits: { menuItemId: string; openingStock: number }[] = []
      for (const item of itemData.items) {
        allItemEdits.push({
          menuItemId: item.menuItemId,
          openingStock: parseFloat(openEdits[item.menuItemId] || '0') || 0,
        })
      }
      // Add converted recipe items (not already in itemData.items)
      const existingIds = new Set(itemData.items.map((i) => i.menuItemId))
      for (const ri of recipeItemsForOpening) {
        if (!existingIds.has(ri.menuItemId)) {
          allItemEdits.push({
            menuItemId: ri.menuItemId,
            openingStock: parseFloat(openEdits[ri.menuItemId] || '0') || 0,
          })
        }
      }

      if (allItemEdits.length > 0) {
        promises.push(
          fetch('/api/stock/items/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, items: allItemEdits }),
          }),
        )
      }

      // Pool stock — only for pools not yet set (immutable once opened)
      const poolMaterials = poolData.pools
        .filter((p) => p.openingStock === null && poolEdits[p.rawMaterialId] !== '' && poolEdits[p.rawMaterialId] !== undefined)
        .map((p) => ({
          rawMaterialId: p.rawMaterialId,
          stock: parseFloat(poolEdits[p.rawMaterialId] || '0') || 0,
        }))
      if (poolMaterials.length > 0) {
        promises.push(
          fetch('/api/stock/pools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, materials: poolMaterials }),
          }),
        )
      }

      if (promises.length === 0) {
        toast.info('Nothing to save')
        return
      }

      const responses = await Promise.all(promises)
      for (const res of responses) {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error)
        }
      }
      toast.success('Opening stock confirmed')
      setEditingFrom(null)
      setShowConvertedRecipeItems(false)
      await fetchData(selectedDate, true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm opening')
    } finally {
      setConfirming(false)
    }
  }

  const handleCloseStock = () => {
    if (!itemData || !poolData) return
    const sold: Record<string, string> = {}
    const waste: Record<string, string> = {}
    for (const item of itemData.items) {
      sold[item.menuItemId] = item.soldQuantity !== null ? String(item.soldQuantity) : '0'
      waste[item.menuItemId] = item.hasRecipe ? '0' : String(item.wasteQuantity ?? 0)
    }
    setSoldEdits(sold)
    setWasteEdits(waste)

    const pSold: Record<string, string> = {}
    const pWaste: Record<string, string> = {}
    for (const pool of poolData.pools) {
      const autoSold = pool.openingStock !== null && pool.currentStock !== null
        ? pool.openingStock - pool.currentStock
        : 0
      pSold[pool.rawMaterialId] = String(autoSold)
      pWaste[pool.rawMaterialId] = String(pool.wasteQuantity ?? 0)
    }
    setPoolSoldEdits(pSold)
    setPoolWasteEdits(pWaste)

    setPhase('closing')
  }

  const handleEditOpening = () => {
    if (!itemData || !poolData) return
    const edits: Record<string, string> = {}
    for (const item of itemData.items) {
      edits[item.menuItemId] = item.openingStock !== null ? String(item.openingStock) : ''
    }
    const pEdits: Record<string, string> = {}
    for (const pool of poolData.pools) {
      pEdits[pool.rawMaterialId] = pool.openingStock !== null ? String(pool.openingStock) : ''
    }
    setOpenEdits(edits)
    setPoolEdits(pEdits)
    // Show converted recipe items if they were already saved
    setShowConvertedRecipeItems(itemData.items.some((i) => i.hasRecipe))
    setEditingFrom('open-confirmed')
    setPhase('opening')
  }

  const handleEditClosing = () => {
    if (!itemData || !poolData) return
    const sold: Record<string, string> = {}
    const waste: Record<string, string> = {}
    for (const item of itemData.items) {
      sold[item.menuItemId] = item.soldQuantity !== null ? String(item.soldQuantity) : '0'
      waste[item.menuItemId] = item.hasRecipe ? '0' : String(item.wasteQuantity ?? 0)
    }
    setSoldEdits(sold)
    setWasteEdits(waste)

    const pSold: Record<string, string> = {}
    const pWaste: Record<string, string> = {}
    for (const pool of poolData.pools) {
      const storedSold = pool.openingStock !== null && pool.closingStock !== null
        ? pool.openingStock - pool.closingStock - pool.wasteQuantity
        : pool.openingStock !== null && pool.currentStock !== null
          ? pool.openingStock - pool.currentStock
          : 0
      pSold[pool.rawMaterialId] = String(Math.max(0, storedSold))
      pWaste[pool.rawMaterialId] = String(pool.wasteQuantity ?? 0)
    }
    setPoolSoldEdits(pSold)
    setPoolWasteEdits(pWaste)

    setEditingFrom('closed')
    setPhase('closing')
  }

  const handleConfirmClosing = async () => {
    if (!itemData || !poolData) return
    setConfirming(true)
    try {
      const promises: Promise<Response>[] = []

      if (itemData.items.length > 0) {
        const items = itemData.items.map((item) => ({
          menuItemId: item.menuItemId,
          soldQuantity: parseFloat(soldEdits[item.menuItemId] || '0') || 0,
          wasteQuantity: item.hasRecipe ? 0 : parseFloat(wasteEdits[item.menuItemId] || '0') || 0,
        }))
        promises.push(
          fetch('/api/stock/items/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, items }),
          }),
        )
      }

      const poolMaterials = poolData.pools
        .filter((p) => p.openingStock !== null)
        .map((p) => ({
          rawMaterialId: p.rawMaterialId,
          soldQuantity: parseFloat(poolSoldEdits[p.rawMaterialId] || '0') || 0,
          wasteQuantity: parseFloat(poolWasteEdits[p.rawMaterialId] || '0') || 0,
        }))
      if (poolMaterials.length > 0) {
        promises.push(
          fetch('/api/stock/pools/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, materials: poolMaterials }),
          }),
        )
      }

      if (promises.length === 0) {
        toast.info('Nothing to close')
        return
      }

      const responses = await Promise.all(promises)
      for (const res of responses) {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error)
        }
      }
      toast.success('Closing stock confirmed — day closed')
      setEditingFrom(null)
      await fetchData(selectedDate, true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm closing')
    } finally {
      setConfirming(false)
    }
  }

  const calcClosing = (menuItemId: string, openingStock: number | null, hasRecipe: boolean): number | null => {
    if (openingStock === null) return null
    const sold = parseFloat(soldEdits[menuItemId] || '0') || 0
    const waste = hasRecipe ? 0 : parseFloat(wasteEdits[menuItemId] || '0') || 0
    return Math.max(0, openingStock - sold - waste)
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted">Loading stock…</div>
  }

  if (!itemData || !poolData) return null

  // Build per-item categories:
  // - In opening phase: itemData.items + recipeItemsForOpening (after Convert)
  // - In other phases: itemData.items (includes recipe items if they have snapshots)
  const allPerItems: ItemStockRow[] = phase === 'opening'
    ? (() => {
        const existingIds = new Set(itemData.items.map((i) => i.menuItemId))
        return [
          ...itemData.items,
          ...recipeItemsForOpening.filter((ri) => !existingIds.has(ri.menuItemId)),
        ]
      })()
    : itemData.items

  const itemCategories: { name: string; items: ItemStockRow[] }[] = []
  for (const item of allPerItems) {
    let cat = itemCategories.find((c) => c.name === item.category)
    if (!cat) {
      cat = { name: item.category, items: [] }
      itemCategories.push(cat)
    }
    cat.items.push(item)
  }

  const hasPerItemStock = allPerItems.length > 0
  const hasPoolStock = poolData.pools.length > 0

  // "Convert" is available when at least one pool has a quantity entered or already set
  const canConvert = poolData.pools.some(
    (p) => p.openingStock !== null || (poolEdits[p.rawMaterialId] && parseFloat(poolEdits[p.rawMaterialId]) > 0),
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Stock</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (phase === 'opening' || phase === 'closing') return
                setSelectedDate(e.target.value)
                setLoading(true)
              }}
              className="rounded-md border border-card-border px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-sm text-muted">
            {phase === 'idle' && "Set today's stock to begin service."}
            {phase === 'opening' && 'Enter pool counts, convert to per-item, then confirm opening.'}
            {phase === 'open-confirmed' && 'Stock is open. Close when service ends.'}
            {phase === 'closing' && 'Review sold and waste, then confirm close.'}
            {phase === 'closed' && 'Day is closed.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchData(selectedDate)}
            disabled={refreshing}
          >
            Refresh
          </Button>

          {phase === 'idle' && (
            <Button variant="primary" size="sm" leftIcon={<PackageOpen className="h-4 w-4" />} onClick={handleOpenStock}>
              Open Stock
            </Button>
          )}
          {phase === 'opening' && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setPhase(editingFrom ?? 'idle'); setEditingFrom(null) }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                loading={confirming}
                disabled={confirming}
                onClick={handleConfirmOpening}
              >
                Confirm Opening
              </Button>
            </>
          )}
          {phase === 'open-confirmed' && (
            <>
              <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEditOpening}>
                Edit Opening
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Lock className="h-4 w-4" />} onClick={handleCloseStock}>
                Close Stock
              </Button>
            </>
          )}
          {phase === 'closing' && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setPhase(editingFrom ?? 'open-confirmed'); setEditingFrom(null) }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                loading={confirming}
                disabled={confirming}
                onClick={handleConfirmClosing}
              >
                Confirm Closing
              </Button>
            </>
          )}
          {phase === 'closed' && (
            <>
              <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEditClosing}>
                Edit Closing
              </Button>
              <Badge variant="success" size="sm"><Lock className="mr-1 h-3 w-3" /> Day Closed</Badge>
            </>
          )}
        </div>
      </div>

      {/* Pool section */}
      {hasPoolStock && (
        <PoolSection
          pools={poolData.pools}
          phase={phase}
          poolEdits={poolEdits}
          poolSoldEdits={poolSoldEdits}
          poolWasteEdits={poolWasteEdits}
          onPoolEdit={(id, v) => setPoolEdits((prev) => ({ ...prev, [id]: v }))}
          onPoolSoldEdit={(id, v) => setPoolSoldEdits((prev) => ({ ...prev, [id]: v }))}
          onPoolWasteEdit={(id, v) => setPoolWasteEdits((prev) => ({ ...prev, [id]: v }))}
          onConvert={handleConvert}
          canConvert={canConvert}
        />
      )}

      {/* Per-item section */}
      {hasPerItemStock && (
        <PerItemSection
          categories={itemCategories}
          phase={phase}
          openEdits={openEdits}
          soldEdits={soldEdits}
          wasteEdits={wasteEdits}
          onOpenEdit={(id, v) => setOpenEdits((prev) => ({ ...prev, [id]: v }))}
          onSoldEdit={(id, v) => setSoldEdits((prev) => ({ ...prev, [id]: v }))}
          onWasteEdit={(id, v) => setWasteEdits((prev) => ({ ...prev, [id]: v }))}
          calcClosing={calcClosing}
        />
      )}

      {!hasPoolStock && !hasPerItemStock && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">No active menu items found.</p>
          <p className="mt-1 text-xs text-muted">Add items in Catalog before tracking stock.</p>
        </div>
      )}

      {phase === 'opening' && (
        <p className="text-xs text-muted">
          Enter pool raw-material counts, click <strong>Convert</strong> to populate per-item opening quantities, then adjust and confirm.
        </p>
      )}
      {phase === 'closing' && (
        <p className="text-xs text-muted">
          Sold counts pre-filled from today&apos;s completed orders. Pool waste is in raw-material units.
          Closing = Opening − (Sold + Waste).
        </p>
      )}
    </div>
  )
}
