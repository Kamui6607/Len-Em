import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useSearchParams } from "react-router";

// ═══════════════════════════════════════════════════════════════════
// LARGE GIFT BOX SVG — celebratory, bow-tied, with sparkles
// ═══════════════════════════════════════════════════════════════════

function LargeGiftBox({ size = 200 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="Gift box with bow"
    >
      <defs>
        {/* Warm candlelit glow behind the box */}
        <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="var(--bg-1)" stopOpacity="0.9" />
          <stop offset="30%"  stopColor="#F5EFA8" stopOpacity="0.55" />
          <stop offset="65%"  stopColor="#F0C4E0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F0C4E0" stopOpacity="0"    />
        </radialGradient>
        {/* Box body fill gradient */}
        <linearGradient id="lg-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#F5EFA8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F0C4E0" stopOpacity="0.55" />
        </linearGradient>
        {/* Ribbon fill gradient */}
        <linearGradient id="lg-rib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9B6FD6" />
          <stop offset="100%" stopColor="#6B3FA0" />
        </linearGradient>
        {/* Bow fill gradient */}
        <linearGradient id="lg-bow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#6B3FA0" />
        </linearGradient>
      </defs>

      {/* ── Glow background disc ── */}
      <circle cx="100" cy="105" r="96" fill="url(#lg-glow)" />

      {/* ── Ground shadow ── */}
      <ellipse cx="100" cy="180" rx="50" ry="7"
        fill="var(--primary)" fillOpacity="0.08" />

      {/* ══ BOX BODY ══ */}
      <rect x="58" y="110" width="84" height="60" rx="5"
        fill="url(#lg-box)"
        stroke="var(--primary)" strokeWidth="1.8" />
      {/* Body inner sheen */}
      <rect x="60" y="112" width="80" height="20" rx="3"
        fill="white" fillOpacity="0.18" />

      {/* ══ BOX LID (slightly wider) ══ */}
      <rect x="50" y="90" width="100" height="22" rx="5"
        fill="#F5EFA8" fillOpacity="0.8"
        stroke="var(--primary)" strokeWidth="1.8" />
      {/* Lid sheen */}
      <rect x="52" y="92" width="96" height="8" rx="3"
        fill="white" fillOpacity="0.28" />

      {/* ══ RIBBON — vertical ══ */}
      <rect x="93" y="90" width="14" height="80" rx="3"
        fill="url(#lg-rib)" />
      {/* Ribbon shine */}
      <rect x="95" y="90" width="4" height="80" rx="2"
        fill="white" fillOpacity="0.22" />

      {/* ══ RIBBON — horizontal ══ */}
      <rect x="58" y="122" width="84" height="11" rx="3"
        fill="url(#lg-rib)" />
      {/* Ribbon shine */}
      <rect x="58" y="124" width="84" height="3" rx="1.5"
        fill="white" fillOpacity="0.22" />

      {/* ══ RIBBON CROSS (darker at intersection) ══ */}
      <rect x="93" y="122" width="14" height="11" rx="2"
        fill="var(--primary)" fillOpacity="0.4" />

      {/* ══ BOW — left loop ══ */}
      <path
        d="M100,90 C90,70 62,62 68,78 C73,91 88,90 100,90 Z"
        fill="url(#lg-bow)" />
      {/* Left loop inner highlight */}
      <path
        d="M100,90 C94,78 76,74 74,80"
        stroke="white" strokeWidth="1.2" strokeLinecap="round"
        fill="none" opacity="0.3" />

      {/* ══ BOW — right loop ══ */}
      <path
        d="M100,90 C110,70 138,62 132,78 C127,91 112,90 100,90 Z"
        fill="url(#lg-bow)" />
      {/* Right loop inner highlight */}
      <path
        d="M100,90 C106,78 124,74 126,80"
        stroke="white" strokeWidth="1.2" strokeLinecap="round"
        fill="none" opacity="0.3" />

      {/* ══ BOW — left tail ══ */}
      <path
        d="M100,90 C90,100 78,110 68,122"
        stroke="var(--primary)" strokeWidth="8"
        strokeLinecap="round" fill="none" />
      <path
        d="M100,90 C90,100 78,110 68,122"
        stroke="white" strokeWidth="2"
        strokeLinecap="round" fill="none" opacity="0.2" />

      {/* ══ BOW — right tail ══ */}
      <path
        d="M100,90 C110,100 122,110 132,122"
        stroke="var(--primary)" strokeWidth="8"
        strokeLinecap="round" fill="none" />
      <path
        d="M100,90 C110,100 122,110 132,122"
        stroke="white" strokeWidth="2"
        strokeLinecap="round" fill="none" opacity="0.2" />

      {/* ══ BOW — centre knot ══ */}
      <ellipse cx="100" cy="90" rx="9" ry="7"
        fill="var(--primary)" />
      <ellipse cx="100" cy="90" rx="4" ry="3"
        fill="var(--accent-yellow)" fillOpacity="0.65" />

      {/* ══ SPARKLES ══ */}
      {/* Large sparkle — top right */}
      <path d="M150,54 L152,47 L154,54 L161,56 L154,58 L152,65 L150,58 L143,56 Z"
        fill="var(--accent-yellow)" fillOpacity="0.95" />
      {/* Medium sparkle — top left */}
      <path d="M50,56 L51.5,51 L53,56 L58,57.5 L53,59 L51.5,64 L50,59 L45,57.5 Z"
        fill="var(--accent-pink)" fillOpacity="0.85" />
      {/* Small sparkle — right side */}
      <path d="M164,114 L165,110 L166,114 L170,115 L166,116 L165,120 L164,116 L160,115 Z"
        fill="var(--accent-yellow)" fillOpacity="0.75" />
      {/* Tiny sparkle — lower left */}
      <path d="M44,142 L45,138 L46,142 L50,143 L46,144 L45,148 L44,144 L40,143 Z"
        fill="var(--accent-pink)" fillOpacity="0.65" />
      {/* Dot sparkles — scattered */}
      {[[162,72,4],[42,78,3],[156,148,3],[48,108,2.5]].map(([x,y,r],i) => (
        <circle key={i} cx={x} cy={y} r={r}
          fill={i % 2 === 0 ? "var(--accent-yellow)" : "var(--accent-pink)"}
          fillOpacity="0.7" />
      ))}
    </svg>
  );
}

