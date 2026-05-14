'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone, User, Clock, BookOpen, Search, ChevronDown, ChevronUp, DollarSign, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Pills } from '@/components/ui/pills'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DebtPayment {
  id: string
  amount: number
  createdAt: string
}

interface DebtEntry {
  id: string
  supplierName: string
  contactType: string | null
  contactValue: string | null
  amount: number
  paidAmount: number
  description: string | null
  settled: boolean
  settledAt: string | null
  createdAt: string
  user: { name: string }
  payments: DebtPayment[]
}

interface SupplierGroup {
  supplierName: string
  contactType: string | null
  contactValue: string | null
  totalOwed: number
  totalPaid: number
  balance: number
  debts: DebtEntry[]
}

interface ExistingSupplier {
  supplierName: string
  contactType: string | null
  contactValue: string | null
}

type ContactType = 'phone' | 'momo'

export function DebtBook() {
  const [suppliers, setSuppliers] = useState<SupplierGroup[]>([])
  const [existingSuppliers, setExistingSuppliers] = useState<ExistingSupplier[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'open' | 'settled'>('open')
  const [search, setSearch] = useState('')
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<DebtEntry | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submittingAdd, setSubmittingAdd] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DebtEntry | null>(null)
  const [form, setForm] = useState<{
    supplierName: string
    contactType: ContactType
    contactValue: string
    amount: string
    description: string
  }>({
    supplierName: '',
    contactType: 'phone',
    contactValue: '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetchDebts()
  }, [statusFilter, search])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ settled: String(statusFilter === 'settled') })
      if (search) params.set('search', search)
      const response = await fetch(`/api/debts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setSuppliers(data.suppliers)
      setTotalOwed(data.totalOwed)
      setExistingSuppliers(data.existingSuppliers || [])
    } catch {
      toast.error('Failed to load debt book')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!form.supplierName.trim() || !form.amount) {
      toast.error('Supplier and amount are required')
      return
    }
    setSubmittingAdd(true)
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: form.supplierName.trim(),
          contactType: form.contactValue ? form.contactType : null,
          contactValue: form.contactValue || null,
          amount: parseFloat(form.amount),
          description: form.description || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add')
      }
      toast.success('Debt recorded')
      setForm({ supplierName: '', contactType: 'phone', contactValue: '', amount: '', description: '' })
      setSubmittingAdd(false)
      setShowAddForm(false)
      fetchDebts()
    } catch (error: any) {
      setSubmittingAdd(false)
      toast.error(error.message)
    }
  }

  const handlePayment = async () => {
    if (!showPaymentModal) return
    if (!paymentAmount) {
      toast.error('Enter an amount')
      return
    }
    setSubmittingPayment(true)
    try {
      const response = await fetch('/api/debts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: showPaymentModal.id,
          amount: parseFloat(paymentAmount),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record payment')
      }
      const data = await response.json()
      toast.success(data.settled ? 'Fully paid!' : 'Payment recorded')
      setSubmittingPayment(false)
      setShowPaymentModal(null)
      setPaymentAmount('')
      fetchDebts()
    } catch (error: any) {
      setSubmittingPayment(false)
      toast.error(error.message)
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/debts?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Entry deleted')
      fetchDebts()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const selectExistingSupplier = (supplier: ExistingSupplier) => {
    setForm({
      ...form,
      supplierName: supplier.supplierName,
      contactType: (supplier.contactType as ContactType) || 'phone',
      contactValue: supplier.contactValue || '',
    })
    setShowSuggestions(false)
  }

  const filteredSuggestions = existingSuppliers.filter(
    (s) =>
      form.supplierName.length > 0 &&
      s.supplierName.toLowerCase().includes(form.supplierName.toLowerCase()) &&
      s.supplierName.toLowerCase() !== form.supplierName.toLowerCase(),
  )

  const formatContact = (type: string | null, value: string | null) => {
    if (!value) return null
    return { label: type === 'momo' ? 'MoMo' : 'Phone', value }
  }

  const showSettled = statusFilter === 'settled'

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <h3 className="text-base font-semibold text-gray-900">Debt Book</h3>
          </div>
          {!showSettled && totalOwed > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5">
              <span className="text-xs font-medium text-amber-700">Total you owe</span>
              <span className="text-base font-bold text-amber-800 tabular-nums">{formatPrice(totalOwed)}</span>
              <Badge variant="warning" size="sm">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Pills
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v)
              setExpandedSupplier(null)
            }}
            options={[
              { value: 'open', label: 'Outstanding' },
              { value: 'settled', label: 'Paid' },
            ]}
          />
          {!showSettled && (
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm(true)}>
              Add debt
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="text"
          placeholder="Search by name or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">
            {showSettled ? 'No settled debts yet' : search ? 'No results found' : 'No outstanding debts'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => {
            const isExpanded = expandedSupplier === supplier.supplierName.toLowerCase()
            const contact = formatContact(supplier.contactType, supplier.contactValue)
            return (
              <div
                key={supplier.supplierName}
                className="overflow-hidden rounded-xl border border-card-border bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedSupplier(isExpanded ? null : supplier.supplierName.toLowerCase())}
                  className="flex w-full items-center justify-between p-4 transition-colors hover:bg-surface focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{supplier.supplierName}</div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        {contact && (
                          <span className="flex items-center gap-1">
                            {supplier.contactType === 'momo' ? (
                              <Hash className="h-3 w-3" />
                            ) : (
                              <Phone className="h-3 w-3" />
                            )}
                            {contact.label}: {contact.value}
                          </span>
                        )}
                        <span>{supplier.debts.length} debt{supplier.debts.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!showSettled && supplier.totalPaid > 0 && (
                      <span className="text-xs text-green-600 tabular-nums">
                        {formatPrice(supplier.totalPaid)} paid
                      </span>
                    )}
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        showSettled ? 'text-green-600' : 'text-amber-700'
                      }`}
                    >
                      {formatPrice(showSettled ? supplier.totalOwed : supplier.balance)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-2 border-t border-card-border bg-surface p-4">
                    {supplier.debts.map((debt) => {
                      const remaining = debt.amount - debt.paidAmount
                      return (
                        <div
                          key={debt.id}
                          className={`rounded-lg border p-3 ${
                            debt.settled ? 'border-green-100 bg-green-50' : 'border-card-border bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold text-gray-900 tabular-nums">
                                  {formatPrice(debt.amount)}
                                </span>
                                {debt.paidAmount > 0 && !debt.settled && (
                                  <Badge variant="warning" size="sm">
                                    {formatPrice(remaining)} left
                                  </Badge>
                                )}
                                {debt.settled && (
                                  <Badge variant="success" size="sm">
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              {debt.description && (
                                <p className="mb-1 text-sm text-gray-700">{debt.description}</p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <Clock className="h-3 w-3" />
                                {new Date(debt.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                {debt.settled && debt.settledAt && (
                                  <span className="ml-2 text-green-600">
                                    — Settled{' '}
                                    {new Date(debt.settledAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>

                              {debt.payments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {debt.payments.map((p) => (
                                    <div key={p.id} className="flex items-center gap-2 text-xs">
                                      <DollarSign className="h-3 w-3 text-green-500" />
                                      <span className="font-medium text-green-600 tabular-nums">
                                        {formatPrice(p.amount)}
                                      </span>
                                      <span className="text-muted">
                                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {!debt.settled && (
                              <div className="flex gap-1">
                                <IconButton
                                  aria-label="Record payment"
                                  variant="primary"
                                  onClick={() => {
                                    setShowPaymentModal(debt)
                                    setPaymentAmount('')
                                  }}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                  aria-label="Delete"
                                  variant="danger"
                                  onClick={() => setDeleteTarget(debt)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </IconButton>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showAddForm}
        onClose={() => {
          setShowAddForm(false)
          setForm({ supplierName: '', contactType: 'phone', contactValue: '', amount: '', description: '' })
        }}
        title="Record new debt"
        width="lg"
        footer={
          <>
            <Button
              variant="outline"
              disabled={submittingAdd}
              onClick={() => {
                setShowAddForm(false)
                setForm({ supplierName: '', contactType: 'phone', contactValue: '', amount: '', description: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingAdd}
              disabled={submittingAdd}
              onClick={handleAdd}
            >
              {submittingAdd ? 'Saving…' : 'Save debt'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Supplier name</label>
            <Input
              type="text"
              placeholder="Who do you owe?"
              value={form.supplierName}
              onChange={(e) => {
                setForm({ ...form, supplierName: e.target.value })
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-card-border bg-white shadow-lg">
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectExistingSupplier(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                  >
                    <span className="font-medium">{s.supplierName}</span>
                    {s.contactValue && (
                      <span className="text-xs text-muted">
                        {s.contactType === 'momo' ? 'MoMo: ' : ''}
                        {s.contactValue}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Contact (optional)
            </label>
            <div className="flex gap-2">
              <div className="w-32 shrink-0">
                <Select<ContactType>
                  value={form.contactType}
                  onChange={(v) => setForm({ ...form, contactType: v })}
                  options={[
                    { value: 'phone', label: 'Phone' },
                    { value: 'momo', label: 'MoMo' },
                  ]}
                />
              </div>
              <Input
                type="text"
                placeholder={form.contactType === 'momo' ? 'MoMo code' : 'Phone number'}
                value={form.contactValue}
                onChange={(e) => setForm({ ...form, contactValue: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Amount (RWF)</label>
            <Input
              type="number"
              placeholder="0"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Reason (optional)</label>
            <Input
              type="text"
              placeholder="e.g. Chicken supply, Gas refill"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showPaymentModal}
        onClose={() => {
          setShowPaymentModal(null)
          setPaymentAmount('')
        }}
        title="Record payment"
        width="sm"
        footer={
          <>
            <Button
              variant="outline"
              disabled={submittingPayment}
              onClick={() => {
                setShowPaymentModal(null)
                setPaymentAmount('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submittingPayment}
              disabled={submittingPayment}
              onClick={handlePayment}
            >
              {submittingPayment
                ? 'Saving…'
                : showPaymentModal &&
                    paymentAmount &&
                    parseFloat(paymentAmount) >= showPaymentModal.amount - showPaymentModal.paidAmount
                  ? 'Pay & settle'
                  : 'Record payment'}
            </Button>
          </>
        }
      >
        {showPaymentModal && (
          <div className="space-y-4">
            <div className="space-y-1 rounded-lg border border-card-border bg-surface p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total debt</span>
                <span className="font-medium tabular-nums">{formatPrice(showPaymentModal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Already paid</span>
                <span className="font-medium text-green-600 tabular-nums">
                  {formatPrice(showPaymentModal.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-card-border pt-1">
                <span className="font-medium text-muted">Remaining</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  {formatPrice(showPaymentModal.amount - showPaymentModal.paidAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Payment amount (RWF)
              </label>
              <Input
                type="number"
                min="1"
                max={showPaymentModal.amount - showPaymentModal.paidAmount}
                placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  setPaymentAmount(String(showPaymentModal.amount - showPaymentModal.paidAmount))
                }
              >
                Pay full remaining
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        title="Delete debt entry?"
        description={
          deleteTarget
            ? `${deleteTarget.supplierName}'s debt of ${formatPrice(deleteTarget.amount)} will be permanently removed.`
            : null
        }
        warning={
          deleteTarget && deleteTarget.paidAmount > 0
            ? `This debt already has ${formatPrice(deleteTarget.paidAmount)} in recorded payments. They will be deleted too.`
            : null
        }
        confirmLabel="Delete entry"
      />
    </div>
  )
}
