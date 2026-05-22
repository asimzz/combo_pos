'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BusinessSettingsData {
  restaurantName: string
  tagline: string
  address: string
  phone: string
}

export function BusinessSettings() {
  const [form, setForm] = useState<BusinessSettingsData>({
    restaurantName: '',
    tagline: '',
    address: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          restaurantName: data.restaurantName ?? '',
          tagline: data.tagline ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
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
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Business info saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Info</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant name">
            <Input
              value={form.restaurantName}
              onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
              placeholder="Combo Restaurant"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="Different Every Time. Always You."
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="KG 18 Ave. Kisiminti, Kigali"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+250 7xx xxx xxx"
            />
          </Field>
        </div>
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
