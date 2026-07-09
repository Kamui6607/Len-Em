import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

// ═══════════════════════════════════════════════════════════════════
// BOW / KNOT GRAPHIC  — static decorative SVG closing asset
// ═══════════════════════════════════════════════════════════════════

export function BowKnotGraphic({
  width = 88,
  color = "var(--accent-pink)",
  accentColor = "var(--primary)",
  opacity = 1,
  animate = false,
}: {
  width?: number;
  color?: string;
  accentColor?: string;
  opacity?: number;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const draw = animate && !reduce;
  const pathProps = draw ? {
    initial: { pathLength: 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true },
    transition: { duration: 1.1, ease: "easeInOut" },
  } : {};

  const h = width * 0.52;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 88 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ opacity }}
    >
      {/* ── Left loop ── */}
      <path
        d="M44,22 C40,8 22,4 14,12 C6,20 14,34 28,28 C36,24 42,22 44,22 Z"
        fill={color}
        fillOpacity="0.45"
        stroke={accentColor}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Left loop inner sheen */}
      <path
        d="M44,22 C41,13 28,8 20,13 C17,15 17,20 21,22"
        stroke="white"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />

      {/* ── Right loop ── */}
      <path
        d="M44,22 C48,8 66,4 74,12 C82,20 74,34 60,28 C52,24 46,22 44,22 Z"
        fill={color}
        fillOpacity="0.45"
        stroke={accentColor}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Right loop inner sheen */}
      <path
        d="M44,22 C47,13 60,8 68,13 C71,15 71,20 67,22"
        stroke="white"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />

      {/* ── Tail left — animate draw if enabled ── */}
      <motion.path
        d="M44,22 C40,28 32,36 26,42"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        {...pathProps}
      />
      <path
        d="M44,22 C42,30 36,38 30,44"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* ── Tail right — animate draw if enabled ── */}
      <motion.path
        d="M44,22 C48,28 56,36 62,42"
        stroke={accentColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        {...(draw ? { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true }, transition: { duration: 0.8, delay: 0.3 } } : {})}
      />
      <path
        d="M44,22 C46,30 52,38 58,44"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* ── Centre knot ── */}
      <ellipse
        cx="44" cy="22" rx="5.5" ry="4.5"
        fill={accentColor}
        fillOpacity="0.85"
      />
      <ellipse
        cx="44" cy="22" rx="2.5" ry="2"
        fill={color}
        fillOpacity="0.9"
      />

      {/* ── Tiny loop end flourishes on tails ── */}
      <circle cx="26" cy="43" r="1.8" fill={accentColor} fillOpacity="0.55" />
      <circle cx="62" cy="43" r="1.8" fill={accentColor} fillOpacity="0.55" />
    </svg>
  );
}

// ── Shared variants ───────────────────────────────────────────────────────────

const ctaContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const ctaItemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const footerContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const footerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const footerColumnVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ═══════════════════════════════════════════════════════════════════
// CLOSING CTA SECTION
// ═══════════════════════════════════════════════════════════════════

