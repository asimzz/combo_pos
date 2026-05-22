'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentSettingsData {
  defaultTaxRate: string
  defaultServiceCharge: string
  momoMerchantId: string
  momoUssdNumber: string
}

export function PaymentSettings() {
  const [form, setForm] = useState<PaymentSettingsData>({
    defaultTaxRate: '0',
    defaultServiceCharge: '0',
    momoMerchantId: '',
    momoUssdNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          defaultTaxRate: String(data.defaultTaxRate ?? 0),
          defaultServiceCharge: String(data.defaultServiceCharge ?? 0),
          momoMerchantId: data.momoMerchantId ?? '',
          momoUssdNumber: data.momoUssdNumber ?? '',
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load settings')
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    const taxRate = parseFloat(form.defaultTaxRate)
    const serviceCharge = parseFloat(form.defaultServiceCharge)
    if (isNaN(taxRate) || isNaN(serviceCharge)) {
      toast.error('Tax rate and service charge must be valid numbers')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTaxRate: taxRate,
          defaultServiceCharge: serviceCharge,
          momoMerchantId: form.momoMerchantId || null,
          momoUssdNumber: form.momoUssdNumber || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Payment settings saved')
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Defaults</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default tax rate (%)">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.defaultTaxRate}
              onChange={(e) => setForm((f) => ({ ...f, defaultTaxRate: e.target.value }))}
              placeholder="0"
            />
          </Field>
          <Field label="Default service charge (RWF)">
            <Input
              type="number"
              min="0"
              step="100"
              value={form.defaultServiceCharge}
              onChange={(e) => setForm((f) => ({ ...f, defaultServiceCharge: e.target.value }))}
              placeholder="0"
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">MTN MoMo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Merchant ID">
            <Input
              value={form.momoMerchantId}
              onChange={(e) => setForm((f) => ({ ...f, momoMerchantId: e.target.value }))}
              placeholder="COMBO_RESTAURANT_001"
            />
          </Field>
          <Field label="USSD merchant number">
            <Input
              value={form.momoUssdNumber}
              onChange={(e) => setForm((f) => ({ ...f, momoUssdNumber: e.target.value }))}
              placeholder="7919494"
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted">
          The USSD number is used to generate the dial code: *182*8*1*<em>number</em>*amount#
        </p>
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
