import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticate } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  customerPhone: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['special', 'handoff']),
})

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const ticket = await prisma.specialOrder.create({
      data: {
        customerPhone: data.customerPhone,
        description: data.description,
        type: data.type === 'handoff' ? 'HANDOFF' : 'SPECIAL',
      },
    })

    return NextResponse.json({ id: ticket.id, status: ticket.status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Error creating special order:', error)
    return NextResponse.json(
      { error: 'Failed to create special order' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  const status = request.nextUrl.searchParams.get('status')
  const tickets = await prisma.specialOrder.findMany({
    where: status ? { status: status as 'OPEN' | 'RESOLVED' | 'CANCELLED' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(tickets)
}
