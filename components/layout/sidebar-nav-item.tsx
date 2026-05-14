'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SidebarNavItemProps = {
  href: string
  label: string
  icon: ReactNode
  badge?: number
}

export function SidebarNavItem({ href, label, icon, badge }: SidebarNavItemProps) {
  const pathname = usePathname() ?? ''
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-5 py-2.5 text-[15px] font-medium transition-colors',
        isActive
          ? 'bg-sidebar-active text-white border-r-2 border-secondary-400'
          : 'text-white/65 hover:bg-sidebar-hover hover:text-white',
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary-400 px-1.5 text-xs font-semibold text-black">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
