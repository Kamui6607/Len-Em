import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

/**
 * Hook to implement pull-to-refresh gesture.
 * Should be attached to a scrollable container element.
 *
 * @param onRefresh - Callback to trigger refresh
 * @param threshold - Pull distance threshold (default 80px)
 * @returns Ref to attach to container, plus state (isPulling, pullDistance)
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshProps) {
  const startY = useRef(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRefreshing = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop !== 0) return;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (el.scrollTop !== 0) return;
      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;
      if (delta > 0) {
        setIsPulling(true);
        setPullDistance(delta);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing.current) {
        isRefreshing.current = true;
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
        try {
          await onRefresh();
        } finally {
          isRefreshing.current = false;
        }
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance]);

  return { containerRef, isPulling, pullDistance };
}
