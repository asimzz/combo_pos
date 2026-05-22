import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  subtotal: z.number().min(0),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
    }),
  ),
})

function rwandaTime(): { hhmm: string; dow: number } {
  const now = new Date()
  const rwandaOffset = 2 * 60
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const localMinutes = (utcMinutes + rwandaOffset) % (24 * 60)
  const h = Math.floor(localMinutes / 60)
  const m = localMinutes % 60
  const hhmm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  const utcDay = now.getUTCDay()
  const crossedMidnight = utcMinutes + rwandaOffset >= 24 * 60
  const dow = crossedMidnight ? (utcDay + 1) % 7 : utcDay
  return { hhmm, dow }
}

function calcDiscount(
  p: {
    type: string
    value: number
    buyQuantity: number | null
    getQuantity: number | null
    applicableItems: { menuItemId: string }[]
  },
  subtotal: number,
  cartItems: { menuItemId: string; quantity: number; unitPrice: number }[],
): number {
  if (p.type === 'PERCENTAGE') return Math.round((subtotal * p.value) / 100)
  if (p.type === 'FIXED_AMOUNT') return p.value

  // BUY_X_GET_Y_FREE
  const buyQty = p.buyQuantity ?? 1
  const freeQty = p.getQuantity ?? 1
  const cycleSize = buyQty + freeQty

  const matchingItems =
    p.applicableItems.length > 0
      ? cartItems.filter((ci) =>
          p.applicableItems.some((ai) => ai.menuItemId === ci.menuItemId),
        )
      : cartItems

  return matchingItems.reduce((total, item) => {
    const freeUnits = Math.floor(item.quantity / cycleSize) * freeQty
    return total + freeUnits * item.unitPrice
  }, 0)
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { subtotal, items } = body
  const itemIds = items.map((i) => i.menuItemId)

  const promotions = await prisma.promotion.findMany({
    where: { active: true },
    include: { applicableItems: { select: { menuItemId: true } } },
  })

  const { hhmm, dow } = rwandaTime()

  const applicable = promotions
    .filter((p) => {
      if (p.minOrderAmount != null && subtotal < p.minOrderAmount) return false
      if (p.startTime && p.endTime && !(hhmm >= p.startTime && hhmm <= p.endTime)) return false
      if (p.daysOfWeek.length > 0 && !p.daysOfWeek.includes(dow)) return false
      if (p.applicableItems.length > 0) {
        const promoItemIds = p.applicableItems.map((ai) => ai.menuItemId)
        if (!itemIds.some((id) => promoItemIds.includes(id))) return false
      }
      return true
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      value: p.value,
      buyQuantity: p.buyQuantity,
      getQuantity: p.getQuantity,
      discountAmount: calcDiscount(p, subtotal, items),
    }))
    .filter((p) => p.discountAmount > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount)

  return NextResponse.json(applicable)
}
