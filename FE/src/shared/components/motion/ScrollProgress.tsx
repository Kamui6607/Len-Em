import { motion, useScroll, useSpring, useTransform } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.3,
  });
  // Fades the leading glow dot out right at the very top/bottom so it
  // doesn't sit awkwardly clipped against the viewport edge
  const dotOpacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);
  // Position the dot at the tip of the bar as it fills across the viewport
  const dotX = useTransform(scaleX, (v) => `calc(${v * 100}vw - 4px)`);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", zIndex: 1000, pointerEvents: "none" }}>
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0% 50%",
          scaleX,
          background: "linear-gradient(90deg, var(--primary), var(--accent-pink))",
        }}
      />
      {/* Leading glow — a small bright pulse riding the tip of the bar,
          nod to a "needle pulling thread" across the page */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--accent-pink)",
          boxShadow: "0 0 8px 2px var(--accent-pink)",
          opacity: dotOpacity,
          x: dotX,
          y: "-50%",
        }}
      />
    </div>
  );
}