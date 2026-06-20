export function MobileProductSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card overflow-hidden">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MobileProductSkeleton key={i} />
      ))}
    </div>
  );
}
