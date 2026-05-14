'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Pills } from '@/components/ui/pills'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface MaterialCategory {
  id: string
  name: string
  unit: string
}

interface MaterialEntry {
  id: string
  quantity: number | null
  amount: number
  description: string | null
  date: string
  createdAt: string
  category: { id: string; name: string; unit: string }
  user: { name: string }
}

interface MaterialData {
  entries: MaterialEntry[]
  total: number
  byCategory: Record<string, number>
}

type Unit = 'kg' | 'g' | 'L' | 'mL' | 'pcs' | 'box' | 'pack' | 'bag'

export function MaterialManagement() {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [materialData, setMaterialData] = useState<MaterialData>({ entries: [], total: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryUnit, setNewCategoryUnit] = useState<Unit>('kg')
  const [form, setForm] = useState({
    quantity: '',
    amount: '',
    description: '',
    categoryId: '',
  })
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [summaryData, setSummaryData] = useState<MaterialData>({ entries: [], total: 0, byCategory: {} })
  const [submittingEntry, setSubmittingEntry] = useState(false)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MaterialEntry | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [selectedDate])

  useEffect(() => {
    fetchSummary()
  }, [summaryPeriod, selectedDate])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/materials/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
      if (data.length > 0 && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: data[0].id }))
      }
    } catch {
      toast.error('Failed to load material categories')
    }
  }

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/materials?date=${selectedDate}`)
      if (!response.ok) throw new Error('Failed to fetch entries')
      const data = await response.json()
      setMaterialData(data)
    } catch {
      toast.error('Failed to load material entries')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    const baseDate = new Date(selectedDate + 'T00:00:00')
    let from: string
    const to = selectedDate
    if (summaryPeriod === 'today') {
      from = to
    } else if (summaryPeriod === 'week') {
      const weekAgo = new Date(baseDate)
      weekAgo.setDate(weekAgo.getDate() - 6)
      from = weekAgo.toISOString().split('T')[0]
    } else {
      const monthAgo = new Date(baseDate)
      monthAgo.setDate(monthAgo.getDate() - 29)
      from = monthAgo.toISOString().split('T')[0]
    }
    try {
      const response = await fetch(`/api/materials?from=${from}&to=${to}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      const data = await response.json()
      setSummaryData(data)
    } catch {
      /* silent */
    }
  }

  const handleAddEntry = async () => {
    if (!form.categoryId || !form.amount) {
      toast.error('Category and cost are required')
      return
    }
    setSubmittingEntry(true)
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: form.quantity ? parseFloat(form.quantity) : undefined,
          amount: parseFloat(form.amount),
          description: form.description || null,
          categoryId: form.categoryId,
          date: selectedDate,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add entry')
      }
      toast.success('Material entry added')
      setForm({ quantity: '', amount: '', description: '', categoryId: categories[0]?.id || '' })
      setSubmittingEntry(false)
      setShowAddForm(false)
      fetchEntries()
      fetchSummary()
    } catch (error: any) {
      setSubmittingEntry(false)
      toast.error(error.message)
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/materials?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Entry deleted')
      fetchEntries()
      fetchSummary()
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Name is required')
      return
    }
    setSubmittingCategory(true)
    try {
      const response = await fetch('/api/materials/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, unit: newCategoryUnit }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add category')
      }
      toast.success('Category added')
      setNewCategoryName('')
      setNewCategoryUnit('kg')
      setSubmittingCategory(false)
      setShowNewCategory(false)
      fetchCategories()
    } catch (error: any) {
      setSubmittingCategory(false)
      toast.error(error.message)
    }
  }

  const navigateDate = (direction: -1 | 1) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId)
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Materials summary</h3>
          <div className="ml-auto">
            <Pills
              value={summaryPeriod}
              onChange={setSummaryPeriod}
              options={[
                { value: 'today', label: 'Day' },
                { value: 'week', label: '7d' },
                { value: 'month', label: '30d' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-700">Total materials</p>
            <p className="mt-1 text-lg font-bold text-amber-800 tabular-nums">{formatPrice(summaryData.total)}</p>
          </div>
          {Object.entries(summaryData.byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category, amount]) => (
              <div key={category} className="rounded-xl border border-card-border bg-white p-3">
                <p className="truncate text-xs font-medium text-muted">{category}</p>
                <p className="mt-1 text-lg font-bold text-gray-900 tabular-nums">{formatPrice(amount)}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <IconButton aria-label="Previous day" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <div className="flex items-center gap-2 rounded-lg border border-card-border bg-white px-3 py-1.5">
            <Calendar className="h-4 w-4 text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
            />
            {isToday && <Badge variant="success" size="sm">Today</Badge>}
          </div>
          <IconButton aria-label="Next day" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowNewCategory(true)}>
            New category
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm(true)}>
            Add material
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted">{formatDisplayDate(selectedDate)}</h3>
        <span className="text-sm font-bold text-amber-700 tabular-nums">
          Total: {formatPrice(materialData.total)}
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : materialData.entries.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No material entries recorded for this day</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
            + Add a material entry
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {materialData.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-card-border bg-white p-3 transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <Badge variant="warning" size="sm">{entry.category.name}</Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 tabular-nums">{formatPrice(entry.amount)}</span>
                    {entry.quantity && (
                      <Badge variant="neutral" size="sm">
                        {entry.quantity} {entry.category.unit}
                      </Badge>
                    )}
                  </div>
                  {entry.description && <p className="text-xs text-muted">{entry.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted tabular-nums">
                  {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <IconButton aria-label="Delete entry" variant="danger" onClick={() => setDeleteTarget(entry)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add material entry"
        width="lg"
        footer={
          <>
            <Button variant="outline" disabled={submittingEntry} onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingEntry}
              disabled={submittingEntry || categories.length === 0}
              onClick={handleAddEntry}
            >
              {submittingEntry ? 'Saving…' : 'Save entry'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
            <Select
              value={form.categoryId}
              onChange={(v) => setForm({ ...form, categoryId: v })}
              options={categories.map((c) => ({ value: c.id, label: `${c.name} (${c.unit})` }))}
              placeholder={categories.length === 0 ? 'Add a category first' : 'Select category'}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Quantity ({selectedCategory?.unit || 'unit'})
            </label>
            <Input
              type="number"
              placeholder="0"
              step="0.1"
              min="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Cost (RWF)</label>
            <Input
              type="number"
              placeholder="0"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Note</label>
            <Input
              type="text"
              placeholder="Optional"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        title="New material category"
        width="md"
        footer={
          <>
            <Button variant="outline" disabled={submittingCategory} onClick={() => setShowNewCategory(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingCategory}
              disabled={submittingCategory}
              onClick={handleAddCategory}
            >
              {submittingCategory ? 'Adding…' : 'Add category'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
            <Input
              type="text"
              placeholder="Chicken, Bread, Oil…"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Unit</label>
            <Select<Unit>
              value={newCategoryUnit}
              onChange={setNewCategoryUnit}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'g', label: 'g' },
                { value: 'L', label: 'L' },
                { value: 'mL', label: 'mL' },
                { value: 'pcs', label: 'pcs' },
                { value: 'box', label: 'box' },
                { value: 'pack', label: 'pack' },
                { value: 'bag', label: 'bag' },
              ]}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        title="Delete material entry?"
        description={
          deleteTarget
            ? `This ${deleteTarget.category.name} entry (${formatPrice(deleteTarget.amount)}) will be permanently removed from reports.`
            : null
        }
        confirmLabel="Delete entry"
      />
    </div>
  )
}
