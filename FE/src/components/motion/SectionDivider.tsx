import { motion } from "motion/react";

export function SectionDivider({
  accent = "var(--primary)",
}: {
  accent?: string;
}) {
  return (
    <div style={{ position: "relative", height: "1px", overflow: "visible" }}>
      <motion.div
        initial={{ opacity: 0, scaleX: 0.3 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: "120px",
          height: "3px",
          borderRadius: "999px",
          background: accent,
          opacity: 0.5,
        }}
      />
    </div>
  );
}