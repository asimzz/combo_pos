import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ORD-${timestamp}${random}`
}

export async function generateDailyOrderNumber(prisma: any): Promise<string> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // Use upsert to either create a new counter or increment existing one
    const counter = await prisma.dailyOrderCounter.upsert({
      where: { date: today },
      create: {
        date: today,
        counter: 1
      },
      update: {
        counter: { increment: 1 }
      },
    })

    return counter.counter.toString()
  } catch (error) {
    console.error('Error generating daily order number:', error)
    // Fallback to timestamp-based number if database operation fails
    return Date.now().toString().slice(-6)
  }
}

export function calculateTax(amount: number, taxRate: number = 0.18): number {
  return Math.round(amount * taxRate * 100) / 100
}

export function calculateServiceCharge(amount: number, rate: number = 0.05): number {
  return Math.round(amount * rate * 100) / 100
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getRandomReceiptMessage(): string {
  const messages = [
    'Side effects may include heavy breathing, eye rolling and sudden loyalty.',
    'You will lick your fingers and we respect that.',
    'This will be a toxic relationship. See you tomorrow.',
    'Your mom will never feed you like we do. But don\'t tell her.',
    'If this is your last meal. You chose wisely.'
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}