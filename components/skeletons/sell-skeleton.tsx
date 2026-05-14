import { Skeleton } from '@/components/ui/skeleton'

export function SellSkeleton() {
  return (
    <div className="h-full bg-surface" role="status" aria-label="Loading menu">
      <div className="flex h-full">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-32 flex-col justify-between rounded-xl border border-card-border bg-white p-3"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-80 xl:w-96 2xl:w-[420px] flex-col shrink-0 border-l border-card-border bg-white">
          <div className="border-b border-card-border px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1 space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t border-card-border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
