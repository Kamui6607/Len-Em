import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion, useReducedMotion } from "motion/react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LearnState = "default" | "revealed";
export type ShopState  = "front"   | "back";
export type DIYState   = "default" | "revealed";

// ── Image URLs ────────────────────────────────────────────────────────────────

const IMG = {
  learnHands: "https://images.unsplash.com/photo-1632649027900-389e810204e6?auto=format&fit=crop&w=700&q=80",
  shopYarn:   "https://images.unsplash.com/photo-1597736091383-084fa1b69a6a?auto=format&fit=crop&w=700&q=80",
  shopSwatch: "https://images.unsplash.com/photo-1624516268152-1e48624026ed?auto=format&fit=crop&w=800&q=80",
  diy1:       "https://images.unsplash.com/photo-1728393287642-13bee7126ae8?auto=format&fit=crop&w=500&q=80",
  diy2:       "https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?auto=format&fit=crop&w=500&q=80",
  diy3:       "https://images.unsplash.com/photo-1494430539277-0c8da386e1ad?auto=format&fit=crop&w=500&q=80",
};

// ── Material dots (Learn scrubber) ────────────────────────────────────────────

const DOTS = [
  { id: "d1", pos: 12, bg: "var(--decor-1-bg)", border: "var(--decor-1-border)", label: "Merino Yarn",      detail: "Natural · 200g · 4-ply"     },
  { id: "d2", pos: 32, bg: "var(--decor-2-bg)", border: "var(--decor-2-border)", label: "Circular Needles", detail: "4.0 mm · 80 cm cable"        },
  { id: "d3", pos: 54, bg: "var(--decor-3-bg)", border: "var(--decor-3-border)", label: "Stitch Markers",   detail: "Set of 8 · silicone ring"   },
  { id: "d4", pos: 74, bg: "var(--decor-4-bg)", border: "var(--decor-4-border)", label: "Tapestry Needle",  detail: "Blunt tip · size 16"        },
  { id: "d5", pos: 91, bg: "var(--decor-5-bg)", border: "var(--decor-5-border)", label: "Blocking Mat",     detail: "60 × 60 cm · EVA foam"      },
] as const;

// Dot that pops open in "revealed" state (Stitch Markers @ 54 %)
const ACTIVE_IDX = 2;

// ── Shared primitives ─────────────────────────────────────────────────────────

function CategoryChip({ children, color = "var(--accent-pink)" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "999px",
        background: color,
        border: "1px solid var(--border)",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "0.62rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "var(--foreground)",
      }}
    >
      {children}
    </span>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "1.45rem",
        fontWeight: 700,
        color: "var(--foreground)",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        marginTop: "6px",
        marginBottom: "4px",
      }}
    >
      {children}
    </div>
  );
}

function CardSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.78rem",
        color: "var(--foreground-muted)",
        lineHeight: 1.5,
        marginBottom: "14px",
      }}
    >
      {children}
    </p>
  );
}

