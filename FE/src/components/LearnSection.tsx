import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { useIsMobile } from "../hooks/useMediaQuery";

export type StitchFillState = "unfilled" | "filled";

// ── Image ─────────────────────────────────────────────────────────────────────

const LESSON_IMG = "https://images.unsplash.com/photo-1628759213613-40de37caaf32?auto=format&fit=crop&w=900&q=80";

// ═══════════════════════════════════════════════════════════════════
// STITCH-LOOP ICONS  (6 unique motifs, two states each)
// ═══════════════════════════════════════════════════════════════════

interface StitchIconProps {
  filled?: boolean;
  size?: number;
  primaryColor?: string;
  bgColor?: string;
}

// Shared token shortcuts
const T = {
  stroke:       "var(--foreground-muted)",
  strokeFilled: "none",
  fill:         "none",
  fillFilled:   "var(--primary)",
  sw:           1.9,
};

// Icon 1 — Ring Stitch (donut, evenodd hole)
export function StitchRing({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Ring stitch">
      {/* Outer glow only when filled */}
      {f && <circle cx="24" cy="24" r="17" fill="var(--accent-pink)" fillOpacity="0.35" />}
      {/* Donut shape via evenodd */}
      <path
        fillRule="evenodd"
        d="M9,24 A15,15 0 1,0 39,24 A15,15 0 1,0 9,24 Z M17,24 A7,7 0 1,0 31,24 A7,7 0 1,0 17,24 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      {/* Inner detail dot when filled */}
      {f && <circle cx="24" cy="24" r="2.5" fill="var(--background)" fillOpacity="0.55" />}
    </svg>
  );
}

// Icon 2 — Arch Stitch (garter arch / rainbow)
export function StitchArch({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Arch stitch">
      {f && <path d="M7,39 C7,20 14,8 24,8 C34,8 41,20 41,39 Z" fill="var(--accent-yellow)" fillOpacity="0.45" />}
      {/* Thick C-arch: outer arch minus inner arch */}
      <path
        fillRule="evenodd"
        d="M6,39 L10,39 C10,23 16,11 24,11 C32,11 38,23 38,39 L42,39 C42,21 34,7 24,7 C14,7 6,21 6,39 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      {/* Baseline crossbar */}
      <rect
        x={f ? 6 : 7} y={f ? 37 : 37}
        width={f ? 36 : 34} height={f ? 4 : 3}
        rx="1.5"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
    </svg>
  );
}

// Icon 3 — Double Loop (figure-8, vertical)
export function StitchFigureEight({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  // Upper oval: cx=24 cy=16 rx=10 ry=9
  // Lower oval: cx=24 cy=33 rx=10 ry=9
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Figure-eight stitch">
      {f && <>
        <ellipse cx="24" cy="16" rx="13" ry="11" fill="var(--accent-pink)" fillOpacity="0.3" />
        <ellipse cx="24" cy="33" rx="13" ry="11" fill="var(--accent-yellow)" fillOpacity="0.3" />
      </>}
      <ellipse cx="24" cy="16" rx="10" ry="9"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      <ellipse cx="24" cy="33" rx="10" ry="9"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      {/* Connecting bridge at center */}
      {f && <rect x="18" y="21.5" width="12" height="5" fill={T.fillFilled} />}
      {/* Center divider line when unfilled */}
      {!f && <line x1="14" y1="24.5" x2="34" y2="24.5" stroke={T.stroke} strokeWidth="1.2" strokeDasharray="2.5 2" />}
    </svg>
  );
}

