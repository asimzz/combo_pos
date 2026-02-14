'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { Category } from '@prisma/client'
import toast from 'react-hot-toast'

interface CategoryManagementProps {}

export function CategoryManagement({}: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id)
    setEditForm({
      name: category.name,
      description: category.description || '',
      active: category.active
    })
  }

  const handleSave = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to update category')

      await fetchCategories()
      setEditingCategory(null)
      toast.success('Category updated successfully')
    } catch (error) {
      toast.error('Failed to update category')
    }
  }

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to create category')

      await fetchCategories()
      setShowAddForm(false)
      setEditForm({
        name: '',
        description: '',
        active: true
      })
      toast.success('Category created successfully')
    } catch (error) {
      toast.error('Failed to create category')
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all menu items in this category.')) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')

      await fetchCategories()
      toast.success('Category deleted successfully')
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  const toggleActive = async (categoryId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })

      if (!response.ok) throw new Error('Failed to update category')

      await fetchCategories()
      toast.success(`Category ${!currentActive ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      toast.error('Failed to update category')
    }
  }

  const updateSortOrder = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/sort`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      })

      if (!response.ok) throw new Error('Failed to update sort order')

      await fetchCategories()
      toast.success('Category order updated')
    } catch (error) {
      toast.error('Failed to update category order')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          <p className="text-sm text-gray-600">Manage menu categories and their display order</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Add New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Category name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="input"
            />
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="mr-2"
                />
                Active
              </label>
            </div>
            <div className="md:col-span-2">
              <textarea
                placeholder="Description (optional)"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="input resize-none"
                rows={2}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button onClick={handleAdd} className="btn btn-primary btn-sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn btn-outline btn-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category, index) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateSortOrder(category.id, 'up')}
                      disabled={index === 0}
                      className="btn btn-outline btn-sm p-1 disabled:opacity-50"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => updateSortOrder(category.id, 'down')}
                      disabled={index === categories.length - 1}
                      className="btn btn-outline btn-sm p-1 disabled:opacity-50"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {editingCategory === category.id ? (
                      <>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="input text-sm mb-1"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="input text-xs resize-none"
                          rows={1}
                          placeholder="Description"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(category.id, category.active)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {category.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(category as any)._count?.items || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingCategory === category.id ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave(category.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="btn btn-outline btn-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn btn-outline btn-sm"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No categories found. Add some categories to get started!</p>
        </div>
      )}
    </div>
  )
}