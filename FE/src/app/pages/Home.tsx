import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";

interface HomeProps {
  onSignIn?: () => void;
  isAuthOpen?: boolean;
}

const SLIDES = [
  { id: "hero", label: "Hero — Find Your Cozy Corner" },
  { id: "features", label: "Features — What We Offer" },
  { id: "why", label: "Why CozyStitch" },
  { id: "cta", label: "CTA — Start Your Cozy Era" },
];

export function Home({ onSignIn, isAuthOpen = false }: HomeProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [heroIn, setHeroIn] = useState(false);
  const wheelAccRef = useRef(0);
  const lastWheelRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (
        isTransitioning ||
        idx === activeSlide ||
        idx < 0 ||
        idx >= SLIDES.length
      )
        return;
      setIsTransitioning(true);
      setPrevSlide(activeSlide);
      setActiveSlide(idx);
      setTimeout(() => {
        setIsTransitioning(false);
        setPrevSlide(-1);
      }, 1050);
    },
    [activeSlide, isTransitioning],
  );

  const goToRef = useRef(goTo);
  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  const activeSlidRef = useRef(activeSlide);
  useEffect(() => {
    activeSlidRef.current = activeSlide;
  }, [activeSlide]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current > 600) wheelAccRef.current = 0;
      lastWheelRef.current = now;
      wheelAccRef.current += e.deltaY;
      if (Math.abs(wheelAccRef.current) > 80) {
        const dir = wheelAccRef.current > 0 ? 1 : -1;
        wheelAccRef.current = 0;
        goToRef.current(activeSlidRef.current + dir);
      }
    };
    const el = containerRef.current;
    el?.addEventListener("wheel", handleWheel, { passive: false });
    return () => el?.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50)
        goToRef.current(activeSlidRef.current + (dy > 0 ? 1 : -1));
    };
    const el = containerRef.current;
    el?.addEventListener("touchstart", handleTouchStart);
    el?.addEventListener("touchend", handleTouchEnd);
    return () => {
      el?.removeEventListener("touchstart", handleTouchStart);
      el?.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown")
        goToRef.current(activeSlidRef.current + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp")
        goToRef.current(activeSlidRef.current - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Auth-gated navigation helper
  const requireAuth = (path: string) => {
    if (isAuthenticated) navigate(path);
    else if (onSignIn) onSignIn();
  };

  const handleGetStarted = () => requireAuth("/shop");
  const handleBrowseKits = () => requireAuth("/kits");
  const handleCommunity = () => requireAuth("/community");

  const direction = prevSlide < activeSlide ? 1 : -1;
  const isEntering = (idx: number) => idx === activeSlide && prevSlide >= 0;
  const isLeaving = (idx: number) => idx === prevSlide;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .home-wrapper *, .home-wrapper *::before, .home-wrapper *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        :root {
          --rose:      #F2A7B2;
          --blush:     #F9DDE2;
          --sage:      #A8C5B5;
          --sage-d:    #6FA08A;
          --lavender:  #C4B5E0;
          --butter:    #F5E6A3;
          --cream:     #FDF8F2;
          --ink:       #2A2220;
          --muted:     #7A6E6B;
        }

        .home-wrapper {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Slide panels ── */
        .slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          will-change: transform, opacity;
        }

        @keyframes enterFromBottom {
          from { transform: translateY(100%) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes enterFromTop {
          0%   { transform: translateY(-60%) scale(0.98); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes exitToTop {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to   { transform: translateY(-40%) scale(0.96); opacity: 0; }
        }
        @keyframes exitToBottom {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          50%  { opacity: 0.2; }
          100% { transform: translateY(38%) scale(0.97); opacity: 0; }
        }

        .anim-enter-bottom { animation: enterFromBottom 0.88s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-enter-top    { animation: enterFromTop    1.05s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .anim-exit-top     { animation: exitToTop       0.88s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-exit-bottom  { animation: exitToBottom    1.05s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }

        /* ── Stagger helpers ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(36px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .s1 { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .s2 { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .s3 { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .s4 { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.51s both; }
        .s5 { animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.64s both; }
        .fl { animation: fadeLeft  0.75s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .fr { animation: fadeRight 0.75s cubic-bezier(0.16,1,0.3,1) 0.30s both; }

        /* ── Decorative ── */
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes rotateSlow { to { transform: rotate(360deg); } }

        /* ── Shimmer text ── */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg,
            var(--rose) 0%, var(--lavender) 28%, var(--sage-d) 55%, var(--rose) 78%, var(--lavender) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        /* ── NEW: Shimmer button animations ── */
        @keyframes btnShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(242,167,178,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(242,167,178,0); }
        }
        @keyframes btnGlowGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(111,160,138,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(111,160,138,0); }
        }
        @keyframes btnGlowCream {
          0%, 100% { box-shadow: 0 0 0 0 rgba(253,248,242,0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(253,248,242,0); }
        }

        /* ── NEW: Extra background decorations ── */
        @keyframes driftX {
          0%,100% { transform: translateX(0) translateY(0); }
          33%      { transform: translateX(12px) translateY(-8px); }
          66%      { transform: translateX(-8px) translateY(10px); }
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.3); }
        }
        @keyframes sparkle {
          0%,100% { opacity: 0; transform: rotate(0deg) scale(0.5); }
          50%      { opacity: 0.7; transform: rotate(180deg) scale(1); }
        }
        @keyframes waveFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-20px) rotate(3deg); }
        }

        /* Star/sparkle decorations */
        .star {
          position: absolute;
          pointer-events: none;
          font-style: normal;
        }
        .star-twinkle { animation: twinkle var(--dur, 3s) ease-in-out infinite; }
        .star-sparkle  { animation: sparkle var(--dur, 4s) ease-in-out infinite; }

        /* Mesh grid overlay */
        .mesh-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(242,167,178,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,167,178,0.06) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .mesh-grid-lavender {
          background-image:
            linear-gradient(rgba(196,181,224,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,181,224,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .mesh-grid-dark {
          background-image:
            linear-gradient(rgba(253,248,242,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(253,248,242,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* Floating yarn ball shapes */
        .yarn-shape {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── Progress bar ── */
        .pbar-wrap {
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: rgba(242,167,178,0.15);
          z-index: 200;
          pointer-events: none;
        }
        .pbar {
          height: 100%;
          background: linear-gradient(90deg, var(--rose), var(--lavender), var(--sage-d));
          background-size: 200% auto;
          animation: btnShimmer 3s linear infinite;
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Dot nav ── */
        .dot-nav {
          position: absolute; right: 28px; top: 50%;
          transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 10px;
          z-index: 50;
          transition: opacity 0.35s cubic-bezier(0.16,1,0.3,1),
                      transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .dot-nav.auth-open {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-50%) translateX(14px);
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(42,34,32,0.22);
          border: none; cursor: pointer; padding: 0;
          transition: background 0.3s, transform 0.3s, height 0.35s;
        }
        .dot.active {
          background: var(--ink);
          height: 24px;
          border-radius: 4px;
          transform: none;
        }
        .dot.dark-slide { background: rgba(253,248,242,0.3); }
        .dot.dark-slide.active { background: var(--cream); }

        /* ── Counter ── */
        .counter {
          position: absolute; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem; letter-spacing: 0.16em;
          color: var(--muted);
          z-index: 200;
          display: flex; align-items: center; gap: 10px;
          transition: color 0.4s, opacity 0.35s cubic-bezier(0.16,1,0.3,1),
                      transform 0.35s cubic-bezier(0.16,1,0.3,1);
          pointer-events: none;
        }
        .counter.on-dark { color: rgba(253,248,242,0.4); }
        .counter.auth-open {
          opacity: 0;
          transform: translateX(-50%) translateY(8px);
        }

        /* ── Base button ── */
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500; font-size: 0.95rem;
          padding: 14px 36px;
          border-radius: 100px; border: none; cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s;
          letter-spacing: 0.01em; text-decoration: none;
          position: relative; overflow: hidden;
        }

        /* Shimmer overlay on hover — all buttons */
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg,
            transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%
          );
          background-size: 200% 100%;
          background-position: -100% 0;
          border-radius: inherit;
          transition: background-position 0s;
          pointer-events: none;
        }
        .btn:hover::after {
          background-position: 200% 0;
          transition: background-position 0.55s ease;
        }

        /* Slide 0 — Hero: rose→lavender gradient */
        .btn-hero {
          background: linear-gradient(135deg, var(--ink) 0%, #3d2e2b 100%);
          color: var(--cream);
        }
        .btn-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(42,34,32,0.25), 0 0 0 1px rgba(242,167,178,0.3);
          animation: btnPulse 2s ease-in-out infinite;
        }

        /* Slide 1 — Features: soft lavender-rose */
        .btn-features {
          background: transparent;
          color: var(--ink);
          border: 1.5px solid rgba(42,34,32,0.18);
          background-image: linear-gradient(135deg, rgba(249,221,226,0.4), rgba(196,181,224,0.3));
        }
        .btn-features:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(196,181,224,0.35);
          border-color: rgba(196,181,224,0.6);
          background-image: linear-gradient(135deg, rgba(249,221,226,0.7), rgba(196,181,224,0.55));
        }

        /* Slide 2 — Why: sage green */
        .btn-why {
          background: linear-gradient(135deg, var(--ink) 0%, #233d33 100%);
          color: var(--cream);
        }
        .btn-why:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(42,34,32,0.22), 0 0 0 1px rgba(111,160,138,0.4);
          animation: btnGlowGreen 2s ease-in-out infinite;
        }

        /* Slide 3 — CTA dark: cream warm */
        .btn-cta-primary {
          background: var(--cream);
          color: var(--ink);
          background-image: linear-gradient(135deg, #FDF8F2 0%, #F9DDE2 100%);
        }
        .btn-cta-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(42,34,32,0.3), 0 0 0 1px rgba(253,248,242,0.5);
          animation: btnGlowCream 2s ease-in-out infinite;
        }

        .btn-ghost-light {
          background: transparent;
          color: var(--cream);
          border: 1.5px solid rgba(253,248,242,0.22);
        }
        .btn-ghost-light:hover {
          background: rgba(253,248,242,0.08);
          transform: translateY(-2px);
          border-color: rgba(253,248,242,0.5);
        }

        /* ── Auth-gated link style ── */
        .home-link {
          font-family: 'DM Sans', sans-serif;
          color: var(--muted); text-decoration: none;
          font-size: 0.92rem; font-weight: 400;
          position: relative; padding-bottom: 2px;
          background: none; border: none; cursor: pointer;
          font-size: 0.92rem;
        }
        .home-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1.5px; background: var(--rose);
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .home-link:hover { color: var(--ink); }
        .home-link:hover::after { width: 100%; }

        /* ── Typography ── */
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.6rem, 7vw, 5.5rem);
          font-weight: 900; line-height: 1.0; color: var(--ink);
        }
        .display-h {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 900; line-height: 1.1; color: var(--ink);
        }
        .label {
          font-size: 0.72rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--rose);
        }

        /* ── Feature card ── */
        .feat-card {
          background: white; border-radius: 28px; padding: 28px 24px;
          border: 1.5px solid rgba(242,167,178,0.18);
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s;
        }
        .feat-card:hover { transform: translateY(-10px); box-shadow: 0 28px 64px rgba(242,167,178,0.2); }

        /* ── Why card ── */
        .why-card {
          background: white; border-radius: 22px; padding: 22px 18px;
          border: 1.5px solid rgba(196,181,224,0.22);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;
        }
        .why-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(196,181,224,0.18); }

        /* ── Stat pill ── */
        .pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; border: 1.5px solid var(--blush);
          border-radius: 100px; padding: 8px 18px;
          font-size: 0.85rem; font-weight: 500; color: var(--ink);
        }

        /* ── Scroll hint ── */
        @keyframes bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(6px); }
        }
        .scroll-hint {
          position: absolute; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          animation: bounce 2.2s ease-in-out infinite;
          opacity: 0.4; font-size: 0.7rem; letter-spacing: 0.12em; color: var(--ink);
          pointer-events: none;
          z-index: 5;
        }

        /* ── Testimonial card ── */
        .testi {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 20px 24px;
          max-width: 270px; text-align: left;
        }

        .slide-content {
          max-width: 1200px;
          width: 100%;
          padding: 0 48px;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .slide-content { padding: 0 24px; }
          .dot-nav { right: 14px; }
          .hero-title { font-size: clamp(2.2rem, 10vw, 4rem); }
        }
      `}</style>

      <div ref={containerRef} className="home-wrapper">
        {/* ── Progress bar ── */}
        <div className="pbar-wrap">
          <div
            className="pbar"
            style={{ width: `${((activeSlide + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        {/* ── Dot nav — improved aria-labels ── */}
        <nav
          className={`dot-nav${isAuthOpen ? " auth-open" : ""}`}
          aria-label="Điều hướng trang"
          aria-hidden={isAuthOpen}
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`dot ${i === activeSlide ? "active" : ""} ${activeSlide === 3 ? "dark-slide" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Đến trang ${i + 1}: ${s.label}`}
              aria-current={i === activeSlide ? "true" : undefined}
              title={s.label}
            />
          ))}
        </nav>

        {/* ── Counter ── */}
        <div
          className={`counter${activeSlide === 3 ? " on-dark" : ""}${isAuthOpen ? " auth-open" : ""}`}
          aria-hidden="true"
        >
          <span
            style={{
              fontWeight: 500,
              color: activeSlide === 3 ? "rgba(253,248,242,0.6)" : "var(--ink)",
            }}
          >
            0{activeSlide + 1}
          </span>
          <span
            style={{
              width: 30,
              height: 1,
              background: "currentColor",
              display: "inline-block",
              opacity: 0.4,
            }}
          />
          <span>0{SLIDES.length}</span>
        </div>

        {/* ══ SLIDE 0 — HERO ══ */}
        {(activeSlide === 0 || prevSlide === 0) && (
          <div
            className={`slide ${
              isEntering(0)
                ? direction > 0
                  ? "anim-enter-bottom"
                  : "anim-enter-top"
                : isLeaving(0)
                  ? direction > 0
                    ? "anim-exit-top"
                    : "anim-exit-bottom"
                  : ""
            }`}
            style={{ background: "var(--cream)" }}
          >
            {/* Mesh grid */}
            <div className="mesh-grid" />

            {/* Blobs */}
            <div
              className="blob"
              style={{
                width: 520,
                height: 520,
                background: "var(--blush)",
                opacity: 0.5,
                top: "-18%",
                right: "-10%",
                filter: "blur(80px)",
                transform: `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * -18}px)`,
                animation: "driftX 12s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 300,
                height: 300,
                background: "var(--lavender)",
                opacity: 0.3,
                bottom: "0%",
                left: "-6%",
                filter: "blur(70px)",
                transform: `translate(${(mousePos.x - 0.5) * 18}px, ${(mousePos.y - 0.5) * 14}px)`,
                animation: "driftX 15s ease-in-out infinite reverse",
              }}
            />
            <div
              className="blob"
              style={{
                width: 180,
                height: 180,
                background: "var(--sage)",
                opacity: 0.22,
                top: "38%",
                left: "60%",
                filter: "blur(55px)",
                transform: `translate(${(mousePos.x - 0.5) * -12}px, ${(mousePos.y - 0.5) * 22}px)`,
              }}
            />

            {/* Rings */}
            <div
              className="ring"
              style={{
                width: 200,
                height: 200,
                border: "2px dashed rgba(242,167,178,0.32)",
                top: "8%",
                right: "10%",
                animation: "rotateSlow 22s linear infinite",
              }}
            />
            <div
              className="ring"
              style={{
                width: 110,
                height: 110,
                border: "2px solid rgba(196,181,224,0.28)",
                bottom: "14%",
                left: "7%",
                animation: "rotateSlow 14s linear infinite reverse",
              }}
            />
            {/* Extra ring */}
            <div
              className="ring"
              style={{
                width: 340,
                height: 340,
                border: "1px dashed rgba(168,197,181,0.2)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "rotateSlow 38s linear infinite",
              }}
            />

            {/* Floating dots */}
            {[
              {
                s: 60,
                x: "10%",
                y: "20%",
                c: "var(--rose)",
                d: "0s",
                dur: "5s",
              },
              {
                s: 40,
                x: "83%",
                y: "16%",
                c: "var(--lavender)",
                d: "1.3s",
                dur: "4.5s",
              },
              {
                s: 46,
                x: "74%",
                y: "74%",
                c: "var(--sage)",
                d: "0.7s",
                dur: "6s",
              },
              {
                s: 32,
                x: "23%",
                y: "76%",
                c: "var(--butter)",
                d: "1.9s",
                dur: "4s",
              },
              {
                s: 20,
                x: "48%",
                y: "10%",
                c: "var(--rose)",
                d: "2.4s",
                dur: "5.5s",
              },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: b.x,
                  top: b.y,
                  width: b.s,
                  height: b.s,
                  borderRadius: "50%",
                  background: b.c,
                  opacity: 0.28,
                  animation: `floatY ${b.dur} ease-in-out infinite`,
                  animationDelay: b.d,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* ✦ Sparkle stars */}
            {[
              { x: "30%", y: "12%", size: 10, dur: "2.8s", del: "0s" },
              { x: "68%", y: "34%", size: 8, dur: "3.5s", del: "1.1s" },
              { x: "18%", y: "55%", size: 12, dur: "4s", del: "0.5s" },
              { x: "88%", y: "60%", size: 7, dur: "2.5s", del: "1.8s" },
              { x: "55%", y: "82%", size: 9, dur: "3.2s", del: "0.8s" },
            ].map((sp, i) => (
              <div
                key={i}
                className="star star-twinkle"
                style={
                  {
                    left: sp.x,
                    top: sp.y,
                    fontSize: sp.size,
                    color: i % 2 === 0 ? "var(--rose)" : "var(--lavender)",
                    "--dur": sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            <div className="slide-content">
              <div style={{ maxWidth: 660 }}>
                <div
                  className={`label ${heroIn ? "s1" : ""}`}
                  style={{ opacity: heroIn ? undefined : 0 }}
                >
                  ✦ Craft your calm
                </div>

                <h1
                  className={`hero-title ${heroIn ? "s2" : ""}`}
                  style={{ marginTop: 18, opacity: heroIn ? undefined : 0 }}
                >
                  Find Your
                  <br />
                  <span className="shimmer-text">Cozy Corner</span>
                </h1>

                <p
                  className={`${heroIn ? "s3" : ""}`}
                  style={{
                    marginTop: 20,
                    opacity: heroIn ? undefined : 0,
                    fontSize: "clamp(0.92rem, 1.4vw, 1.08rem)",
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    fontWeight: 300,
                    maxWidth: 440,
                  }}
                >
                  Handcrafted yarn, beginner-friendly kits, and a community that{" "}
                  <em>gets it</em>. Because crocheting isn't just a hobby — it's
                  your escape from the chaos.
                </p>

                <div
                  className={`${heroIn ? "s4" : ""}`}
                  style={{
                    marginTop: 32,
                    opacity: heroIn ? undefined : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Primary CTA — shimmer ink button */}
                  <button className="btn btn-hero" onClick={handleGetStarted}>
                    Get Started →
                  </button>
                  {/* Auth-gated links */}
                  <button className="home-link" onClick={handleBrowseKits}>
                    Browse DIY Kits
                  </button>
                  <button className="home-link" onClick={handleCommunity}>
                    Join Community
                  </button>
                </div>

                <div
                  className={`${heroIn ? "s5" : ""}`}
                  style={{
                    marginTop: 36,
                    opacity: heroIn ? undefined : 0,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { dot: "var(--rose)", label: "12k+ crafters" },
                    { dot: "var(--sage-d)", label: "200+ patterns" },
                    { dot: "var(--lavender)", label: "Eco-friendly" },
                  ].map((s) => (
                    <span key={s.label} className="pill">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: s.dot,
                          display: "inline-block",
                        }}
                      />
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="scroll-hint">
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="20"
                  rx="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <rect
                  x="6"
                  y="4"
                  width="4"
                  height="6"
                  rx="2"
                  fill="currentColor"
                  style={{ animation: "floatY 1.4s ease-in-out infinite" }}
                />
              </svg>
              scroll
            </div>
          </div>
        )}

        {/* ══ SLIDE 1 — FEATURES ══ */}
        {(activeSlide === 1 || prevSlide === 1) && (
          <div
            className={`slide ${
              isEntering(1)
                ? direction > 0
                  ? "anim-enter-bottom"
                  : "anim-enter-top"
                : isLeaving(1)
                  ? direction > 0
                    ? "anim-exit-top"
                    : "anim-exit-bottom"
                  : ""
            }`}
            style={{ background: "white" }}
          >
            {/* Lavender grid */}
            <div className="mesh-grid mesh-grid-lavender" />

            <div
              className="blob"
              style={{
                width: 420,
                height: 420,
                background: "var(--blush)",
                opacity: 0.45,
                top: "-18%",
                right: "-6%",
                filter: "blur(85px)",
                animation: "driftX 14s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 220,
                height: 220,
                background: "var(--sage)",
                opacity: 0.2,
                bottom: "-10%",
                left: "20%",
                filter: "blur(65px)",
                animation: "driftX 10s ease-in-out infinite reverse",
              }}
            />
            {/* Extra lavender blob */}
            <div
              className="blob"
              style={{
                width: 160,
                height: 160,
                background: "var(--lavender)",
                opacity: 0.18,
                top: "30%",
                left: "2%",
                filter: "blur(50px)",
              }}
            />

            {/* Sparkles on white bg */}
            {[
              {
                x: "6%",
                y: "14%",
                size: 11,
                dur: "3.1s",
                del: "0s",
                c: "var(--rose)",
              },
              {
                x: "92%",
                y: "22%",
                size: 8,
                dur: "2.7s",
                del: "0.9s",
                c: "var(--lavender)",
              },
              {
                x: "15%",
                y: "80%",
                size: 10,
                dur: "4.2s",
                del: "0.3s",
                c: "var(--sage-d)",
              },
              {
                x: "88%",
                y: "75%",
                size: 7,
                dur: "3.8s",
                del: "1.5s",
                c: "var(--rose)",
              },
            ].map((sp, i) => (
              <div
                key={i}
                className="star star-sparkle"
                style={
                  {
                    left: sp.x,
                    top: sp.y,
                    fontSize: sp.size,
                    color: sp.c,
                    "--dur": sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            {/* Floating rings */}
            <div
              className="ring"
              style={{
                width: 80,
                height: 80,
                border: "1.5px solid rgba(242,167,178,0.25)",
                bottom: "20%",
                right: "8%",
                animation: "rotateSlow 10s linear infinite",
              }}
            />

            <div className="slide-content">
              <div className="s1 label" style={{ marginBottom: 14 }}>
                What we offer
              </div>
              <h2 className="display-h s2" style={{ marginBottom: 44 }}>
                Crafted with{" "}
                <em style={{ color: "var(--rose)", fontStyle: "italic" }}>
                  intention
                </em>
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 18,
                }}
              >
                {[
                  {
                    emoji: "✨",
                    cls: "s3",
                    bg: "linear-gradient(135deg,#F9DDE2,#F2A7B2)",
                    title: "Beginner-Friendly",
                    desc: "Never crocheted before? Kits include everything you need plus easy video tutorials.",
                  },
                  {
                    emoji: "🫶",
                    cls: "s4",
                    bg: "linear-gradient(135deg,#EDE5F7,#C4B5E0)",
                    title: "Stress-Relief Approved",
                    desc: "Join thousands who found their calm in crochet's rhythm. Basically meditation with yarn.",
                  },
                  {
                    emoji: "🌸",
                    cls: "s5",
                    bg: "linear-gradient(135deg,#D4EDE3,#A8C5B5)",
                    title: "Creative Community",
                    desc: "Share your makes, get inspired, and connect with fellow Gen Z crafters.",
                  },
                ].map((f) => (
                  <div key={f.title} className={`feat-card ${f.cls}`}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 18,
                        background: f.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.6rem",
                        marginBottom: 20,
                      }}
                    >
                      {f.emoji}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--ink)",
                        marginBottom: 10,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--muted)",
                        lineHeight: 1.68,
                        fontWeight: 300,
                        fontSize: "0.88rem",
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="s5"
                style={{
                  marginTop: 36,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                {/* Features slide button — lavender-blush gradient */}
                <button className="btn btn-features" onClick={() => goTo(2)}>
                  Why CozyStitch? →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SLIDE 2 — WHY ══ */}
        {(activeSlide === 2 || prevSlide === 2) && (
          <div
            className={`slide ${
              isEntering(2)
                ? direction > 0
                  ? "anim-enter-bottom"
                  : "anim-enter-top"
                : isLeaving(2)
                  ? direction > 0
                    ? "anim-exit-top"
                    : "anim-exit-bottom"
                  : ""
            }`}
            style={{ background: "var(--cream)" }}
          >
            {/* Rose grid */}
            <div className="mesh-grid" />

            <div
              className="blob"
              style={{
                width: 460,
                height: 460,
                background: "var(--lavender)",
                opacity: 0.25,
                bottom: "-18%",
                right: "-10%",
                filter: "blur(90px)",
                animation: "driftX 16s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 240,
                height: 240,
                background: "var(--rose)",
                opacity: 0.18,
                top: "-10%",
                left: "10%",
                filter: "blur(70px)",
                animation: "driftX 12s ease-in-out infinite reverse",
              }}
            />
            {/* sage accent */}
            <div
              className="blob"
              style={{
                width: 200,
                height: 200,
                background: "var(--sage)",
                opacity: 0.15,
                top: "40%",
                right: "8%",
                filter: "blur(65px)",
              }}
            />

            {/* Sparkles */}
            {[
              {
                x: "5%",
                y: "10%",
                size: 9,
                dur: "3.5s",
                del: "0s",
                c: "var(--lavender)",
              },
              {
                x: "92%",
                y: "15%",
                size: 11,
                dur: "2.9s",
                del: "1.2s",
                c: "var(--sage-d)",
              },
              {
                x: "80%",
                y: "85%",
                size: 8,
                dur: "4.1s",
                del: "0.4s",
                c: "var(--rose)",
              },
              {
                x: "12%",
                y: "88%",
                size: 10,
                dur: "3.3s",
                del: "1.7s",
                c: "var(--lavender)",
              },
            ].map((sp, i) => (
              <div
                key={i}
                className="star star-twinkle"
                style={
                  {
                    left: sp.x,
                    top: sp.y,
                    fontSize: sp.size,
                    color: sp.c,
                    "--dur": sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            {/* Rings */}
            <div
              className="ring"
              style={{
                width: 150,
                height: 150,
                border: "1.5px dashed rgba(111,160,138,0.25)",
                top: "12%",
                right: "16%",
                animation: "rotateSlow 18s linear infinite",
              }}
            />
            <div
              className="ring"
              style={{
                width: 90,
                height: 90,
                border: "1.5px solid rgba(196,181,224,0.3)",
                bottom: "18%",
                left: "4%",
                animation: "rotateSlow 12s linear infinite reverse",
              }}
            />

            <div className="slide-content">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.1fr",
                  gap: 60,
                  alignItems: "center",
                }}
              >
                {/* Left */}
                <div className="fl">
                  <div className="label" style={{ marginBottom: 14 }}>
                    Why us
                  </div>
                  <h2 className="display-h" style={{ marginBottom: 18 }}>
                    More than a<br />
                    <span style={{ color: "var(--rose)" }}>craft store.</span>
                  </h2>
                  <p
                    style={{
                      color: "var(--muted)",
                      lineHeight: 1.78,
                      fontWeight: 300,
                      fontSize: "0.95rem",
                      marginBottom: 28,
                      maxWidth: 400,
                    }}
                  >
                    We're building a space where Gen Z can slow down, create
                    something with their hands, and actually enjoy the process.
                    No pressure, no perfection.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 12,
                      marginBottom: 32,
                    }}
                  >
                    {[
                      { num: "12k+", label: "Crafters" },
                      { num: "200+", label: "Patterns" },
                      { num: "4.9★", label: "Rating" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          background: "white",
                          borderRadius: 16,
                          padding: "14px 10px",
                          textAlign: "center",
                          border: "1.5px solid rgba(242,167,178,0.18)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: "1.5rem",
                            fontWeight: 900,
                            color: "var(--ink)",
                          }}
                        >
                          {s.num}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--muted)",
                            marginTop: 4,
                            fontWeight: 400,
                          }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Why slide — sage-tinted ink button */}
                  <button className="btn btn-why" onClick={handleGetStarted}>
                    Start Crafting
                  </button>
                </div>

                {/* Right: 2×2 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      emoji: "🎨",
                      title: "Curated for You",
                      desc: "Pastels, modern patterns, Instagram-worthy results.",
                      d: "0.20s",
                    },
                    {
                      emoji: "📚",
                      title: "Learn at Your Pace",
                      desc: "Step-by-step tutorials made by real people.",
                      d: "0.32s",
                    },
                    {
                      emoji: "💬",
                      title: "Join the Community",
                      desc: "Share WIPs and celebrate finished projects.",
                      d: "0.44s",
                    },
                    {
                      emoji: "🌱",
                      title: "Sustainable Choices",
                      desc: "Eco-friendly materials and ethical sourcing.",
                      d: "0.56s",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="why-card fr"
                      style={{ animationDelay: item.d }}
                    >
                      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                        {item.emoji}
                      </div>
                      <h4
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "0.93rem",
                          fontWeight: 700,
                          color: "var(--ink)",
                          marginBottom: 6,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          color: "var(--muted)",
                          fontSize: "0.80rem",
                          lineHeight: 1.6,
                          fontWeight: 300,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SLIDE 3 — CTA (DARK) ══ */}
        {(activeSlide === 3 || prevSlide === 3) && (
          <div
            className={`slide ${
              isEntering(3)
                ? direction > 0
                  ? "anim-enter-bottom"
                  : "anim-enter-top"
                : isLeaving(3)
                  ? direction > 0
                    ? "anim-exit-top"
                    : "anim-exit-bottom"
                  : ""
            }`}
            style={{ background: "var(--ink)" }}
          >
            {/* Dark mesh */}
            <div className="mesh-grid mesh-grid-dark" />

            <div
              className="blob"
              style={{
                width: 500,
                height: 500,
                background: "var(--rose)",
                opacity: 0.14,
                top: "-20%",
                left: "-10%",
                filter: "blur(100px)",
                transform: `translate(${(mousePos.x - 0.5) * 18}px, ${(mousePos.y - 0.5) * 14}px)`,
                animation: "driftX 18s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 380,
                height: 380,
                background: "var(--lavender)",
                opacity: 0.16,
                bottom: "-15%",
                right: "-8%",
                filter: "blur(90px)",
                transform: `translate(${(mousePos.x - 0.5) * -14}px, ${(mousePos.y - 0.5) * -18}px)`,
                animation: "driftX 22s ease-in-out infinite reverse",
              }}
            />
            <div
              className="blob"
              style={{
                width: 180,
                height: 180,
                background: "var(--sage)",
                opacity: 0.12,
                top: "40%",
                right: "22%",
                filter: "blur(60px)",
              }}
            />
            {/* Extra butter blob */}
            <div
              className="blob"
              style={{
                width: 120,
                height: 120,
                background: "var(--butter)",
                opacity: 0.08,
                bottom: "25%",
                left: "30%",
                filter: "blur(50px)",
              }}
            />

            <div
              className="ring"
              style={{
                width: 260,
                height: 260,
                border: "1.5px dashed rgba(242,167,178,0.18)",
                top: "5%",
                right: "7%",
                animation: "rotateSlow 24s linear infinite",
              }}
            />
            <div
              className="ring"
              style={{
                width: 140,
                height: 140,
                border: "1.5px solid rgba(196,181,224,0.18)",
                bottom: "10%",
                left: "6%",
                animation: "rotateSlow 16s linear infinite reverse",
              }}
            />
            {/* Extra ring */}
            <div
              className="ring"
              style={{
                width: 420,
                height: 420,
                border: "1px dashed rgba(253,248,242,0.06)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "rotateSlow 45s linear infinite",
              }}
            />

            {/* Sparkles on dark */}
            {[
              {
                x: "8%",
                y: "18%",
                size: 12,
                dur: "3.2s",
                del: "0s",
                c: "rgba(242,167,178,0.6)",
              },
              {
                x: "88%",
                y: "12%",
                size: 8,
                dur: "2.6s",
                del: "1.0s",
                c: "rgba(196,181,224,0.5)",
              },
              {
                x: "75%",
                y: "78%",
                size: 10,
                dur: "4.0s",
                del: "0.6s",
                c: "rgba(168,197,181,0.5)",
              },
              {
                x: "20%",
                y: "82%",
                size: 7,
                dur: "3.6s",
                del: "1.8s",
                c: "rgba(245,230,163,0.4)",
              },
              {
                x: "50%",
                y: "6%",
                size: 9,
                dur: "2.9s",
                del: "0.3s",
                c: "rgba(242,167,178,0.4)",
              },
            ].map((sp, i) => (
              <div
                key={i}
                className="star star-sparkle"
                style={
                  {
                    left: sp.x,
                    top: sp.y,
                    fontSize: sp.size,
                    color: sp.c,
                    "--dur": sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            {[
              { s: 52, x: "14%", y: "24%", c: "var(--rose)", d: "0s" },
              { s: 34, x: "82%", y: "20%", c: "var(--lavender)", d: "1.5s" },
              { s: 42, x: "72%", y: "70%", c: "var(--sage)", d: "0.8s" },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: b.x,
                  top: b.y,
                  width: b.s,
                  height: b.s,
                  borderRadius: "50%",
                  background: b.c,
                  opacity: 0.2,
                  animation: `floatY 5s ease-in-out infinite`,
                  animationDelay: b.d,
                  pointerEvents: "none",
                }}
              />
            ))}

            <div
              style={{
                textAlign: "center",
                position: "relative",
                zIndex: 1,
                padding: "0 48px",
                maxWidth: 780,
              }}
            >
              <div className="s1 label" style={{ color: "var(--rose)" }}>
                Ready to start?
              </div>

              <h2
                className="s2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2.4rem, 6.5vw, 4.8rem)",
                  fontWeight: 900,
                  color: "var(--cream)",
                  lineHeight: 1.05,
                  marginTop: 16,
                  marginBottom: 18,
                }}
              >
                Your cozy era
                <br />
                starts <span className="shimmer-text">here.</span>
              </h2>

              <p
                className="s3"
                style={{
                  color: "rgba(253,248,242,0.5)",
                  fontSize: "0.97rem",
                  fontWeight: 300,
                  lineHeight: 1.75,
                  marginBottom: 36,
                }}
              >
                Join 12,000+ crafters who traded doom-scrolling for
                stitch-counting.
                <br />
                No experience needed — just curiosity and good vibes.
              </p>

              <div
                className="s4"
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 44,
                }}
              >
                {/* CTA slide — warm cream-blush gradient */}
                <button
                  className="btn btn-cta-primary"
                  onClick={handleGetStarted}
                >
                  Shop Now →
                </button>
                {/* Auth-gated Browse Kits on dark slide */}
                <button
                  className="btn btn-ghost-light"
                  onClick={handleBrowseKits}
                >
                  Browse Kits
                </button>
              </div>

              <div
                className="s5"
                style={{
                  display: "flex",
                  gap: 18,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {[
                  {
                    q: `"Finally a hobby that actually calms me down"`,
                    name: "— Linh, 22",
                  },
                  {
                    q: `"Ordered Friday, finished my first kit by Sunday"`,
                    name: "— Minh, 19",
                  },
                ].map((t) => (
                  <div key={t.name} className="testi">
                    <p
                      style={{
                        color: "rgba(253,248,242,0.7)",
                        fontSize: "0.85rem",
                        lineHeight: 1.62,
                        fontWeight: 300,
                        fontStyle: "italic",
                        marginBottom: 8,
                      }}
                    >
                      {t.q}
                    </p>
                    <p
                      style={{
                        color: "var(--rose)",
                        fontSize: "0.74rem",
                        fontWeight: 500,
                      }}
                    >
                      {t.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
