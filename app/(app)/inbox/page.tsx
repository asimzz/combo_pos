import { InboxView } from '@/components/inbox/inbox-view'

export default function InboxPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="mt-1 text-sm text-muted">
            WhatsApp conversations with customers. Toggle auto-reply off to take
            over manually.
          </p>
        </div>

        <InboxView />
      </div>
    </div>
  )
}
