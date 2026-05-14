import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { agentFetch, passthrough } from '@/lib/agent-client'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { phone: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const phone = encodeURIComponent(params.phone)
  const upstream = await agentFetch(`/v1/conversations/${phone}/read`, {
    method: 'POST',
  })
  return passthrough(upstream)
}
