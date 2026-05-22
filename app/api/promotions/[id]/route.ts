import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  active: z.boolean(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = patchSchema.parse(body)
    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(promotion)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticate(request)
  if (auth instanceof NextResponse) return auth

  if (auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.promotion.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
