import type { ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  /** Height of spinner indicator in pixels */
  indicatorHeight?: number;
}

/**
 * PullToRefresh wrapper component.
 * Attaches touch gesture to its child container and shows a simple spinner
 * when pulling. Expects a single scrollable child.
 */
export function PullToRefresh({
  children,
  onRefresh,
  indicatorHeight = 60,
}: PullToRefreshProps) {
  return (
    <PullToRefreshRoot onRefresh={onRefresh} indicatorHeight={indicatorHeight}>
      {(ref, isPulling) => (
        <div ref={ref} className="relative overflow-auto">
          {isPulling && (
            <div
              className="flex items-center justify-center"
              style={{ height: indicatorHeight }}
            >
              <svg
                className="animate-spin size-6 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          {children}
        </div>
      )}
    </PullToRefreshRoot>
  );
}

// Internal component using the hook
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

interface PullToRefreshRootProps {
  children: (ref: (el: HTMLDivElement | null) => void, isPulling: boolean) => ReactNode;
  onRefresh: () => Promise<void> | void;
  indicatorHeight?: number;
}

function PullToRefreshRoot({
  children,
  onRefresh,
}: PullToRefreshRootProps) {
  const { containerRef, isPulling } = usePullToRefresh({ onRefresh });

  // Expose ref setter to children using callback ref pattern
  const setRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return <>{children(setRef, isPulling)}</>;
}