// The outer card shell — keeps equal proportions across all three
function CardShell({
  children,
  style,
  overflow = "hidden",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  overflow?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "22px",
        overflow,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "430px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEARN CARD
// ═══════════════════════════════════════════════════════════════════

function Scrubber({ state }: { state: LearnState }) {
  const progress = state === "default" ? 0 : 54;

  return (
    <div>
      {/* Track row */}
      <div style={{ position: "relative", height: "36px", marginBottom: "6px" }}>
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "3px",
            background: "var(--border)",
            borderRadius: "99px",
            transform: "translateY(-50%)",
          }}
        />

        {/* Filled portion — animated width */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            height: "3px",
            background: "linear-gradient(90deg, var(--primary), var(--primary-hover))",
            borderRadius: "99px",
            transform: "translateY(-50%)",
          }}
        />

        {/* Material dots */}
        {DOTS.map((dot, i) => {
          const isActive = state === "revealed" && i === ACTIVE_IDX;
          const isPast   = dot.pos <= progress;
          return (
            <div
              key={dot.id}
              style={{
                position: "absolute",
                left: `${dot.pos}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: isActive ? 20 : 10,
              }}
            >
              {/* The dot itself */}
              <div
                style={{
                  width:  isActive ? "14px" : "10px",
                  height: isActive ? "14px" : "10px",
                  borderRadius: "50%",
                  background: dot.bg,
                  border: `2px solid ${dot.border}`,
                  boxShadow: isActive
                    ? `0 0 0 3px ${dot.bg}88, 0 2px 8px rgba(0,0,0,0.15)`
                    : "0 1px 3px rgba(0,0,0,0.12)",
                  transition: "all 0.2s",
                  opacity: isPast ? 1 : 0.55,
                  position: "relative",
                  zIndex: 2,
                }}
              />

              {/* Callout popup — only on active dot in revealed state */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 10px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "9px 13px",
                    boxShadow: "var(--shadow-md)",
                    whiteSpace: "nowrap",
                    zIndex: 30,
                  }}
                >
                  {/* Colour swatch strip */}
                  <div
                    style={{
                      width: "100%",
                      height: "3px",
                      borderRadius: "99px",
                      background: `linear-gradient(90deg, ${dot.bg}, ${dot.border})`,
                      marginBottom: "7px",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {dot.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.62rem",
                      color: "var(--foreground-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {dot.detail}
                  </div>

                  {/* Caret pointing down */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-5px",
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: "8px",
                      height: "8px",
                      background: "var(--background)",
                      borderRight: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  />
                </div>
              )}

              {/* Small abbreviated label on all non-active revealed dots */}
              {state === "revealed" && !isActive && isPast && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: dot.bg,
                    borderRadius: "4px",
                    padding: "1px 5px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.5rem", fontWeight: 700, color: dot.border }}>
                    {dot.label.split(" ")[0]}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `${progress}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "var(--primary)",
            border: "2.5px solid var(--background)",
            boxShadow: "var(--shadow-sm)",
            zIndex: 15,
          }}
        />
      </div>

      {/* Step counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.78rem",
            color: "var(--foreground-muted)",
          }}
        >
          {state === "default" ? "5 material tags" : "Step 3 of 12 · Stitch Markers"}
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 500,
            color: "var(--foreground-muted)",
          }}
        >
          {state === "default" ? "0 %" : "54 %"}
        </span>
      </div>
    </div>
  );
}

export function LearnCard({ state = "default" }: { state?: LearnState }) {
  return (
    <CardShell style={{ overflow: state === "revealed" ? "visible" : "hidden" }}>
      {/* Image */}
      <div style={{ position: "relative", height: "180px", flexShrink: 0, overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
        <ImageWithFallback
          src={IMG.learnHands}
          alt="Hands knitting with wool yarn"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        {/* Lesson count pill */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "var(--bg-overlay-92)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            padding: "3px 10px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <circle cx="4" cy="4" r="3.5" fill="var(--primary)" fillOpacity="0.8"/>
          </svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.62rem", fontWeight: 600, color: "var(--foreground)" }}>
            12 lessons
          </span>
        </div>

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 50%, var(--surface) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <CategoryChip color="var(--accent-pink)">Learn</CategoryChip>
        <CardTitle>Video lessons</CardTitle>
        <CardSubtitle>Beginner to advanced · tagged at every step</CardSubtitle>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "14px" }} />

        {/* Label */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--foreground-muted)",
            marginBottom: "10px",
          }}
        >
          Lesson materials ↓
        </div>

        {/* Scrubber — needs overflow:visible when revealed */}
        <div style={{ position: "relative", flex: 1, paddingTop: state === "revealed" ? "52px" : "0" }}>
          <Scrubber state={state} />
        </div>
      </div>
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHOP CARD
// ═══════════════════════════════════════════════════════════════════

function StarRating({ value = 4.2, count = 38 }: { value?: number; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M5.5 1L6.7 4.1H10L7.4 6.1L8.4 9.2L5.5 7.4L2.6 9.2L3.6 6.1L1 4.1H4.3Z"
            fill={s <= Math.round(value) ? "var(--rating-star)" : "var(--border)"}
          />
        </svg>
      ))}
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.62rem", color: "var(--foreground-muted)" }}>
        {value} ({count})
      </span>
    </div>
  );
}

// Price tag that hangs over the swatch image
function HangTag() {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Thread from hole to card edge (SVG) */}
      <svg
        width="32"
        height="26"
        viewBox="0 0 32 26"
        fill="none"
        style={{ position: "absolute", top: "-22px", left: "18px", pointerEvents: "none" }}
        aria-hidden
      >
        {/* Thread — looped/kinked like real string */}
        <path
          d="M16 24 C16 18, 22 14, 26 8 C28 4, 24 1, 20 2"
          stroke="var(--foreground-muted)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.55"
          strokeDasharray="2 1.5"
        />
      </svg>

      {/* Tag body */}
      <div
        style={{
          background: "var(--background)",
          border: "1.5px solid var(--border)",
          borderRadius: "10px",
          padding: "13px 16px 13px",
          boxShadow: "var(--shadow-md)",
          minWidth: "148px",
          transform: "rotate(-3deg)",
          transformOrigin: "top center",
          position: "relative",
        }}
      >
        {/* Punch hole */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--background)",
            border: "1.5px solid var(--border)",
          }}
        />

        {/* Spacer for hole */}
        <div style={{ height: "14px" }} />

        {/* Brand */}
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.7rem",
            color: "var(--primary)",
            letterSpacing: "0.06em",
            marginBottom: "3px",
          }}
        >
          Len&Em Shop
        </div>

        {/* Product name */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--foreground)",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}
        >
          Alpine Merino Bundle
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "6px" }} />

        {/* Price */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--primary)",
            letterSpacing: "-0.02em",
            marginBottom: "5px",
          }}
        >
          €42.00
        </div>

        {/* Specs */}
        {["100% Merino Wool", "4-ply · 200m", "Natural dye"].map((spec) => (
          <div
            key={spec}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.58rem",
              color: "var(--foreground-muted)",
              lineHeight: 1.6,
            }}
          >
            {spec}
          </div>
        ))}

        {/* Handmade badge */}
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: "0.65rem", color: "var(--primary)", opacity: 0.75 }}>
            ♥ handpicked
          </span>
        </div>
      </div>
    </div>
  );
}

