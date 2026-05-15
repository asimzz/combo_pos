import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { agentFetch } from '@/lib/agent-client'

export const dynamic = 'force-dynamic'

const FORWARDED_HEADERS = ['content-type', 'content-length', 'content-disposition', 'cache-control']

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = encodeURIComponent(params.id)
  const upstream = await agentFetch(`/v1/media/${id}`)

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '')
    return new Response(text || 'media not found', {
      status: upstream.status || 502,
    })
  }

  const headers = new Headers()
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new Response(upstream.body, { status: 200, headers })
}
