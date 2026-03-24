'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone, User, Clock, BookOpen, Search, ChevronDown, ChevronUp, DollarSign, X, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

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

export function DebtBook() {
  const [suppliers, setSuppliers] = useState<SupplierGroup[]>([])
  const [existingSuppliers, setExistingSuppliers] = useState<ExistingSupplier[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showSettled, setShowSettled] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<DebtEntry | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [form, setForm] = useState({
    supplierName: '',
    contactType: 'phone' as 'phone' | 'momo',
    contactValue: '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetchDebts()
  }, [showSettled, search])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ settled: String(showSettled) })
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setShowAddForm(false)
      fetchDebts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPaymentModal) return

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
      setShowPaymentModal(null)
      setPaymentAmount('')
      fetchDebts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this debt entry?')) return
    try {
      const response = await fetch(`/api/debts?id=${id}`, { method: 'DELETE' })
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
      contactType: (supplier.contactType as 'phone' | 'momo') || 'phone',
      contactValue: supplier.contactValue || '',
    })
    setShowSuggestions(false)
  }

  const filteredSuggestions = existingSuppliers.filter(s =>
    form.supplierName.length > 0 &&
    s.supplierName.toLowerCase().includes(form.supplierName.toLowerCase()) &&
    s.supplierName.toLowerCase() !== form.supplierName.toLowerCase()
  )

  const formatContact = (type: string | null, value: string | null) => {
    if (!value) return null
    return { label: type === 'momo' ? 'MoMo' : 'Phone', value }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Debt Book</h2>
          </div>
          {!showSettled && totalOwed > 0 && (
            <div className="mt-2 inline-flex items-center bg-orange-50 border border-orange-100 rounded-lg px-4 py-2">
              <span className="text-sm text-orange-600 font-medium mr-2">Total You Owe:</span>
              <span className="text-lg font-bold text-orange-700">{formatPrice(totalOwed)}</span>
              <span className="text-xs text-orange-500 ml-2">({suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => { setShowSettled(!showSettled); setExpandedSupplier(null) }}
            className={`px-3 py-2 text-sm rounded-lg border ${
              showSettled
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {showSettled ? 'Showing Paid' : 'Show Paid'}
          </button>
          {!showSettled && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Record New Debt</h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                required
                placeholder="Who do you owe?"
                value={form.supplierName}
                onChange={(e) => {
                  setForm({ ...form, supplierName: e.target.value })
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="input w-full"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectExistingSupplier(s)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="font-medium">{s.supplierName}</span>
                      {s.contactValue && (
                        <span className="text-gray-400 text-xs">
                          {s.contactType === 'momo' ? 'MoMo: ' : ''}{s.contactValue}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact (optional)</label>
              <div className="flex space-x-2">
                <select
                  value={form.contactType}
                  onChange={(e) => setForm({ ...form, contactType: e.target.value as 'phone' | 'momo' })}
                  className="input w-auto min-w-0 shrink-0"
                >
                  <option value="phone">Phone</option>
                  <option value="momo">MoMo Code</option>
                </select>
                <input
                  type="text"
                  placeholder={form.contactType === 'momo' ? 'MoMo code' : 'Phone number'}
                  value={form.contactValue}
                  onChange={(e) => setForm({ ...form, contactValue: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Amount you owe"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Chicken supply, Gas refill"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input w-full"
              />
            </div>
            <div className="md:col-span-2 flex space-x-2">
              <button type="submit" className="btn btn-primary btn-sm">Save</button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setForm({ supplierName: '', contactType: 'phone', contactValue: '', amount: '', description: '' }) }}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>{showSettled ? 'No settled debts yet' : search ? 'No results found' : 'No outstanding debts'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => {
            const isExpanded = expandedSupplier === supplier.supplierName.toLowerCase()
            const contact = formatContact(supplier.contactType, supplier.contactValue)
            return (
              <div
                key={supplier.supplierName}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Supplier Header */}
                <button
                  onClick={() => setExpandedSupplier(isExpanded ? null : supplier.supplierName.toLowerCase())}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{supplier.supplierName}</div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {contact && (
                          <span className="flex items-center">
                            {supplier.contactType === 'momo' ? (
                              <Hash className="w-3 h-3 mr-1" />
                            ) : (
                              <Phone className="w-3 h-3 mr-1" />
                            )}
                            {contact.label}: {contact.value}
                          </span>
                        )}
                        <span>{supplier.debts.length} debt{supplier.debts.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {!showSettled && supplier.totalPaid > 0 && (
                      <span className="text-xs text-green-600">
                        {formatPrice(supplier.totalPaid)} paid
                      </span>
                    )}
                    <span className={`text-lg font-bold ${showSettled ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatPrice(showSettled ? supplier.totalOwed : supplier.balance)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Debts */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    {supplier.debts.map((debt) => {
                      const remaining = debt.amount - debt.paidAmount
                      return (
                        <div
                          key={debt.id}
                          className={`p-3 rounded-lg border ${
                            debt.settled ? 'bg-green-50 border-green-100' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">{formatPrice(debt.amount)}</span>
                                {debt.paidAmount > 0 && !debt.settled && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                    {formatPrice(remaining)} left
                                  </span>
                                )}
                                {debt.settled && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                              {debt.description && (
                                <p className="text-sm text-gray-600 mb-1">{debt.description}</p>
                              )}
                              <div className="text-xs text-gray-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(debt.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                                {debt.settled && debt.settledAt && (
                                  <span className="ml-2 text-green-600">
                                    — Settled {new Date(debt.settledAt).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric'
                                    })}
                                  </span>
                                )}
                              </div>

                              {/* Payment history */}
                              {debt.payments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {debt.payments.map((p) => (
                                    <div key={p.id} className="text-xs text-gray-500 flex items-center space-x-2">
                                      <DollarSign className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600 font-medium">{formatPrice(p.amount)}</span>
                                      <span>
                                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                                          month: 'short', day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {!debt.settled && (
                              <div className="flex space-x-1 ml-3">
                                <button
                                  onClick={() => { setShowPaymentModal(debt); setPaymentAmount('') }}
                                  className="btn btn-primary btn-sm"
                                  title="Record Payment"
                                >
                                  <DollarSign className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(debt.id)}
                                  className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <button
                onClick={() => { setShowPaymentModal(null); setPaymentAmount('') }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Debt:</span>
                  <span className="font-medium">{formatPrice(showPaymentModal.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-medium text-green-600">{formatPrice(showPaymentModal.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-1">
                  <span className="text-gray-600 font-medium">Remaining:</span>
                  <span className="font-bold text-orange-600">
                    {formatPrice(showPaymentModal.amount - showPaymentModal.paidAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (RWF)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={showPaymentModal.amount - showPaymentModal.paidAmount}
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input w-full"
                />
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(showPaymentModal.amount - showPaymentModal.paidAmount))}
                  className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                >
                  Pay full remaining amount
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="submit" className="btn btn-primary btn-md flex-1">
                  {paymentAmount && parseFloat(paymentAmount) >= (showPaymentModal.amount - showPaymentModal.paidAmount)
                    ? 'Pay & Settle'
                    : 'Record Payment'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(null); setPaymentAmount('') }}
                  className="btn btn-outline btn-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
