import { useState, useRef } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

export function StickyNavWrapper({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const diff = y - lastY.current;
    if (y < 80) setHidden(false);
    else if (diff > 4) setHidden(true);
    else if (diff < -4) setHidden(false);
    lastY.current = y;
  });

  return (
    <motion.div
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: "sticky", top: 0, zIndex: 100 }}
    >
      {children}
    </motion.div>
  );
}