// Icon 4 — Chain Link (two interlocked tilted ovals)
export function StitchChain({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Chain stitch">
      {f && <>
        <ellipse cx="17" cy="22" rx="13" ry="8" transform="rotate(-35,17,22)" fill="var(--accent-pink)" fillOpacity="0.3" />
        <ellipse cx="31" cy="26" rx="13" ry="8" transform="rotate(-35,31,26)" fill="var(--accent-yellow)" fillOpacity="0.3" />
      </>}
      {/* Left link */}
      <ellipse cx="17" cy="22" rx="10" ry="6.5"
        transform="rotate(-35,17,22)"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      {/* Right link */}
      <ellipse cx="31" cy="26" rx="10" ry="6.5"
        transform="rotate(-35,31,26)"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
      />
      {/* Interlock overlay — small overlap zone that needs to be "clipped" visually */}
      {/* In filled state, draw a small bridge piece */}
      {f && (
        <ellipse cx="24" cy="24" rx="5" ry="4"
          transform="rotate(-35,24,24)"
          fill={T.fillFilled}
        />
      )}
    </svg>
  );
}

// Icon 5 — Cable Braid (X-crossing two diagonal bands)
export function StitchCable({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Cable stitch">
      {f && <circle cx="24" cy="24" r="18" fill="var(--accent-pink)" fillOpacity="0.2" />}
      {/* Band ↘ (top-left to bottom-right) */}
      <path
        d="M6,8 C8,12 18,20 22,24 C26,28 36,36 40,40 L38,42 C36,38 26,30 22,26 C18,22 8,14 4,10 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Band ↙ (top-right to bottom-left) */}
      <path
        d="M42,8 C40,12 30,20 26,24 C22,28 12,36 8,40 L10,42 C12,38 22,30 26,26 C30,22 40,14 44,10 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Center knot circle */}
      <circle cx="24" cy="24" r={f ? 5 : 4}
        fill={f ? "var(--background)" : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        fillOpacity={f ? 1 : 0}
      />
    </svg>
  );
}

// Icon 6 — Lace Bloom (4-petal flower)
export function StitchBloom({ filled = false, size = 48 }: StitchIconProps) {
  const f = filled;
  // 4 petals built from pairs of cubic bezier arcs, centered at (24,24)
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Lace bloom stitch">
      {f && <circle cx="24" cy="24" r="18" fill="var(--accent-yellow)" fillOpacity="0.25" />}
      {/* Petal Top */}
      <path
        d="M24,24 C20,20 16,10 24,8 C32,10 28,20 24,24 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Petal Right */}
      <path
        d="M24,24 C28,20 38,16 40,24 C38,32 28,28 24,24 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Petal Bottom */}
      <path
        d="M24,24 C28,28 32,38 24,40 C16,38 20,28 24,24 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Petal Left */}
      <path
        d="M24,24 C20,28 10,32 8,24 C10,16 20,20 24,24 Z"
        fill={f ? T.fillFilled : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        strokeLinejoin="round"
      />
      {/* Center bead */}
      <circle cx="24" cy="24" r={f ? 4 : 3}
        fill={f ? "var(--background)" : T.fill}
        stroke={f ? T.strokeFilled : T.stroke}
        strokeWidth={f ? 0 : T.sw}
        fillOpacity={f ? 0.7 : 0}
      />
    </svg>
  );
}

// Convenience array of all 6 icon components
export const ALL_STITCH_ICONS = [
  { key: "ring",  label: "Ring",     Comp: StitchRing        },
  { key: "arch",  label: "Arch",     Comp: StitchArch        },
  { key: "eight", label: "Fig. 8",   Comp: StitchFigureEight },
  { key: "chain", label: "Chain",    Comp: StitchChain       },
  { key: "cable", label: "Cable",    Comp: StitchCable       },
  { key: "bloom", label: "Bloom",    Comp: StitchBloom       },
];

// ── Icon row (one state) ──────────────────────────────────────────────────────

export function StitchIconRow({
  filled = false,
  size = 52,
  showLabel = true,
}: {
  filled?: boolean;
  size?: number;
  showLabel?: boolean;
}) {
  return (
    <motion.div
      variants={stitchContainerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap" as const }}
    >
      {ALL_STITCH_ICONS.map(({ key, label, Comp }) => (
        <motion.div
          key={key}
          variants={stitchItemVariants}
          whileHover={{ scale: 1.08 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
        >
          <div
            style={{
              width: size + 16,
              height: size + 16,
              borderRadius: "14px",
              background: filled ? "var(--primary)" : "var(--surface)",
              border: `1.5px solid ${filled ? "var(--primary-hover)" : "var(--border)"}`,
              boxShadow: filled ? "var(--shadow-md)" : "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s",
            }}
          >
            <Comp filled={filled} size={size} />
          </div>
          {showLabel && (
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "0.72rem",
                color: filled ? "var(--primary)" : "var(--foreground-muted)",
                letterSpacing: "0.04em",
                fontWeight: filled ? 600 : 400,
              }}
            >
              {label}
            </span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Stitch icon variants ──────────────────────────────────────────────────────

const stitchContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const stitchItemVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -15 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 12 } },
};

// ═══════════════════════════════════════════════════════════════════
// CHECKLIST
// ═══════════════════════════════════════════════════════════════════

function CheckItem({ title, detail }: { title: string; detail?: string }) {
  return (
    <motion.div
      variants={checkItemVariants}
      style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
    >
      {/* Check blob */}
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "var(--accent-pink)",
          border: "1.5px solid var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
          <path d="M1.5 4.5L4 7L9.5 1" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--foreground)",
            lineHeight: 1.5,
          }}
        >
          {title}
        </span>
        {detail && (
          <span
            style={{
              display: "block",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              color: "var(--foreground-muted)",
              marginTop: "1px",
              lineHeight: 1.4,
            }}
          >
            {detail}
          </span>
        )}
      </div>
    </motion.div>
  );
}

const checkItemVariants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ═══════════════════════════════════════════════════════════════════
// RIBBON-BOOKMARK TESTIMONIAL CARD
// ═══════════════════════════════════════════════════════════════════

export function RibbonTestimonialCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -4 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: 0.5, type: "spring", bounce: 0.35 }}
      style={{ position: "relative", width: "100%", maxWidth: "280px" }}
    >
      {/* SVG bookmark shape as the card background */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
        viewBox="0 0 280 320"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Drop shadow filter */}
        <defs>
          <filter id="bookmark-shadow" x="-10%" y="-5%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(58,42,77,0.14)" />
          </filter>
        </defs>
        {/* Bookmark shape — rounded top, pointed bottom */}
        <path
          d="M10,0 H270 Q280,0 280,10 V280 L140,318 L0,280 V10 Q0,0 10,0 Z"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="1.5"
          filter="url(#bookmark-shadow)"
        />
        {/* Decorative top rule */}
        <line x1="24" y1="44" x2="256" y2="44" stroke="var(--border)" strokeWidth="1" />
        {/* Accent stripe at top */}
        <rect x="0" y="0" width="280" height="6" rx="0"
          fill="var(--primary)" fillOpacity="0.6"
          clipPath="inset(0 0 0 0 round 10px 10px 0 0)"
        />
      </svg>

      {/* Content sits on top */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "22px 22px 52px",
        }}
      >
        {/* Top row: star + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
          <div style={{ display: "flex", gap: "2px" }}>
            {[1,2,3,4,5].map((s) => (
              <svg key={s} width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1L6.7 4.1H10L7.4 6.1L8.4 9.2L5.5 7.4L2.6 9.2L3.6 6.1L1 4.1H4.3Z"
                  fill="var(--rating-star)" />
              </svg>
            ))}
          </div>
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.72rem",
              color: "var(--foreground-muted)",
              letterSpacing: "0.04em",
            }}
          >
            Verified learner
          </span>
        </div>

        {/* Opening quote mark — Playfair Display, oversized */}
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "3.6rem",
            lineHeight: 0.7,
            color: "var(--primary)",
            opacity: 0.25,
            marginBottom: "4px",
            userSelect: "none",
          }}
          aria-hidden
        >
          "
        </div>

        {/* Quote body */}
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "0.92rem",
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--foreground)",
            lineHeight: 1.65,
            marginBottom: "18px",
          }}
        >
          I picked up knitting in a single weekend. The material tags{" "}
          <span style={{ color: "var(--primary)", fontWeight: 500 }}>
            made all the difference
          </span>{" "}
          — I never lost my place in a lesson.
        </p>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, var(--primary) 0%, var(--accent-pink) 60%, transparent 100%)",
            opacity: 0.4,
            marginBottom: "14px",
          }}
        />

        {/* Signature row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar blob */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-pink), var(--primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--background)",
              }}
            >
              A
            </span>
          </div>

          <div>
            {/* Signature in Caveat — the key accent */}
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--primary)",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              — Amelia R.
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.62rem",
                color: "var(--foreground-muted)",
                marginTop: "1px",
              }}
            >
              Beginner · 3 courses completed
            </div>
          </div>
        </div>

        {/* Little yarn-ball flourish near the tail */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            right: "22px",
            opacity: 0.4,
          }}
          aria-hidden
        >
          <StitchBloom filled size={20} />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATED STITCH ROW  — fills icons on viewport enter with stagger
