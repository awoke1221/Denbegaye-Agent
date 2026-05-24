export function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Titles Skeleton */}
      <div>
        <div className="h-8 w-48 bg-muted rounded-lg mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Description Skeleton */}
      <div>
        <div className="h-8 w-56 bg-muted rounded-lg mb-4 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-muted rounded w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Tags Skeleton */}
      <div>
        <div className="h-8 w-40 bg-muted rounded-lg mb-4 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-24 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
