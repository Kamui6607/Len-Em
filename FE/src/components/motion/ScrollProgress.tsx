import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.3,
  });

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        transformOrigin: "0% 50%",
        scaleX,
        background: "linear-gradient(90deg, var(--primary), var(--accent-pink))",
        zIndex: 1000,
      }}
    />
  );
}