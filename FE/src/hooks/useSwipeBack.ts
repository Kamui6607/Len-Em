import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

/**
 * Hook to enable swipe-back gesture navigation on mobile.
 * Detects touch starting within left edge (default 30px) and triggers navigate(-1)
 * when swipe distance exceeds threshold (default 80px).
 *
 * @param enabled - Whether gesture is enabled (default true)
 */
export function useSwipeBack(enabled: boolean = true) {
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);
  const [lastTrigger, setLastTrigger] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // Only on mobile
    if (window.innerWidth >= 768) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0].clientX > 30) return; // Only left edge
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      const deltaX = e.touches[0].clientX - startX.current;
      if (deltaX > 80) {
        // Debounce: prevent multiple triggers within 300ms
        const now = Date.now();
        if (now - lastTrigger > 300) {
          isSwiping.current = false;
          setLastTrigger(now);
          navigate(-1);
        }
      }
    };

    const handleTouchEnd = () => {
      isSwiping.current = false;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, enabled, lastTrigger]);
}