export function ShopCard({ state = "front" }: { state?: ShopState }) {
  if (state === "back") {
    return (
      <CardShell style={{ overflow: "hidden", minHeight: "430px" }}>
        {/* Full-bleed swatch image */}
        <div style={{ position: "absolute", inset: 0 }}>
          <ImageWithFallback
            src={IMG.shopSwatch}
            alt="Multi-colored striped textile fabric swatch"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />

          {/* Darkening vignette — lower 55% for legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(28,21,38,0.15) 0%, rgba(28,21,38,0.72) 100%)",
            }}
          />
        </div>

        {/* "Back" edge cue — thin strip on left, mimicking card back exposure */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "6px",
            background: "linear-gradient(to right, rgba(107,63,160,0.35), transparent)",
            zIndex: 5,
          }}
        />

        {/* Hang tag — top-right quadrant */}
        <div
          style={{
            position: "absolute",
            top: "32px",
            right: "20px",
            zIndex: 10,
          }}
        >
          <HangTag />
        </div>

        {/* Bottom info strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            zIndex: 10,
          }}
        >
          {/* Material tag chips */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px", marginBottom: "10px" }}>
            {["100% Merino", "4-ply", "Natural dye", "Oeko-Tex®"].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "2px 9px",
                  borderRadius: "999px",
                  background: "var(--bg-overlay-15)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  color: "var(--primary-foreground)",
                  letterSpacing: "0.04em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* "Tap to flip back" hint */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L7 12M4 9L7 12L10 9" stroke="rgba(245,240,232,0.6)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "0.75rem",
                color: "rgba(245,240,232,0.6)",
              }}
            >
              tap to flip back
            </span>
          </div>
        </div>
      </CardShell>
    );
  }

  // ── Front ──
  return (
    <CardShell>
      {/* Product image */}
      <div style={{ position: "relative", height: "180px", flexShrink: 0, overflow: "hidden", borderRadius: "22px 22px 0 0" }}>
        <ImageWithFallback
          src={IMG.shopYarn}
          alt="Blue and white yarn skeins product shot"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }}
        />
        {/* "Limited" badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "var(--accent-yellow)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            padding: "3px 10px",
            fontFamily: "'Caveat', cursive",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          Limited edition
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 50%, var(--surface) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: "14px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <CategoryChip color="var(--accent-yellow)">Shop</CategoryChip>
        <CardTitle>Alpine Merino Bundle</CardTitle>
        <StarRating />

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.02em",
            }}
          >
            €42.00
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              color: "var(--foreground-muted)",
              textDecoration: "line-through",
            }}
          >
            €55.00
          </span>
          <span
            style={{
              padding: "1px 7px",
              borderRadius: "999px",
              background: "var(--success-bg)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "var(--success-text)",
            }}
          >
            −24 %
          </span>
        </div>

        {/* Spec pills */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px", marginBottom: "14px" }}>
          {["100% Merino", "4-ply", "200m", "Free shipping"].map((s) => (
            <span
              key={s}
              style={{
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.6rem",
                color: "var(--foreground-muted)",
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Add to cart CTA */}
        <button
          className="add-to-cart-btn"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
          }}
        >
          <div className="btn-text">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 2H3.5L5.5 9H10.5L12 4H4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="11.5" r="0.8" fill="currentColor"/>
              <circle cx="10" cy="11.5" r="0.8" fill="currentColor"/>
            </svg>
            Add to cart
          </div>
          <div className="btn-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </button>
      </div>
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DIY CARD
// ═══════════════════════════════════════════════════════════════════

// Photo card dimensions
const PHOTO_W = 168;
const PHOTO_H = 196;
const BORDER  = 8;  // white frame around each photo

// Positions: [default, revealed] for each of the 3 photos
// Photo 0 = top visible; Photo 1 = middle; Photo 2 = bottom
const PHOTO_TRANSFORMS = {
  default: [
    // Photo 0 — fully visible on top
    { x:  0, y:   0, rotate:  1.5, zIndex: 3, scale: 1,    opacity: 1   },
    // Photo 1 — peeking behind, slightly lower-right
    { x:  9, y:  10, rotate: -4,   zIndex: 2, scale: 0.97, opacity: 1   },
    // Photo 2 — deepest, further offset
    { x: -7, y:  18, rotate:  6,   zIndex: 1, scale: 0.94, opacity: 1   },
  ],
  revealed: [
    // Photo 0 — slides up and slightly right, partially off-frame
    { x: 22, y: -82, rotate:  9,   zIndex: 2, scale: 0.9,  opacity: 0.7 },
    // Photo 1 — moves to top position (now the featured card)
    { x:  0, y:   0, rotate:  1,   zIndex: 3, scale: 1,    opacity: 1   },
    // Photo 2 — stays behind
    { x: -7, y:  18, rotate:  6,   zIndex: 1, scale: 0.94, opacity: 1   },
  ],
};

const DIY_IMAGES = [IMG.diy1, IMG.diy2, IMG.diy3];
const DIY_ALTS  = [
  "Crocheted blanket kit laid on bed",
  "Group of crocheted flowers on blue surface",
  "Green scissors beside knitting sticks",
];
const DIY_STEPS = ["Choose your pattern", "Gather materials", "Make & wear it!"];

export function DIYCard({ state = "default" }: { state?: DIYState }) {
  const transforms = PHOTO_TRANSFORMS[state];
  const activeStep = state === "default" ? 0 : 1;

  return (
    <CardShell style={{ overflow: "visible" }}>
      {/* Inner clip wrapper for rounded corners */}
      <div style={{ borderRadius: "22px", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", background: "var(--surface)" }}>

        {/* Photo stack area */}
        <div
          style={{
            position: "relative",
            height: "244px",
            flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-yellow) 100%)",
            overflow: "visible",
          }}
        >
          {/* Fiber texture overlay on the photo bg */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='%236B3FA0' fill-opacity='0.05'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Dot grid decoration — top-left */}
          <svg
            width="44" height="44" viewBox="0 0 44 44" fill="none"
            style={{ position: "absolute", top: "10px", left: "12px", opacity: 0.45, zIndex: 0 }}
            aria-hidden
          >
            {[0,1,2,3].flatMap((r) =>
              [0,1,2,3].map((c) => (
                <circle key={`${r}-${c}`} cx={4 + c * 12} cy={4 + r * 12} r="2" fill="var(--primary)" />
              ))
            )}
          </svg>

          {/* Photo stack — centered in area */}
          <div
            style={{
              position: "absolute",
              bottom: "-24px",   // let them float out the bottom edge
              left: "50%",
              transform: "translateX(-50%)",
              width: PHOTO_W + BORDER * 2,
              height: PHOTO_H + BORDER * 2,
            }}
          >
            {[2, 1, 0].map((idx) => {
              const t = transforms[idx];
              return (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: PHOTO_W + BORDER * 2,
                    height: PHOTO_H + BORDER * 2,
                    borderRadius: "12px",
                    background: "white",
                    padding: `${BORDER}px`,
                    boxShadow: "var(--shadow-lg)",
                    overflow: "hidden",
                    transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotate}deg) scale(${t.scale})`,
                    transformOrigin: "center center",
                    zIndex: t.zIndex,
                    opacity: t.opacity,
                    willChange: "transform, opacity",
                  }}
                >
                  <ImageWithFallback
                    src={DIY_IMAGES[idx]}
                    alt={DIY_ALTS[idx]}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "5px", display: "block" }}
                  />

                  {/* Step number on photo */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: BORDER + 5,
                      left: BORDER + 6,
                      background: "var(--bg-overlay-90)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      padding: "1px 8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: "var(--primary)",
                      }}
                    >
                      Step {idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body — sits below the stack */}
        <div style={{ padding: "36px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
          <CategoryChip color="var(--accent-yellow)">DIY</CategoryChip>
          <CardTitle>Make it yourself</CardTitle>
          <CardSubtitle>From pattern to finished piece · 3 steps</CardSubtitle>

          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "var(--background)",
              border: "1px solid var(--border)",
              marginBottom: "12px",
            }}
          >
            {/* Step dots */}
            {DIY_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: i === activeStep ? "22px" : "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: i === activeStep ? "var(--primary)" : "var(--border)",
                    transition: "width 0.3s",
                    flexShrink: 0,
                  }}
                />
                {i === activeStep && (
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.68rem",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {step}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Swipe hint */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
              <path d="M1 5H14M10 1.5L14 5L10 8.5" stroke="var(--foreground-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "0.75rem",
                color: "var(--foreground-muted)",
              }}
            >
              {state === "default" ? "swipe to see next step" : "tap photo to go back"}
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE CARD WRAPPERS  (hover / flip)
// ═══════════════════════════════════════════════════════════════════

export function LearnCardHoverable() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setHovered(h => !h)}
    >
      <motion.div animate={{ y: hovered ? -6 : 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <LearnCard state={hovered ? "revealed" : "default"} />
      </motion.div>
    </div>
  );
}

export function ShopCardFlippable() {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
      style={{ perspective: "1200px", minHeight: "430px" }}
    >
      <motion.div
        style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d" }}
        animate={reduce ? undefined : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div style={{ position: reduce ? "static" : "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <ShopCard state="front" />
        </div>
        <div style={{
          position: reduce ? "static" : "absolute", inset: 0,
          backfaceVisibility: "hidden", transform: "rotateY(180deg)",
          display: reduce ? "none" : undefined,
        }}>
          <ShopCard state="back" />
        </div>
      </motion.div>
    </div>
  );
}

export function DIYCardHoverable() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setHovered(h => !h)}
    >
      <motion.div
        animate={{ scale: hovered ? 1.015 : 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <DIYCard state={hovered ? "revealed" : "default"} />
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL SECTION  (default state — the live page component)
// ═══════════════════════════════════════════════════════════════════

// ── Shared variants ───────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -8 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function HowItWorksSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-16 sm:px-8 sm:py-20"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--primary)",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "6px",
            }}
          >
            your creative journey
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2rem, 3vw, 2.6rem)",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            How Len&Em works
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.95rem",
              color: "var(--foreground-muted)",
              maxWidth: "420px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Learn a skill, find the perfect yarn, make something you'll treasure — all in one place.
          </p>
        </motion.div>

        {/* Card grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ alignItems: "start", perspective: "1000px" }}
        >
          <motion.div variants={cardVariants}>
            <LearnCardHoverable />
          </motion.div>
          <motion.div variants={cardVariants}>
            <ShopCardFlippable />
          </motion.div>
          <motion.div variants={cardVariants}>
            <DIYCardHoverable />
          </motion.div>
        </motion.div>

      </div>
    </motion.section>
  );
}