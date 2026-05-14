'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone, User, Clock, BookOpen, Search, ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Pills } from '@/components/ui/pills'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface CreditPayment {
  id: string
  amount: number
  createdAt: string
}

interface CreditEntry {
  id: string
  customerName: string
  customerPhone: string | null
  amount: number
  paidAmount: number
  description: string | null
  settled: boolean
  settledAt: string | null
  createdAt: string
  user: { name: string }
  payments: CreditPayment[]
}

interface CustomerGroup {
  customerName: string
  customerPhone: string | null
  totalOwed: number
  totalPaid: number
  balance: number
  credits: CreditEntry[]
}

interface ExistingCustomer {
  customerName: string
  customerPhone: string | null
}

export function CreditBook() {
  const [customers, setCustomers] = useState<CustomerGroup[]>([])
  const [existingCustomers, setExistingCustomers] = useState<ExistingCustomer[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'open' | 'settled'>('open')
  const [search, setSearch] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<CreditEntry | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submittingAdd, setSubmittingAdd] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CreditEntry | null>(null)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetchCredits()
  }, [statusFilter, search])

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ settled: String(statusFilter === 'settled') })
      if (search) params.set('search', search)
      const response = await fetch(`/api/credits?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setCustomers(data.customers)
      setTotalOwed(data.totalOwed)
      setExistingCustomers(data.existingCustomers || [])
    } catch {
      toast.error('Failed to load credit book')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!form.customerName.trim() || !form.amount) {
      toast.error('Name and amount are required')
      return
    }
    setSubmittingAdd(true)
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone || null,
          amount: parseFloat(form.amount),
          description: form.description || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add')
      }
      toast.success('Credit recorded')
      setForm({ customerName: '', customerPhone: '', amount: '', description: '' })
      setSubmittingAdd(false)
      setShowAddForm(false)
      fetchCredits()
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
      const response = await fetch('/api/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId: showPaymentModal.id,
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
      fetchCredits()
    } catch (error: any) {
      setSubmittingPayment(false)
      toast.error(error.message)
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/credits?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Entry deleted')
      fetchCredits()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const selectExistingCustomer = (customer: ExistingCustomer) => {
    setForm({
      ...form,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone || '',
    })
    setShowSuggestions(false)
  }

  const filteredSuggestions = existingCustomers.filter(
    (c) =>
      form.customerName.length > 0 &&
      c.customerName.toLowerCase().includes(form.customerName.toLowerCase()) &&
      c.customerName.toLowerCase() !== form.customerName.toLowerCase(),
  )

  const showSettled = statusFilter === 'settled'

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-semibold text-gray-900">Credit Book</h3>
          </div>
          {!showSettled && totalOwed > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5">
              <span className="text-xs font-medium text-red-600">Total owed</span>
              <span className="text-base font-bold text-red-700 tabular-nums">{formatPrice(totalOwed)}</span>
              <Badge variant="danger" size="sm">{customers.length} customer{customers.length !== 1 ? 's' : ''}</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Pills
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v)
              setExpandedCustomer(null)
            }}
            options={[
              { value: 'open', label: 'Outstanding' },
              { value: 'settled', label: 'Paid' },
            ]}
          />
          {!showSettled && (
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddForm(true)}>
              Add credit
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center text-sm text-muted">
          Loading…
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-white py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">
            {showSettled ? 'No settled debts yet' : search ? 'No results found' : 'No outstanding debts'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => {
            const isExpanded = expandedCustomer === customer.customerName.toLowerCase()
            return (
              <div
                key={customer.customerName}
                className="overflow-hidden rounded-xl border border-card-border bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.customerName.toLowerCase())}
                  className="flex w-full items-center justify-between p-4 transition-colors hover:bg-surface focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
                      <User className="h-4 w-4 text-muted" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{customer.customerName}</div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        {customer.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.customerPhone}
                          </span>
                        )}
                        <span>
                          {customer.credits.length} credit{customer.credits.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!showSettled && customer.totalPaid > 0 && (
                      <span className="text-xs text-green-600 tabular-nums">
                        {formatPrice(customer.totalPaid)} paid
                      </span>
                    )}
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        showSettled ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPrice(showSettled ? customer.totalOwed : customer.balance)}
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
                    {customer.credits.map((credit) => {
                      const remaining = credit.amount - credit.paidAmount
                      return (
                        <div
                          key={credit.id}
                          className={`rounded-lg border p-3 ${
                            credit.settled ? 'border-green-100 bg-green-50' : 'border-card-border bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold text-gray-900 tabular-nums">
                                  {formatPrice(credit.amount)}
                                </span>
                                {credit.paidAmount > 0 && !credit.settled && (
                                  <Badge variant="warning" size="sm">
                                    {formatPrice(remaining)} left
                                  </Badge>
                                )}
                                {credit.settled && (
                                  <Badge variant="success" size="sm">
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              {credit.description && (
                                <p className="mb-1 text-sm text-gray-700">{credit.description}</p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <Clock className="h-3 w-3" />
                                {new Date(credit.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                {credit.settled && credit.settledAt && (
                                  <span className="ml-2 text-green-600">
                                    — Settled{' '}
                                    {new Date(credit.settledAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>

                              {credit.payments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {credit.payments.map((p) => (
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

                            {!credit.settled && (
                              <div className="flex gap-1">
                                <IconButton
                                  aria-label="Record payment"
                                  variant="primary"
                                  onClick={() => {
                                    setShowPaymentModal(credit)
                                    setPaymentAmount('')
                                  }}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                  aria-label="Delete"
                                  variant="danger"
                                  onClick={() => setDeleteTarget(credit)}
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
          setForm({ customerName: '', customerPhone: '', amount: '', description: '' })
        }}
        title="Record new credit"
        width="lg"
        footer={
          <>
            <Button
              variant="outline"
              disabled={submittingAdd}
              onClick={() => {
                setShowAddForm(false)
                setForm({ customerName: '', customerPhone: '', amount: '', description: '' })
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
              {submittingAdd ? 'Saving…' : 'Save credit'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Customer name</label>
            <Input
              type="text"
              placeholder="Name"
              value={form.customerName}
              onChange={(e) => {
                setForm({ ...form, customerName: e.target.value })
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-card-border bg-white shadow-lg">
                {filteredSuggestions.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectExistingCustomer(c)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                  >
                    <span className="font-medium">{c.customerName}</span>
                    {c.customerPhone && <span className="text-xs text-muted">{c.customerPhone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Phone (optional)</label>
            <Input
              type="text"
              placeholder="Phone number"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
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
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              What they ordered (optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. 2 grilled chicken + fries"
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
                <span className="text-muted">Total</span>
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
                <span className="font-bold text-red-600 tabular-nums">
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
        title="Delete credit entry?"
        description={
          deleteTarget
            ? `${deleteTarget.customerName}'s credit of ${formatPrice(deleteTarget.amount)} will be permanently removed.`
            : null
        }
        warning={
          deleteTarget && deleteTarget.paidAmount > 0
            ? `This credit already has ${formatPrice(deleteTarget.paidAmount)} in recorded payments. They will be deleted too.`
            : null
        }
        confirmLabel="Delete entry"
      />
    </div>
  )
}
