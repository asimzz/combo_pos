'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, BarChart3, Cog, ClipboardList, Menu, X } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { data: session } = useSession()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between relative">
      <div className="flex items-center space-x-3">
        <img
          src="/logo.svg"
          alt="Combo Restaurant"
          className="h-8 w-auto"
        />
        <span className="text-lg font-semibold text-primary-600 hidden sm:inline">POS System</span>
        <span className="hidden md:block text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          Welcome, {session?.user?.name}
        </span>

        {session?.user?.role !== 'STAFF' && (
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            <BarChart3 className="w-4 h-4 mr-1" />
            Dashboard
          </Link>
        )}

        <Link href="/orders" className="btn btn-outline btn-sm">
          <ClipboardList className="w-4 h-4 mr-1" />
          Orders
        </Link>

        {session?.user?.role === 'ADMIN' && (
          <Link href="/manage" className="btn btn-outline btn-sm">
            <Cog className="w-4 h-4 mr-1" />
            Manage
          </Link>
        )}

        <button onClick={() => signOut()} className="btn btn-outline btn-sm">
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 p-4 space-y-2">
          <p className="text-sm text-gray-600 pb-2 border-b">
            Welcome, {session?.user?.name}
          </p>

          {session?.user?.role !== 'STAFF' && (
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          )}

          <Link
            href="/orders"
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
            onClick={() => setShowMobileMenu(false)}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Orders</span>
          </Link>

          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/manage"
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              <Cog className="w-4 h-4" />
              <span>Manage</span>
            </Link>
          )}

          <button
            onClick={() => signOut()}
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg w-full text-left text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  )
}