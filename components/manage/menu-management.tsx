'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Category, MenuItem } from '@prisma/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Table } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface MenuItemWithCategory extends MenuItem {
  category: Category
}

type FormState = {
  name: string
  description: string
  price: string
  categoryId: string
  featured: boolean
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  featured: false,
  active: true,
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItemWithCategory | null>(null)

  useEffect(() => {
    Promise.all([fetchMenuItems(), fetchCategories()]).finally(() => setLoading(false))
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      setMenuItems(data)
    } catch {
      toast.error('Failed to load menu items')
    }
  }

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
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (item: MenuItemWithCategory) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      featured: item.featured,
      active: item.active,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.categoryId || !form.price) {
      toast.error('Name, category and price are required')
      return
    }
    const payload = { ...form, price: parseFloat(form.price) }
    setSubmitting(true)
    try {
      const response = await fetch(editingId ? `/api/menu/${editingId}` : '/api/menu', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save menu item')
      }
      await fetchMenuItems()
      toast.success(editingId ? 'Menu item updated' : 'Menu item created')
      setSubmitting(false)
      closeForm()
    } catch (error: any) {
      setSubmitting(false)
      toast.error(error.message || 'Failed to save menu item')
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/menu/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete item')
      }
      await fetchMenuItems()
      toast.success('Menu item deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item')
    }
  }

  const toggleAvailability = async (itemId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update availability')
      }
      await fetchMenuItems()
      toast.success(`Item ${!currentActive ? 'enabled' : 'disabled'}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Menu Items</h3>
          <p className="text-sm text-muted">Manage menu items, pricing and availability</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add menu item
        </Button>
      </div>

      <Table>
        <Table.Header>
          <tr>
            <Table.HeaderCell>Item</Table.HeaderCell>
            <Table.HeaderCell>Category</Table.HeaderCell>
            <Table.HeaderCell align="right">Price</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell align="right">Actions</Table.HeaderCell>
          </tr>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Empty colSpan={5}>Loading…</Table.Empty>
          ) : menuItems.length === 0 ? (
            <Table.Empty colSpan={5}>No menu items yet. Add one to get started.</Table.Empty>
          ) : (
            menuItems.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>
                  <div className="flex items-center gap-1.5 font-medium">
                    {item.name}
                    {item.featured && <Star className="h-3.5 w-3.5 fill-current text-amber-400" />}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted line-clamp-1">{item.description}</div>
                  )}
                </Table.Cell>
                <Table.Cell>{item.category.name}</Table.Cell>
                <Table.Cell align="right" className="tabular-nums">
                  {formatPrice(item.price)}
                </Table.Cell>
                <Table.Cell>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item.id, item.active)}
                    className="focus:outline-none"
                  >
                    <Badge variant={item.active ? 'success' : 'danger'} size="sm">
                      {item.active ? 'Available' : 'Disabled'}
                    </Badge>
                  </button>
                </Table.Cell>
                <Table.Cell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton aria-label="Edit" onClick={() => openEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    <IconButton aria-label="Delete" variant="danger" onClick={() => setDeleteTarget(item)}>
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
        title={editingId ? 'Edit menu item' : 'Add menu item'}
        description={editingId ? 'Update the details below.' : 'Fill in the details to add a new item.'}
        width="lg"
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
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create item'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
            <Input
              type="text"
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
            <Select
              value={form.categoryId}
              onChange={(v) => setForm({ ...form, categoryId: v })}
              options={categoryOptions}
              placeholder="Select category"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Price (RWF)</label>
            <Input
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Description</label>
            <textarea
              placeholder="Short description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-4 pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
              />
              Featured item
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
              />
              Available
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        title="Delete menu item?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will no longer be available in POS.`
            : null
        }
        confirmLabel="Delete item"
      />
    </div>
  )
}
