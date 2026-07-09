import { useRef, useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, useReducedMotion } from "motion/react";

export type StackMode = "collapsed" | "fanned";

const HERO_IMAGES = [
  {
    id: "img1",
    src: "https://images.unsplash.com/photo-1668072587819-7b393944b426?auto=format&fit=crop&w=500&q=80",
    alt: "A group of colorful wool yarn skeins in warm tones",
    credit: "Raelle Cameron / Unsplash",
  },
  {
    id: "img2",
    src: "https://images.unsplash.com/photo-1550376026-7375b92bb318?auto=format&fit=crop&w=500&q=80",
    alt: "Assorted cozy textile and yarn in soft colors",
    credit: "Paul Hanaoka / Unsplash",
  },
  {
    id: "img3",
    src: "https://images.unsplash.com/photo-1586244897859-2cd81e1cad1f?auto=format&fit=crop&w=500&q=80",
    alt: "Dried botanical flowers on a white surface",
    credit: "Diana Light / Unsplash",
  },
];

const CARD_W = 206;
const CARD_H = 275;
const CONTAINER_W = 510;
const CONTAINER_H = 420;
const OX = (CONTAINER_W - CARD_W) / 2;
const OY = (CONTAINER_H - CARD_H) / 2 - 10;

const STACK_TRANSFORMS: Record<StackMode, Array<{ x: number; y: number; rotate: number; zIndex: number }>> = {
  collapsed: [
    { x: -10, y: 14,  rotate: -9,  zIndex: 1 },
    { x:   6, y:  5,  rotate: -2,  zIndex: 2 },
    { x:  14, y: -8,  rotate:  6,  zIndex: 3 },
  ],
  fanned: [
    { x: -118, y: 22, rotate: -19, zIndex: 1 },
    { x:    2, y: -6, rotate:   0, zIndex: 3 },
    { x:  112, y: 24, rotate:  16, zIndex: 2 },
  ],
};

function useViewportScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setScale(0.58);
      else if (w < 768) setScale(0.75);
      else setScale(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

function useIsStacked(breakpoint = 900) {
  const [stacked, setStacked] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setStacked(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return stacked;
}

function HandInkedUnderline({ width = 300 }: { width?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      width={width}
      height="13"
      viewBox="0 0 300 13"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      initial={reduce ? undefined : { scaleX: 0 }}
      animate={reduce ? undefined : { scaleX: 1 }}
      transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
      className="origin-left"
    >
      <motion.path
        d="M 3,5 C 18,2  42,6  68,4 C 94,2  118,5 142,4 C 162,3 180,6 200,4 C 218,2 238,5 258,3 C 272,2 286,4 297,3 L 297,8 C 285,10 270,8  255,10 C 237,11 217,9  200,10 C 180,11 162,9  142,10 C 122,11 98,9   70,10 C 46,11  22,9    3,10 Z"
        fill="var(--color-primary)"
        fillOpacity={0.65}
        initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
      />
      <path
        d="M 8,6 C 30,3  60,7  95,5 C 130,3 165,6 200,4.5 C 232,3 262,6 290,4 L 292,7.5 C 263,9  232,7  200,8.5 C 165,10 130,8  95,9 C 60,10  30,8    8,9 Z"
        fill="var(--color-primary)"
        fillOpacity="0.28"
      />
      <ellipse cx="293" cy="5.5" rx="3.5" ry="1.8" fill="var(--color-primary)" fillOpacity="0.45" />
      <ellipse cx="6"   cy="7"   rx="2"   ry="1.2" fill="var(--color-primary)" fillOpacity="0.3" />
    </motion.svg>
  );
}

function EyebrowBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="inline-flex items-center gap-2"
      style={{ marginBottom: "1.25rem" }}
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-1"
        style={{
          background: "var(--color-secondary)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 0.5 L6.8 4.8 L11 5.5 L6.8 6.2 L6 10.5 L5.2 6.2 L1 5.5 L5.2 4.8 Z" fill="var(--color-primary)" fillOpacity="0.8" />
        </svg>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: "0.85rem", fontWeight: 500,
          color: "var(--color-primary)", letterSpacing: "0.03em",
        }}>
          New season · Spring 2025
        </span>
      </span>
    </motion.div>
  );
}

