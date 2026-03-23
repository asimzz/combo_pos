import { User, Category, MenuItem, Order, OrderItem, Payment, SalaryPayment } from '@prisma/client'

export type UserWithOrders = User & {
  orders: Order[]
}

export type CategoryWithItems = Category & {
  items: MenuItem[]
}

export type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    menuItem: MenuItem & {
      category: Category
    }
  })[]
  payments: Payment[]
  user: User
}

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  notes?: string
  menuItemId: string
}

export type OrderSummary = {
  subtotal: number
  taxAmount: number
  serviceCharge: number
  discount: number
  total: number
}

export type DashboardStats = {
  todayOrders: number
  todaySales: number
  weekSales: number
  monthSales: number
  popularItems: {
    name: string
    quantity: number
  }[]
}

export type PaymentMethod = 'CASH' | 'MOMO'
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'

export type UserWithSalaryInfo = User & {
  totalPaid: number
  balance: number
  salaryPayments: SalaryPayment[]
}

export type MonthlySalaryData = {
  month: number
  monthName: string
  monthlySalary: number
  totalPaid: number
  balance: number
  payments: SalaryPayment[]
  paymentCount: number
}

export type SalaryPaymentWithUser = SalaryPayment & {
  user: {
    name: string
    email: string
    role: string
  }
}