'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Lock, Package, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { LoadingState } from '@/components/ui/loading-state'

type MovementType = 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT'

interface StockLog {
  id: string
  type: MovementType
  quantity: number
  reason: string | null
  createdAt: string
  user: { name: string }
}

interface MaterialRow {
  id: string
  name: string
  unit: string
  currentStock: number
  openingStock: number
  movements: Record<MovementType, number>
  todayLogs: StockLog[]
}

interface StockResponse {
  today: string
  yesterday: string
  isBootstrapped: boolean
  yesterdayClosed: boolean
  todayClosed: boolean
  materials: MaterialRow[]
}

const TYPE_LABEL: Record<MovementType, string> = {
  IN: 'Stock In',
  OUT: 'Stock Out',
  WASTE: 'Waste',
  ADJUSTMENT: 'Adjustment',
}

const TYPE_BADGE: Record<MovementType, 'success' | 'info' | 'danger' | 'warning'> = {
  IN: 'success',
  OUT: 'info',
  WASTE: 'danger',
  ADJUSTMENT: 'warning',
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function StockManagement() {
  const [data, setData] = useState<StockResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [movementModal, setMovementModal] = useState<{ material: MaterialRow } | null>(null)
  const [newMaterialOpen, setNewMaterialOpen] = useState(false)
  const [bootstrapOpen, setBootstrapOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res = await fetch('/api/stock', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed')
      const json = (await res.json()) as StockResponse
      setData(json)
    } catch {
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState />
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-sm text-muted">Could not load stock data.</div>
  }

  const hasMaterials = data.materials.length > 0
  const showBootstrap = hasMaterials && !data.isBootstrapped

  return (
    <div className="p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stock — {data.today}</h3>
          <p className="text-sm text-muted">
            Opening rolls over from yesterday&apos;s closing. Movements are manual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setNewMaterialOpen(true)}
          >
            Add material
          </Button>
          {showBootstrap ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Package className="h-4 w-4" />}
              onClick={() => setBootstrapOpen(true)}
            >
              Set opening counts
            </Button>
          ) : data.todayClosed ? (
            <Badge variant="success" size="md" leftIcon={<Lock className="h-3 w-3" />}>
              Day closed
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Lock className="h-4 w-4" />}
              onClick={() => setCloseOpen(true)}
              disabled={!hasMaterials}
            >
              Close day
            </Button>
          )}
        </div>
      </header>

      {data.isBootstrapped && !data.yesterdayClosed ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Yesterday ({data.yesterday}) was not closed. Today&apos;s opening is showing as <strong>0</strong>{' '}
            until you close yesterday from the snapshot history.
          </div>
        </div>
      ) : null}

      {!hasMaterials ? (
        <EmptyState onAddMaterial={() => setNewMaterialOpen(true)} />
      ) : (
        <StockTable
          materials={data.materials}
          locked={data.todayClosed}
          onMovement={(m) => setMovementModal({ material: m })}
        />
      )}

      {movementModal ? (
        <MovementModal
          material={movementModal.material}
          locked={data.todayClosed}
          onClose={() => setMovementModal(null)}
          onSaved={() => {
            setMovementModal(null)
            fetchData(true)
          }}
        />
      ) : null}

      <NewMaterialModal
        open={newMaterialOpen}
        onClose={() => setNewMaterialOpen(false)}
        onSaved={() => {
          setNewMaterialOpen(false)
          fetchData(true)
        }}
      />

      {showBootstrap ? (
        <BootstrapModal
          open={bootstrapOpen}
          materials={data.materials}
          onClose={() => setBootstrapOpen(false)}
          onSaved={() => {
            setBootstrapOpen(false)
            fetchData(true)
          }}
        />
      ) : null}

      <CloseDayModal
        open={closeOpen}
        date={data.today}
        materialCount={data.materials.length}
        onClose={() => setCloseOpen(false)}
        onSaved={() => {
          setCloseOpen(false)
          fetchData(true)
        }}
      />
    </div>
  )
}

function EmptyState({ onAddMaterial }: { onAddMaterial: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-card-border bg-surface px-6 py-12 text-center">
      <Package className="h-8 w-8 text-muted" />
      <h4 className="mt-3 text-sm font-semibold text-gray-900">No raw materials yet</h4>
      <p className="mt-1 text-xs text-muted">Add your first material to start tracking stock.</p>
      <Button className="mt-4" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={onAddMaterial}>
        Add material
      </Button>
    </div>
  )
}

