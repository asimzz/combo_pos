'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight, Pencil, Upload, Settings, Check, X } from 'lucide-react'
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

interface ExpenseCategory {
  id: string
  name: string
}

interface ImportResult {
  created: number
  reactivated: number
  skipped: number
  errors: Array<{ row: number; name: string; reason: string }>
}

interface Expense {
  id: string
  amount: number
  description: string | null
  date: string
  category: { id: string; name: string }
  user: { name: string }
}

interface ExpenseData {
  expenses: Expense[]
  total: number
  byCategory: Record<string, number>
}

export function ExpenseManagement() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseData>({ expenses: [], total: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)
  const [addName, setAddName] = useState('')
  const [form, setForm] = useState({ amount: '', description: '', categoryId: '' })

  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [summaryData, setSummaryData] = useState<ExpenseData>({ expenses: [], total: 0, byCategory: {} })
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const [showManageCategories, setShowManageCategories] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<ExpenseCategory | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [selectedDate])

  useEffect(() => {
    fetchSummary()
  }, [summaryPeriod])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/expenses/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
      if (data.length > 0 && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: data[0].id }))
      }
    } catch {
      toast.error('Failed to load expense categories')
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expenses?date=${selectedDate}`)
      if (!response.ok) throw new Error('Failed to fetch expenses')
      const data = await response.json()
      setExpenseData(data)
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    const now = new Date()
    let from: string
    const to = now.toISOString().split('T')[0]
    if (summaryPeriod === 'today') {
      from = to
    } else if (summaryPeriod === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 6)
      from = weekAgo.toISOString().split('T')[0]
    } else {
      const monthAgo = new Date(now)
      monthAgo.setDate(monthAgo.getDate() - 29)
      from = monthAgo.toISOString().split('T')[0]
    }
    try {
      const response = await fetch(`/api/expenses?from=${from}&to=${to}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      const data = await response.json()
      setSummaryData(data)
    } catch {
      /* silent */
    }
  }

  const handleAddExpense = async () => {
    if (!form.categoryId || !form.amount) {
      toast.error('Category and amount are required')
      return
    }
    setSubmittingExpense(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          description: form.description || null,
          categoryId: form.categoryId,
          date: selectedDate,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add expense')
      }
      toast.success('Expense added')
      setForm({ amount: '', description: '', categoryId: categories[0]?.id || '' })
      setSubmittingExpense(false)
      setShowAddForm(false)
      fetchExpenses()
      fetchSummary()
    } catch (error: any) {
      setSubmittingExpense(false)
      toast.error(error.message)
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/expenses?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Expense deleted')
      fetchExpenses()
      fetchSummary()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const startEditCategory = (category: ExpenseCategory) => {
    setEditingCategoryId(category.id)
    setEditName(category.name)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
  }

  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingEdit(true)
    try {
      const response = await fetch(`/api/expenses/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update category')
      }
      toast.success('Category updated')
      setEditingCategoryId(null)
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const performDeleteCategory = async () => {
    if (!categoryDeleteTarget) return
    try {
      const response = await fetch(`/api/expenses/categories/${categoryDeleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete category')
      toast.success('Category deleted')
      setCategoryDeleteTarget(null)
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const handleImportCsv = async (file: File) => {
    setUploading(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/expenses/categories/import', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import categories')
      }
      setImportResult(data)
      const summaryParts: string[] = [`Imported ${data.created}`]
      if (data.reactivated > 0) summaryParts.push(`${data.reactivated} reactivated`)
      if (data.skipped > 0) summaryParts.push(`${data.skipped} duplicates skipped`)
      if (data.errors.length > 0) summaryParts.push(`${data.errors.length} errors`)
      toast.success(summaryParts.join(' · '))
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const closeManageCategories = () => {
    setShowManageCategories(false)
    setEditingCategoryId(null)
    setImportResult(null)
    setShowAddRow(false)
    setAddName('')
  }

  const handleAddCategory = async () => {
    if (!addName.trim()) {
      toast.error('Name is required')
      return
    }
    setSubmittingCategory(true)
    try {
      const response = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add category')
      }
      toast.success('Category added')
      setAddName('')
      setShowAddRow(false)
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add category')
    } finally {
      setSubmittingCategory(false)
    }
  }

  const navigateDate = (direction: -1 | 1) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }

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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Expense summary</h3>
          <div className="ml-auto">
            <Pills
              value={summaryPeriod}
              onChange={setSummaryPeriod}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: '7d' },
                { value: 'month', label: '30d' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-xs font-medium text-red-600">Total expenses</p>
            <p className="mt-1 text-lg font-bold text-red-700 tabular-nums">{formatPrice(summaryData.total)}</p>
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

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />} onClick={() => setShowManageCategories(true)}>
            Manage categories
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm(true)}>
            Add expense
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted">{formatDisplayDate(selectedDate)}</h3>
        <span className="text-sm font-bold text-red-600 tabular-nums">
          Total: {formatPrice(expenseData.total)}
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : expenseData.expenses.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No expenses recorded for this day</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
            + Add an expense
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenseData.expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between rounded-lg border border-card-border bg-white p-3 transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <Badge variant="neutral" size="sm">{expense.category.name}</Badge>
                <div>
                  <span className="font-semibold text-gray-900 tabular-nums">{formatPrice(expense.amount)}</span>
                  {expense.description && <p className="text-xs text-muted">{expense.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted tabular-nums">
                  {new Date(expense.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <IconButton aria-label="Delete expense" variant="danger" onClick={() => setDeleteTarget(expense)}>
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
        title="Add expense"
        width="md"
        footer={
          <>
            <Button variant="outline" disabled={submittingExpense} onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingExpense}
              disabled={submittingExpense || categories.length === 0}
              onClick={handleAddExpense}
            >
              {submittingExpense ? 'Saving…' : 'Save expense'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Amount (RWF)</label>
            <Input
              type="number"
              placeholder="0"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
            <Select
              value={form.categoryId}
              onChange={(v) => setForm({ ...form, categoryId: v })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder={categories.length === 0 ? 'Add a category first' : 'Select category'}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Note (optional)</label>
            <Input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showManageCategories}
        onClose={closeManageCategories}
        title="Manage expense categories"
        description="Bulk-upload from CSV, edit, or remove categories."
        width="xl"
        footer={
          <Button variant="outline" onClick={closeManageCategories}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddRow((v) => !v)}
              >
                New category
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportCsv(file)
                }}
              />
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                loading={uploading}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Upload CSV'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">CSV format: name · header optional</p>
            {importResult && importResult.errors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                <p className="mb-1 text-xs font-semibold text-red-700">
                  {importResult.errors.length} row{importResult.errors.length === 1 ? '' : 's'} skipped:
                </p>
                <ul className="space-y-1 text-xs text-red-700">
                  {importResult.errors.map((err) => (
                    <li key={`${err.row}-${err.name}`}>
                      Row {err.row}{err.name ? ` (${err.name})` : ''}: {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">
                Categories <span className="font-normal text-muted">({categories.length})</span>
              </h4>
            </div>
            <div className="space-y-2">
              {showAddRow && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/40 p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
                      <Input
                        type="text"
                        placeholder="Rent, Utilities, …"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                      />
                    </div>
                    <IconButton
                      aria-label="Save category"
                      variant="primary"
                      disabled={submittingCategory}
                      onClick={handleAddCategory}
                    >
                      <Check className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      aria-label="Cancel add"
                      disabled={submittingCategory}
                      onClick={() => {
                        setShowAddRow(false)
                        setAddName('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              )}
              {categories.length === 0 && !showAddRow ? (
                <p className="rounded-lg border border-card-border bg-white py-8 text-center text-sm text-muted">
                  No categories yet. Click "New category" or "Upload CSV" to add one.
                </p>
              ) : (
                categories.map((category) => {
                  const isEditing = editingCategoryId === category.id
                  if (isEditing) {
                    return (
                      <div
                        key={category.id}
                        className="rounded-lg border border-primary-200 bg-primary-50/40 p-3"
                      >
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
                            <Input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <IconButton
                            aria-label="Save changes"
                            variant="primary"
                            disabled={savingEdit}
                            onClick={() => handleSaveEdit(category.id)}
                          >
                            <Check className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            aria-label="Cancel edit"
                            disabled={savingEdit}
                            onClick={cancelEditCategory}
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-lg border border-card-border bg-white p-3"
                    >
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <div className="flex items-center gap-1">
                        <IconButton
                          aria-label="Edit category"
                          onClick={() => startEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          aria-label="Delete category"
                          variant="danger"
                          onClick={() => setCategoryDeleteTarget(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        title="Delete expense?"
        description={
          deleteTarget
            ? `This ${deleteTarget.category.name} expense (${formatPrice(deleteTarget.amount)}) will be removed from reports.`
            : null
        }
        confirmLabel="Delete expense"
      />

      <ConfirmDialog
        open={categoryDeleteTarget !== null}
        onClose={() => setCategoryDeleteTarget(null)}
        onConfirm={performDeleteCategory}
        title="Delete category?"
        description={
          categoryDeleteTarget
            ? `"${categoryDeleteTarget.name}" will be removed. Existing expenses using it will keep their history.`
            : null
        }
        confirmLabel="Delete category"
      />
    </div>
  )
}
