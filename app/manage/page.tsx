'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MenuManagement } from '@/components/manage/menu-management'
import { StaffManagement } from '@/components/manage/staff-management'
import { CategoryManagement } from '@/components/manage/category-management'
import { RawMaterialsManagement } from '@/components/manage/raw-materials-management'
import { StockManagement } from '@/components/manage/stock-management'
import SalaryManagement from '@/components/manage/salary-management'
import { Settings, Users, Menu, Store, Grid3X3, Package, Warehouse, DollarSign } from 'lucide-react'

type TabType = 'menu' | 'categories' | 'staff' | 'stock' | 'raw-materials' | 'salaries' | 'settings'

export default function ManagePage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('menu')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  const tabs = [
    { id: 'menu' as TabType, name: 'Menu Items', icon: Menu, adminOnly: false },
    { id: 'categories' as TabType, name: 'Categories', icon: Grid3X3, adminOnly: true },
    { id: 'stock' as TabType, name: 'Stock Management', icon: Package, adminOnly: false },
    { id: 'raw-materials' as TabType, name: 'Raw Materials', icon: Warehouse, adminOnly: true },
    { id: 'staff' as TabType, name: 'Staff Management', icon: Users, adminOnly: true },
    { id: 'salaries' as TabType, name: 'Employee Salaries', icon: DollarSign, adminOnly: true },
    { id: 'settings' as TabType, name: 'Settings', icon: Settings, adminOnly: true },
  ].filter(tab => !tab.adminOnly || session.user.role === 'ADMIN')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Store className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          </div>
          <p className="text-gray-600">Manage your restaurant's menu, staff, and settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'menu' && <MenuManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'stock' && <StockManagement />}
          {activeTab === 'raw-materials' && <RawMaterialsManagement />}
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'salaries' && <SalaryManagement />}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              <p className="text-gray-600">Settings management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}