// ── Pom-pom confetti piece ─────────────────────────────────────

function PomPomShape({
  size, color, opacity = 1,
}: {
  size: number; color: string; opacity?: number;
}) {
  const r = size / 2;
  const fib = Math.max(2, size * 0.22);
  const count = size >= 20 ? 12 : 8;

  return (
    <svg
      width={size + fib * 2}
      height={size + fib * 2}
      viewBox={`0 0 ${size + fib * 2} ${size + fib * 2}`}
      fill="none"
      overflow="visible"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const cx = r + fib;
        const cy = r + fib;
        const x1 = cx + Math.cos(a) * (r * 0.92);
        const y1 = cy + Math.sin(a) * (r * 0.92);
        const x2 = cx + Math.cos(a) * (r + fib);
        const y2 = cy + Math.sin(a) * (r + fib);
        return (
          <line key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color}
            strokeWidth={Math.max(1, size * 0.09)}
            strokeLinecap="round"
            opacity={opacity * 0.78}
          />
        );
      })}
      <circle cx={r + fib} cy={r + fib} r={r}
        fill={color} opacity={opacity} />
      <circle cx={r + fib} cy={r + fib} r={r * 0.65}
        fill={color} fillOpacity={opacity * 0.25}
        stroke={color} strokeWidth={r * 0.08} strokeOpacity={opacity * 0.3} />
      <circle
        cx={r + fib - r * 0.28}
        cy={r + fib - r * 0.28}
        r={r * 0.38}
        fill="white" fillOpacity={0.28 * opacity} />
      <circle cx={r + fib} cy={r + fib} r={r * 0.12}
        fill="white" fillOpacity={0.35 * opacity} />
    </svg>
  );
}

