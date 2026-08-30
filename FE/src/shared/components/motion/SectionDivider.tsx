import { motion, useReducedMotion } from "motion/react";

export function SectionDivider({
  accent = "var(--primary)",
}: {
  accent?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: "1px",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      {/* Soft ambient glow behind the line — gives the seam some depth
          instead of a flat hairline, reads well on both themes and over
          the animated background since it's just a low-opacity radial */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1 }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "220px",
          height: "60px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${accent} 0%, transparent 70%)`,
          opacity: 0.16,
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      {/* Gradient-fade line — fades to transparent at both ends instead of
          a hard-edged bar, feels more hand-drawn / less "template" */}
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
          width: "140px",
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.55,
        }}
      />

      {/* Center ornament — a tiny stitched "spark". Sits on a small glass
          backing (blur, not a solid color) instead of a hard var(--background)
          ring, since sections no longer guarantee an opaque backdrop —
          this keeps the dot crisp over the animated background too. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-9px",
            borderRadius: "50%",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            background: "color-mix(in srgb, var(--background) 35%, transparent)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 10px 2px ${accent}`,
            opacity: 0.9,
          }}
        />
        {!reduce && (
          <motion.div
            aria-hidden="true"
            animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              border: `1px solid ${accent}`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}