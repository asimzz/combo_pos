'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, ArrowLeft, Settings, BarChart3, ClipboardList, Cloud } from 'lucide-react'
import Link from 'next/link'

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link
              href="/pos"
              className="btn btn-outline btn-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to POS
            </Link>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <img
                  src="/logo.svg"
                  alt="Combo Restaurant"
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-primary-600">POS Dashboard</span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name}
            </span>

{session?.user?.role !== 'STAFF' && (
              <Link
                href="/dashboard"
                className="btn btn-outline btn-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            )}

            <Link
              href="/orders"
              className="btn btn-outline btn-sm"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Orders
            </Link>

            {session?.user?.role !== 'STAFF' && (
              <Link
                href="/sync"
                className="btn btn-outline btn-sm"
              >
                <Cloud className="w-4 h-4 mr-2" />
                Sync
              </Link>
            )}

            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/manage"
                className="btn btn-outline btn-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Link>
            )}

            <button
              onClick={() => signOut()}
              className="btn btn-outline btn-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}