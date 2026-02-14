'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface RawMaterial {
  id: string
  name: string
  description: string | null
  unit: string
  stock: number
  cost: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface RawMaterialWithUsage extends RawMaterial {
  _count: {
    usage: number
  }
}

export function RawMaterialsManagement() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showStockModal, setShowStockModal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    unit: '',
    stock: '',
    cost: '',
  })
  const [stockForm, setStockForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE',
    quantity: '',
    reason: '',
  })

  useEffect(() => {
    fetchRawMaterials()
  }, [])

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch('/api/raw-materials')
      if (!response.ok) throw new Error('Failed to fetch raw materials')
      const data = await response.json()
      setRawMaterials(data)
    } catch (error) {
      toast.error('Failed to load raw materials')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingItem ? `/api/raw-materials/${editingItem}` : '/api/raw-materials'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          unit: editForm.unit,
          stock: parseFloat(editForm.stock),
          cost: parseFloat(editForm.cost),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save raw material')
      }

      toast.success(editingItem ? 'Raw material updated!' : 'Raw material created!')
      resetForm()
      fetchRawMaterials()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showStockModal) return

    try {
      const response = await fetch(`/api/raw-materials/${showStockModal}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: stockForm.type,
          quantity: parseFloat(stockForm.quantity),
          reason: stockForm.reason || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stock')
      }

      toast.success('Stock updated successfully!')
      setShowStockModal(null)
      setStockForm({ type: 'IN', quantity: '', reason: '' })
      fetchRawMaterials()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEdit = (item: RawMaterialWithUsage) => {
    setEditingItem(item.id)
    setEditForm({
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      stock: String(item.stock || 0),
      cost: String(item.cost || 0),
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this raw material?')) return

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete raw material')

      toast.success('Raw material deleted!')
      fetchRawMaterials()
    } catch (error) {
      toast.error('Failed to delete raw material')
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setShowAddForm(false)
    setEditForm({
      name: '',
      description: '',
      unit: '',
      stock: '',
      cost: '',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Raw Materials</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Raw Material
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">
            {editingItem ? 'Edit Raw Material' : 'Add New Raw Material'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Material name"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="input"
            />
            <input
              type="text"
              placeholder="Unit (kg, lbs, pieces, etc.)"
              required
              value={editForm.unit}
              onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
              className="input"
            />
            <input
              type="number"
              placeholder="Initial stock"
              step="0.001"
              required
              value={editForm.stock}
              onChange={(e) => setEditForm({...editForm, stock: e.target.value})}
              className="input"
            />
            <input
              type="number"
              placeholder="Cost (RWF)"
              step="0.01"
              required
              value={editForm.cost}
              onChange={(e) => setEditForm({...editForm, cost: e.target.value})}
              className="input"
            />
            <div className="md:col-span-2">
              <textarea
                placeholder="Description (optional)"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="input"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex space-x-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline btn-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Raw Materials List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost/Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rawMaterials.map((item) => (
              <tr key={item.id} className={Number(item.stock) <= 5 ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                        <span>{item.name}</span>
                        {Number(item.stock) <= 5 && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {Number(item.stock) || 0} {item.unit}
                  </div>
                  <button
                    onClick={() => setShowStockModal(item.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Update Stock
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${Number(item.cost).toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rawMaterials.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No raw materials found. Add your first raw material above.
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Update Stock</h3>
            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Type
                </label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm({...stockForm, type: e.target.value as any})}
                  className="input"
                >
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="WASTE">Waste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({...stockForm, reason: e.target.value})}
                  className="input"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-md flex-1"
                >
                  Update Stock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(null)
                    setStockForm({ type: 'IN', quantity: '', reason: '' })
                  }}
                  className="btn btn-outline btn-md flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}