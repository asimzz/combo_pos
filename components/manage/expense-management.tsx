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

interface ExpenseCategory {
  id: string
  name: string
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
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState({ amount: '', description: '', categoryId: '' })

  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [summaryData, setSummaryData] = useState<ExpenseData>({ expenses: [], total: 0, byCategory: {} })
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Name is required')
      return
    }
    setSubmittingCategory(true)
    try {
      const response = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })
      if (!response.ok) throw new Error('Failed to add category')
      toast.success('Category added')
      setNewCategoryName('')
      setSubmittingCategory(false)
      setShowNewCategory(false)
      fetchCategories()
    } catch {
      setSubmittingCategory(false)
      toast.error('Failed to add category')
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowNewCategory(true)}>
            New category
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
        open={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        title="New expense category"
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
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
          <Input
            type="text"
            placeholder="Rent, Utilities, …"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
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
    </div>
  )
}
