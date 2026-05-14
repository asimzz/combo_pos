import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8" role="status" aria-label="Loading dashboard">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start justify-between rounded-xl border border-card-border bg-white p-5"
              >
                <div className="min-w-0 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <Skeleton variant="rect" className="h-10 w-10 rounded-lg" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-white">
              <div className="border-b border-card-border px-5 py-4">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="circle" className="h-7 w-7" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-white">
              <div className="border-b border-card-border px-5 py-4">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="divide-y divide-card-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                      <Skeleton className="ml-auto h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
