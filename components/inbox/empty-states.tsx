import { MessageSquare, SearchX } from 'lucide-react'
import { WhatsAppIcon } from './channel-badge'

export function EmptyConversations() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#25D366]">
        <WhatsAppIcon className="h-6 w-6" />
      </span>
      <p className="mt-1 text-sm font-medium text-gray-700">No conversations yet</p>
      <p className="text-xs text-muted">
        When customers message on WhatsApp, they&apos;ll show up here.
      </p>
    </div>
  )
}

export function NoSearchResults() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <SearchX className="h-8 w-8 text-gray-300" />
      <p className="text-sm font-medium text-gray-500">No matches</p>
      <p className="text-xs text-muted">Try a different filter or search term.</p>
    </div>
  )
}

export function NoConversationSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <MessageSquare className="h-10 w-10 text-gray-300" />
      <p className="mt-1 text-sm font-medium text-gray-500">Select a conversation</p>
      <p className="text-xs text-muted">Pick a chat on the left to view messages.</p>
    </div>
  )
}

export function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <MessageSquare className="h-8 w-8 text-gray-300" />
      <p className="text-sm text-muted">No messages yet. Send the first reply below.</p>
    </div>
  )
}
