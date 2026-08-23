import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 600));

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.08, rotate: -8 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed z-200 flex items-center justify-center border-none cursor-pointer rounded-full"
          style={{
            bottom: "max(80px, env(safe-area-inset-bottom, 80px))",
            right: "max(12px, env(safe-area-inset-right, 12px))",
            width: "clamp(40px, 10vw, 48px)",
            height: "clamp(40px, 10vw, 48px)",
            background: "var(--primary)",
            boxShadow: "0 6px 20px rgba(107,63,160,0.35)",
          }}
          aria-label="Back to top"
        >
          <svg width="clamp(16px, 4vw, 20px)" height="clamp(16px, 4vw, 20px)" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="white"
              fillOpacity="0.15"
              stroke="white"
              strokeWidth="1"
            />
            <path
              d="M6 12L10 7L14 12"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
