import { useState, useRef, useEffect, useCallback } from "react";

const HOLD_DURATION = 2000; // 2 seconds

interface HoldToDeleteOptions {
  /** Called when hold completes for immediate delete (no popup needed) */
  onDelete?: () => void;
  /** Called when hold completes for delete that needs a popup/reason */
  onShowPopup?: () => void;
}

interface HoldToDeleteReturn {
  /** Whether currently holding */
  isHolding: boolean;
  /** Progress from 0 to 1 */
  holdProgress: number;
  /** Call on pointer/mouse down to start hold */
  startHold: () => void;
  /** Call on pointer/mouse up to cancel hold */
  cancelHold: () => void;
  /** Call on pointer/mouse leave to cancel hold */
  cancelHoldOnLeave: () => void;
}

export function useHoldToDelete({
  onDelete,
  onShowPopup,
}: HoldToDeleteOptions): HoldToDeleteReturn {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startHold = useCallback(() => {
    clearTimer();
    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        clearTimer();
        setIsHolding(false);
        setHoldProgress(0);
        // If there's a popup callback, show popup; otherwise delete directly
        if (onShowPopup) {
          onShowPopup();
        } else if (onDelete) {
          onDelete();
        }
      }
    }, 50);
  }, [clearTimer, onDelete, onShowPopup]);

  const cancelHold = useCallback(() => {
    clearTimer();
    setIsHolding(false);
    setHoldProgress(0);
  }, [clearTimer]);

  const cancelHoldOnLeave = useCallback(() => {
    cancelHold();
  }, [cancelHold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    isHolding,
    holdProgress,
    startHold,
    cancelHold,
    cancelHoldOnLeave,
  };
}