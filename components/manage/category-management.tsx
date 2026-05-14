'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Category } from '@prisma/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Table } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type CategoryWithCount = Category & { _count?: { items: number } }

type FormState = {
  name: string
  description: string
  active: boolean
}

const EMPTY: FormState = { name: '', description: '', active: true }

export function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false))
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch {
      toast.error('Failed to load categories')
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({
      name: category.name,
      description: category.description || '',
      active: category.active,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(editingId ? `/api/categories/${editingId}` : '/api/categories', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Failed to save category')
      await fetchCategories()
      toast.success(editingId ? 'Category updated' : 'Category created')
      setSubmitting(false)
      closeForm()
    } catch {
      setSubmitting(false)
      toast.error('Failed to save category')
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete category')
      }
      await fetchCategories()
      toast.success('Category deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    }
  }

  const toggleActive = async (categoryId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })
      if (!response.ok) throw new Error('Failed to update category')
      await fetchCategories()
      toast.success(`Category ${!currentActive ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update category')
    }
  }

  const updateSortOrder = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/sort`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      if (!response.ok) throw new Error('Failed to update sort order')
      await fetchCategories()
      toast.success('Category order updated')
    } catch {
      toast.error('Failed to update category order')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Categories</h3>
          <p className="text-sm text-muted">Organize menu sections and their display order</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add category
        </Button>
      </div>

      <Table>
        <Table.Header>
          <tr>
            <Table.HeaderCell>Order</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell align="right">Items</Table.HeaderCell>
            <Table.HeaderCell align="right">Actions</Table.HeaderCell>
          </tr>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Empty colSpan={5}>Loading…</Table.Empty>
          ) : categories.length === 0 ? (
            <Table.Empty colSpan={5}>No categories yet. Add one to get started.</Table.Empty>
          ) : (
            categories.map((category, index) => (
              <Table.Row key={category.id}>
                <Table.Cell>
                  <div className="flex gap-1">
                    <IconButton
                      size="sm"
                      aria-label="Move up"
                      onClick={() => updateSortOrder(category.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      size="sm"
                      aria-label="Move down"
                      onClick={() => updateSortOrder(category.id, 'down')}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-muted">{category.description}</div>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <button
                    type="button"
                    onClick={() => toggleActive(category.id, category.active)}
                    className="focus:outline-none"
                  >
                    <Badge variant={category.active ? 'success' : 'danger'} size="sm">
                      {category.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </button>
                </Table.Cell>
                <Table.Cell align="right" className="tabular-nums">
                  {category._count?.items ?? 0}
                </Table.Cell>
                <Table.Cell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton aria-label="Edit" onClick={() => openEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton aria-label="Delete" variant="danger" onClick={() => setDeleteTarget(category)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? 'Edit category' : 'Add category'}
        width="md"
        footer={
          <>
            <Button variant="outline" disabled={submitting} onClick={closeForm}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
            <Input
              type="text"
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Description</label>
            <textarea
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
            />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        variant={(deleteTarget?._count?.items ?? 0) > 0 ? 'warning' : 'danger'}
        hideConfirm={(deleteTarget?._count?.items ?? 0) > 0}
        title={
          (deleteTarget?._count?.items ?? 0) > 0
            ? "Can't delete this category"
            : 'Delete category?'
        }
        description={
          (deleteTarget?._count?.items ?? 0) > 0
            ? `“${deleteTarget?.name}” still has menu items. Move or delete them first before removing the category.`
            : deleteTarget
              ? `“${deleteTarget.name}” will be removed permanently.`
              : null
        }
        warning={
          (deleteTarget?._count?.items ?? 0) > 0
            ? `This category currently contains ${deleteTarget?._count?.items} menu item${(deleteTarget?._count?.items ?? 0) === 1 ? '' : 's'}.`
            : null
        }
        cancelLabel={(deleteTarget?._count?.items ?? 0) > 0 ? 'Close' : 'Cancel'}
        confirmLabel="Delete category"
      />
    </div>
  )
}