function HeroHeadline() {
  return (
    <div style={{ marginBottom: "1.35rem" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0 } },
        }}
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2rem, 6vw, 3.6rem)",
          fontWeight: 700,
          color: "var(--color-foreground)",
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
        }}
      >
        Learn to knit,
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.15 } },
        }}
        className="flex flex-wrap items-baseline gap-2"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2rem, 6vw, 3.6rem)",
          fontWeight: 700,
          color: "var(--color-foreground)",
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
        }}
      >
        <span>live</span>
        <span className="relative inline-block" style={{ paddingBottom: "4px" }}>
          <span style={{ fontStyle: "italic", fontWeight: 600, color: "var(--color-primary)" }}>
            creatively
          </span>
          <span className="absolute" style={{ left: "-4px", right: "-4px", bottom: "-2px", display: "block" }}>
            <HandInkedUnderline width={220} />
          </span>
        </span>
      </motion.div>
    </div>
  );
}

function HeroSubtitle() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      style={{
        fontFamily: "'Inter', 'Poppins', sans-serif",
        fontSize: "1rem",
        fontWeight: 400,
        color: "var(--color-muted-foreground)",
        lineHeight: 1.7,
        maxWidth: "420px",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: "2rem",
      }}
    >
      Step-by-step knitting tutorials, curated yarn bundles, and a community
      of makers. Your cozy craft journey starts here.
    </motion.p>
  );
}

const ctaContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.45 } },
};

const ctaItem = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

function HeroCTAs() {
  return (
    <motion.div
      className="flex items-center gap-3 flex-wrap"
      variants={ctaContainer}
      initial="hidden"
      animate="show"
    >
      <motion.a
        href="#"
        variants={ctaItem}
        className="inline-flex items-center gap-2 rounded-full"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "0.75rem 1.75rem",
          background: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          boxShadow: "var(--shadow-md)",
          textDecoration: "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
          <path d="M2.5 6C4 7 6 7.5 8 7.3C10 7.1 11.8 6.4 13.2 5.2" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.8"/>
          <path d="M2 9.5C3.5 8.6 5.8 8.1 8 8.4C10.2 8.7 12 9.5 13.5 10.5" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.8"/>
          <path d="M5.5 2.2C6 4 6.2 6 6 8C5.8 10 5.2 12 4.4 13.5" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.8"/>
          <path d="M10.5 2.5C10 4.3 9.8 6.2 10 8.2C10.2 10 10.8 11.8 11.6 13.2" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.8"/>
        </svg>
        Start Learning
      </motion.a>

      <motion.a
        href="#"
        variants={ctaItem}
        className="inline-flex items-center gap-1.5 rounded-full"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "0.75rem 1.75rem",
          background: "transparent",
          color: "var(--color-foreground)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 500,
          letterSpacing: "0.01em",
          border: "1.5px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          textDecoration: "none",
        }}
      >
        Browse Patterns
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.a>

      <motion.div
        variants={ctaItem}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
        whileHover={{ scale: 1.04 }}
        style={{
          background: "var(--color-accent)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex -space-x-2">
          {["#C084CC", "#A3B18A", "#D4A373"].map((c, i) => (
            <div
              key={i}
              className="rounded-full border-2"
              style={{ width: "18px", height: "18px", background: c, borderColor: "var(--color-accent)" }}
            />
          ))}
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "var(--color-foreground)",
        }}>
          4,200+ makers
        </span>
      </motion.div>
    </motion.div>
  );
}

