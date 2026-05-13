import { cn } from "./ui/utils";

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted rounded-xl",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
    />
  );
}

export function SkeletonCard({ count = 1, className }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-card rounded-2xl overflow-hidden border border-border",
            className
          )}
        >
          {/* Image placeholder */}
          <Shimmer className="aspect-square w-full rounded-none" />

          {/* Content */}
          <div className="p-4 space-y-3">
            <Shimmer className="h-4 w-3/4 rounded-md" />
            <Shimmer className="h-3 w-full rounded-md" />
            <Shimmer className="h-3 w-2/3 rounded-md" />

            <div className="flex items-center justify-between pt-2">
              <Shimmer className="h-5 w-16 rounded-md" />
              <Shimmer className="h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      <SkeletonCard count={count} />
    </div>
  );
}