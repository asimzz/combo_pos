'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

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
  category: { id: string; name: string; unit: string }
  user: { name: string }
}

interface MaterialData {
  entries: MaterialEntry[]
  total: number
  byCategory: Record<string, number>
}

export function MaterialManagement() {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [materialData, setMaterialData] = useState<MaterialData>({ entries: [], total: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryUnit, setNewCategoryUnit] = useState('kg')
  const [form, setForm] = useState({
    quantity: '',
    amount: '',
    description: '',
    categoryId: '',
  })

  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [summaryData, setSummaryData] = useState<MaterialData>({ entries: [], total: 0, byCategory: {} })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [selectedDate])

  useEffect(() => {
    fetchSummary()
  }, [summaryPeriod])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/materials/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
      if (data.length > 0 && !form.categoryId) {
        setForm(prev => ({ ...prev, categoryId: data[0].id }))
      }
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to load material entries')
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
      const response = await fetch(`/api/materials?from=${from}&to=${to}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      const data = await response.json()
      setSummaryData(data)
    } catch {
      // Silent fail for summary
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
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

      toast.success('Material entry added!')
      setForm({ quantity: '', amount: '', description: '', categoryId: categories[0]?.id || '' })
      setShowAddForm(false)
      fetchEntries()
      fetchSummary()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      const response = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Entry deleted')
      fetchEntries()
      fetchSummary()
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
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

      toast.success('Category added!')
      setNewCategoryName('')
      setNewCategoryUnit('kg')
      setShowNewCategory(false)
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const navigateDate = (direction: -1 | 1) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId)
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Materials Summary</h3>
          <div className="flex ml-auto space-x-1">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSummaryPeriod(period)}
                className={`px-3 py-1 text-xs rounded-full ${
                  summaryPeriod === period
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === 'today' ? 'Today' : period === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium">Total Materials</p>
            <p className="text-lg font-bold text-orange-700">{formatPrice(summaryData.total)}</p>
          </div>
          {Object.entries(summaryData.byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category, amount]) => (
              <div key={category} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium truncate">{category}</p>
                <p className="text-lg font-bold text-gray-800">{formatPrice(amount)}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Date Navigation & Add Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-gray-900 border-none bg-transparent cursor-pointer"
            />
            {isToday && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>
          <button onClick={() => navigateDate(1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewCategory(true)}
            className="btn btn-outline px-3 py-2 text-sm"
          >
            + Category
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </button>
        </div>
      </div>

      {/* New Category Form */}
      {showNewCategory && (
        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <form onSubmit={handleAddCategory} className="flex space-x-2">
            <input
              type="text"
              placeholder="Category name (e.g. Chicken, Bread, Oil)"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input flex-1"
            />
            <select
              value={newCategoryUnit}
              onChange={(e) => setNewCategoryUnit(e.target.value)}
              className="input w-24"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="mL">mL</option>
              <option value="pcs">pcs</option>
              <option value="box">box</option>
              <option value="pack">pack</option>
              <option value="bag">bag</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
            <button
              type="button"
              onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setNewCategoryUnit('kg') }}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Add Material Entry</h4>
          <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input"
                required
              >
                {categories.length === 0 && <option value="">No categories - add one first</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity ({selectedCategory?.unit || 'unit'})
              </label>
              <input
                type="number"
                placeholder="Qty"
                step="0.1"
                min="0.1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (RWF)</label>
              <input
                type="number"
                placeholder="Cost"
                required
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
              />
            </div>
            <div className="md:col-span-4 flex space-x-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={categories.length === 0}>
                Save Entry
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daily Total */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-gray-600">
          {formatDisplayDate(selectedDate)}
        </h3>
        <span className="text-sm font-bold text-orange-600">
          Total: {formatPrice(materialData.total)}
        </span>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        </div>
      ) : materialData.entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No material entries recorded for this day</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            + Add a material entry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {materialData.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded font-medium">
                  {entry.category.name}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{formatPrice(entry.amount)}</span>
                    {entry.quantity && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {entry.quantity} {entry.category.unit}
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-sm text-gray-500">{entry.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">
                  {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
