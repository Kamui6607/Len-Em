import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { Link } from "react-router";
import { Wordmark } from "./brand/Wordmark";

const MotionLink = motion.create(Link);

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

  // Luôn có object đầy đủ, không bao giờ {} — chỉ đổi giá trị bên trong.
  // Khi draw=false, animate về đúng initial (pathLength giữ nguyên trạng
  // thái vẽ đầy đủ) thay vì bỏ hẳn props animation.
  const pathProps1 = {
    initial: { pathLength: draw ? 0 : 1 },
    animate: { pathLength: 1 },
    transition: draw ? { duration: 1.1, ease: "easeInOut" } : { duration: 0 },
  };
  const pathProps2 = {
    initial: { pathLength: draw ? 0 : 1 },
    animate: { pathLength: 1 },
    transition: draw ? { duration: 0.8, delay: 0.3 } : { duration: 0 },
  };

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
        {...pathProps1}
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
        {...pathProps2}
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
  const { t } = useLanguage();
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        // Nền = họa tiết sợi len (public/pattern.png); màu nền phòng khi ảnh chưa tải
        background: "#EC769A url('/pattern.png') center / cover no-repeat",
        paddingTop: "var(--section-py-lg)",
        paddingBottom: "var(--section-py-lg)",
        paddingLeft: "2rem",
        paddingRight: "2rem",
      }}
    >
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
            {t("cta.eyebrow")}
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
            {t("cta.headline1")}
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
            {t("cta.headline2")}
          </motion.span>
          <motion.span
            variants={ctaItemVariants}
            style={{
              display: "block",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
              fontWeight: 700,
              color: "var(--primary-foreground)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {t("cta.headline3")}
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
          {t("cta.subtitle")}
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={ctaItemVariants}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" as const }}
        >
          {/* Primary CTA — fill with primary-foreground */}
          <MotionLink
            to="/learn"
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
            {t("cta.ctaStart")}
            <ArrowRight size={15} strokeWidth={2.5} />
          </MotionLink>

          {/* Secondary CTA — ghost */}
          <MotionLink
            to="/shop"
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
            {t("cta.ctaShop")}
          </MotionLink>
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
    <Link to="/" aria-label="Len&Em" className="group" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
      <img
        src="/cuu.png"
        alt=""
        width={39}
        height={32}
        className="brand-mark"
        style={{ display: "block" }}
        draggable={false}
      />
      <Wordmark className="h-[30px]" />
    </Link>
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

type FooterLink = { label: string; to: string };

function FooterColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
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
          <li key={link.label}>
            <MotionLink
              to={link.to}
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
              {link.label}
            </MotionLink>
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
  const { t } = useLanguage();
  return (
    <motion.footer
      className="lenem-footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      style={{
        // Màu footer lấy từ token --footer-* trong theme.css
        // (light: trắng + chữ tím than, dark: tím tối + chữ sáng).
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-y-8 gap-x-4 sm:gap-6 lg:gap-16"
          style={{ padding: "36px 0 32px", borderBottom: "1px solid var(--footer-border)" }}
        >
          {/* ── Brand column ── */}
            <motion.div variants={footerItemVariants} className="col-span-2 sm:col-span-3 lg:col-span-1">
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
              {t("cta.footprint")}
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

          <FooterColumn heading={t("cta.footerShop")}    links={[
            { label: t("cta.footerNewArrivals"), to: "/shop?sort=newest" },
            { label: t("cta.footerYarn"),        to: "/shop?search=len" },
            { label: t("cta.footerNeedles"),     to: "/shop?search=kim" },
            { label: t("cta.footerKits"),        to: "/shop?view=combo" },
            { label: t("cta.footerGiftCards"),   to: "/shop" },
          ]} />
          <FooterColumn heading={t("cta.footerLearn")}   links={[
            { label: t("cta.footerCourses"),   to: "/learn" },
            { label: t("cta.footerBeginner"),  to: "/learn" },
            { label: t("cta.footerPatterns"),  to: "/diy" },
            { label: t("cta.footerCreator"),   to: "/diy/create" },
            { label: t("cta.footerCommunity"), to: "/diy" },
          ]} />
          <FooterColumn heading={t("cta.footerConnect")} links={[
            { label: t("cta.footerStudio"),     to: "/about" },
            { label: t("cta.footerNewsletter"), to: "/about" },
            { label: t("cta.footerWholesale"),  to: "/about" },
            { label: t("cta.footerPress"),      to: "/about" },
            { label: t("cta.footerContact"),    to: "/messages" },
          ]} />
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
            {t("cta.copyright")}{" "}
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: "0.78rem", color: "var(--footer-text-muted)" }}>
              {t("cta.madeWith")}
            </span>
          </p>

          <div style={{ display: "flex", gap: "16px" }}>
            {[t("cta.privacy"), t("cta.terms"), t("cta.cookies")].map((item) => (
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