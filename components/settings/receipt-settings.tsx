'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ReceiptSettingsData {
  receiptFooter: string
  feedbackUrl: string
  showReceiptQR: boolean
}

export function ReceiptSettings() {
  const [form, setForm] = useState<ReceiptSettingsData>({
    receiptFooter: '',
    feedbackUrl: '',
    showReceiptQR: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          receiptFooter: data.receiptFooter ?? '',
          feedbackUrl: data.feedbackUrl ?? '',
          showReceiptQR: data.showReceiptQR ?? true,
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load settings')
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptFooter: form.receiptFooter || null,
          feedbackUrl: form.feedbackUrl || null,
          showReceiptQR: form.showReceiptQR,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Receipt settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Receipt footer message">
          <Input
            value={form.receiptFooter}
            onChange={(e) => setForm((f) => ({ ...f, receiptFooter: e.target.value }))}
            placeholder="Thank you for dining with us!"
          />
        </Field>
        <Field label="Feedback URL">
          <Input
            value={form.feedbackUrl}
            onChange={(e) => setForm((f) => ({ ...f, feedbackUrl: e.target.value }))}
            placeholder="https://combo.rw/feedback"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.showReceiptQR}
          onClick={() => setForm((f) => ({ ...f, showReceiptQR: !f.showReceiptQR }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
            form.showReceiptQR ? 'bg-primary-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.showReceiptQR ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Show QR code on receipt</span>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {children}
    </div>
  )
}
