const DEFAULT_BASE = 'http://localhost:8080'

export function agentBaseUrl(): string {
  return process.env.AI_AGENT_BASE_URL ?? DEFAULT_BASE
}

export function agentAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  const key = process.env.AI_AGENT_API_KEY
  if (key) h.authorization = `Bearer ${key}`
  return h
}

export async function agentFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${agentBaseUrl()}${path}`
  return fetch(url, {
    ...init,
    headers: { ...agentAuthHeaders(), ...(init.headers ?? {}) },
    cache: 'no-store',
  })
}

export async function passthrough(response: Response) {
  const text = await response.text()
  return new Response(text, {
    status: response.status,
    headers: { 'content-type': 'application/json' },
  })
}