export function ClosingCTA() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--primary)",
        padding: "7rem 2rem 7.5rem",
      }}
    >
      {/* ── Soft radial warm-glow graphic ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* Large warm-pink bloom — left of centre — breathing glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          style={{
            position: "absolute",
            width: "680px", height: "480px",
            top: "-100px", left: "8%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(240,196,224,0.28) 0%, transparent 65%)",
            filter: "blur(48px)",
          }}
        />

        {/* Warm-yellow bloom — right of centre — breathing glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          style={{
            position: "absolute",
            width: "560px", height: "380px",
            bottom: "-80px", right: "5%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(245,239,168,0.22) 0%, transparent 65%)",
            filter: "blur(44px)",
          }}
        />

        {/* Core radial — centred, the "spotlight" — breathing glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{
            position: "absolute",
            width: "900px", height: "560px",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.09) 0%, rgba(155,111,214,0.12) 40%, transparent 70%)",
            filter: "blur(32px)",
          }}
        />

        {/* Floating particles */}
        {[15, 40, 65, 85].map((left, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -220, opacity: [0, 0.6, 0] }}
            transition={{ duration: 6 + i, repeat: Infinity, delay: i * 1.4, ease: "easeInOut" }}
            style={{
              position: "absolute", left: `${left}%`, bottom: "10%",
              width: "5px", height: "5px", borderRadius: "50%",
              background: i % 2 === 0 ? "rgba(240,196,224,0.7)" : "rgba(245,239,168,0.7)",
            }}
          />
        ))}

        {/* Fine fiber texture at low opacity */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%23ffffff' fill-opacity='0.04'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
        }} />

        {/* ── Large decorative stitch loops — far background ── */}
        <svg
          viewBox="0 0 1200 200"
          width="100%"
          height="200"
          style={{ position: "absolute", top: "-30px", left: 0, opacity: 0.07 }}
          aria-hidden
        >
          {/* Giant arch motif left */}
          <path
            d="M-40,180 C-40,60 60,-20 160,-20 C260,-20 360,60 360,180"
            stroke="white" strokeWidth="22" fill="none" strokeLinecap="round"
          />
          {/* Giant ring motif right */}
          <circle cx="1000" cy="90" r="130" stroke="white" strokeWidth="22" fill="none" />
          <circle cx="1000" cy="90" r="70"  stroke="white" strokeWidth="12" fill="none" />
          {/* Figure-8 centre */}
          <ellipse cx="600" cy="50"  rx="90" ry="55" stroke="white" strokeWidth="14" fill="none" />
          <ellipse cx="600" cy="155" rx="90" ry="55" stroke="white" strokeWidth="14" fill="none" />
        </svg>

        {/* Bottom decorative motifs */}
        <svg
          viewBox="0 0 1200 180"
          width="100%"
          height="180"
          style={{ position: "absolute", bottom: "-20px", left: 0, opacity: 0.055 }}
          aria-hidden
        >
          <path
            d="M900,180 C900,60 1000,-10 1100,-10 C1200,-10 1300,60 1300,180"
            stroke="white" strokeWidth="18" fill="none" strokeLinecap="round"
          />
          <circle cx="200" cy="80" r="110" stroke="white" strokeWidth="18" fill="none" />
          <circle cx="200" cy="80" r="56"  stroke="white" strokeWidth="10" fill="none" />
        </svg>

        {/* Floating accent-pink dots */}
        <svg
          width="100%" height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.55 }}
          aria-hidden
        >
          {[
            [8, 15], [15, 72], [6, 38],
            [88, 22], [92, 68], [85, 45],
            [50, 8],  [48, 90],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={`${cx}%`} cy={`${cy}%`}
              r={i % 3 === 0 ? 3 : 2}
              fill={i % 2 === 0 ? "rgba(240,196,224,0.6)" : "rgba(245,239,168,0.5)"}
            />
          ))}
        </svg>
      </div>

      {/* ── Content ── */}
      <motion.div
        variants={ctaContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "780px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Eyebrow */}
        <motion.div
          variants={ctaItemVariants}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 16px",
            borderRadius: "999px",
            background: "color-mix(in srgb, var(--primary-foreground) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary-foreground) 20%, transparent)",
            backdropFilter: "blur(8px)",
            marginBottom: "28px",
          }}
        >
          <Sparkles size={12} style={{ color: "var(--accent-yellow)" }} />
          <span style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "color-mix(in srgb, var(--primary-foreground) 85%, transparent)",
            letterSpacing: "0.05em",
          }}>
            Tham gia cùng 6.200 người yêu thích
          </span>
        </motion.div>

        {/* Headline — split for typographic rhythm */}
        <motion.h2 variants={ctaItemVariants} style={{ margin: "0 0 20px", padding: 0 }}>
          <span style={{
            display: "block",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
            fontWeight: 700,
            color: "var(--primary-foreground)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}>
            Dự án handmade
          </span>
          <motion.span
            variants={ctaItemVariants}
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--accent-yellow)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            tiếp theo của bạn bắt đầu từ đây,
          </motion.span>
        </motion.h2>

        {/* Sub-line */}
        <motion.p
          variants={ctaItemVariants}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            color: "color-mix(in srgb, var(--primary-foreground) 65%, transparent)",
            lineHeight: 1.65,
            maxWidth: "500px",
            margin: "0 auto 40px",
          }}
        >
          Học từ những người làm thực thụ, mua nguyên liệu chọn lọc,
          và chia sẻ thành quả của bạn — tất cả trong một góc ấm áp của internet.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={ctaItemVariants}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" as const }}
        >
          {/* Primary CTA — fill with primary-foreground */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              borderRadius: "999px",
              background: "var(--primary-foreground)",
              color: "var(--primary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.92rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              textDecoration: "none",
              boxShadow: "0 6px 24px rgba(28,21,38,0.25), 0 2px 8px rgba(28,21,38,0.15)",
              whiteSpace: "nowrap" as const,
            }}
          >
            Bắt đầu dự án đầu tiên
            <ArrowRight size={15} strokeWidth={2.5} />
          </motion.a>

          {/* Secondary CTA — ghost */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 28px",
              borderRadius: "999px",
              background: "color-mix(in srgb, var(--primary-foreground) 10%, transparent)",
              border: "1.5px solid color-mix(in srgb, var(--primary-foreground) 35%, transparent)",
              color: "color-mix(in srgb, var(--primary-foreground) 90%, transparent)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.92rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              textDecoration: "none",
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap" as const,
            }}
          >
            Khám phá cửa hàng
          </motion.a>
        </motion.div>

        {/* Bow flourish beneath buttons */}
        <motion.div
          variants={ctaItemVariants}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 0.55, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.5, type: "spring" }}
          style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}
        >
          <BowKnotGraphic width={64} color="var(--accent-yellow)" accentColor="color-mix(in srgb, var(--primary-foreground) 70%, transparent)" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER LOGO (matches Navbar, re-tuned for both themes)
