'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DollarSign, Plus, User, Eye, Edit3, Check, X, History, FileText, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Table } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'

interface Employee {
  id: string
  name: string
  phone: string
  role: string
  monthlySalary: number
  salaryDueDay: number
  dueDate: string
  totalPaid: number
  balance: number
  payments: SalaryPayment[]
}

interface SalaryPayment {
  id: string
  amount: number
  month: number
  year: number
  notes: string | null
  createdAt: string
}

interface EmployeeDetail {
  employee: Employee
  year: number
  monthlySummaries: MonthlySummary[]
  yearlyTotals: { totalSalary: number; totalPaid: number; balance: number }
}

interface MonthlySummary {
  month: number
  monthName: string
  monthlySalary: number
  totalPaid: number
  balance: number
  payments: SalaryPayment[]
  paymentCount: number
}

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

function roleVariant(role: string): Variant {
  switch (role) {
    case 'ADMIN':
      return 'brand'
    case 'MANAGER':
      return 'info'
    default:
      return 'success'
  }
}

export default function SalaryManagement() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [currentYear, setCurrentYear] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ userId: '', amount: '', notes: '' })
  const [editingSalary, setEditingSalary] = useState<Record<string, boolean>>({})
  const [salaryInputs, setSalaryInputs] = useState<Record<string, string>>({})
  const [dueDayInputs, setDueDayInputs] = useState<Record<string, string>>({})
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<SalaryPayment[]>([])
  const [historyEmployeeName, setHistoryEmployeeName] = useState('')

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchEmployees()
    }
  }, [session])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/salaries')
      if (!response.ok) throw new Error('Failed to fetch employees')
      const data = await response.json()
      setEmployees(data.employees)
      setCurrentMonth(data.currentMonth)
      setCurrentYear(data.currentYear)
    } catch {
      toast.error('Failed to fetch employee data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSalary = async (userId: string, newSalary: number) => {
    try {
      const dueDay = dueDayInputs[userId] ? parseInt(dueDayInputs[userId]) : undefined
      const response = await fetch('/api/salaries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, monthlySalary: newSalary, ...(dueDay && { salaryDueDay: dueDay }) }),
      })
      if (!response.ok) throw new Error('Failed to update salary')
      toast.success('Salary updated')
      setEditingSalary((prev) => ({ ...prev, [userId]: false }))
      setSalaryInputs((prev) => ({ ...prev, [userId]: '' }))
      await fetchEmployees()
    } catch {
      toast.error('Failed to update salary')
    }
  }

  const handleAddPayment = async () => {
    if (!paymentForm.userId || !paymentForm.amount) {
      toast.error('Fill in all required fields')
      return
    }
    try {
      setLoading(true)
      const response = await fetch('/api/salaries/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: paymentForm.userId,
          amount: parseFloat(paymentForm.amount),
          notes: paymentForm.notes || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record payment')
      }
      toast.success('Payment recorded')
      setShowPaymentModal(false)
      setPaymentForm({ userId: '', amount: '', notes: '' })
      await fetchEmployees()
      if (selectedEmployee && selectedEmployee.employee.id === paymentForm.userId) {
        await fetchEmployeeDetail(paymentForm.userId)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetail = async (userId: string) => {
    try {
      setSelectedEmployee(null)
      setModalLoading(true)
      const response = await fetch(`/api/salaries/${userId}?year=${currentYear}`)
      if (!response.ok) throw new Error('Failed to fetch employee details')
      const data = await response.json()
      setSelectedEmployee(data)
    } catch {
      toast.error('Failed to fetch employee details')
    } finally {
      setModalLoading(false)
    }
  }

  const fetchPaymentHistory = async (userId: string, employeeName: string) => {
    try {
      setHistoryEmployeeName(employeeName)
      setShowPaymentHistory(true)
      setModalLoading(true)
      const response = await fetch(`/api/salaries/payments?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch payment history')
      const data = await response.json()
      setPaymentHistory(data)
    } catch {
      toast.error('Failed to fetch payment history')
    } finally {
      setModalLoading(false)
    }
  }

  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center">
        <h3 className="text-base font-semibold text-gray-900">Access denied</h3>
        <p className="mt-1 text-sm text-muted">Only administrators can access salary management.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Employee Salary Management</h3>
          <p className="text-sm text-muted">
            Manage employee salaries and track payments for{' '}
            {new Date(currentYear, currentMonth - 1).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPaymentModal(true)}>
          Record payment
        </Button>
      </div>

      <Table>
        <Table.Header>
          <tr>
            <Table.HeaderCell>Employee</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell align="right">Monthly salary</Table.HeaderCell>
            <Table.HeaderCell align="right">Total paid</Table.HeaderCell>
            <Table.HeaderCell align="right">Balance</Table.HeaderCell>
            <Table.HeaderCell>Due</Table.HeaderCell>
            <Table.HeaderCell align="right">Actions</Table.HeaderCell>
          </tr>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Empty colSpan={7}>Loading…</Table.Empty>
          ) : employees.length === 0 ? (
            <Table.Empty colSpan={7}>
              <div className="flex flex-col items-center gap-2">
                <User className="h-8 w-8 text-muted" />
                <span>No employees found</span>
              </div>
            </Table.Empty>
          ) : (
            employees.map((employee) => (
              <Table.Row key={employee.id}>
                <Table.Cell>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-xs text-muted">{employee.phone}</div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={roleVariant(employee.role)} size="sm">{employee.role}</Badge>
                </Table.Cell>
                <Table.Cell align="right">
                  {editingSalary[employee.id] ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        value={salaryInputs[employee.id] || ''}
                        onChange={(e) =>
                          setSalaryInputs((prev) => ({ ...prev, [employee.id]: e.target.value }))
                        }
                        className="w-24"
                        placeholder="0"
                      />
                      <IconButton
                        aria-label="Confirm"
                        variant="primary"
                        onClick={() => {
                          const v = parseFloat(salaryInputs[employee.id])
                          if (isNaN(v) || v < 0) {
                            toast.error('Enter a valid salary')
                            return
                          }
                          handleUpdateSalary(employee.id, v)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        aria-label="Cancel"
                        onClick={() => {
                          setEditingSalary((p) => ({ ...p, [employee.id]: false }))
                          setSalaryInputs((p) => ({ ...p, [employee.id]: '' }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <span className="tabular-nums">{formatPrice(employee.monthlySalary)}</span>
                      <IconButton
                        aria-label="Edit salary"
                        onClick={() => {
                          setEditingSalary((p) => ({ ...p, [employee.id]: true }))
                          setSalaryInputs((p) => ({ ...p, [employee.id]: employee.monthlySalary.toString() }))
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell align="right" className="tabular-nums">
                  {formatPrice(employee.totalPaid)}
                </Table.Cell>
                <Table.Cell align="right">
                  <span
                    className={`font-medium tabular-nums ${
                      employee.balance > 0
                        ? 'text-red-600'
                        : employee.balance === 0
                          ? 'text-green-600'
                          : 'text-amber-600'
                    }`}
                  >
                    {formatPrice(employee.balance)}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {editingSalary[employee.id] ? (
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDayInputs[employee.id] || (employee.salaryDueDay ?? 1).toString()}
                      onChange={(e) =>
                        setDueDayInputs((prev) => ({ ...prev, [employee.id]: e.target.value }))
                      }
                      className="w-20"
                    />
                  ) : (
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          new Date(employee.dueDate) < new Date() && employee.balance > 0
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {new Date(employee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-muted">Day {employee.salaryDueDay} of month</div>
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton
                      aria-label="Record payment"
                      variant="primary"
                      onClick={() => {
                        setPaymentForm({ ...paymentForm, userId: employee.id })
                        setShowPaymentModal(true)
                      }}
                    >
                      <DollarSign className="h-4 w-4" />
                    </IconButton>
                    <IconButton aria-label="View summary" onClick={() => fetchEmployeeDetail(employee.id)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      aria-label="Payment history"
                      onClick={() => fetchPaymentHistory(employee.id, employee.name)}
                    >
                      <History className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      <Modal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setPaymentForm({ userId: '', amount: '', notes: '' })
        }}
        title="Record salary payment"
        width="md"
        footer={
          <>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                setShowPaymentModal(false)
                setPaymentForm({ userId: '', amount: '', notes: '' })
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" disabled={loading} loading={loading} onClick={handleAddPayment}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Employee</label>
            <Select
              value={paymentForm.userId}
              onChange={(v) => setPaymentForm({ ...paymentForm, userId: v })}
              options={employees.map((e) => ({
                value: e.id,
                label: `${e.name} (${formatPrice(e.balance)} remaining)`,
              }))}
              placeholder="Select employee"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Amount (RWF)</label>
            <Input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0"
              min="1"
              step="1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Notes (optional)</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Payment notes…"
              rows={3}
              className="w-full resize-none rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={(!!selectedEmployee || modalLoading) && !showPaymentHistory}
        onClose={() => {
          setSelectedEmployee(null)
          setModalLoading(false)
        }}
        title={selectedEmployee ? `Salary details — ${selectedEmployee.employee.name}` : 'Loading…'}
        width="xl"
      >
        {modalLoading && !selectedEmployee ? (
          <div className="py-12 text-center text-sm text-muted">Loading details…</div>
        ) : selectedEmployee ? (
          <>
            <div className="mb-6 rounded-xl border border-card-border bg-surface p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Year {selectedEmployee.year} summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted">Total salary</span>
                  <div className="font-semibold tabular-nums">
                    {formatPrice(selectedEmployee.yearlyTotals.totalSalary)}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Total paid</span>
                  <div className="font-semibold text-green-600 tabular-nums">
                    {formatPrice(selectedEmployee.yearlyTotals.totalPaid)}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Balance</span>
                  <div
                    className={`font-semibold tabular-nums ${
                      selectedEmployee.yearlyTotals.balance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatPrice(selectedEmployee.yearlyTotals.balance)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {selectedEmployee.monthlySummaries.map((month) => (
                <div key={month.month} className="rounded-xl border border-card-border bg-white p-4">
                  <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                    {month.monthName}
                    {month.month === currentMonth && <Badge variant="info" size="sm">Current</Badge>}
                  </h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted">Salary</span><span className="tabular-nums">{formatPrice(month.monthlySalary)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Paid</span><span className="text-green-600 tabular-nums">{formatPrice(month.totalPaid)}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted">Balance</span>
                      <span className={`tabular-nums ${month.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPrice(month.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-muted">Payments</span><span>{month.paymentCount}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={showPaymentHistory}
        onClose={() => {
          setShowPaymentHistory(false)
          setPaymentHistory([])
          setHistoryEmployeeName('')
        }}
        title={`Payment history — ${historyEmployeeName}`}
        description="Complete payment records"
        width="xl"
      >
        {modalLoading ? (
          <div className="py-12 text-center text-sm text-muted">Loading payment history…</div>
        ) : paymentHistory.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted" />
            <h4 className="text-base font-semibold text-gray-900">No payment history</h4>
            <p className="mt-1 text-sm text-muted">
              No salary payments have been recorded for this employee yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-card-border bg-surface p-4 md:grid-cols-2">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted">Total payments</div>
                <div className="text-xl font-bold text-gray-900 tabular-nums">{paymentHistory.length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted">Total amount</div>
                <div className="text-xl font-bold text-green-600 tabular-nums">
                  {formatPrice(paymentHistory.reduce((s, p) => s + p.amount, 0))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-card-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-base font-semibold text-green-600 tabular-nums">
                          {formatPrice(payment.amount)}
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(payment.year, payment.month - 1).toLocaleString('default', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {payment.notes && <div className="mb-1 text-sm text-gray-700">{payment.notes}</div>}
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {new Date(payment.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted">Payment #{payment.id.slice(-8)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
