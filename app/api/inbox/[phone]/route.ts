import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { agentFetch, passthrough } from '@/lib/agent-client'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const phone = encodeURIComponent(params.phone)
  const upstream = await agentFetch(`/v1/conversations/${phone}/messages`)
  return passthrough(upstream)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { phone: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const text = typeof body?.text === 'string' ? body.text : ''
  if (!text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }
  const phone = encodeURIComponent(params.phone)
  const upstream = await agentFetch(`/v1/conversations/${phone}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      staff_name: session.user.name ?? null,
    }),
  })
  return passthrough(upstream)
}
