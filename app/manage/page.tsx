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
import { ExpenseManagement } from '@/components/manage/expense-management'
import { CreditBook } from '@/components/manage/credit-book'
import { Settings, Users, Menu, Store, Grid3X3, Package, Warehouse, DollarSign, Receipt, BookOpen, ArrowLeft } from 'lucide-react'

type TabType = 'menu' | 'categories' | 'staff' | 'stock' | 'raw-materials' | 'salaries' | 'expenses' | 'credits' | 'settings'

export default function ManagePage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<TabType | null>(null)

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
    { id: 'menu' as TabType, name: 'Menu Items', icon: Menu, description: 'Add and edit menu items', adminOnly: false },
    { id: 'categories' as TabType, name: 'Categories', icon: Grid3X3, description: 'Organize menu categories', adminOnly: true },
    { id: 'stock' as TabType, name: 'Stock', icon: Package, description: 'Track inventory levels', adminOnly: false },
    { id: 'raw-materials' as TabType, name: 'Raw Materials', icon: Warehouse, description: 'Manage ingredients', adminOnly: true },
    { id: 'staff' as TabType, name: 'Staff', icon: Users, description: 'Manage employees', adminOnly: true },
    { id: 'salaries' as TabType, name: 'Salaries', icon: DollarSign, description: 'Employee payments', adminOnly: true },
    { id: 'expenses' as TabType, name: 'Expenses', icon: Receipt, description: 'Track daily expenses', adminOnly: true },
    { id: 'credits' as TabType, name: 'Credit Book', icon: BookOpen, description: 'Track customer debts', adminOnly: true },
    { id: 'settings' as TabType, name: 'Settings', icon: Settings, description: 'App configuration', adminOnly: true },
  ].filter(tab => !tab.adminOnly || session.user.role === 'ADMIN')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            {activeTab ? (
              <button
                onClick={() => setActiveTab(null)}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Store className="w-6 h-6 text-primary-600" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab ? tabs.find(t => t.id === activeTab)?.name : 'Restaurant Management'}
            </h1>
          </div>
          {!activeTab && (
            <p className="text-gray-600">Manage your restaurant's menu, staff, and settings</p>
          )}
        </div>

        {!activeTab ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tab.name}</h3>
                  <p className="text-sm text-gray-500">{tab.description}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {activeTab === 'menu' && <MenuManagement />}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'stock' && <StockManagement />}
            {activeTab === 'raw-materials' && <RawMaterialsManagement />}
            {activeTab === 'staff' && <StaffManagement />}
            {activeTab === 'salaries' && <SalaryManagement />}
            {activeTab === 'expenses' && <ExpenseManagement />}
            {activeTab === 'credits' && <CreditBook />}
            {activeTab === 'settings' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                <p className="text-gray-600">Settings management coming soon...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}