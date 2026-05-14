import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export const AGENT_USER_PHONE = '__ai_agent__'
export const AGENT_USER_NAME = 'AI Agent'

export type AuthOk =
  | { kind: 'session'; userId: string; userName: string; role: string }
  | { kind: 'api-key'; userId: string; userName: string; role: 'ADMIN' }

export async function authenticate(
  req: NextRequest,
): Promise<AuthOk | NextResponse> {
  const header = req.headers.get('authorization') ?? ''
  const bearer = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null
  const apiKey = process.env.COMBO_POS_API_KEY

  if (bearer && apiKey && bearer === apiKey) {
    const agent = await ensureAgentUser()
    return {
      kind: 'api-key',
      userId: agent.id,
      userName: agent.name,
      role: 'ADMIN',
    }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return {
    kind: 'session',
    userId: session.user.id,
    userName: session.user.name ?? '',
    role: (session.user as { role?: string }).role ?? 'STAFF',
  }
}

async function ensureAgentUser() {
  const existing = await prisma.user.findUnique({
    where: { phone: AGENT_USER_PHONE },
  })
  if (existing) return existing
  return prisma.user.create({
    data: {
      phone: AGENT_USER_PHONE,
      name: AGENT_USER_NAME,
      password: '!disabled!',
      role: 'ADMIN',
      active: true,
    },
  })
}
