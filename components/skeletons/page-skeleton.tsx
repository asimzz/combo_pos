import { Skeleton } from '@/components/ui/skeleton'

type PageSkeletonProps = {
  title?: boolean
  rows?: number
  columns?: number
}

export function PageSkeleton({ title = true, rows = 6, columns = 4 }: PageSkeletonProps) {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8" role="status" aria-label="Loading">
      <div className="mx-auto max-w-7xl">
        {title && (
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-white">
          <div className="grid border-b border-card-border px-5 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          <div className="divide-y divide-card-border">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="grid items-center px-5 py-4"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: columns }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-3/4" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
