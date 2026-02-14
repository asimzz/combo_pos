'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Edit, Save, X } from 'lucide-react'
// formatPrice removed as not used
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

export function StockManagement() {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([])
  const [alerts, setAlerts] = useState<LowStockAlerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<{ [key: string]: boolean }>({})
  const [stockValues, setStockValues] = useState<{ [key: string]: string }>({})
  const [alertValues, setAlertValues] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchMenuItems()
    fetchAlerts()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      setMenuItems(data)

      // Initialize stock and alert values for editing
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

  const handleStockEdit = (itemId: string, newStock: string) => {
    setStockValues({
      ...stockValues,
      [itemId]: newStock
    })
  }

  const handleAlertEdit = (itemId: string, newAlert: string) => {
    setAlertValues({
      ...alertValues,
      [itemId]: newAlert
    })
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
        body: JSON.stringify({
          stock,
          lowStockAlert: alertLevel
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stock')
      }

      // Update local state
      setMenuItems(items =>
        items.map(item =>
          item.id === itemId ? {
            ...item,
            stock,
            lowStockAlert: alertLevel
          } as any : item
        )
      )

      setEditingStock({
        ...editingStock,
        [itemId]: false
      })

      toast.success('Stock and alert level updated successfully!')

      // Refresh alerts
      fetchAlerts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleStockCancel = (itemId: string, originalStock: number, originalAlert: number) => {
    setStockValues({
      ...stockValues,
      [itemId]: originalStock.toString()
    })
    setAlertValues({
      ...alertValues,
      [itemId]: originalAlert.toString()
    })
    setEditingStock({
      ...editingStock,
      [itemId]: false
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Alerts Summary */}
      {alerts && alerts.totalAlerts > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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

      {/* Stock Management Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map((item) => {
                const stock = item.stock || 0
                const lowStockAlert = (item as any).lowStockAlert || 10
                const status = getStockStatus(stock, lowStockAlert)
                const isEditing = editingStock[item.id]

                return (
                  <tr key={item.id} className={status.bg}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500">
                              {item.description.length > 50
                                ? `${item.description.substring(0, 50)}...`
                                : item.description}
                            </div>
                          )}
                        </div>
                      </div>
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
                          <button
                            onClick={() => handleStockSave(item.id)}
                            className="btn btn-outline btn-sm"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleStockCancel(item.id, stock, lowStockAlert)}
                            className="btn btn-outline btn-sm"
                            title="Cancel"
                          >
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

            {menuItems.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No menu items found.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
      </div>

      {/* Daily Stock Reset Info */}
      <div className="card p-4 mt-6">
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