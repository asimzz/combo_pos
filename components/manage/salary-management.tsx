"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DollarSign,
  Plus,
  User,
  Calendar,
  Eye,
  Edit3,
  Check,
  X,
  History,
  FileText,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  monthlySalary: number;
  salaryDueDay: number;
  dueDate: string;
  totalPaid: number;
  balance: number;
  payments: SalaryPayment[];
}

interface SalaryPayment {
  id: string;
  amount: number;
  month: number;
  year: number;
  notes: string | null;
  createdAt: string;
}

interface EmployeeDetail {
  employee: Employee;
  year: number;
  monthlySummaries: MonthlySummary[];
  yearlyTotals: {
    totalSalary: number;
    totalPaid: number;
    balance: number;
  };
}

interface MonthlySummary {
  month: number;
  monthName: string;
  monthlySalary: number;
  totalPaid: number;
  balance: number;
  payments: SalaryPayment[];
  paymentCount: number;
}

export default function SalaryManagement() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    userId: "",
    amount: "",
    notes: "",
  });
  const [editingSalary, setEditingSalary] = useState<{
    [key: string]: boolean;
  }>({});
  const [salaryInputs, setSalaryInputs] = useState<{ [key: string]: string }>(
    {},
  );
  const [dueDayInputs, setDueDayInputs] = useState<{ [key: string]: string }>(
    {},
  );
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<SalaryPayment[]>([]);
  const [historyEmployeeName, setHistoryEmployeeName] = useState("");

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchEmployees();
    }
  }, [session]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/salaries");
      if (!response.ok) throw new Error("Failed to fetch employees");

      const data = await response.json();
      setEmployees(data.employees);
      setCurrentMonth(data.currentMonth);
      setCurrentYear(data.currentYear);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employee data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalary = async (userId: string, newSalary: number) => {
    try {
      const dueDay = dueDayInputs[userId]
        ? parseInt(dueDayInputs[userId])
        : undefined;

      const response = await fetch("/api/salaries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          monthlySalary: newSalary,
          ...(dueDay && { salaryDueDay: dueDay }),
        }),
      });

      if (!response.ok) throw new Error("Failed to update salary");

      toast.success("Salary updated successfully");
      setEditingSalary((prev) => ({ ...prev, [userId]: false }));
      setSalaryInputs((prev) => ({ ...prev, [userId]: "" }));
      await fetchEmployees();
    } catch (error) {
      console.error("Error updating salary:", error);
      toast.error("Failed to update salary");
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentForm.userId || !paymentForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/salaries/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: paymentForm.userId,
          amount: parseFloat(paymentForm.amount),
          notes: paymentForm.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully");
      setShowPaymentModal(false);
      setPaymentForm({ userId: "", amount: "", notes: "" });
      await fetchEmployees();

      // Refresh selected employee detail if viewing
      if (
        selectedEmployee &&
        selectedEmployee.employee.id === paymentForm.userId
      ) {
        await fetchEmployeeDetail(paymentForm.userId);
      }
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDetail = async (userId: string) => {
    try {
      setSelectedEmployee(null);
      setModalLoading(true);
      const response = await fetch(
        `/api/salaries/${userId}?year=${currentYear}`,
      );
      if (!response.ok) throw new Error("Failed to fetch employee details");

      const data = await response.json();
      setSelectedEmployee(data);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details");
    } finally {
      setModalLoading(false);
    }
  };

  const startEditSalary = (userId: string, currentSalary: number) => {
    setEditingSalary((prev) => ({ ...prev, [userId]: true }));
    setSalaryInputs((prev) => ({
      ...prev,
      [userId]: currentSalary.toString(),
    }));
  };

  const cancelEditSalary = (userId: string) => {
    setEditingSalary((prev) => ({ ...prev, [userId]: false }));
    setSalaryInputs((prev) => ({ ...prev, [userId]: "" }));
  };

  const confirmEditSalary = (userId: string) => {
    const newSalary = parseFloat(salaryInputs[userId]);
    if (isNaN(newSalary) || newSalary < 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }
    handleUpdateSalary(userId, newSalary);
  };

  const fetchPaymentHistory = async (userId: string, employeeName: string) => {
    try {
      setHistoryEmployeeName(employeeName);
      setShowPaymentHistory(true);
      setModalLoading(true);
      const response = await fetch(`/api/salaries/payments?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch payment history");

      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to fetch payment history");
    } finally {
      setModalLoading(false);
    }
  };

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-600">Access Denied</h2>
        <p className="text-gray-500">
          Only administrators can access salary management.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Employee Salary Management
          </h3>
          <p className="text-sm text-gray-600">
            Manage employee salaries and track payments for{" "}
            {new Date(currentYear, currentMonth - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="btn btn-primary px-4 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Employees Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h4 className="text-base font-medium text-gray-900">
            Current Month Salary Overview
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : employee.role === "MANAGER"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalary[employee.id] ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={salaryInputs[employee.id] || ""}
                            onChange={(e) =>
                              setSalaryInputs((prev) => ({
                                ...prev,
                                [employee.id]: e.target.value,
                              }))
                            }
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => confirmEditSalary(employee.id)}
                            className="btn btn-primary btn-sm"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => cancelEditSalary(employee.id)}
                            className="btn btn-outline btn-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">
                            {formatPrice(employee.monthlySalary)}
                          </span>
                          <button
                            onClick={() =>
                              startEditSalary(
                                employee.id,
                                employee.monthlySalary,
                              )
                            }
                            className="btn btn-outline btn-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(employee.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          employee.balance > 0
                            ? "text-red-600"
                            : employee.balance === 0
                              ? "text-green-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {formatPrice(employee.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSalary[employee.id] ? (
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={dueDayInputs[employee.id] || employee.salaryDueDay || 1}
                          onChange={(e) =>
                            setDueDayInputs((prev) => ({
                              ...prev,
                              [employee.id]: e.target.value,
                            }))
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div>
                          <div className={`text-sm font-medium ${
                            new Date(employee.dueDate) < new Date() && employee.balance > 0
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {new Date(employee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500">Day {employee.salaryDueDay} of month</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setPaymentForm({
                              ...paymentForm,
                              userId: employee.id,
                            });
                            setShowPaymentModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                          title="Add Payment"
                        >
                          <DollarSign className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => fetchEmployeeDetail(employee.id)}
                          className="btn btn-outline btn-sm"
                          title="View Summary"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => fetchPaymentHistory(employee.id, employee.name)}
                          className="btn btn-secondary btn-sm"
                          title="Payment History"
                        >
                          <History className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleAddPayment}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Record Salary Payment
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={paymentForm.userId}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, userId: e.target.value })
                    }
                    className="input w-full"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({formatPrice(employee.balance)}{" "}
                        remaining)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount (RWF)
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    className="input w-full"
                    placeholder="Enter amount"
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    className="input w-full"
                    placeholder="Payment notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({ userId: "", amount: "", notes: "" });
                  }}
                  className="btn btn-outline btn-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={loading}
                >
                  {loading ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {(selectedEmployee || modalLoading) && !showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEmployee ? `Salary Details - ${selectedEmployee.employee.name}` : 'Loading...'}
                </h3>
                <button
                  onClick={() => { setSelectedEmployee(null); setModalLoading(false); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {modalLoading && !selectedEmployee ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading details...</p>
              </div>
            ) : selectedEmployee && (
            <div className="px-6 py-4">
              {/* Yearly Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Year {selectedEmployee.year} Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Salary:</span>
                    <div className="font-semibold">
                      {formatPrice(selectedEmployee.yearlyTotals.totalSalary)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <div className="font-semibold text-green-600">
                      {formatPrice(selectedEmployee.yearlyTotals.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance:</span>
                    <div
                      className={`font-semibold ${selectedEmployee.yearlyTotals.balance > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatPrice(selectedEmployee.yearlyTotals.balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedEmployee.monthlySummaries.map((month) => (
                  <div
                    key={month.month}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h5 className="font-semibold text-gray-900 mb-2">
                      {month.monthName}
                      {month.month === currentMonth && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salary:</span>
                        <span>{formatPrice(month.monthlySalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid:</span>
                        <span className="text-green-600">
                          {formatPrice(month.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span
                          className={
                            month.balance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {formatPrice(month.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payments:</span>
                        <span>{month.paymentCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Payment History - {historyEmployeeName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete payment records for this employee
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentHistory(false);
                    setPaymentHistory([]);
                    setHistoryEmployeeName("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              {modalLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading payment history...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h4>
                  <p>No salary payments have been recorded for this employee yet.</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Payments</div>
                      <div className="text-xl font-bold text-gray-900">
                        {paymentHistory.length}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(
                          paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment List */}
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-lg font-semibold text-green-600">
                                {formatPrice(payment.amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(payment.year, payment.month - 1).toLocaleString('default', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>

                            {payment.notes && (
                              <div className="mb-2 text-sm text-gray-600">
                                {payment.notes}
                              </div>
                            )}

                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(payment.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(payment.year, payment.month - 1).toLocaleString('default', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              Payment #{payment.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowPaymentHistory(false);
                  setPaymentHistory([]);
                  setHistoryEmployeeName("");
                }}
                className="btn btn-outline btn-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
