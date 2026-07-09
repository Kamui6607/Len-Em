import { useState, useEffect } from "react";
import { Heart, ArrowRight, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeartState = "default" | "liked";

interface Creator {
  id: string;
  name: string;
  handle: string;
  project: string;
  likes: number;
  img: string;
  avatarFrom: string;
  avatarTo: string;
  initial: string;
}

// ── Creator data ──────────────────────────────────────────────────────────────

export const CREATORS: Creator[] = [
  {
    id: "c1",
    name: "Margaux Ève",
    handle: "@margaux.makes",
    project: "Nordic Cowl · Worsted",
    likes: 2840,
    img: "https://images.unsplash.com/photo-1695883447569-80abcd3030c0?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--accent-blush)",
    avatarTo: "var(--primary)",
    initial: "M",
  },
  {
    id: "c2",
    name: "Yuki Sato",
    handle: "@yukiknits",
    project: "Lace Shawl · Fingering",
    likes: 1190,
    img: "https://images.unsplash.com/photo-1762034654189-345554213b49?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--accent-lavender)",
    avatarTo: "var(--decor-avatar-close)",
    initial: "Y",
  },
  {
    id: "c3",
    name: "Imani Cole",
    handle: "@imani.stitch",
    project: "Heirloom Quilt · DK",
    likes: 3420,
    img: "https://images.unsplash.com/photo-1519412849983-957822373d02?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--primary)",
    avatarTo: "var(--accent-pink)",
    initial: "I",
  },
  {
    id: "c4",
    name: "Sofía Reyes",
    handle: "@sofiamakes",
    project: "Merino Wrap · Bulky",
    likes: 892,
    img: "https://images.unsplash.com/photo-1651342703853-2594571bb96a?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--accent-butter)",
    avatarTo: "var(--decor-avatar-s)",
    initial: "S",
  },
  {
    id: "c5",
    name: "Ella Pierce",
    handle: "@ellacraft",
    project: "Cable Sweater · Aran",
    likes: 4110,
    img: "https://images.unsplash.com/photo-1470049384172-927891aad5e9?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--accent-pink)",
    avatarTo: "var(--primary-pressed)",
    initial: "E",
  },
  {
    id: "c6",
    name: "Nadia Voss",
    handle: "@nadiaknits",
    project: "Chunky Blanket · Super Bulky",
    likes: 1670,
    img: "https://images.unsplash.com/photo-1728393287642-13bee7126ae8?auto=format&fit=crop&w=600&q=80",
    avatarFrom: "var(--accent-cream)",
    avatarTo: "var(--accent-warm)",
    initial: "N",
  },
];

// ── Fixed positions along the S-curve ────────────────────────────────────────
// Container is 1200 × 520 px.
// Each entry places the photo card's TOP-LEFT corner.
// The SVG thread is drawn through the CENTER of each card (left+88, top+108).

const PHOTO_W = 160; // inner image
const PHOTO_H = 200;
const BORDER = 8; // white frame each side
const CAPTION = 24; // polaroid bottom

const CARD_W = PHOTO_W + BORDER * 2; // 176

export const CURVE_POSITIONS: Array<{
  left: number;
  top: number;
  rotate: number;
  scale: number;
}> = [
  { left: 18, top: 22, rotate: -10, scale: 1.0 },
  { left: 202, top: 130, rotate: 4, scale: 0.95 },
  { left: 392, top: 268, rotate: -8, scale: 1.05 },
  { left: 598, top: 165, rotate: 6, scale: 0.97 },
  { left: 788, top: 28, rotate: -5, scale: 1.02 },
  { left: 983, top: 190, rotate: 9, scale: 0.96 },
];

// Thread path centres (left + BORDER+PHOTO_W/2, top + BORDER+PHOTO_H/2)
// Used by the SVG S-curve behind the photos.
// viewBox: "0 0 1200 520"
const THREAD_PATH =
  "M 106,122 " +
  "C 200,330 355,405 480,374 " +
  "C 605,343 650,248 686,273 " +
  "C 722,298 855,78  876,130 " +
  "C 897,182 1004,355 1071,298";

// Waypoints dọc theo THREAD_PATH để tim bay men theo đường S
const THREAD_WAYPOINTS: Array<{ x: number; y: number }> = [
  { x: 106, y: 122 },
  { x: 300, y: 300 },
  { x: 480, y: 374 },
  { x: 686, y: 273 },
  { x: 876, y: 130 },
  { x: 1071, y: 298 },
  { x: 1150, y: 40 }, // điểm cuối gần counter góc trên-phải
];

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ creator, size = 34 }: { creator: Creator; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${creator.avatarFrom}, ${creator.avatarTo})`,
        border: "2px solid rgba(255,255,255,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: size * 0.42 + "px",
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {creator.initial}
      </span>
    </div>
  );
}

// ── Heart button — two static states ───────────────────────────────────────────

export function HeartButton({
  state = "default",
  count,
  onChange,
}: {
  state?: HeartState;
  count: number;
  onChange?: () => void;
}) {
  const liked = state === "liked";
  return (
    <motion.button
      onClick={onChange}
      whileTap={{ scale: 0.8 }}
      animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: liked ? "rgba(225,29,72,0.18)" : "rgba(255,255,255,0.14)",
        border: liked
          ? "1px solid rgba(225,29,72,0.4)"
          : "1px solid rgba(255,255,255,0.25)",
        borderRadius: "999px",
        padding: "5px 11px",
        cursor: "pointer",
        backdropFilter: "blur(6px)",
      }}
    >
      <Heart
        size={13}
        strokeWidth={liked ? 0 : 1.8}
        style={{
          fill: liked ? "var(--decor-heart)" : "none",
          stroke: liked ? "var(--decor-heart)" : "rgba(255,255,255,0.85)",
          transition: "fill 0.2s, stroke 0.2s",
        }}
      />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.68rem",
          fontWeight: 600,
          color: liked ? "var(--decor-heart-soft)" : "rgba(255,255,255,0.85)",
          letterSpacing: "0.01em",
          lineHeight: 1,
        }}
      >
        {liked ? (count + 1).toLocaleString() : count.toLocaleString()}
      </span>
    </motion.button>
  );
}

// ── Hover overlay (inside the photo frame) ───────────────────────────────────────

function HoverOverlay({
  creator,
  heartState = "default",
  onHeartChange,
}: {
  creator: Creator;
  heartState?: HeartState;
  onHeartChange?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "2px",
        background:
          "linear-gradient(to top, rgba(28,21,38,0.92) 0%, rgba(28,21,38,0.55) 40%, transparent 72%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "10px 10px 11px",
        gap: "7px",
      }}
    >
      {/* Creator row */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        style={{ display: "flex", alignItems: "center", gap: "7px" }}
      >
        <Avatar creator={creator} size={32} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#fff",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {creator.name}
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1,
              marginTop: "1px",
            }}
          >
            {creator.handle}
          </div>
        </div>
      </motion.div>

      {/* Project tag */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.09, duration: 0.25 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.6rem",
          fontWeight: 500,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.04em",
          textTransform: "uppercase" as const,
        }}
      >
        {creator.project}
      </motion.div>

      {/* Like button */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.13, duration: 0.25 }}
      >
        <HeartButton
          state={heartState}
          count={creator.likes}
          onChange={onHeartChange}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Creator photo card ──────────────────────────────────────────────────────────

export function CreatorPhoto({
  creator,
  position,
  hovered = false,
  heartState = "default",
  onHeartChange,
  index = 0,
  draggable = false,
}: {
  creator: Creator;
  position: (typeof CURVE_POSITIONS)[0];
  hovered?: boolean;
  heartState?: HeartState;
  onHeartChange?: () => void;
  index?: number;
  draggable?: boolean;
}) {
  const reduce = useReducedMotion();

  // ── Hover thật do chuột điều khiển ──
  const [isHoveredLocal, setIsHoveredLocal] = useState(false);
  const isHovered = hovered || isHoveredLocal;

  // Motion values cho hiệu ứng kéo kiểu thẻ bài
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateDrag = useTransform(x, [-150, 0, 150], [-18, 0, 18]);
  const likeHintOpacity = useTransform(x, [20, 120], [0, 1]);
  const likeHintOpacityUp = useTransform(y, [-120, -20], [1, 0]);

  const [dragging, setDragging] = useState(false);

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    setDragging(false);
    const draggedFar = Math.abs(info.offset.x) > 90 || info.offset.y < -90;
    if (draggedFar && heartState !== "liked") {
      onHeartChange?.();
    }
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
        rotate: position.rotate + (index % 2 ? 8 : -8),
        scale: 0.8,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotate: position.rotate,
        scale: position.scale,
      }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.5,
        delay: 0.3 + index * 0.15,
        type: "spring",
        stiffness: 140,
        damping: 14,
      }}
      onMouseEnter={() => setIsHoveredLocal(true)}
      onMouseLeave={() => setIsHoveredLocal(false)}
      // ── Kéo chỉ cho card đầu ──
      {...(draggable && !reduce
        ? {
            drag: true as const,
            dragElastic: 0.35,
            dragConstraints: { left: -140, right: 140, top: -140, bottom: 60 },
            dragTransition: { bounceStiffness: 300, bounceDamping: 18 },
            onDragStart: () => setDragging(true),
            onDragEnd: handleDragEnd,
            style: { x, y },
            whileDrag: { scale: 1.06, zIndex: 50, cursor: "grabbing" },
          }
        : {})}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width: CARD_W,
        zIndex: isHovered || dragging ? 20 : 1,
        transformOrigin: "center center",
        willChange: "transform",
        filter: `drop-shadow(0 ${isHovered || dragging ? 14 : 8}px ${isHovered || dragging ? 28 : 18}px rgba(30,12,54,${isHovered || dragging ? 0.28 : 0.18}))`,
        transition: dragging ? "none" : "filter 0.3s ease",
        cursor: draggable && !reduce ? "grab" : "default",
        rotate: draggable ? rotateDrag : undefined,
        ...(draggable ? { x, y } : {}),
      }}
    >
      {/* White polaroid frame */}
      <div
        style={{
          background: "#fff",
          padding: `${BORDER}px ${BORDER}px 0`,
          borderRadius: "3px",
          position: "relative",
        }}
      >
        {/* Photo + hover overlay */}
        <div
          style={{
            position: "relative",
            width: PHOTO_W,
            height: PHOTO_H,
            overflow: "hidden",
            borderRadius: "1px",
          }}
        >
          <ImageWithFallback
            src={creator.img}
            alt={creator.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
              filter: isHovered ? "brightness(0.85) saturate(1.05)" : "none",
              transition: "filter 0.3s ease",
            }}
          />
          <AnimatePresence>
            {isHovered && (
              <HoverOverlay
                key="overlay"
                creator={creator}
                heartState={heartState}
                onHeartChange={onHeartChange}
              />
            )}
          </AnimatePresence>

          {/* Gợi ý "sắp like" khi kéo */}
          {draggable && !reduce && (
            <>
              <motion.div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  opacity: likeHintOpacity,
                  pointerEvents: "none",
                  background: "rgba(225,29,72,0.85)",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={15} style={{ fill: "#fff", color: "#fff" }} />
              </motion.div>
              <motion.div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  opacity: likeHintOpacityUp,
                  pointerEvents: "none",
                  background: "rgba(225,29,72,0.85)",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={15} style={{ fill: "#fff", color: "#fff" }} />
              </motion.div>
            </>
          )}
        </div>

        {/* Polaroid caption strip */}
        <div
          style={{
            height: CAPTION,
            display: "flex",
            alignItems: "center",
            paddingLeft: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.6rem",
              fontWeight: 500,
              color: "#aaa",
              letterSpacing: "0.03em",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              maxWidth: PHOTO_W - 8,
            }}
          >
            {creator.handle}
          </span>
        </div>

        {/* Gợi ý nhỏ: "kéo để thích" */}
        {draggable && !dragging && (
          <span
            style={{
              position: "absolute",
              bottom: `${CAPTION + 4}px`,
              right: "6px",
              fontFamily: "'Caveat', cursive",
              fontSize: "0.62rem",
              color: "var(--primary)",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          >
            kéo để thích ↗
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── SVG S-curve thread ────────────────────────────────────────────────────────
// Drawn in a 1200×520 viewBox sitting behind all photos.

function SCurveThread() {
  return (
    <svg
      viewBox="0 0 1200 520"
      width="1200"
      height="520"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden
    >
      <defs>
        <filter id="thread-blur">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* Shadow trace — slightly offset, very blurred */}
      <motion.path
        d={THREAD_PATH}
        fill="none"
        stroke="rgba(58,42,77,0.12)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#thread-blur)"
        transform="translate(0,3)"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      {/* Main thread — doubled for "twisted yarn" look */}
      <motion.path
        d={THREAD_PATH}
        fill="none"
        stroke="var(--accent-pink)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="7 5"
        opacity="0.55"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.55 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.path
        d={THREAD_PATH}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="5 7"
        strokeDashoffset="6"
        opacity="0.3"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.3 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      {/* Node dots at each photo centre */}
      {CURVE_POSITIONS.map((pos, i) => {
        const cx = pos.left + BORDER + PHOTO_W / 2;
        const cy = pos.top + BORDER + PHOTO_H / 2;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              delay: 0.3 + i * 0.15,
              duration: 0.3,
              type: "spring",
            }}
          >
            <circle
              cx={cx}
              cy={cy}
              r="7"
              fill="var(--accent-pink)"
              fillOpacity="0.25"
              stroke="var(--primary)"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
            <circle
              cx={cx}
              cy={cy}
              r="2.5"
              fill="var(--primary)"
              fillOpacity="0.5"
            />
          </motion.g>
        );
      })}
    </svg>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

function DIYHeading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "40px",
        flexWrap: "wrap" as const,
        marginBottom: "52px",
      }}
    >
      {/* Left: text */}
      <div>
        {/* Eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "1.5px",
              background: "var(--primary)",
              opacity: 0.5,
            }}
          />
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "var(--primary)",
              letterSpacing: "0.05em",
            }}
          >
            Community · 6k creators
          </span>
        </div>

        {/* Three-line headline */}
        <h2 style={{ margin: 0, padding: 0 }}>
          {/* Line 1 */}
          <span
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 2.5vw, 2.8rem)",
              fontWeight: 400,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
            }}
          >
            See it made.
          </span>
          {/* Line 2 — italic + primary */}
          <span
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 2.5vw, 2.8rem)",
              fontWeight: 600,
              fontStyle: "italic",
              color: "var(--primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
            }}
          >
            Buy the kit.
          </span>
          {/* Line 3 — bold + trailing comma */}
          <span
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 2.5vw, 2.8rem)",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
            }}
          >
            Make it yours.,
          </span>
        </h2>
      </div>

      {/* Right: CTA + stat */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "12px",
        }}
      >
        <motion.a
          href="#"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "999px",
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "var(--shadow-md)",
          }}
        >
          Join the community
          <ArrowRight size={14} strokeWidth={2} />
        </motion.a>

        {/* Stat strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Users
            size={12}
            strokeWidth={1.6}
            style={{ color: "var(--foreground-muted)" }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              color: "var(--foreground-muted)",
              letterSpacing: "0.02em",
            }}
          >
            6,200 makers · 48k projects shared
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Floating creator photo wrapper ─────────────────────────────────────────────

function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return narrow;
}

// ── Tim bay dọc theo đường cong S ──────────────────────────────────────

function FlyingHeart({ startX, startY }: { startX: number; startY: number }) {
  return (
    <motion.div
      initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
      animate={{
        x: THREAD_WAYPOINTS.map((p) => p.x),
        y: THREAD_WAYPOINTS.map((p) => p.y),
        opacity: [1, 1, 1, 1, 1, 0.6, 0],
        scale: [1, 0.9, 0.95, 0.85, 0.8, 0.6, 0.4],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.9,
        ease: "easeInOut",
        times: [0, 0.16, 0.33, 0.5, 0.66, 0.85, 1],
      }}
      style={{ position: "absolute", zIndex: 30, pointerEvents: "none" }}
    >
      <Heart
        size={18}
        style={{ fill: "var(--decor-heart)", color: "var(--decor-heart)" }}
      />
    </motion.div>
  );
}

// ── Card đơn giản cho mobile: chỉ click-to-like, không bobbing, không drag ──

function MobileCreatorCard({
  creator,
  heartState,
  onHeartChange,
}: {
  creator: Creator;
  heartState: HeartState;
  onHeartChange: () => void;
}) {
  const liked = heartState === "liked";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px",
        borderRadius: "16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 90,
          borderRadius: "10px",
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid var(--border)",
        }}
      >
        <ImageWithFallback
          src={creator.img}
          alt={creator.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "0.9rem",
            fontWeight: 600,
            fontStyle: "italic",
            color: "var(--foreground)",
            lineHeight: 1.1,
          }}
        >
          {creator.name}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.72rem",
            color: "var(--foreground-muted)",
            marginBottom: "6px",
          }}
        >
          {creator.project}
        </div>
        <motion.button
          onClick={onHeartChange}
          whileTap={{ scale: 0.85 }}
          animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: liked
              ? "color-mix(in srgb, var(--decor-heart) 12%, transparent)"
              : "var(--background)",
            border: liked
              ? "1px solid color-mix(in srgb, var(--decor-heart) 35%, transparent)"
              : "1px solid var(--border)",
            borderRadius: "999px",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          <Heart
            size={13}
            strokeWidth={liked ? 0 : 1.8}
            style={{
              fill: liked ? "var(--decor-heart)" : "none",
              stroke: liked ? "var(--decor-heart)" : "var(--foreground-muted)",
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: liked ? "var(--decor-heart)" : "var(--foreground-muted)",
            }}
          >
            {(liked ? creator.likes + 1 : creator.likes).toLocaleString()}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function FloatingCreatorPhoto({
  index,
  creator,
  position,
  hovered,
  heartState,
  onHeartChange,
}: {
  index: number;
  creator: Creator;
  position: (typeof CURVE_POSITIONS)[0];
  hovered: boolean;
  heartState: HeartState;
  onHeartChange: () => void;
}) {
  const reduce = useReducedMotion();
  // Bobbing ở div cha, drag ở div con — hai lớp riêng, không xung đột
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -7, 0] }}
      transition={{
        duration: 3 + (index % 3) * 0.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3,
      }}
      style={{ position: "absolute", left: position.left, top: position.top }}
    >
      <CreatorPhoto
        creator={creator}
        position={{ ...position, left: 0, top: 0 }}
        hovered={hovered}
        heartState={heartState}
        onHeartChange={onHeartChange}
        index={index}
        draggable={index === 0}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL DIY SECTION
// ═══════════════════════════════════════════════════════════════════

export function DIYSection({ hoveredIndex = -1 }: { hoveredIndex?: number }) {
  const isNarrow = useIsNarrow();
  const [hearts, setHearts] = useState<HeartState[]>(
    CREATORS.map(() => "default"),
  );
  const [likeTotal, setLikeTotal] = useState(() =>
    CREATORS.reduce((s, c) => s + c.likes, 0),
  );
  const [flyingHearts, setFlyingHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const toggleHeart = (i: number) => {
    setHearts((prev) => {
      const next = prev.map((s, j) =>
        j === i ? (s === "liked" ? "default" : "liked") : s,
      );
      setLikeTotal((t) => t + (next[i] === "liked" ? 1 : -1));
      if (next[i] === "liked" && !isNarrow) {
        const pos = CURVE_POSITIONS[i];
        const id = Date.now();
        setFlyingHearts((f) => [...f, { id, x: pos.left, y: pos.top }]);
        setTimeout(
          () => setFlyingHearts((f) => f.filter((h) => h.id !== id)),
          900,
        );
      }
      return next;
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "5.5rem 2rem 6rem",
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "280px",
            top: "35%",
            left: "40%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, var(--glow-primary) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Fiber texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%236B3FA0' fill-opacity='0.025'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23F0C4E0' fill-opacity='0.02'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <DIYHeading />

        {isNarrow ? (
          // ── MOBILE: danh sách cuộn dọc, chỉ giữ animation click tim ──
          <>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {CREATORS.map((creator, i) => (
                <MobileCreatorCard
                  key={creator.id}
                  creator={creator}
                  heartState={hearts[i]}
                  onHeartChange={() => toggleHeart(i)}
                />
              ))}
            </div>
            {/* Total like counter */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: "16px",
              }}
            >
              <Heart
                size={14}
                style={{
                  fill: "var(--decor-heart)",
                  color: "var(--decor-heart)",
                }}
              />
              <motion.span
                key={likeTotal}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                {likeTotal.toLocaleString()}
              </motion.span>
            </div>
          </>
        ) : (
          // ── DESKTOP: S-curve gallery ──
          <div
            style={{
              overflowX: "auto",
              overflowY: "visible",
              paddingBottom: "32px",
            }}
          >
            <div
              className="diy-curve-container"
              style={{
                position: "relative",
                width: "1200px",
                height: "520px",
              }}
            >
              <SCurveThread />

              {CREATORS.map((creator, i) => (
                <FloatingCreatorPhoto
                  key={creator.id}
                  index={i}
                  creator={creator}
                  position={CURVE_POSITIONS[i]}
                  hovered={hoveredIndex === i}
                  heartState={hearts[i]}
                  onHeartChange={() => toggleHeart(i)}
                />
              ))}

              {/* Flying hearts overlay — bay dọc theo đường cong S */}
              <AnimatePresence>
                {flyingHearts.map((h) => (
                  <FlyingHeart
                    key={h.id}
                    startX={h.x + BORDER + PHOTO_W / 2}
                    startY={h.y + BORDER + PHOTO_H / 2}
                  />
                ))}
              </AnimatePresence>

              {/* Total like counter */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  zIndex: 5,
                }}
              >
                <Heart
                  size={14}
                  style={{
                    fill: "var(--decor-heart)",
                    color: "var(--decor-heart)",
                  }}
                />
                <motion.span
                  key={likeTotal}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  {likeTotal.toLocaleString()}
                </motion.span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ── Standalone heart-state reference panel ────────────────────────────────────
// Used in App.tsx frames for the close-up heart icon comparison.

export function HeartStatePanel() {
  const creator = CREATORS[2]; // Imani — highest likes, good reference
  return (
    <div style={{ display: "flex", gap: "48px", alignItems: "center" }}>
      {/* Default heart */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "80px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, var(--surface), var(--bg-1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartButton state="default" count={creator.likes} />
        </div>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.82rem",
            color: "var(--foreground-muted)",
          }}
        >
          Default — unfilled
        </span>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={18}
        strokeWidth={1.5}
        style={{
          color: "var(--foreground-muted)",
          opacity: 0.4,
          flexShrink: 0,
        }}
      />

      {/* Liked heart */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "80px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, var(--surface), var(--bg-1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartButton state="liked" count={creator.likes} />
        </div>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.82rem",
            color: "var(--decor-heart)",
          }}
        >
          Liked — filled
        </span>
      </div>
    </div>
  );
}
