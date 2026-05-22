// Global set of SSE controllers for the kitchen display.
// Uses a module-level global so it survives Next.js hot-reload in dev.
declare global {
  // eslint-disable-next-line no-var
  var __orderEventControllers: Set<ReadableStreamDefaultController> | undefined
}

function controllers(): Set<ReadableStreamDefaultController> {
  global.__orderEventControllers ??= new Set()
  return global.__orderEventControllers
}

const enc = new TextEncoder()

export function subscribeToOrderEvents(ctrl: ReadableStreamDefaultController): () => void {
  controllers().add(ctrl)
  return () => controllers().delete(ctrl)
}

export function broadcastOrderEvent(type: string, data: unknown): void {
  const msg = enc.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
  for (const ctrl of Array.from(controllers())) {
    try {
      ctrl.enqueue(msg)
    } catch {
      controllers().delete(ctrl)
    }
  }
}
