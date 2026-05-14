const DEFAULT_BASE = 'http://localhost:8080'

function baseUrl() {
  return process.env.AI_AGENT_BASE_URL ?? DEFAULT_BASE
}

function headers() {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  const key = process.env.AI_AGENT_API_KEY
  if (key) h.authorization = `Bearer ${key}`
  return h
}

export async function agentFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${baseUrl()}${path}`
  return fetch(url, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
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