function StockTable({
  materials,
  locked,
  onMovement,
}: {
  materials: MaterialRow[]
  locked: boolean
  onMovement: (m: MaterialRow) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-white">
      <table className="min-w-full divide-y divide-card-border">
        <thead className="bg-surface">
          <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted">
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3">Opening</th>
            <th className="px-4 py-3 text-green-700">+ In</th>
            <th className="px-4 py-3 text-blue-700">− Out</th>
            <th className="px-4 py-3 text-red-700">− Waste</th>
            <th className="px-4 py-3 text-amber-700">± Adj</th>
            <th className="px-4 py-3">Current</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border bg-white">
          {materials.map((m) => (
            <tr key={m.id} className="text-sm">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{m.name}</div>
                <div className="text-xs text-muted">unit: {m.unit}</div>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {formatQty(m.openingStock)} {m.unit}
              </td>
              <td className="px-4 py-3 text-green-700">
                {m.movements.IN > 0 ? `+${formatQty(m.movements.IN)}` : '—'}
              </td>
              <td className="px-4 py-3 text-blue-700">
                {m.movements.OUT > 0 ? `−${formatQty(m.movements.OUT)}` : '—'}
              </td>
              <td className="px-4 py-3 text-red-700">
                {m.movements.WASTE > 0 ? `−${formatQty(m.movements.WASTE)}` : '—'}
              </td>
              <td className="px-4 py-3 text-amber-700">
                {m.movements.ADJUSTMENT !== 0
                  ? `${m.movements.ADJUSTMENT > 0 ? '+' : ''}${formatQty(m.movements.ADJUSTMENT)}`
                  : '—'}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {formatQty(m.currentStock)} {m.unit}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={locked}
                  title={locked ? 'Day is closed' : 'Record movement'}
                  onClick={() => onMovement(m)}
                >
                  Record
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MovementModal({
  material,
  locked,
  onClose,
  onSaved,
}: {
  material: MaterialRow
  locked: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<MovementType>('IN')
  const [quantityStr, setQuantityStr] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const typeOptions = useMemo<{ value: MovementType; label: string }[]>(
    () => [
      { value: 'IN', label: '+ Stock In' },
      { value: 'OUT', label: '− Stock Out' },
      { value: 'WASTE', label: '− Waste' },
      { value: 'ADJUSTMENT', label: '± Adjustment' },
    ],
    [],
  )

  const quantity = parseFloat(quantityStr)

  const onSubmit = async () => {
    if (!Number.isFinite(quantity)) {
      toast.error('Enter a valid quantity')
      return
    }
    if (type !== 'ADJUSTMENT' && quantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }
    if (type === 'ADJUSTMENT' && quantity === 0) {
      toast.error('Adjustment cannot be zero')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawMaterialId: material.id,
          type,
          quantity,
          reason: reason.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to record movement')
      toast.success('Movement recorded')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Record movement — ${material.name}`}
      description={`Current stock: ${formatQty(material.currentStock)} ${material.unit}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} loading={saving} disabled={locked}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
          <Select<MovementType> value={type} onChange={setType} options={typeOptions} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Quantity ({material.unit}){' '}
            {type === 'ADJUSTMENT' && (
              <span className="text-muted">— use negative to decrease</span>
            )}
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Reason (optional)</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. delivery, dropped, recount" />
        </div>

        {material.todayLogs.length > 0 ? (
          <div className="mt-4 rounded-lg border border-card-border bg-surface p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Today&apos;s entries
            </h4>
            <ul className="space-y-1.5 text-xs">
              {material.todayLogs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Badge variant={TYPE_BADGE[l.type]} size="sm">
                      {TYPE_LABEL[l.type]}
                    </Badge>
                    <span className="text-gray-700">
                      {formatQty(l.quantity)} {material.unit}
                    </span>
                    {l.reason ? <span className="text-muted">— {l.reason}</span> : null}
                  </span>
                  <span className="text-muted">
                    {formatTime(l.createdAt)} · {l.user.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function NewMaterialModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('kg')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setUnit('kg')
      setDescription('')
    }
  }, [open])

  const onSubmit = async () => {
    if (!name.trim() || !unit.trim()) {
      toast.error('Name and unit are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stock/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim(),
          description: description.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add material')
      toast.success('Material added')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add raw material"
      description="Starts at 0 stock — use a Stock In movement to populate it."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} loading={saving}>
            Add
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rice" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Unit</label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, L, pcs, …" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description (optional)</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="" />
        </div>
      </div>
    </Modal>
  )
}

function BootstrapModal({
  open,
  materials,
  onClose,
  onSaved,
}: {
  open: boolean
  materials: MaterialRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const seed: Record<string, string> = {}
      for (const m of materials) seed[m.id] = ''
      setValues(seed)
    }
  }, [open, materials])

  const onSubmit = async () => {
    const items = materials
      .map((m) => ({ rawMaterialId: m.id, openingStock: parseFloat(values[m.id] || '0') }))
      .filter((i) => Number.isFinite(i.openingStock) && i.openingStock >= 0)

    if (items.length === 0) {
      toast.error('Enter at least one opening count')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/stock/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to initialise')
      toast.success('Opening counts saved')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set opening counts"
      description="One-time setup — these become the opening for today and the rollover baseline thereafter."
      width="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} loading={saving}>
            Save opening counts
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{m.name}</div>
              <div className="text-xs text-muted">unit: {m.unit}</div>
            </div>
            <div className="w-32">
              <Input
                type="number"
                inputMode="decimal"
                value={values[m.id] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function CloseDayModal({
  open,
  date,
  materialCount,
  onClose,
  onSaved,
}: {
  open: boolean
  date: string
  materialCount: number
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)

  const onSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/stock/close-day', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to close day')
      toast.success(`Closed ${json.snapshotsCreated} material(s) for ${date}`)
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Close day — ${date}`}
      description="This locks today's stock and rolls the closing balance into tomorrow's opening. No further movements can be recorded for today."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} loading={saving} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
            Confirm close
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">
        Snapshotting <strong>{materialCount}</strong> material(s) at their current stock levels.
      </p>
    </Modal>
  )
}
