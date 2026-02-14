'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, Settings, BarChart3, Cog, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.svg"
            alt="Combo Restaurant"
            className="h-8 w-auto"
          />
          <span className="text-lg font-semibold text-primary-600">POS System</span>
        </div>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
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

        {session?.user?.role === 'ADMIN' && (
          <Link
            href="/manage"
            className="btn btn-outline btn-sm"
          >
            <Cog className="w-4 h-4 mr-2" />
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
    </header>
  )
}