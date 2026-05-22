'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { IconButton } from '@/components/ui/icon-button'

interface RawMaterial {
  id: string
  name: string
  unit: string
}

interface UsageEntry {
  id: string
  quantity: number
  rawMaterial: RawMaterial
}

interface RecipeItem {
  id: string
  name: string
  category: { id: string; name: string }
  rawMaterialUsage: UsageEntry[]
}

interface AddIngredientForm {
  rawMaterialId: string
  quantity: string
}

export function RecipeManagement() {
  const [items, setItems] = useState<RecipeItem[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddIngredientForm>({ rawMaterialId: '', quantity: '' })
  const [saving, setSaving] = useState(false)
  const [editingUsageId, setEditingUsageId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/recipes')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items)
      setRawMaterials(data.rawMaterials)
      if (data.rawMaterials.length > 0) {
        setAddForm((f) => ({ ...f, rawMaterialId: data.rawMaterials[0].id }))
      }
    } catch {
      toast.error('Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setAddingFor(null)
    } else {
      setExpandedId(id)
      setAddingFor(null)
    }
  }

  const startAdding = (menuItemId: string) => {
    setAddingFor(menuItemId)
    const item = items.find((i) => i.id === menuItemId)
    const usedIds = item?.rawMaterialUsage.map((u) => u.rawMaterial.id) ?? []
    const available = rawMaterials.filter((rm) => !usedIds.includes(rm.id))
    setAddForm({ rawMaterialId: available[0]?.id ?? '', quantity: '' })
  }

  const handleAddIngredient = async (menuItemId: string) => {
    if (!addForm.rawMaterialId || !addForm.quantity) {
      toast.error('Select an ingredient and enter a quantity')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          rawMaterialId: addForm.rawMaterialId,
          quantity: parseFloat(addForm.quantity),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Ingredient added')
      setAddingFor(null)
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteIngredient = async (usageId: string) => {
    try {
      const res = await fetch(`/api/recipes/${usageId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Ingredient removed')
      fetchData()
    } catch {
      toast.error('Failed to remove ingredient')
    }
  }

  const startEditQty = (usage: UsageEntry) => {
    setEditingUsageId(usage.id)
    setEditQty(String(usage.quantity))
  }

  const handleSaveQty = async (usageId: string) => {
    const qty = parseFloat(editQty)
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    try {
      const res = await fetch(`/api/recipes/${usageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
      })
      if (!res.ok) throw new Error()
      toast.success('Quantity updated')
      setEditingUsageId(null)
      fetchData()
    } catch {
      toast.error('Failed to update quantity')
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted">Loading recipes…</div>
    )
  }

  if (rawMaterials.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted" />
        <p className="text-sm font-medium text-gray-900">No raw materials configured</p>
        <p className="mt-1 text-xs text-muted">Add raw materials in the Stock section first, then come back to define recipes.</p>
      </div>
    )
  }

  // Group by category
  const byCategory: Record<string, { name: string; items: RecipeItem[] }> = {}
  for (const item of items) {
    const catId = item.category.id
    if (!byCategory[catId]) byCategory[catId] = { name: item.category.name, items: [] }
    byCategory[catId].items.push(item)
  }

  return (
    <div className="divide-y divide-border">
      {Object.values(byCategory).map((cat) => (
        <div key={cat.name}>
          <div className="bg-surface px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{cat.name}</span>
          </div>
          {cat.items.map((item) => {
            const isExpanded = expandedId === item.id
            const usedIds = item.rawMaterialUsage.map((u) => u.rawMaterial.id)
            const availableRawMaterials = rawMaterials.filter((rm) => !usedIds.includes(rm.id))

            return (
              <div key={item.id} className="border-t border-border first:border-t-0">
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                  onClick={() => toggleExpand(item.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className="flex-1 text-sm font-medium text-gray-900">{item.name}</span>
                  {item.rawMaterialUsage.length > 0 ? (
                    <Badge variant="success" size="sm">
                      {item.rawMaterialUsage.length} ingredient{item.rawMaterialUsage.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">No recipe</Badge>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-surface px-4 pb-4 pt-3">
                    {item.rawMaterialUsage.length === 0 ? (
                      <p className="mb-3 text-xs text-muted">No ingredients defined yet. Add ingredients below.</p>
                    ) : (
                      <div className="mb-3 space-y-1">
                        {item.rawMaterialUsage.map((usage) => (
                          <div
                            key={usage.id}
                            className="flex items-center gap-3 rounded-lg border border-card-border bg-white px-3 py-2"
                          >
                            <span className="flex-1 text-sm text-gray-900">{usage.rawMaterial.name}</span>
                            {editingUsageId === usage.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editQty}
                                  onChange={(e) => setEditQty(e.target.value)}
                                  step="0.001"
                                  min="0.001"
                                  className="w-24"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveQty(usage.id)
                                    if (e.key === 'Escape') setEditingUsageId(null)
                                  }}
                                />
                                <span className="text-xs text-muted">{usage.rawMaterial.unit}</span>
                                <Button size="sm" variant="primary" onClick={() => handleSaveQty(usage.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUsageId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button
                                className="cursor-pointer rounded px-2 py-0.5 text-sm font-medium tabular-nums text-gray-700 hover:bg-gray-100"
                                title="Click to edit"
                                onClick={() => startEditQty(usage)}
                              >
                                {usage.quantity} {usage.rawMaterial.unit}
                              </button>
                            )}
                            <IconButton
                              aria-label="Remove ingredient"
                              variant="danger"
                              onClick={() => handleDeleteIngredient(usage.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    )}

                    {addingFor === item.id ? (
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted">Ingredient</label>
                          <Select
                            value={addForm.rawMaterialId}
                            onChange={(v) => setAddForm((f) => ({ ...f, rawMaterialId: v }))}
                            options={availableRawMaterials.map((rm) => ({
                              value: rm.id,
                              label: `${rm.name} (${rm.unit})`,
                            }))}
                            placeholder="Select ingredient"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Qty ({rawMaterials.find((r) => r.id === addForm.rawMaterialId)?.unit ?? '—'})
                          </label>
                          <Input
                            type="number"
                            placeholder="0"
                            step="0.001"
                            min="0.001"
                            value={addForm.quantity}
                            onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient(item.id)}
                          />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={saving}
                          disabled={saving}
                          onClick={() => handleAddIngredient(item.id)}
                        >
                          Add
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAddingFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      availableRawMaterials.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Plus className="h-4 w-4" />}
                          onClick={() => startAdding(item.id)}
                        >
                          Add ingredient
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