// ═══════════════════════════════════════════════════════════════════

function FooterLogo() {
  return (
    <a href="#" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
      <svg width="30" height="30" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="color-mix(in srgb, var(--footer-text) 12%, transparent)" />
        <circle cx="14" cy="14" r="7" fill="color-mix(in srgb, var(--footer-text-muted) 20%, transparent)" stroke="var(--footer-text-muted)" strokeWidth="1.2" />
        <path d="M8 11.5C10 12.4 12 12.7 14 12.6C16 12.5 17.8 11.9 19.5 10.8" stroke="var(--footer-text-muted)" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M7.5 15C9.5 14.0 12 13.4 14 13.6C16.2 13.8 18 14.6 19.8 15.8" stroke="var(--footer-text-muted)" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M11 7.5C11.6 9.5 11.8 11.8 11.7 14C11.6 16.2 11.0 18.4 9.9 20.2" stroke="var(--footer-text-muted)" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M17 7.8C16.4 9.8 16.2 12 16.3 14C16.4 16.2 17 18.4 18.1 20.0" stroke="var(--footer-text-muted)" strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="22" y2="22" stroke="var(--footer-text-muted)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="6.5" cy="6.5" r="1.5" fill="var(--footer-text-muted)" />
      </svg>
      <span style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 600, color: "var(--footer-text)", letterSpacing: "-0.01em" }}>Len</span>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.35rem", fontWeight: 500, color: "var(--footer-text-muted)", lineHeight: 1, marginTop: "2px" }}>&</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 600, color: "var(--footer-text)", letterSpacing: "-0.01em" }}>Em</span>
      </span>
    </a>
  );
}

// ── Social icon SVGs ──────────────────────────────────────────────────────────

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.a
      href="#"
      aria-label={label}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: "color-mix(in srgb, var(--footer-text) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--footer-text) 12%, transparent)",
        textDecoration: "none",
        color: "var(--footer-text-muted)",
      }}
    >
      {children}
    </motion.a>
  );
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="11.5" cy="4.5" r="0.9" fill="currentColor"/>
    </svg>
  );
}

function IconPinterest() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 11.5C6.8 10.4 7.2 9.2 7.5 8.5C7.1 8.2 6.8 7.6 6.8 6.8C6.8 5.5 7.7 4.5 9 4.5C10.1 4.5 10.8 5.2 10.8 6.2C10.8 7.4 10.1 8.8 8.9 8.8C8.4 8.8 8 8.5 8 8C7.7 9.1 7.2 10.2 6.9 11C6.8 11.2 6.6 11.4 6.5 11.5Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 5.8L10.2 8L6.5 10.2V5.8Z" fill="currentColor"/>
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 2C10.7 3.2 11.4 4.1 12.5 4.5V6.5C11.7 6.4 10.9 6.1 10.5 5.6V9.8C10.5 11.6 9.1 13 7.2 13C5.4 13 4 11.6 4 9.8C4 8 5.4 6.6 7.2 6.6C7.4 6.6 7.6 6.6 7.8 6.7V8.7C7.6 8.6 7.4 8.6 7.2 8.6C6.5 8.6 6 9.1 6 9.8C6 10.5 6.5 11 7.2 11C7.9 11 8.5 10.4 8.5 9.7V2H10.5Z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Footer link column ─────────────────────────────────────────────────────────

