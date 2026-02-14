import { User, Category, MenuItem, Order, OrderItem, Payment } from '@prisma/client'

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