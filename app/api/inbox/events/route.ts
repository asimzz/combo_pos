import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { agentAuthHeaders, agentBaseUrl } from '@/lib/agent-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const upstreamCtrl = new AbortController()
  req.signal.addEventListener('abort', () => upstreamCtrl.abort())

  const headers = agentAuthHeaders()
  delete headers['content-type']
  headers.accept = 'text/event-stream'

  const upstream = await fetch(`${agentBaseUrl()}/v1/events`, {
    headers,
    signal: upstreamCtrl.signal,
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('upstream error', { status: 502 })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