function FooterColumn({ heading, links }: { heading: string; links: string[] }) {
  return (
    <motion.div
      variants={footerColumnVariants}
      style={{ width: "100%" }}
    >
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: "var(--footer-text-muted)",
        marginBottom: "16px",
      }}>
        {heading}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: "10px" }}>
        {links.map((link) => (
          <li key={link}>
            <motion.a
              href="#"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.83rem",
                fontWeight: 400,
                color: "var(--footer-text-muted)",
                textDecoration: "none",
                letterSpacing: "0.01em",
                lineHeight: 1.4,
                transition: "color 0.15s",
              }}
            >
              {link}
            </motion.a>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════

export function LenEmFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      style={{
        // ── Local CSS variables, isolated from theme.css tokens ──
        // This ensures footer always keeps dark-bg / light-text regardless
        // of --foreground/--card changes elsewhere on the page.
        "--footer-bg": "#1A1020",
        "--footer-text": "#F5F0E8",
        "--footer-text-muted": "#D0C4DC",
        "--footer-text-dim": "#A898B0",
        "--footer-border": "rgba(255,255,255,0.06)",
        "--footer-glow": "rgba(155,111,214,0.12)",
        "--footer-accent": "rgba(240,196,224,0.18)",

        background: "var(--footer-bg)",
        color: "var(--footer-text)",
        borderTop: "1px solid var(--footer-border)",
        position: "relative",
        overflow: "hidden",
      } as React.CSSProperties}
    >
      {/* Subtle ambient bleed from the CTA above */}
      <div style={{
        position: "absolute",
        width: "600px", height: "200px",
        top: "-80px", left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: `radial-gradient(ellipse, var(--footer-glow) 0%, transparent 70%)`,
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }} className="px-4 sm:px-8">

        {/* ── Main footer grid ── */}
        <motion.div
          variants={footerContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-3 sm:gap-6 lg:gap-16"
          style={{ padding: "36px 0 32px", borderBottom: "1px solid var(--footer-border)" }}
        >
          {/* ── Brand column ── */}
          <motion.div variants={footerItemVariants} className="col-span-3 lg:col-span-1">
            <FooterLogo />

            <p style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--footer-text-muted)",
              margin: "14px 0 0",
              lineHeight: 1.4,
              letterSpacing: "0.02em",
            }}>
              Workshop ấm cúng,<br />kết quả tinh tế.
            </p>

            <div style={{ marginTop: "18px" }}>
              <BowKnotGraphic
                width={76}
                color="color-mix(in srgb, var(--footer-text) 25%, transparent)"
                accentColor="var(--footer-text-muted)"
                animate
              />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
              <SocialIcon label="Instagram">  <IconInstagram  /> </SocialIcon>
              <SocialIcon label="Pinterest">  <IconPinterest  /> </SocialIcon>
              <SocialIcon label="YouTube">    <IconYouTube    /> </SocialIcon>
              <SocialIcon label="TikTok">     <IconTikTok     /> </SocialIcon>
            </div>
          </motion.div>

          <FooterColumn heading="Shop"    links={["New Arrivals","Yarn & Fibres","Needles & Tools","Kits & Bundles","Gift Cards"]} />
          <FooterColumn heading="Learn"   links={["Browse Courses","Beginner Track","Pattern Library","Creator Programme","Community"]} />
          <FooterColumn heading="Connect" links={["Our Studio","Newsletter","Wholesale","Press & Media","Contact"]} />
        </motion.div>

        {/* ── Bottom bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-2"
          style={{ padding: "16px 0 20px" }}
        >
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.72rem",
            color: "var(--footer-text-dim)",
            margin: 0,
            letterSpacing: "0.02em",
          }}>
            © 2025 Len&Em Studio.{" "}
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: "0.78rem", color: "var(--footer-text-muted)" }}>
              Made with ♥ in Amsterdam.
            </span>
          </p>

          <div style={{ display: "flex", gap: "16px" }}>
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href="#" style={{
                fontFamily: "'Inter', sans-serif", fontSize: "0.68rem",
                color: "var(--footer-text-dim)", textDecoration: "none", letterSpacing: "0.02em",
              }}>
                {item}
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.footer>
  );
}