// ═══════════════════════════════════════════════════════════════════

function ViewFillIcon({ Comp, label, delay }: { Comp: React.ComponentType<StitchIconProps>; label: string; delay: number }) {
  const [filled, setFilled] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <motion.div
        onViewportEnter={() => setTimeout(() => setFilled(true), delay * 1000)}
        viewport={{ once: true, amount: 0.6 }}
        style={{
          width: "60px", height: "60px", borderRadius: "14px",
          background: filled ? "var(--primary)" : "var(--surface)",
          border: `1.5px solid ${filled ? "var(--primary-hover)" : "var(--border)"}`,
          boxShadow: filled ? "var(--shadow-md)" : "var(--shadow-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <Comp filled={filled} size={44} />
      </motion.div>
      <span style={{
        fontFamily: "'Caveat', cursive", fontSize: "0.72rem",
        color: filled ? "var(--primary)" : "var(--foreground-muted)",
      }}>
        {label}
      </span>
    </div>
  );
}

function AnimatedStitchRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap" as const }}>
      {ALL_STITCH_ICONS.map(({ key, label, Comp }, i) => (
        <ViewFillIcon key={key} Comp={Comp} label={label} delay={i * 0.1} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL LEARN SECTION
// ═══════════════════════════════════════════════════════════════════

// ── Shared variants ───────────────────────────────────────────────────────────

const leftColVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const leftColItem = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function LearnSection() {
  const isMobile = useIsMobile();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-16 sm:px-8"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "340px", height: "260px", top: "40%", left: "38%", borderRadius: "50%", background: "radial-gradient(ellipse, var(--glow-primary) 0%, transparent 70%)", filter: "blur(52px)" }} />
        {/* Fiber texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%236B3FA0' fill-opacity='0.028'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23F0C4E0' fill-opacity='0.022'/%3E%3C/svg%3E")` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── 2-col → 1-col trên mobile ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
          style={{ alignItems: "start", marginBottom: "5rem" }}
        >
          {/* ── LEFT: text column ── */}
          <motion.div
            variants={leftColVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            style={{ paddingTop: "8px" }}
          >
            {/* Eyebrow */}
            <motion.div
              variants={leftColItem}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 14px",
                borderRadius: "999px",
                background: "var(--accent-pink)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "20px",
              }}
            >
              <StitchBloom filled size={14} />
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                  letterSpacing: "0.04em",
                }}
              >
                Xây dựng kỹ năng · Mùa 2025
              </span>
            </motion.div>

            {/* Headline */}
              <motion.h2
                variants={leftColItem}
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(1.9rem, 2.8vw, 2.9rem)",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.12,
                  marginBottom: "20px",
                }}
              >
                Thành thạo mọi mũi móc,{" "}
                <span style={{ fontStyle: "italic", color: "var(--primary)" }}>
                  một bài học
                </span>{" "}
                mỗi lần,
              </motion.h2>

            {/* Checklist */}
            <motion.div
              variants={leftColVariants}
              style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}
            >
              <CheckItem
                title="Người mới · Trung cấp · Nâng cao"
                detail="Lộ trình có cấu trúc cho mọi trình độ — bắt đầu từ bất kỳ đâu."
              />
              <CheckItem
                title="Video bài học từ người làm thực thụ"
                detail="Những người làm thủ công thực tế, quay trong xưởng của họ. Không phong cách giảng đường."
              />
              <CheckItem
                title="Nguyên liệu được gắn thẻ theo thời gian"
                detail="Nhấn vào bất kỳ thẻ nào giữa bài học để thêm trực tiếp vào giỏ hàng."
              />
            </motion.div>

            {/* CTA */}
            <motion.a
              variants={leftColItem}
              href="#"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.85rem 2rem",
                borderRadius: "999px",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.92rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                boxShadow: "var(--shadow-md)",
                textDecoration: "none",
              }}
            >
              Duyệt khóa học
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.a>

            {/* Micro stat row */}
            <motion.div
              variants={leftColItem}
              style={{ display: "flex", gap: "24px", marginTop: "22px" }}
            >
                {[
                  { n: "48+", label: "khóa học" },
                  { n: "4.9",  label: "đánh giá TB" },
                  { n: "12k",  label: "học viên" },
                ].map(({ n, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {n}
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "var(--foreground-muted)", marginTop: "2px" }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: image + testimonial ── */}
          <div style={{ position: "relative" }}>
            {/* Lesson image */}
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              style={{
                borderRadius: "22px",
                overflow: "hidden",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border)",
                aspectRatio: "4/3",
                position: "relative",
              }}
            >
              <ImageWithFallback
                src={LESSON_IMG}
                alt="Knit socks beside a wooden box — warm atelier aesthetic"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
              />
              {/* Warm vignette */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(240,196,224,0.12) 0%, transparent 60%, rgba(58,42,77,0.18) 100%)",
                  pointerEvents: "none",
                }}
              />
              {/* "Now playing" pill */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "var(--bg-overlay-88)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Pulsing dot */}
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--destructive)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "var(--foreground)" }}>
                  Bài 4 · Móc lỗ tạm
                </span>
              </motion.div>

              {/* Material tag chip inside image */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 11px",
                  borderRadius: "999px",
                  background: "rgba(107,63,160,0.88)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" fill="var(--accent-pink)" stroke="white" strokeWidth="0.8"/>
                </svg>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.62rem", fontWeight: 600, color: "white" }}>
                  Sợi Merino · đã gắn thẻ
                </span>
              </motion.div>
            </motion.div>

            {/* Ribbon-bookmark testimonial card — overlaps image bottom-left on desktop, flows naturally on mobile */}
            <div
              style={
                isMobile
                  ? { position: "static", marginTop: "20px", zIndex: 10 }
                  : { position: "absolute", bottom: "-28px", left: "-28px", zIndex: 10 }
              }
            >
              <RibbonTestimonialCard />
            </div>

            {/* Decorative dot cluster — top-right, hidden on mobile to reduce clutter */}
            {!isMobile && (
              <svg
                width="48" height="48" viewBox="0 0 48 48" fill="none"
                style={{ position: "absolute", top: "-18px", right: "-14px", opacity: 0.65, zIndex: 0 }}
                aria-hidden
              >
                {[4,16,28,40].flatMap((cx) =>
                  [4,16,28,40].map((cy) => (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx} cy={cy} r="2.2"
                      fill={((cx + cy) / 12) % 2 === 0 ? "var(--accent-pink)" : "var(--primary)"}
                      fillOpacity="0.6"
                    />
                  ))
                )}
              </svg>
            )}
          </div>
        </div>

        {/* ── Stitch icon strip ── */}
        <div>
          <div
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--border), transparent)",
              marginBottom: "36px",
            }}
          />

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "0.88rem",
                color: "var(--foreground-muted)",
                letterSpacing: "0.06em",
              }}
            >
              6 mẫu mũi móc · di chuột để tô màu
            </span>
          </div>

          {/* Animated stitch icon row — fills on viewport enter */}
          <AnimatedStitchRow />
        </div>
      </div>
    </motion.section>
  );
}