const CONFETTI_PIECES = [
  { size:22, color:"var(--accent-pink)",   top:"6%",    left:"6%",    rotate: 15,  opacity:0.92 },
  { size:13, color:"var(--accent-yellow)", top:"13%",   left:"19%",   rotate:-5,   opacity:0.85 },
  { size:30, color:"var(--primary)",       top:"4%",    right:"8%",   rotate: 22,  opacity:0.75 },
  { size:16, color:"var(--accent-pink)",   top:"18%",   right:"4%",   rotate:-12,  opacity:0.88 },
  { size:10, color:"var(--accent-yellow)", top:"8%",    left:"36%",   rotate: 8,   opacity:0.80 },
  { size: 8, color:"var(--primary)",       top:"3%",    right:"26%",  rotate:-20,  opacity:0.65 },
  { size:18, color:"var(--accent-yellow)", top:"42%",   left:"2%",    rotate: 10,  opacity:0.82 },
  { size:12, color:"var(--accent-pink)",   top:"38%",   right:"3%",   rotate:-18,  opacity:0.78 },
  { size:24, color:"var(--primary)",       top:"54%",   left:"5%",    rotate: 6,   opacity:0.70 },
  { size:14, color:"var(--accent-yellow)", top:"58%",   right:"2%",   rotate:-8,   opacity:0.75 },
  { size:26, color:"var(--accent-pink)",   bottom:"16%",left:"7%",    rotate: 12,  opacity:0.85 },
  { size:18, color:"var(--accent-yellow)", bottom:"12%",right:"5%",   rotate:-10,  opacity:0.80 },
  { size:11, color:"var(--primary)",       bottom:"30%",left:"3%",    rotate: 25,  opacity:0.68 },
  { size:15, color:"var(--accent-pink)",   bottom:"25%",right:"12%",  rotate:-15,  opacity:0.72 },
  { size: 9, color:"var(--accent-yellow)", bottom:"8%", left:"20%",   rotate: 4,   opacity:0.65 },
  { size: 8, color:"var(--primary)",       bottom:"6%", right:"22%",  rotate:-22,  opacity:0.60 },
];

