'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Category, MenuItem } from '@prisma/client'
import toast from 'react-hot-toast'

interface MenuItemWithCategory extends MenuItem {
  category: Category
}

interface MenuManagementProps {}

export function MenuManagement({}: MenuManagementProps) {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    categoryId: '',
    featured: false,
    active: false
  })

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      setMenuItems(data)
    } catch (error) {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const handleEdit = (item: MenuItemWithCategory) => {
    setEditingItem(item.id)
    setEditForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      cost: (item.cost || 0).toString(),
      categoryId: item.categoryId,
      featured: item.featured,
      active: item.active
    })
  }

  const handleSave = async (itemId: string) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          cost: parseFloat(editForm.cost),
        })
      })

      if (!response.ok) throw new Error('Failed to update item')

      await fetchMenuItems()
      setEditingItem(null)
      toast.success('Menu item updated successfully')
    } catch (error) {
      toast.error('Failed to update menu item')
    }
  }

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          cost: parseFloat(editForm.cost),
        })
      })

      if (!response.ok) throw new Error('Failed to create item')

      await fetchMenuItems()
      setShowAddForm(false)
      setEditForm({
        name: '',
        description: '',
        price: '',
        cost: '',
        categoryId: '',
        featured: false,
        active: false
      })
      toast.success('Menu item created successfully')
    } catch (error) {
      toast.error('Failed to create menu item')
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete item')

      await fetchMenuItems()
      toast.success('Menu item deleted successfully')
    } catch (error) {
      toast.error('Failed to delete menu item')
    }
  }

  const toggleAvailability = async (itemId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })

      if (!response.ok) throw new Error('Failed to update availability')

      await fetchMenuItems()
      toast.success(`Item ${!currentActive ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      toast.error('Failed to update availability')
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
          <h3 className="text-lg font-medium text-gray-900">Menu Items</h3>
          <p className="text-sm text-gray-600">Manage your restaurant's menu items and pricing</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Add New Menu Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="input"
            />
            <select
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              className="input"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price (RWF)"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab' && e.key !== 'Backspace' && e.key !== 'Delete' && !e.key.match(/[0-9]/)) {
                  e.preventDefault()
                }
              }}
              className="input"
            />
            <input
              type="number"
              placeholder="Cost (RWF)"
              value={editForm.cost}
              onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab' && e.key !== 'Backspace' && e.key !== 'Delete' && !e.key.match(/[0-9]/)) {
                  e.preventDefault()
                }
              }}
              className="input"
            />
            <div className="md:col-span-2">
              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="input resize-none"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.featured}
                  onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                  className="mr-2"
                />
                Featured item
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="mr-2"
                />
                Available
              </label>
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

      {/* Menu Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {menuItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="flex items-center">
                        {editingItem === item.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input text-sm"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {item.name}
                            {item.featured && <Star className="w-4 h-4 ml-1 text-yellow-400 fill-current" />}
                          </div>
                        )}
                      </div>
                      {editingItem === item.id ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="input text-xs mt-1 resize-none"
                          rows={1}
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                      className="input text-sm"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-gray-900">{item.category.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab' && e.key !== 'Backspace' && e.key !== 'Delete' && !e.key.match(/[0-9]/)) {
                          e.preventDefault()
                        }
                      }}
                      className="input text-sm w-24"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{formatPrice(item.price)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItem === item.id ? (
                    <input
                      type="number"
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab' && e.key !== 'Backspace' && e.key !== 'Delete' && !e.key.match(/[0-9]/)) {
                          e.preventDefault()
                        }
                      }}
                      className="input text-sm w-24"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{formatPrice(item.cost || 0)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleAvailability(item.id, item.active)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {item.active ? 'Available' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingItem === item.id ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="btn btn-outline btn-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-outline btn-sm"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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

      {menuItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found. Add some items to get started!</p>
        </div>
      )}
    </div>
  )
}