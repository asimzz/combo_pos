'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type Align = 'start' | 'end'

type DropdownMenuContextValue = {
  open: boolean
  setOpen: (next: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  contentRef: React.RefObject<HTMLDivElement>
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext)
  if (!ctx) {
    throw new Error('DropdownMenu subcomponents must be used inside <DropdownMenu>')
  }
  return ctx
}

type RootProps = {
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

function Root({ children, defaultOpen = false, className }: RootProps) {
  const [open, setOpenState] = useState(defaultOpen)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
  }, [])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (contentRef.current?.contains(target)) return
      setOpenState(false)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpenState(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className={cn('relative', className ?? 'inline-block')}>{children}</div>
    </DropdownMenuContext.Provider>
  )
}

type TriggerProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

function Trigger({ children, className, disabled, ...rest }: TriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu()
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={className}
      {...rest}
    >
      {children}
    </button>
  )
}

type ContentProps = {
  children: ReactNode
  align?: Align
  sideOffset?: number
  className?: string
  width?: 'trigger' | 'auto' | string
}

function Content({
  children,
  align = 'start',
  sideOffset = 6,
  className,
  width = 'auto',
}: ContentProps) {
  const { open, contentRef, triggerRef } = useDropdownMenu()

  useEffect(() => {
    if (!open) return
    const first = contentRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([data-disabled="true"])',
    )
    first?.focus()
  }, [open, contentRef])

  if (!open) return null

  const alignClass = align === 'end' ? 'right-0' : 'left-0'
  const widthStyle =
    width === 'trigger'
      ? { minWidth: triggerRef.current?.offsetWidth ?? undefined }
      : width === 'auto'
        ? undefined
        : { width }

  return (
    <div
      ref={contentRef}
      role="menu"
      style={{ marginTop: sideOffset, ...widthStyle }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
        e.preventDefault()
        const items = Array.from(
          contentRef.current?.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([data-disabled="true"])',
          ) ?? [],
        )
        if (items.length === 0) return
        const active = document.activeElement as HTMLElement | null
        const idx = active ? items.indexOf(active) : -1
        const next =
          e.key === 'ArrowDown'
            ? items[(idx + 1) % items.length]
            : items[(idx - 1 + items.length) % items.length]
        next?.focus()
      }}
      className={cn(
        'absolute z-50 top-full max-h-80 min-w-40 overflow-y-auto rounded-lg border border-card-border bg-white py-1 shadow-lg',
        alignClass,
        className,
      )}
    >
      {children}
    </div>
  )
}

type ItemVariant = 'default' | 'primary' | 'danger'

type ItemProps = {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  variant?: ItemVariant
  className?: string
}

const ITEM_VARIANT: Record<ItemVariant, string> = {
  default: 'text-gray-700 hover:bg-surface focus:bg-surface',
  primary: 'text-primary-600 hover:bg-primary-50 focus:bg-primary-50 font-medium',
  danger: 'text-red-600 hover:bg-red-50 focus:bg-red-50',
}

function Item({ children, onSelect, disabled, variant = 'default', className }: ItemProps) {
  const { setOpen } = useDropdownMenu()
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      data-disabled={disabled ? 'true' : undefined}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onSelect?.()
        setOpen(false)
      }}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50',
        ITEM_VARIANT[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="my-1 h-px bg-card-border" role="separator" />
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted',
        className,
      )}
    >
      {children}
    </div>
  )
}

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  Separator,
  Label,
})