function ConfettiLayer() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {CONFETTI_PIECES.map((piece, i) => (
        <div
          key={i}
          style={{
            position:"absolute",
            top: piece.top,
            bottom: piece.bottom,
            left: piece.left,
            right: piece.right,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        >
          <PomPomShape size={piece.size} color={piece.color} opacity={piece.opacity} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER SUCCESS PAGE
// ═══════════════════════════════════════════════════════════════════

export function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "LNE-2503";
  const date = searchParams.get("date") || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{
      minHeight:"100vh",
      background:"var(--background)",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      padding:"60px 24px 80px",
      position:"relative",
      overflow:"hidden",
    }}>
      {/* ── Confetti pom-poms ── */}
      <ConfettiLayer />

      {/* ── Deep warm ambient glow ── */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{
          position:"absolute",
          width:"700px", height:"700px",
          top:"50%", left:"50%",
          transform:"translate(-50%, -50%)",
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(245,239,168,0.32) 0%, rgba(240,196,224,0.22) 40%, transparent 72%)",
          filter:"blur(40px)",
        }} />
        <div style={{
          position:"absolute",
          width:"900px", height:"600px",
          top:"50%", left:"50%",
          transform:"translate(-50%, -52%)",
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(240,196,224,0.18) 0%, rgba(107,63,160,0.08) 55%, transparent 75%)",
          filter:"blur(55px)",
        }} />
      </div>

      {/* ── Main content ── */}
      <div style={{
        position:"relative",
        zIndex:1,
        width:"100%", maxWidth:"480px",
        display:"flex", flexDirection:"column", alignItems:"center",
        textAlign:"center",
        gap:"0",
      }}>
        {/* ── Gift box with warm glow ── */}
        <div style={{ position:"relative", marginBottom:"8px" }}>
          <div style={{
            position:"absolute",
            inset:"-40px",
            borderRadius:"50%",
            background:"radial-gradient(ellipse at 50% 55%, rgba(245,239,168,0.55) 0%, rgba(240,196,224,0.38) 40%, transparent 70%)",
            filter:"blur(24px)",
            zIndex:0,
          }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <LargeGiftBox size={200} />
          </div>
        </div>

        {/* ── Eyebrow chip ── */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"7px",
          padding:"5px 16px",
          borderRadius:"999px",
          background:"var(--accent-pink)",
          border:"1px solid var(--border)",
          marginBottom:"18px",
        }}>
          <span style={{ fontSize:"0.75rem" }}>✦</span>
          <span style={{
            fontFamily:"'Caveat',cursive",
            fontSize:"0.85rem", fontWeight:700,
            color:"var(--primary)", letterSpacing:"0.04em",
          }}>
            Order confirmed
          </span>
          <span style={{ fontSize:"0.75rem" }}>✦</span>
        </div>

        {/* ── Heading ── */}
        <h1 style={{
          fontFamily:"'Playfair Display',Georgia,serif",
          fontSize:"clamp(1.7rem, 3.5vw, 2.2rem)",
          fontWeight:700,
          color:"var(--foreground)",
          letterSpacing:"-0.025em",
          lineHeight:1.12,
          margin:"0 0 10px",
        }}>
          Your order is being
          <span style={{ display:"block", fontStyle:"italic", color:"var(--primary)" }}>
            made with love
          </span>
        </h1>

        {/* ── Sub-copy ── */}
        <p style={{
          fontFamily:"'Caveat',cursive",
          fontSize:"0.95rem", color:"var(--foreground-muted)",
          letterSpacing:"0.02em", lineHeight:1.5,
          margin:"0 0 22px",
        }}>
          We'll send you a tracking link as soon as<br />
          your package is on its way.
        </p>

        {/* ── Order number ── */}
        <div style={{
          padding:"8px 20px",
          borderRadius:"10px",
          background:"var(--surface)",
          border:"1px solid var(--border)",
          marginBottom:"28px",
          display:"flex", alignItems:"center", gap:"8px",
        }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--foreground-muted)" }}>
            Order
          </span>
          <span style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:"0.95rem", fontWeight:700, fontStyle:"italic",
            color:"var(--primary)", letterSpacing:"-0.01em",
          }}>
            #{orderId}
          </span>
          <span style={{ width:"1px", height:"14px", background:"var(--border)" }} />
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:"0.78rem", color:"var(--foreground-muted)" }}>
            {date}
          </span>
        </div>

        {/* ── CTAs ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px", width:"100%" }}>
          {/* Primary CTA */}
          <Link
            to={`/orders/my/${orderId}`}
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
              padding:"14px 32px",
              borderRadius:"999px",
              border:"none",
              background:"var(--primary)",
              color:"var(--primary-foreground)",
              fontFamily:"'Inter',sans-serif",
              fontSize:"0.95rem", fontWeight:700,
              textDecoration:"none",
              boxShadow:"0 6px 22px rgba(107,63,160,0.30)",
            }}
          >
            View order details
            <ArrowRight size={15} strokeWidth={2} />
          </Link>

          {/* Secondary CTA */}
          <Link
            to="/shop"
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
              padding:"13px 32px",
              borderRadius:"999px",
              border:"1.5px solid var(--border)",
              background:"transparent",
              color:"var(--foreground-muted)",
              fontFamily:"'Inter',sans-serif",
              fontSize:"0.9rem", fontWeight:500,
              textDecoration:"none",
            }}
          >
            <ShoppingBag size={14} strokeWidth={1.8} style={{ color:"var(--primary)" }} />
            Continue shopping
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p style={{
          fontFamily:"'Caveat',cursive",
          fontSize:"0.78rem", color:"var(--foreground-muted)",
          marginTop:"24px", letterSpacing:"0.02em",
        }}>
          ✦ A confirmation email is on its way to your inbox
        </p>
      </div>
    </div>
  );
}