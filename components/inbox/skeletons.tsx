import { cn } from '@/lib/utils'

function Bar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-200', className)} />
}

export function ThreadListSkeleton() {
  const widths = ['w-32', 'w-24', 'w-40', 'w-28', 'w-36', 'w-20']
  return (
    <div className="space-y-1 px-2 py-2">
      {widths.map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Bar className={cn('h-3', i % 2 === 0 ? 'w-24' : 'w-20')} />
              <Bar className="h-2 w-8" />
            </div>
            <Bar className={cn('h-2.5', w)} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex justify-start">
        <div className="max-w-[60%] space-y-2 rounded-3xl rounded-bl-md bg-white border border-card-border px-3.5 py-2.5">
          <Bar className="h-3 w-32" />
          <Bar className="h-3 w-24" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[55%] rounded-3xl rounded-br-md bg-primary-50 px-3.5 py-2.5">
          <Bar className="h-3 w-28 bg-primary-100" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] space-y-2 rounded-3xl rounded-bl-md bg-white border border-card-border px-3.5 py-2.5">
          <Bar className="h-3 w-40" />
          <Bar className="h-3 w-36" />
          <Bar className="h-3 w-20" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[40%] rounded-3xl rounded-br-md bg-primary-50 px-3.5 py-2.5">
          <Bar className="h-3 w-20 bg-primary-100" />
        </div>
      </div>
    </div>
  )
}
