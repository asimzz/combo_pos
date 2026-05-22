'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HoursData {
  openingTime: string
  closingTime: string
}

export function HoursSettings() {
  const [form, setForm] = useState<HoursData>({ openingTime: '', closingTime: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          openingTime: data.openingTime ?? '',
          closingTime: data.closingTime ?? '',
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
          openingTime: form.openingTime || null,
          closingTime: form.closingTime || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Hours saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-9 rounded-lg bg-gray-100" />
        <div className="h-9 rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opening time">
          <Input
            type="time"
            value={form.openingTime}
            onChange={(e) => setForm((f) => ({ ...f, openingTime: e.target.value }))}
          />
        </Field>
        <Field label="Closing time">
          <Input
            type="time"
            value={form.closingTime}
            onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))}
          />
        </Field>
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
