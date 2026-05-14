'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  BookOpen,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings2,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { SidebarNavItem } from './sidebar-nav-item'
import { UserMenu } from './user-menu'

type Role = 'ADMIN' | 'MANAGER' | 'STAFF'

type NavEntry = {
  href: string
  label: string
  icon: React.ReactNode
  roles: Role[]
}

const ICON_SIZE = 'h-5 w-5'

const NAV_ENTRIES: NavEntry[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    href: '/sell',
    label: 'Sell',
    icon: <ShoppingCart className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: <ClipboardList className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
  },
  {
    href: '/inbox',
    label: 'Inbox',
    icon: <MessageCircle className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
  },
  {
    href: '/catalog',
    label: 'Catalog',
    icon: <ChefHat className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    href: '/stock',
    label: 'Stock',
    icon: <Package className={ICON_SIZE} />,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    href: '/expenses',
    label: 'Expenses',
    icon: <Receipt className={ICON_SIZE} />,
    roles: ['ADMIN'],
  },
  {
    href: '/staff',
    label: 'Staff',
    icon: <Users className={ICON_SIZE} />,
    roles: ['ADMIN'],
  },
  {
    href: '/books',
    label: 'Books',
    icon: <BookOpen className={ICON_SIZE} />,
    roles: ['ADMIN'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings2 className={ICON_SIZE} />,
    roles: ['ADMIN'],
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const role = (session?.user?.role as Role | undefined) ?? 'STAFF'

  const items = NAV_ENTRIES.filter((entry) => entry.roles.includes(role))
  const inboxUnread = useInboxUnread(Boolean(session?.user))

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Combo" className="h-8 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {items.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href === '/inbox' ? inboxUnread : undefined}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <UserMenu />
      </div>
    </aside>
  )
}

function useInboxUnread(enabled: boolean) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const tick = async () => {
      try {
        const res = await fetch('/api/inbox', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setUnread(Number(data?.total_unread ?? 0))
      } catch {
        // ignore network errors — sidebar shouldn't crash
      }
    }

    tick()
    const id = setInterval(tick, 10_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [enabled])

  return unread
}
