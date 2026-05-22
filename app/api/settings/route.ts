import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SINGLETON_ID = 'singleton'

const updateSchema = z.object({
  restaurantName: z.string().min(1).optional(),
  tagline: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  feedbackUrl: z.string().optional().nullable(),
  momoMerchantId: z.string().optional().nullable(),
  momoUssdNumber: z.string().optional().nullable(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultServiceCharge: z.number().min(0).optional(),
  receiptFooter: z.string().optional().nullable(),
  showReceiptQR: z.boolean().optional(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const settings = await prisma.businessSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const settings = await prisma.businessSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
