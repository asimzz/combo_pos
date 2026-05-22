'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pills } from '@/components/ui/pills'
import { Trash2, Tag, Clock, ShoppingBag, Calendar, Utensils } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { CategoryWithItems } from '@/types'

type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y_FREE'

interface PromotionItem {
  menuItemId: string
  menuItem: { id: string; name: string }
}

interface Promotion {
  id: string
  name: string
  description: string | null
  type: PromotionType
  value: number
  minOrderAmount: number | null
  startTime: string | null
  endTime: string | null
  daysOfWeek: number[]
  buyQuantity: number | null
  getQuantity: number | null
  active: boolean
  applicableItems: PromotionItem[]
}

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const emptyForm = {
  name: '',
  description: '',
  type: 'PERCENTAGE' as PromotionType,
  value: '',
  minOrderAmount: '',
  startTime: '',
  endTime: '',
  daysOfWeek: [] as number[],
  applicableItemIds: [] as string[],
  buyQuantity: '2',
  getQuantity: '1',
}

function formatDays(days: number[]): string {
  if (days.length === 0 || days.length === 7) return 'Every day'
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAYS[d].label)
    .join(', ')
}

export function PromotionsSettings() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [menuCategories, setMenuCategories] = useState<CategoryWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    try {
      const [promoRes, menuRes] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/pos-menu'),
      ])
      if (!promoRes.ok || !menuRes.ok) throw new Error()
      const [promos, menu] = await Promise.all([promoRes.json(), menuRes.json()])
      setPromotions(promos)
      setMenuCategories(menu)
    } catch {
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }))
  }

  const toggleItem = (id: string) => {
    setForm((f) => ({
      ...f,
      applicableItemIds: f.applicableItemIds.includes(id)
        ? f.applicableItemIds.filter((i) => i !== id)
        : [...f.applicableItemIds, id],
    }))
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    const value = form.type === 'BUY_X_GET_Y_FREE' ? 0 : parseFloat(form.value)
    if (form.type !== 'BUY_X_GET_Y_FREE' && (isNaN(value) || value <= 0)) {
      toast.error('Discount value must be greater than 0')
      return
    }
    if (form.type === 'PERCENTAGE' && value > 100) {
      toast.error('Percentage cannot exceed 100')
      return
    }
    if ((form.startTime && !form.endTime) || (!form.startTime && form.endTime)) {
      toast.error('Both start and end time are required for time-bounded promotions')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.type,
          value,
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
          startTime: form.startTime || null,
          endTime: form.endTime || null,
          daysOfWeek: form.daysOfWeek,
          applicableItemIds: form.applicableItemIds,
          buyQuantity: form.type === 'BUY_X_GET_Y_FREE' ? parseInt(form.buyQuantity) || 2 : null,
          getQuantity: form.type === 'BUY_X_GET_Y_FREE' ? parseInt(form.getQuantity) || 1 : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.details ? JSON.stringify(err.details) : err.error || `HTTP ${res.status}`)
      }
      toast.success('Promotion created')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (error) {
      toast.error(`Failed to create promotion: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (promotion: Promotion) => {
    try {
      const res = await fetch(`/api/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promotion.active }),
      })
      if (!res.ok) throw new Error()
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, active: !p.active } : p)),
      )
    } catch {
      toast.error('Failed to update promotion')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPromotions((prev) => prev.filter((p) => p.id !== id))
      toast.success('Promotion deleted')
    } catch {
      toast.error('Failed to delete promotion')
    }
  }

  const formatValue = (p: Promotion) => {
    if (p.type === 'PERCENTAGE') return `${p.value}% off`
    if (p.type === 'FIXED_AMOUNT') return `${formatPrice(p.value)} off`
    return `Buy ${p.buyQuantity ?? 1} get ${p.getQuantity ?? 1} free`
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Active promotions</h3>
          <p className="mt-0.5 text-xs text-muted">
            Automatically applied at checkout when all conditions are met.
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            Add promotion
          </Button>
        )}
      </div>

      {promotions.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-card-border py-8 text-center">
          <Tag className="mx-auto mb-2 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No promotions yet</p>
        </div>
      )}

      <div className="space-y-3">
        {promotions.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg border p-4 ${p.active ? 'border-card-border bg-white' : 'border-card-border bg-gray-50 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                    {formatValue(p)}
                  </span>
                  {!p.active && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-0.5 text-xs text-muted">{p.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDays(p.daysOfWeek)}
                  </span>
                  {p.startTime && p.endTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.startTime} – {p.endTime}
                    </span>
                  )}
                  {p.minOrderAmount != null && (
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      Min {formatPrice(p.minOrderAmount)}
                    </span>
                  )}
                  {p.applicableItems.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      {p.applicableItems.map((ai) => ai.menuItem.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(p)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${p.active ? 'bg-primary-500' : 'bg-gray-200'}`}
                  aria-label={p.active ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.active ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Delete promotion"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-5 space-y-5">
          <h4 className="text-sm font-semibold text-gray-900">New promotion</h4>

          <Field label="Name">
            <Input
              placeholder="e.g. Happy Hour, Lunch Special"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>

          <Field label="Description (optional)">
            <Input
              placeholder="Shown to staff at checkout"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <Field label="Discount type">
            <Pills
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v as PromotionType }))}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED_AMOUNT', label: 'Fixed amount (RWF)' },
                { value: 'BUY_X_GET_Y_FREE', label: 'Buy X get Y free' },
              ]}
              size="md"
            />
          </Field>

          {form.type === 'BUY_X_GET_Y_FREE' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Buy quantity">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="2"
                  value={form.buyQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, buyQuantity: e.target.value }))}
                />
              </Field>
              <Field label="Free quantity">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={form.getQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, getQuantity: e.target.value }))}
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={form.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (RWF)'}>
                <Input
                  type="number"
                  min="0"
                  max={form.type === 'PERCENTAGE' ? '100' : undefined}
                  step={form.type === 'PERCENTAGE' ? '1' : '100'}
                  placeholder={form.type === 'PERCENTAGE' ? '10' : '500'}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              </Field>
              <Field label="Min order amount (RWF, optional)">
                <Input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 5000"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                />
              </Field>
            </div>
          )}

          <Field label="Days of week (leave all unchecked for every day)">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = form.daysOfWeek.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-card-border hover:border-primary-300'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start time (optional)">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </Field>
            <Field label="End time (optional)">
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Applies to (leave unchecked for all items)">
            <div className="max-h-52 overflow-y-auto rounded-lg border border-card-border bg-white divide-y divide-gray-50">
              {menuCategories.map((cat) => (
                <div key={cat.id}>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted bg-gray-50">
                    {cat.name}
                  </p>
                  {cat.items.map((item) => {
                    const checked = form.applicableItemIds.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleItem(item.id)}
                          className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
                        />
                        <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                        <span className="text-xs text-muted tabular-nums">
                          {formatPrice(Number(item.price))}
                        </span>
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
            {form.applicableItemIds.length > 0 && (
              <p className="text-xs text-primary-700 font-medium">
                {form.applicableItemIds.length} item{form.applicableItemIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setForm(emptyForm)
                setShowForm(false)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={saving} onClick={handleCreate}>
              Create promotion
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {children}
    </div>
  )
}
