import { prisma } from './prisma'

export interface SyncData {
  users: any[]
  categories: any[]
  menuItems: any[]
  orders: any[]
  orderItems: any[]
  payments: any[]
  dailySales: any[]
  rawMaterials: any[]
  rawMaterialUsage: any[]
  rawMaterialStockLogs: any[]
  salaryPayments: any[]
  monthlySalarySummary: any[]
}

export class DataSync {
  // Export local data for sync
  static async exportData(): Promise<SyncData> {
    try {
      const [
        users,
        categories,
        menuItems,
        orders,
        orderItems,
        payments,
        dailySales,
        rawMaterials,
        rawMaterialUsage,
        rawMaterialStockLogs,
        salaryPayments,
        monthlySalarySummary
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.category.findMany(),
        prisma.menuItem.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
        prisma.payment.findMany(),
        prisma.dailySales.findMany(),
        prisma.rawMaterial.findMany(),
        prisma.rawMaterialUsage.findMany(),
        prisma.rawMaterialStockLog.findMany(),
        prisma.salaryPayment.findMany(),
        prisma.monthlySalarySummary.findMany()
      ])

      return {
        users,
        categories,
        menuItems,
        orders,
        orderItems,
        payments,
        dailySales,
        rawMaterials,
        rawMaterialUsage,
        rawMaterialStockLogs,
        salaryPayments,
        monthlySalarySummary
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      throw new Error('Failed to export local data')
    }
  }

  // Backup database to JSON file
  static async backupToFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const data = await this.exportData()

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data
      }

      await fs.writeFile(filePath, JSON.stringify(backup, null, 2), 'utf8')
      console.log(`Database backed up to: ${filePath}`)
    } catch (error) {
      console.error('Error backing up to file:', error)
      throw new Error('Failed to backup database')
    }
  }

  // Sync to remote server (end-of-day)
  static async syncToRemote(endpoint: string, apiKey?: string): Promise<boolean> {
    try {
      const data = await this.exportData()

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          restaurantId: process.env.RESTAURANT_ID || 'combo-pos',
          data
        })
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Sync successful:', result)

      // Mark as synced (you could add a sync table to track this)
      await this.markAsSynced()

      return true
    } catch (error) {
      console.error('Error syncing to remote:', error)
      return false
    }
  }

  // Mark data as synced
  private static async markAsSynced(): Promise<void> {
    // You could create a sync_log table to track successful syncs
    console.log('Data marked as synced at:', new Date().toISOString())
  }

  // Check internet connectivity
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Auto-sync if connected and data is pending
  static async autoSync(remoteEndpoint: string, apiKey?: string): Promise<void> {
    const isConnected = await this.checkConnection()

    if (isConnected) {
      console.log('Internet available, attempting sync...')
      const success = await this.syncToRemote(remoteEndpoint, apiKey)

      if (success) {
        console.log('✅ Auto-sync completed successfully')
      } else {
        console.log('❌ Auto-sync failed')
      }
    } else {
      console.log('📡 No internet connection - working offline')
    }
  }

  // Restore from backup (if needed)
  static async restoreFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const backupData = await fs.readFile(filePath, 'utf8')
      const backup = JSON.parse(backupData)

      // Clear existing data
      await prisma.$transaction([
        prisma.salaryPayment.deleteMany(),
        prisma.monthlySalarySummary.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.payment.deleteMany(),
        prisma.order.deleteMany(),
        prisma.rawMaterialStockLog.deleteMany(),
        prisma.rawMaterialUsage.deleteMany(),
        prisma.rawMaterial.deleteMany(),
        prisma.menuItem.deleteMany(),
        prisma.category.deleteMany(),
        prisma.dailySales.deleteMany(),
        prisma.user.deleteMany()
      ])

      // Restore data
      const { data } = backup

      await prisma.$transaction([
        ...data.users.map((user: any) => prisma.user.create({ data: user })),
        ...data.categories.map((cat: any) => prisma.category.create({ data: cat })),
        ...data.menuItems.map((item: any) => prisma.menuItem.create({ data: item })),
        ...data.rawMaterials.map((rm: any) => prisma.rawMaterial.create({ data: rm })),
        ...data.orders.map((order: any) => prisma.order.create({ data: order })),
        ...data.orderItems.map((item: any) => prisma.orderItem.create({ data: item })),
        ...data.payments.map((payment: any) => prisma.payment.create({ data: payment })),
        ...data.dailySales.map((sales: any) => prisma.dailySales.create({ data: sales })),
        ...data.rawMaterialUsage.map((usage: any) => prisma.rawMaterialUsage.create({ data: usage })),
        ...data.rawMaterialStockLogs.map((log: any) => prisma.rawMaterialStockLog.create({ data: log })),
        ...data.salaryPayments?.map((payment: any) => prisma.salaryPayment.create({ data: payment })) || [],
        ...data.monthlySalarySummary?.map((summary: any) => prisma.monthlySalarySummary.create({ data: summary })) || []
      ])

      console.log('Database restored from backup successfully')
    } catch (error) {
      console.error('Error restoring from backup:', error)
      throw new Error('Failed to restore from backup')
    }
  }
}

export function getDataPath(): string {
  return './backups'
}