function ThreeStepCard() {
  const steps = [
    { num: "1", label: "Choose\nyarn", icon: "🧶" },
    { num: "2", label: "Learn\nstitch", icon: "🪡" },
    { num: "3", label: "Wear\nit!", icon: "✨" },
  ];

  return (
    <motion.div
      className="rounded-2xl"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
      style={{
        width: "218px",
        padding: "14px 16px 14px",
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 0.5L5.6 3.8L9 4.5L5.6 5.2L5 8.5L4.4 5.2L1 4.5L4.4 3.8Z" fill="var(--color-primary)" fillOpacity="0.75"/>
        </svg>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: "0.8rem", fontWeight: 600,
          color: "var(--color-primary)", letterSpacing: "0.04em",
        }}>
          how it works
        </span>
      </div>

      <div className="flex items-start gap-1">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-start">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: "30px", height: "30px",
                  background: i === 1 ? "var(--color-primary)" : "var(--color-secondary)",
                  border: "1.5px solid var(--color-border)",
                }}
              >
                <span style={{
                  fontFamily: "'Caveat', cursive", fontSize: "0.85rem", fontWeight: 700,
                  color: i === 1 ? "var(--color-primary-foreground)" : "var(--color-primary)",
                  lineHeight: 1,
                }}>
                  {step.num}
                </span>
              </div>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 500,
                color: "var(--color-muted-foreground)", textAlign: "center",
                whiteSpace: "pre-line", lineHeight: 1.3,
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginTop: "10px", marginLeft: "2px", marginRight: "2px", color: "var(--color-muted-foreground)", opacity: 0.5, flexShrink: 0 }}>
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <path d="M1 5H14M10 1.5L14 5L10 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 pt-2" style={{ borderTop: "1px dashed var(--color-border)" }}>
        <svg width="60" height="14" viewBox="0 0 60 14" fill="none" aria-hidden="true">
          <path d="M54 7 C54 3 46 1 30 1 C14 1 6 3 6 7" stroke="var(--color-primary)" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="2.5 1.8" opacity="0.55" />
          <path d="M8.5 4.5 L6 7 L9 8.5" stroke="var(--color-primary)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        </svg>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: "0.72rem", color: "var(--color-muted-foreground)", fontStyle: "italic" }}>
          loops forever
        </span>
      </div>
    </motion.div>
  );
}

interface ImageStackProps {
  mode: StackMode;
}

function StaticCard({ img }: { img: (typeof HERO_IMAGES)[0] & { slotKey: string } }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        width: "100%", height: "100%",
        borderRadius: "18px",
        border: "2.5px solid var(--color-background)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <ImageWithFallback
        src={img.src}
        alt={img.alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 55%, rgba(58,42,77,0.18) 100%)",
          borderRadius: "16px",
        }}
      />
    </div>
  );
}

function DraggableFrontCard({
  img,
  onSwipe,
  disabled,
}: {
  img: (typeof HERO_IMAGES)[0] & { slotKey: string };
  onSwipe: () => void;
  disabled: boolean;
}) {
  const wasDragged = useRef(false);

  return (
    <motion.div
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.55}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      whileTap={{ scale: 0.97, cursor: "grabbing" }}
      onDragStart={() => { wasDragged.current = false; }}
      onDrag={(_, info) => {
        if (Math.abs(info.offset.x) > 6 || Math.abs(info.offset.y) > 6) {
          wasDragged.current = true;
        }
      }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 60) onSwipe();
      }}
      onClick={() => {
        if (!wasDragged.current) onSwipe();
        wasDragged.current = false;
      }}
      style={{
        width: "100%", height: "100%",
        cursor: disabled ? "default" : "grab",
        overflow: "hidden",
        borderRadius: "18px",
        border: "2.5px solid var(--color-background)",
        boxShadow: "var(--shadow-lg)",
        touchAction: "none",
      }}
    >
      <ImageWithFallback
        src={img.src}
        alt={img.alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 55%, rgba(58,42,77,0.18) 100%)",
          borderRadius: "16px",
        }}
      />
    </motion.div>
  );
}

