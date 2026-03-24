'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Edit, Save, X, Plus, Link2, Trash2 } from 'lucide-react'
import { MenuItem, Category } from '@prisma/client'
import toast from 'react-hot-toast'

interface MenuItemWithCategory extends MenuItem {
  category: Category
}

interface LowStockAlerts {
  menuItems: MenuItemWithCategory[]
  rawMaterials: any[]
  totalAlerts: number
}

interface StockGroup {
  id: string
  name: string
  stock: number
  lowStockAlert: number
  items: { id: string; name: string; category: { name: string } }[]
}

export function StockManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([])
  const [alerts, setAlerts] = useState<LowStockAlerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<{ [key: string]: boolean }>({})
  const [stockValues, setStockValues] = useState<{ [key: string]: string }>({})
  const [alertValues, setAlertValues] = useState<{ [key: string]: string }>({})

  // Stock Groups state
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([])
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [groupForm, setGroupForm] = useState({ name: '', stock: '', lowStockAlert: '10', menuItemIds: [] as string[] })

  useEffect(() => {
    fetchMenuItems()
    fetchAlerts()
    fetchStockGroups()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      setMenuItems(data)

      const initialStockValues: { [key: string]: string } = {}
      const initialAlertValues: { [key: string]: string } = {}
      data.forEach((item: MenuItemWithCategory) => {
        initialStockValues[item.id] = item.stock?.toString() || '0'
        initialAlertValues[item.id] = ((item as any).lowStockAlert || 10).toString()
      })
      setStockValues(initialStockValues)
      setAlertValues(initialAlertValues)
    } catch (error) {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/low-stock')
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      setAlerts(data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  const fetchStockGroups = async () => {
    try {
      const response = await fetch('/api/stock-groups')
      if (!response.ok) throw new Error('Failed to fetch stock groups')
      const data = await response.json()
      setStockGroups(data)
    } catch (error) {
      console.error('Failed to fetch stock groups:', error)
    }
  }

  const handleStockEdit = (itemId: string, newStock: string) => {
    setStockValues({ ...stockValues, [itemId]: newStock })
  }

  const handleAlertEdit = (itemId: string, newAlert: string) => {
    setAlertValues({ ...alertValues, [itemId]: newAlert })
  }

  const handleStockSave = async (itemId: string) => {
    try {
      const stock = parseInt(stockValues[itemId])
      const alertLevel = parseInt(alertValues[itemId])

      if (isNaN(stock) || stock < 0) {
        toast.error('Please enter a valid stock number')
        return
      }
      if (isNaN(alertLevel) || alertLevel < 0) {
        toast.error('Please enter a valid alert level')
        return
      }

      const response = await fetch(`/api/menu-items/${itemId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock, lowStockAlert: alertLevel }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stock')
      }

      setMenuItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, stock, lowStockAlert: alertLevel } as any : item
        )
      )
      setEditingStock({ ...editingStock, [itemId]: false })
      toast.success('Stock updated successfully!')
      fetchAlerts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleStockCancel = (itemId: string, originalStock: number, originalAlert: number) => {
    setStockValues({ ...stockValues, [itemId]: originalStock.toString() })
    setAlertValues({ ...alertValues, [itemId]: originalAlert.toString() })
    setEditingStock({ ...editingStock, [itemId]: false })
  }

  // Stock Group handlers
  const handleGroupSave = async () => {
    if (!groupForm.name || !groupForm.stock || groupForm.menuItemIds.length === 0) {
      toast.error('Please fill in all fields and select at least one item')
      return
    }

    try {
      const payload = {
        ...(editingGroup && { id: editingGroup }),
        name: groupForm.name,
        stock: parseInt(groupForm.stock),
        lowStockAlert: parseInt(groupForm.lowStockAlert) || 10,
        menuItemIds: groupForm.menuItemIds,
      }

      const response = await fetch('/api/stock-groups', {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save stock group')

      toast.success(editingGroup ? 'Stock group updated!' : 'Stock group created!')
      setShowGroupForm(false)
      setEditingGroup(null)
      setGroupForm({ name: '', stock: '', lowStockAlert: '10', menuItemIds: [] })
      fetchStockGroups()
    } catch (error) {
      toast.error('Failed to save stock group')
    }
  }

  const handleGroupEdit = (group: StockGroup) => {
    setEditingGroup(group.id)
    setGroupForm({
      name: group.name,
      stock: group.stock.toString(),
      lowStockAlert: group.lowStockAlert.toString(),
      menuItemIds: group.items.map(i => i.id),
    })
    setShowGroupForm(true)
  }

  const handleGroupDelete = async (id: string) => {
    if (!confirm('Delete this stock group? Items will be unlinked.')) return
    try {
      const response = await fetch('/api/stock-groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Stock group deleted')
      fetchStockGroups()
    } catch (error) {
      toast.error('Failed to delete stock group')
    }
  }

  const handleGroupStockUpdate = async (groupId: string, newStock: number) => {
    try {
      const response = await fetch('/api/stock-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, stock: newStock }),
      })
      if (!response.ok) throw new Error('Failed to update')
      toast.success('Stock updated!')
      fetchStockGroups()
    } catch (error) {
      toast.error('Failed to update stock')
    }
  }

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock === 0) {
      return { color: 'text-red-600', bg: 'bg-red-50', label: 'Out of Stock' }
    } else if (stock <= lowStockAlert) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Low Stock' }
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', label: 'In Stock' }
    }
  }

  // Items that are already in a stock group (exclude from individual table)
  const groupedItemIds = new Set(stockGroups.flatMap(g => g.items.map(i => i.id)))
  const ungroupedItems = menuItems.filter(item => !groupedItemIds.has(item.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Alerts Summary */}
      {alerts && alerts.totalAlerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Stock Alerts</h3>
          </div>
          <p className="text-yellow-700 mb-2">
            You have {alerts.totalAlerts} items with low or no stock:
          </p>
          <ul className="space-y-1">
            {alerts.menuItems.map((item) => (
              <li key={item.id} className="text-yellow-700 text-sm">
                • {item.name}: {item.stock} left (Category: {item.category.name})
              </li>
            ))}
            {alerts.rawMaterials.map((item) => (
              <li key={item.id} className="text-yellow-700 text-sm">
                • {item.name}: {item.stock} {item.unit} left (Raw Material)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stock Groups Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Link2 className="w-5 h-5" />
              <span>Linked Stock Groups</span>
            </h3>
            <p className="text-sm text-gray-600">Items that share the same stock pool</p>
          </div>
          <button
            onClick={() => {
              setShowGroupForm(true)
              setEditingGroup(null)
              setGroupForm({ name: '', stock: '', lowStockAlert: '10', menuItemIds: [] })
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Group
          </button>
        </div>

        {/* Group Form */}
        {showGroupForm && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">
              {editingGroup ? 'Edit Stock Group' : 'Create Stock Group'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Group name (e.g. Tawook)"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="input"
              />
              <input
                type="number"
                placeholder="Stock quantity"
                min="0"
                value={groupForm.stock}
                onChange={(e) => setGroupForm({ ...groupForm, stock: e.target.value })}
                className="input"
              />
              <input
                type="number"
                placeholder="Low stock alert"
                min="0"
                value={groupForm.lowStockAlert}
                onChange={(e) => setGroupForm({ ...groupForm, lowStockAlert: e.target.value })}
                className="input"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select menu items to link:
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-white">
                {menuItems.map((item) => {
                  const inOtherGroup = groupedItemIds.has(item.id) && !groupForm.menuItemIds.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50 ${inOtherGroup ? 'opacity-40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={groupForm.menuItemIds.includes(item.id)}
                        disabled={inOtherGroup}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGroupForm({ ...groupForm, menuItemIds: [...groupForm.menuItemIds, item.id] })
                          } else {
                            setGroupForm({ ...groupForm, menuItemIds: groupForm.menuItemIds.filter(id => id !== item.id) })
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                      />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-xs text-gray-400">({item.category.name})</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleGroupSave} className="btn btn-primary btn-sm">
                <Save className="w-4 h-4 mr-1" />
                {editingGroup ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setShowGroupForm(false); setEditingGroup(null) }}
                className="btn btn-outline btn-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stock Groups Cards */}
        {stockGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stockGroups.map((group) => {
              const status = getStockStatus(group.stock, group.lowStockAlert)
              return (
                <div key={group.id} className={`border rounded-lg p-4 ${status.bg}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                      <div className={`text-sm font-medium ${status.color} flex items-center space-x-1`}>
                        {group.stock <= group.lowStockAlert && <AlertTriangle className="w-3 h-3" />}
                        <span>{group.stock} units — {status.label}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleGroupEdit(group)} className="btn btn-outline btn-sm">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleGroupDelete(group.id)} className="btn btn-outline btn-sm text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="number"
                      min="0"
                      defaultValue={group.stock}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGroupStockUpdate(group.id, parseInt((e.target as HTMLInputElement).value) || 0)
                        }
                      }}
                      className="input w-24 text-sm"
                    />
                    <span className="text-xs text-gray-500">Press Enter to update</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Linked items:</span>{' '}
                    {group.items.map(i => i.name).join(', ')}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">No stock groups yet. Create one to link items that share the same stock.</p>
        )}
      </div>

      {/* Individual Stock Management Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Item Stock</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ungroupedItems.map((item) => {
                const stock = item.stock || 0
                const lowStockAlert = (item as any).lowStockAlert || 10
                const status = getStockStatus(stock, lowStockAlert)
                const isEditing = editingStock[item.id]

                return (
                  <tr key={item.id} className={status.bg}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">
                          {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={stockValues[item.id]}
                          onChange={(e) => handleStockEdit(item.id, e.target.value)}
                          className="input w-20 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{stock} units</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${status.color} flex items-center space-x-1`}>
                        {stock <= lowStockAlert && <AlertTriangle className="w-4 h-4" />}
                        <span>{status.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={alertValues[item.id]}
                          onChange={(e) => handleAlertEdit(item.id, e.target.value)}
                          className="input w-20 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{lowStockAlert} units</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex space-x-1">
                          <button onClick={() => handleStockSave(item.id)} className="btn btn-outline btn-sm" title="Save">
                            <Save className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleStockCancel(item.id, stock, lowStockAlert)} className="btn btn-outline btn-sm" title="Cancel">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingStock({...editingStock, [item.id]: true})}
                          className="btn btn-outline btn-sm"
                          title="Edit Stock"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {ungroupedItems.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    All items are in stock groups.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Daily Stock Reset Info */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Stock Management</h3>
        <p className="text-gray-700 mb-2">
          Remember to update stock levels at the start of each day based on:
        </p>
        <ul className="text-gray-600 text-sm space-y-1">
          <li>• Fresh inventory received</li>
          <li>• Raw materials available</li>
          <li>• Production capacity for the day</li>
          <li>• Previous day's remaining stock</li>
        </ul>
      </div>
    </div>
  )
}
