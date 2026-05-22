import { User, Category, MenuItem, Order, OrderItem, Payment, SalaryPayment } from '@prisma/client'

export type UserWithOrders = User & {
  orders: Order[]
}

export type MenuItemWithStock = MenuItem & { stock: number | null }

export type CategoryWithItems = Category & {
  items: MenuItemWithStock[]
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
  sides?: string[]
  skewers?: string[]
  skewerDeductions?: Array<{ rawMaterialId: string; amount: number }>
  takeaway?: boolean
  takeawayCharge?: number
  priceAdjustment?: number
  adjustmentReason?: string
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

export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y_FREE'

export type Promotion = {
  id: string
  name: string
  description: string | null
  type: PromotionType
  value: number
  minOrderAmount: number | null
  startTime: string | null
  endTime: string | null
  daysOfWeek: number[]
  buyQuantity: number | null
  getQuantity: number | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = 'CASH' | 'MOMO'
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

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
    phone: string
    role: string
  }
}