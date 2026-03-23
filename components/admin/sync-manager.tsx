'use client'

import { useState, useEffect } from 'react'
import { Cloud, Download, Upload, Wifi, WifiOff, Database, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface SyncStatus {
  online: boolean
  timestamp: string
  database: string
  status: string
}

export function SyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    checkSyncStatus()

    // Check status every 30 seconds
    const interval = setInterval(checkSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status')
      if (response.ok) {
        const status = await response.json()
        setSyncStatus(status)
      }
    } catch (error) {
      console.error('Failed to check sync status:', error)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/sync/export', { method: 'POST' })

      if (response.ok) {
        const result = await response.json()

        // Download as JSON file
        const blob = new Blob([JSON.stringify(result, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `combo-pos-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setLastSync(new Date().toISOString())
        toast.success('Data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleManualSync = async () => {
    if (!syncStatus?.online) {
      toast.error('No internet connection available')
      return
    }

    toast.loading('Syncing data to cloud...', { id: 'sync' })

    // Simulate cloud sync (replace with actual endpoint)
    setTimeout(() => {
      setLastSync(new Date().toISOString())
      toast.success('Data synced to cloud successfully!', { id: 'sync' })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sync Status</h3>
          <div className="flex items-center space-x-2">
            {syncStatus?.online ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              syncStatus?.online ? 'text-green-600' : 'text-red-600'
            }`}>
              {syncStatus?.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-blue-900">Database</div>
            <div className="text-xs text-blue-600">SQLite (Local)</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Cloud className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-900">Connection</div>
            <div className="text-xs text-green-600">
              {syncStatus?.status || 'Checking...'}
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-purple-900">Last Sync</div>
            <div className="text-xs text-purple-600">
              {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export/Backup */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Download className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-medium">Export Data</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Download your restaurant data as a backup file.
              Includes all orders, menu items, and sales data.
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </button>
          </div>

          {/* Cloud Sync */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Upload className="w-5 h-5 text-green-500 mr-2" />
              <h4 className="font-medium">Cloud Sync</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sync your local data to the cloud when internet is available.
              End-of-day sync recommended.
            </p>
            <button
              onClick={handleManualSync}
              disabled={!syncStatus?.online}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {syncStatus?.online ? 'Sync to Cloud' : 'No Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* Offline Notice */}
      {!syncStatus?.online && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <WifiOff className="w-5 h-5 text-yellow-500 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">Working Offline</h4>
              <p className="text-sm text-yellow-700">
                Your POS system is working offline. All data is being saved locally.
                Sync to cloud when internet connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}