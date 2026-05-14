import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Table({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-card-border bg-white',
        className,
      )}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Header({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...rest}
      className={cn('bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted', className)}
    >
      {children}
    </thead>
  )
}

function Body({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...rest} className={cn('divide-y divide-card-border', className)}>
      {children}
    </tbody>
  )
}

type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  clickable?: boolean
}

function Row({ className, clickable, children, ...rest }: RowProps) {
  return (
    <tr
      {...rest}
      className={cn(
        clickable ? 'cursor-pointer hover:bg-surface transition-colors' : 'hover:bg-surface/60 transition-colors',
        className,
      )}
    >
      {children}
    </tr>
  )
}

type CellAlign = 'left' | 'right' | 'center'

type HeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & { align?: CellAlign }
function HeaderCell({ className, align = 'left', children, ...rest }: HeaderCellProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th {...rest} className={cn('px-4 py-3', alignClass, className)}>
      {children}
    </th>
  )
}

type CellProps = TdHTMLAttributes<HTMLTableCellElement> & { align?: CellAlign }
function Cell({ className, align = 'left', children, ...rest }: CellProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <td {...rest} className={cn('px-4 py-3 text-gray-900 align-middle', alignClass, className)}>
      {children}
    </td>
  )
}

function Empty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  )
}

const TableNS = Object.assign(Table, {
  Header,
  Body,
  Row,
  HeaderCell,
  Cell,
  Empty,
})

export { TableNS as Table }
