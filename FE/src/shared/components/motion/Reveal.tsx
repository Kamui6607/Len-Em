import { motion, useReducedMotion } from "motion/react";

// Trigger once the block's top edge is 15% into the viewport. A ratio-based
// `amount` (e.g. 0.25) can never be reached by sections taller than ~4x the
// screen — common on mobile — leaving them stuck at opacity 0.
const VIEWPORT_MARGIN = "0px 0px -15% 0px";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
};

export function Reveal({
  children,
  delay = 0,
  y = 28,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: "some", margin: VIEWPORT_MARGIN }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  stagger = 0.12,
  className,
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: "some", margin: VIEWPORT_MARGIN }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 20,
}: {
  children: React.ReactNode;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}