function ImageStack({ mode }: ImageStackProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [hoverFan, setHoverFan] = useState(false);
  const reduce = useReducedMotion();

  const effectiveMode: StackMode = hoverFan ? "fanned" : mode;
  const transforms = STACK_TRANSFORMS[effectiveMode];

  const maxZ = Math.max(...transforms.map((t) => t.zIndex));
  const frontSlotIndex = transforms.findIndex((t) => t.zIndex === maxZ);

  const cycleImages = () => setImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);

  const displayImages = transforms.map((_, slot) => {
    const imgIdx = (imageIndex + slot) % HERO_IMAGES.length;
    return { ...HERO_IMAGES[imgIdx], slotKey: `slot-${slot}` };
  });

  return (
    <div
      className="relative shrink-0"
      style={{ width: CONTAINER_W, height: CONTAINER_H }}
      onMouseEnter={() => setHoverFan(true)}
      onMouseLeave={() => setHoverFan(false)}
    >
      {displayImages.map((img, i) => {
        const t = transforms[i];
        const isFront = i === frontSlotIndex;

        return (
          // ── LỚP NGOÀI: chỉ định vị theo slot (collapsed/fanned) ──
          <motion.div
            key={img.slotKey}
            className="absolute"
            initial={false}
            animate={{ x: t.x, y: t.y, rotate: t.rotate, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 24, mass: 1 }}
            style={{
              left: OX,
              top: OY,
              width: CARD_W,
              height: CARD_H,
              zIndex: t.zIndex,
              transformOrigin: "center center",
              willChange: "transform",
              pointerEvents: isFront ? "auto" : "none",
            }}
          >
            {isFront ? (
              <DraggableFrontCard img={img} onSwipe={cycleImages} disabled={!!reduce} />
            ) : (
              <StaticCard img={img} />
            )}
          </motion.div>
        );
      })}

      {/* Floating 3-step loop card */}
      <motion.div
        className="absolute"
        animate={{
          left: effectiveMode === "fanned" ? 18 : -5,
          bottom: effectiveMode === "fanned" ? 12 : 8,
          y: reduce ? 0 : [0, -6, 0],
        }}
        transition={{
          left: { type: "spring", stiffness: 150, damping: 24 },
          bottom: { type: "spring", stiffness: 150, damping: 24 },
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ zIndex: 10, filter: "drop-shadow(0 8px 24px rgba(58,42,77,0.15))", pointerEvents: "none" }}
      >
        <ThreeStepCard />
      </motion.div>

      {/* Decorative accent dot cluster */}
      <svg
        width="56" height="56" viewBox="0 0 56 56" fill="none"
        className="absolute pointer-events-none"
        style={{ top: "10px", right: "24px", zIndex: 0, opacity: 0.7 }}
        aria-hidden="true"
      >
        {[
          [10, 10], [22, 6], [34, 12], [8, 24], [20, 20],
          [32, 22], [44, 16], [16, 34], [28, 32], [40, 30],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r="2"
            fill={i % 2 === 0 ? "var(--color-secondary)" : "var(--color-primary)"}
            fillOpacity={0.55 - i * 0.03}
          />
        ))}
      </svg>
    </div>
  );
}

interface HeroSectionProps {
  stackMode?: StackMode;
}

export function HeroSection({ stackMode = "collapsed" }: HeroSectionProps) {
  const sectionRef = useRef(null);
  const reduce = useReducedMotion();
  const stacked = useIsStacked(900);
  const scale = useViewportScale();

  return (
    <motion.section
      ref={sectionRef}
      className="relative overflow-hidden px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        paddingTop: "3rem",
        paddingBottom: "3rem",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%236B3FA0' fill-opacity='0.03'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%236B3FA0' fill-opacity='0.02'/%3E%3Crect x='1' y='4' width='1' height='1' fill='%23F0C4E0' fill-opacity='0.025'/%3E%3C/svg%3E")`,
          zIndex: 0,
        }}
      />

      <div
        className="absolute pointer-events-none"
        style={{
          width: "360px", height: "260px",
          top: "30%", right: "30%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, var(--color-primary) 0%, transparent 70%)",
          filter: "blur(55px)", zIndex: 0,
        }}
      />

      <div
        className={`relative mx-auto flex gap-8 lg:gap-12 ${stacked ? "flex-col items-center text-center" : "flex-row items-center"}`}
        style={{ maxWidth: "1200px", zIndex: 1 }}
      >
        <motion.div
          className="flex-1 min-w-0 w-full"
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
          style={stacked ? { display: "flex", flexDirection: "column", alignItems: "center" } : undefined}
        >
          {[<EyebrowBadge key="e" />, <HeroHeadline key="h" />, <HeroSubtitle key="s" />, <HeroCTAs key="c" />].map((el) => (
            <motion.div
              key={el.key}
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } } }}
              style={stacked ? { display: "flex", justifyContent: "center", width: "100%" } : undefined}
            >
              {el}
            </motion.div>
          ))}
        </motion.div>

        <div
          className="shrink-0"
          style={{
            width: CONTAINER_W * scale,
            height: CONTAINER_H * scale,
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <ImageStack mode={stackMode} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}