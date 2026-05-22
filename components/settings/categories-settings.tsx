'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pills } from '@/components/ui/pills'

interface ExpenseCategory {
  id: string
  name: string
}

interface MaterialCategory {
  id: string
  name: string
  unit: string
}

type SubTab = 'expense' | 'material'
type Unit = 'kg' | 'g' | 'L' | 'mL' | 'pcs' | 'box' | 'pack' | 'bag'

const UNIT_OPTIONS: SelectOption<Unit>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'mL', label: 'mL' },
  { value: 'pcs', label: 'pcs' },
  { value: 'box', label: 'box' },
  { value: 'pack', label: 'pack' },
  { value: 'bag', label: 'bag' },
]

export function CategoriesSettings() {
  const [subTab, setSubTab] = useState<SubTab>('expense')

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [expenseName, setExpenseName] = useState('')
  const [addingExpense, setAddingExpense] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [deleteExpense, setDeleteExpense] = useState<ExpenseCategory | null>(null)

  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([])
  const [materialName, setMaterialName] = useState('')
  const [materialUnit, setMaterialUnit] = useState<Unit>('kg')
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [deleteMaterial, setDeleteMaterial] = useState<MaterialCategory | null>(null)

  const [loadingExpense, setLoadingExpense] = useState(true)
  const [loadingMaterial, setLoadingMaterial] = useState(true)

  useEffect(() => {
    fetchExpenseCategories()
    fetchMaterialCategories()
  }, [])

  const fetchExpenseCategories = async () => {
    try {
      const res = await fetch('/api/expenses/categories')
      const data = await res.json()
      setExpenseCategories(data)
    } catch {
      toast.error('Failed to load expense categories')
    } finally {
      setLoadingExpense(false)
    }
  }

  const fetchMaterialCategories = async () => {
    try {
      const res = await fetch('/api/materials/categories')
      const data = await res.json()
      setMaterialCategories(data)
    } catch {
      toast.error('Failed to load material categories')
    } finally {
      setLoadingMaterial(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseName.trim()) return
    setAddingExpense(true)
    try {
      const res = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: expenseName.trim() }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setExpenseCategories((prev) => [...prev, created])
      setExpenseName('')
      setShowExpenseForm(false)
      toast.success('Category added')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setAddingExpense(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!deleteExpense) return
    const res = await fetch(`/api/expenses/categories/${deleteExpense.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    setExpenseCategories((prev) => prev.filter((c) => c.id !== deleteExpense.id))
    toast.success('Category removed')
  }

  const handleAddMaterial = async () => {
    if (!materialName.trim()) return
    setAddingMaterial(true)
    try {
      const res = await fetch('/api/materials/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: materialName.trim(), unit: materialUnit }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setMaterialCategories((prev) => [...prev, created])
      setMaterialName('')
      setMaterialUnit('kg')
      setShowMaterialForm(false)
      toast.success('Category added')
    } catch {
      toast.error('Failed to add category')
    } finally {
      setAddingMaterial(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!deleteMaterial) return
    const res = await fetch(`/api/materials/categories/${deleteMaterial.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    setMaterialCategories((prev) => prev.filter((c) => c.id !== deleteMaterial.id))
    toast.success('Category removed')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Pills
          value={subTab}
          onChange={(v) => setSubTab(v as SubTab)}
          options={[
            { value: 'expense', label: 'Expense categories' },
            { value: 'material', label: 'Material categories' },
          ]}
          size="md"
        />
      </div>

      {subTab === 'expense' && (
        <div className="space-y-4">
          {loadingExpense ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-gray-100" />)}
            </div>
          ) : (
            <>
              <div className="divide-y divide-card-border rounded-lg border border-card-border">
                {expenseCategories.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted">No expense categories yet</div>
                ) : (
                  expenseCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-900">{cat.name}</span>
                      <IconButton
                        aria-label="Delete"
                        variant="danger"
                        onClick={() => setDeleteExpense(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>

              {showExpenseForm ? (
                <div className="flex gap-2">
                  <Input
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    placeholder="Category name"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                    autoFocus
                  />
                  <Button variant="primary" size="md" loading={addingExpense} onClick={handleAddExpense}>
                    Add
                  </Button>
                  <Button variant="outline" size="md" onClick={() => { setShowExpenseForm(false); setExpenseName('') }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowExpenseForm(true)}
                >
                  Add category
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {subTab === 'material' && (
        <div className="space-y-4">
          {loadingMaterial ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-gray-100" />)}
            </div>
          ) : (
            <>
              <div className="divide-y divide-card-border rounded-lg border border-card-border">
                {materialCategories.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted">No material categories yet</div>
                ) : (
                  materialCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-sm text-gray-900">{cat.name}</span>
                        <span className="ml-2 text-xs text-muted">({cat.unit})</span>
                      </div>
                      <IconButton
                        aria-label="Delete"
                        variant="danger"
                        onClick={() => setDeleteMaterial(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>

              {showMaterialForm ? (
                <div className="flex gap-2">
                  <Input
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Category name"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                    autoFocus
                  />
                  <div className="w-28 shrink-0">
                    <Select
                      value={materialUnit}
                      onChange={(v) => setMaterialUnit(v as Unit)}
                      options={UNIT_OPTIONS}
                    />
                  </div>
                  <Button variant="primary" size="md" loading={addingMaterial} onClick={handleAddMaterial}>
                    Add
                  </Button>
                  <Button variant="outline" size="md" onClick={() => { setShowMaterialForm(false); setMaterialName(''); setMaterialUnit('kg') }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowMaterialForm(true)}
                >
                  Add category
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteExpense}
        title="Remove expense category"
        description={`Remove "${deleteExpense?.name}"? Categories with existing expenses will be deactivated instead of deleted.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteExpense}
        onClose={() => setDeleteExpense(null)}
      />

      <ConfirmDialog
        open={!!deleteMaterial}
        title="Remove material category"
        description={`Remove "${deleteMaterial?.name}"? Categories with existing entries will be deactivated instead of deleted.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteMaterial}
        onClose={() => setDeleteMaterial(null)}
      />
    </div>
  )
}
