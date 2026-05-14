'use client'

import { AlertTriangle, Info, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './button'
import { Modal } from './modal'
import { cn } from '@/lib/utils'

type ConfirmVariant = 'danger' | 'warning' | 'primary'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: ReactNode
  description?: ReactNode
  warning?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  submittingLabel?: string
  variant?: ConfirmVariant
  icon?: ReactNode
  hideConfirm?: boolean
}

const VARIANT_BADGE: Record<ConfirmVariant, string> = {
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
  primary: 'bg-surface text-muted',
}

const DEFAULT_ICONS: Record<ConfirmVariant, LucideIcon> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  primary: Info,
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  submittingLabel = 'Deleting…',
  variant = 'danger',
  icon,
  hideConfirm = false,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!open) setSubmitting(false)
  }, [open])

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      if (mountedRef.current) {
        setSubmitting(false)
      }
      onClose()
    }
  }

  const IconComponent = DEFAULT_ICONS[variant]
  const confirmButtonVariant = variant === 'danger' ? 'destructive' : 'primary'

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      closeOnBackdrop={!submitting}
      width="sm"
      footer={
        <>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            {cancelLabel}
          </Button>
          {!hideConfirm && (
            <Button
              variant={confirmButtonVariant}
              loading={submitting}
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? submittingLabel : confirmLabel}
            </Button>
          )}
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            VARIANT_BADGE[variant],
          )}
        >
          {icon ?? <IconComponent className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
          {warning ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {warning}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
