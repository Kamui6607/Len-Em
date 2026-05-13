import { cn } from "../../app/components/ui/utils";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent",
        className
      )}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/** Dashboard table skeleton */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <ShimmerBlock key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 p-4 border-b border-border last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <ShimmerBlock
              key={colIdx}
              className={cn(
                "h-4",
                colIdx === 0 ? "w-1/3" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Admin stats card skeleton */
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl p-6 border border-border space-y-4"
        >
          <div className="flex items-center justify-between">
            <ShimmerBlock className="w-12 h-12 rounded-full" />
            <ShimmerBlock className="h-4 w-10" />
          </div>
          <ShimmerBlock className="h-8 w-20" />
          <ShimmerBlock className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}