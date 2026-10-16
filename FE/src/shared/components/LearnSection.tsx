import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useLanguage } from "../contexts/LanguageContext";
import { Link } from "react-router";

const MotionLink = motion.create(Link);

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

// Yarn-stroke style: every motif is drawn as continuous rounded strokes, like
// a crochet chart symbol. Idle = muted pencil line; filled = primary yarn with
// soft accent tints. Strokes "draw themselves" on mount, so re-mounting an
// icon (see ViewFillIcon hover) replays the stitch being made.
const SW = 2.4;
const draw = (delay = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    pathLength: { duration: 0.7, delay, ease: [0.65, 0, 0.35, 1] },
    opacity: { duration: 0.1, delay },
  },
});

function stitchTone(filled: boolean) {
  return {
    line: filled ? "var(--primary)" : "var(--foreground-muted)",
    tintA: filled ? "color-mix(in srgb, var(--accent-pink) 55%, transparent)" : "none",
    tintB: filled ? "color-mix(in srgb, var(--accent-yellow) 70%, transparent)" : "none",
  };
}

function StitchSvg({ size, label, children }: { size: number; label: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

// Icon 1 — Vòng: magic ring — yarn wrapped twice, both tails crossing below
export function StitchRing({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  return (
    <StitchSvg size={size} label="Ring stitch">
      <circle cx="24" cy="20" r="9" fill={c.tintB} />
      <motion.circle cx="24" cy="20" r="12" stroke={c.line} strokeWidth={SW} {...draw()} />
      <motion.ellipse cx="25" cy="19" rx="8.5" ry="8" stroke={c.line} strokeWidth={SW - 0.6} opacity={0.75} {...draw(0.2)} />
      <motion.path d="M17,29 C20,33 25,36 31,43" stroke={c.line} strokeWidth={SW} {...draw(0.45)} />
      <motion.path d="M31,29 C28,33 23,36 17,43" stroke={c.line} strokeWidth={SW} {...draw(0.55)} />
    </StitchSvg>
  );
}

// Icon 2 — Vòm: chain-space arch (chain loops along an arc) over a base row
export function StitchArch({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  const links = [150, 120, 90, 60, 30].map((deg) => {
    const r = (deg * Math.PI) / 180;
    return { x: 24 + Math.cos(r) * 14, y: 36 - Math.sin(r) * 14, rot: 90 - deg };
  });
  return (
    <StitchSvg size={size} label="Arch stitch">
      <path d="M10,36 A14,14 0 0 1 38,36 Z" fill={c.tintB} opacity={0.6} />
      {links.map((l, i) => (
        <motion.ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx="4"
          ry="2.4"
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          fill={i === 2 ? c.tintA : "none"}
          stroke={c.line}
          strokeWidth={SW - 0.2}
          {...draw(i * 0.09)}
        />
      ))}
      <motion.path d="M6,36 H42" stroke={c.line} strokeWidth={SW} {...draw(0.5)} />
    </StitchSvg>
  );
}

// Icon 3 — Số 8: one continuous strand looping into a figure-eight
export function StitchFigureEight({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  return (
    <StitchSvg size={size} label="Figure-eight stitch">
      <ellipse cx="24" cy="15.5" rx="6" ry="5" fill={c.tintA} />
      <ellipse cx="24" cy="32.5" rx="6.5" ry="5.5" fill={c.tintB} />
      <motion.path
        d="M24,24 C16,19.5 15,7 24,7 C33,7 32,19.5 24,24 C15.5,28.5 14.5,41 24,41 C33.5,41 32.5,28.5 24,24 Z"
        stroke={c.line}
        strokeWidth={SW}
        {...draw()}
      />
    </StitchSvg>
  );
}

// Icon 4 — Xích: a diagonal row of interlocked chain loops with a tail
export function StitchChain({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  const links = [
    { x: 15, y: 33 },
    { x: 24, y: 24 },
    { x: 33, y: 15 },
  ];
  return (
    <StitchSvg size={size} label="Chain stitch">
      {links.map((l, i) => (
        <motion.ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx="7.5"
          ry="4.4"
          transform={`rotate(-45 ${l.x} ${l.y})`}
          fill={i === 1 ? c.tintA : "none"}
          stroke={c.line}
          strokeWidth={SW}
          {...draw(i * 0.15)}
        />
      ))}
      <motion.path d="M10,38 C8,40 7,42 5,43" stroke={c.line} strokeWidth={SW} {...draw(0.5)} />
      <motion.path d="M38,10 C40,8 41,6 43,5" stroke={c.line} strokeWidth={SW} {...draw(0.6)} />
    </StitchSvg>
  );
}

// Icon 5 — Bện: two strands twisting over each other like a cable
export function StitchCable({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  const second = filled ? "color-mix(in srgb, var(--primary) 45%, var(--card))" : c.line;
  return (
    <StitchSvg size={size} label="Cable stitch">
      <motion.path
        d="M33,5 C33,13 15,15 15,24 C15,33 33,35 33,43"
        stroke={second}
        strokeWidth={SW + 1.2}
        {...draw()}
      />
      <motion.path
        d="M15,5 C15,13 33,15 33,24 C33,33 15,35 15,43"
        stroke={c.line}
        strokeWidth={SW + 1.2}
        {...draw(0.15)}
      />
      <motion.path d="M10,5 V43 M38,5 V43" stroke={c.line} strokeWidth={1.4} strokeDasharray="2 3.5" opacity={0.6} {...draw(0.4)} />
    </StitchSvg>
  );
}

// Icon 6 — Hoa: five chain-loop petals around a centre ring
export function StitchBloom({ filled = false, size = 48 }: StitchIconProps) {
  const c = stitchTone(filled);
  return (
    <StitchSvg size={size} label="Lace bloom stitch">
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.path
          key={deg}
          d="M24,21 C19.5,15 20,7.5 24,7.5 C28,7.5 28.5,15 24,21"
          transform={`rotate(${deg} 24 24)`}
          fill={i % 2 === 0 ? c.tintA : c.tintB}
          stroke={c.line}
          strokeWidth={SW - 0.2}
          {...draw(i * 0.08)}
        />
      ))}
      <motion.circle cx="24" cy="24" r="3.2" stroke={c.line} strokeWidth={SW - 0.2} {...draw(0.45)} />
    </StitchSvg>
  );
}

// Convenience array of all 6 icon components
export const ALL_STITCH_ICONS = [
  { key: "ring",  labelKey: "learn.stitchRing",  Comp: StitchRing        },
  { key: "arch",  labelKey: "learn.stitchArch",  Comp: StitchArch        },
  { key: "eight", labelKey: "learn.stitchEight", Comp: StitchFigureEight },
  { key: "chain", labelKey: "learn.stitchChain", Comp: StitchChain       },
  { key: "cable", labelKey: "learn.stitchCable", Comp: StitchCable       },
  { key: "bloom", labelKey: "learn.stitchBloom", Comp: StitchBloom       },
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
  const { t } = useLanguage();
  return (
    <motion.div
      variants={stitchContainerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap" as const }}
    >
      {ALL_STITCH_ICONS.map(({ key, labelKey, Comp }) => (
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
              {t(labelKey)}
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
  const { t } = useLanguage();
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
            {t("learn.verifiedLearner")}
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
          {t("learn.testimonial1")}
          <span style={{ color: "var(--primary)", fontWeight: 500 }}>
            {t("learn.testimonial1Highlight")}
          </span>
          {t("learn.testimonial1End")}
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
              {t("learn.testimonialSig")}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.62rem",
                color: "var(--foreground-muted)",
                marginTop: "1px",
              }}
            >
              {t("learn.testimonialBadge")}
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
// ANIMATED STITCH ROW — fills icons on viewport enter with stagger
// Redesigned: embroidery-hoop rings + a "thread" that stitches through
// each step, using --cta-gradient / --cta-shadow / --glow-primary so
// the glow automatically reads right in both light and dark mode.
// ═══════════════════════════════════════════════════════════════════

function ViewFillIcon({
  Comp,
  label,
  delay,
  index,
  filled,
  onFill,
}: {
  Comp: React.ComponentType<StitchIconProps>;
  label: string;
  delay: number;
  index: number;
  filled: boolean;
  onFill: () => void;
}) {
  // Bumping the key re-mounts the icon so its strokes draw again ("Di chuột để xem")
  const [drawKey, setDrawKey] = useState(0);
  const replay = () => setDrawKey((k) => k + 1);

  return (
    <motion.div
      onViewportEnter={() => setTimeout(onFill, delay * 1000)}
      onHoverStart={replay}
      onTap={replay}
      viewport={{ once: true, amount: 0.6 }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.5 }}
      whileHover={{ y: -3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        position: "relative",
        cursor: "pointer",
      }}
    >
      {/* Step badge — number while unfilled, check once stitched */}
      <motion.div
        animate={{
          backgroundColor: filled ? "var(--primary)" : "var(--surface)",
          scale: filled ? 1 : 0.9,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        style={{
          position: "absolute",
          top: "-4px",
          right: "0px",
          zIndex: 2,
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.5px solid ${filled ? "var(--primary)" : "var(--border)"}`,
          boxShadow: filled ? "var(--shadow-sm)" : "none",
        }}
      >
        {filled ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path d="M1 4L3.5 6.5L9 1" stroke="var(--primary-foreground)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: "0.7rem", fontWeight: 700, color: "var(--foreground-muted)" }}>
            {index + 1}
          </span>
        )}
      </motion.div>

      {/* Dashed "embroidery hoop" ring around the icon */}
      <div
        style={{
          padding: "5px",
          borderRadius: "50%",
          border: `1.5px dashed ${filled ? "var(--primary)" : "color-mix(in srgb, var(--primary) 32%, var(--border))"}`,
          transition: "border-color 0.4s var(--ease-out)",
        }}
      >
        <motion.div
          animate={{
            scale: filled ? [1, 1.12, 1] : 1,
            rotate: filled ? [0, -6, 0] : 0,
          }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            // Light tint (not the solid CTA gradient) so the primary-coloured
            // yarn strokes stay readable once the stitch is "made"
            background: filled
              ? "color-mix(in srgb, var(--primary) 10%, var(--card))"
              : "var(--card)",
            boxShadow: filled
              ? "0 6px 18px color-mix(in srgb, var(--primary) 22%, transparent), inset 0 0 0 1.5px color-mix(in srgb, var(--primary) 30%, transparent)"
              : "var(--shadow-sm)",
            transition: "background 0.4s var(--ease-out), box-shadow 0.4s var(--ease-out)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Comp key={`${filled}-${drawKey}`} filled={filled} size={40} />
        </motion.div>
      </div>

      <span
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "0.74rem",
          fontWeight: filled ? 600 : 400,
          color: filled ? "var(--primary)" : "var(--foreground-muted)",
          transition: "color 0.3s ease",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function AnimatedStitchRow() {
  const { t } = useLanguage();
  const [filledMap, setFilledMap] = useState<boolean[]>(() => ALL_STITCH_ICONS.map(() => false));

  const filledCount = filledMap.filter(Boolean).length;
  const progress = (filledCount / ALL_STITCH_ICONS.length) * 100;

  const markFilled = (i: number) =>
    setFilledMap((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });

  return (
    <div style={{ position: "relative" }}>
      {/* Dashed thread connecting every stitch — hidden once icons wrap on small screens */}
      <div
        aria-hidden
        className="hidden sm:block"
        style={{
          position: "absolute",
          top: "36px",
          left: "6%",
          right: "6%",
          height: "2px",
          backgroundImage: "linear-gradient(to right, var(--border) 50%, transparent 50%)",
          backgroundSize: "8px 2px",
          zIndex: 0,
        }}
      />
      <motion.div
        aria-hidden
        className="hidden sm:block"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: "36px",
          left: "6%",
          height: "2px",
          background: "var(--cta-gradient)",
          boxShadow: "0 0 8px var(--glow-primary)",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "28px",
          flexWrap: "wrap" as const,
        }}
      >
        {ALL_STITCH_ICONS.map(({ key, labelKey, Comp }, i) => (
          <ViewFillIcon
            key={key}
            index={i}
            Comp={Comp}
            label={t(labelKey)}
            delay={i * 0.12}
            filled={filledMap[i]}
            onFill={() => markFilled(i)}
          />
        ))}
      </div>
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
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-8"
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: "var(--section-py-sm)",
        paddingBottom: "var(--section-py-sm)",
      }}
    >
      {/* Background ambient glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "340px", height: "260px", top: "40%", left: "38%", borderRadius: "50%", background: "radial-gradient(ellipse, var(--glow-primary) 0%, transparent 70%)", filter: "blur(52px)" }} />
        {/* Second glow — same lavender accent used across How It Works/Shop/DIY
            so every section reads from the same ambient-glow "recipe" */}
        <div style={{ position: "absolute", width: "260px", height: "200px", bottom: "8%", right: "8%", borderRadius: "50%", background: "radial-gradient(ellipse, var(--glow-lavender) 0%, transparent 72%)", filter: "blur(46px)" }} />
        {/* Fiber texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%235B3DF5' fill-opacity='0.028'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23E8DEFF' fill-opacity='0.022'/%3E%3C/svg%3E")` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── 2-col → 1-col trên mobile ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
          style={{ alignItems: "start", marginBottom: "3rem", marginTop: "1.5rem" }}
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
                {t("learn.eyebrow")}
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
                {t("learn.headline")}{" "}
                <span style={{ fontStyle: "italic", color: "var(--primary)" }}>
                  {t("learn.headlineItalic")}
                </span>{" "}
                {t("learn.headlineEnd")}
              </motion.h2>

            {/* Checklist */}
            <motion.div
              variants={leftColVariants}
              style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}
            >
              <CheckItem
                title={t("learn.check1")}
                detail={t("learn.check1Detail")}
              />
              <CheckItem
                title={t("learn.check2")}
                detail={t("learn.check2Detail")}
              />
              <CheckItem
                title={t("learn.check3")}
                detail={t("learn.check3Detail")}
              />
            </motion.div>

            {/* CTA */}
            <MotionLink
              variants={leftColItem}
              to="/learn"
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
              {t("learn.cta")}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </MotionLink>
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
                  {t("learn.lesson4")}
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
                  {t("learn.merinoTagged")}
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
              marginBottom: "15px",
            }}
          />

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "0.88rem",
                color: "var(--foreground-muted)",
                letterSpacing: "0.06em",
              }}
            >
              {t("learn.stitchLabel")}
            </span>
          </div>

          {/* Animated stitch icon row — fills on viewport enter */}
          <AnimatedStitchRow />
        </div>
      </div>
    </motion.section>
  );
}