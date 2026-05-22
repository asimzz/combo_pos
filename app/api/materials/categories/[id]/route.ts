import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entryCount = await prisma.materialEntry.count({
      where: { categoryId: params.id },
    })

    if (entryCount > 0) {
      await prisma.materialCategory.update({
        where: { id: params.id },
        data: { active: false },
      })
    } else {
      await prisma.materialCategory.delete({ where: { id: params.id } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting material category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
