import { cn } from "../../app/components/ui/utils";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent",
        className
      )}
    />
  );
}

/** Single product card skeleton */
export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-2xl overflow-hidden border border-border", className)}>
      <ShimmerBlock className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <ShimmerBlock className="h-4 w-3/4" />
        <ShimmerBlock className="h-3 w-full" />
        <ShimmerBlock className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1.5">
          <ShimmerBlock className="h-5 w-16" />
          <ShimmerBlock className="h-4 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Grid of product skeletons — matching the Shop grid layout */
export function ProductGridSkeleton({
  count = 8,
  columns = 4,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-5 sm:gap-6", gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

/** Single row skeleton for product detail page */
export function ProductDetailSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Image column */}
      <div className="space-y-4">
        <ShimmerBlock className="aspect-square w-full rounded-3xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <ShimmerBlock key={i} className="w-20 h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Info column */}
      <div className="space-y-6">
        <div className="space-y-3">
          <ShimmerBlock className="h-8 w-3/4" />
          <ShimmerBlock className="h-4 w-1/2" />
          <ShimmerBlock className="h-10 w-28" />
        </div>
        <ShimmerBlock className="h-20 w-full" />
        <ShimmerBlock className="h-32 w-full rounded-2xl" />
        <ShimmerBlock className="h-14 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Filter panel skeleton for sidebar */
export function FilterSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <ShimmerBlock className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((item) => (
              <ShimmerBlock key={item} className="h-8 w-12 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}