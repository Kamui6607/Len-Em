import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useRef, useState, useCallback } from "react";
import { HomeNavigation } from "../components/Homenavigation ";

interface HomeProps {
  isAuthOpen?: boolean;
}

const SLIDES = [
  { id: "hero", label: "Hero — Learn to Crochet Your Way" },
  { id: "features", label: "Features — What We Offer" },
  { id: "why", label: "Why CozyStitch" },
  { id: "cta", label: "CTA — Start Now" },
];

/* Light-mode palette for each slide — soft, progressive, relaxing */
const SLIDE_BG_LIGHT = [
  "#FDF8F2", // Slide 0 — warm cream
  "#FFFFFF", // Slide 1 — clean white
  "#EFF7F3", // Slide 2 — soft mint/sage
  "#EDE8F5", // Slide 3 — gentle lavender
];

const SLIDE_BG_DARK = ["#18100e", "#1f1411", "#18100e", "#0e0a09"];

export function Home({ isAuthOpen = false }: HomeProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [heroIn, setHeroIn] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleDark = useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

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

  const activeSlideRef = useRef(activeSlide);
  useEffect(() => {
    activeSlideRef.current = activeSlide;
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
        goToRef.current(activeSlideRef.current + dir);
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
        goToRef.current(activeSlideRef.current + (dy > 0 ? 1 : -1));
    };
    const el = containerRef.current;
    el?.addEventListener("touchstart", handleTouchStart, { passive: true });
    el?.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el?.removeEventListener("touchstart", handleTouchStart);
      el?.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown")
        goToRef.current(activeSlideRef.current + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp")
        goToRef.current(activeSlideRef.current - 1);
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

  const requireAuth = (path: string) => {
    if (isAuthenticated) navigate(path);
    else navigate("/auth/login");
  };

  const handleGetStarted = () => requireAuth("/shop");
  const handleBrowseKits = () => requireAuth("/kits");
  const handleCommunity = () => requireAuth("/community");

  const direction = prevSlide < activeSlide ? 1 : -1;
  const isEntering = (idx: number) => idx === activeSlide && prevSlide >= 0;
  const isLeaving = (idx: number) => idx === prevSlide;

  const slideClass = (idx: number) => {
    if (isEntering(idx))
      return direction > 0 ? "anim-enter-bottom" : "anim-enter-top";
    if (isLeaving(idx))
      return direction > 0 ? "anim-exit-top" : "anim-exit-bottom";
    return "";
  };

  const bg = (idx: number) =>
    isDark ? SLIDE_BG_DARK[idx] : SLIDE_BG_LIGHT[idx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        :root {
          --rose:     #F2A7B2;
          --blush:    #F9DDE2;
          --sage:     #A8C5B5;
          --sage-d:   #6FA08A;
          --lavender: #C4B5E0;
          --lavender-d: #8B78C4;
          --butter:   #F5E6A3;
          --cream:    #FDF8F2;
          --ink:      #2A2220;
          --muted:    #7A6E6B;
        }

        .home-wrapper          { --hw-text: #2A2220; --hw-text2: #7A6E6B; --hw-card: #FFFFFF; --hw-card-border: rgba(242,167,178,0.18); --hw-why-card: #FFFFFF; --hw-why-border: rgba(196,181,224,0.22); --hw-stat: #FFFFFF; --hw-pill: rgba(255,255,255,0.8); }
        .home-wrapper.hw-dark  { --hw-text: #F0E8E4; --hw-text2: #A0908C; --hw-card: #241810; --hw-card-border: rgba(242,167,178,0.1); --hw-why-card: #1e1510; --hw-why-border: rgba(196,181,224,0.12); --hw-stat: #1e1410; --hw-pill: #221611; }

        .home-wrapper {
          position: relative; width: 100%;
          height: calc(100vh - 70px);
          height: calc(100dvh - 70px);
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.55s cubic-bezier(0.16,1,0.3,1);
        }

        .slide {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; will-change: transform, opacity;
          transition: background 0.55s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes enterFromBottom { from { transform: translateY(100%) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes enterFromTop    { 0% { transform: translateY(-60%) scale(0.98); opacity: 0; } 40% { opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes exitToTop       { from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(-40%) scale(0.96); opacity: 0; } }
        @keyframes exitToBottom    { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { opacity: 0.2; } 100% { transform: translateY(38%) scale(0.97); opacity: 0; } }

        .anim-enter-bottom { animation: enterFromBottom 0.88s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-enter-top    { animation: enterFromTop    1.05s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .anim-exit-top     { animation: exitToTop       0.88s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-exit-bottom  { animation: exitToBottom    1.05s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }

        @keyframes fadeUp   { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeRight{ from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        .s1 { animation: fadeUp   0.7s cubic-bezier(0.16,1,0.3,1) 0.10s both; }
        .s2 { animation: fadeUp   0.7s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .s3 { animation: fadeUp   0.7s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .s4 { animation: fadeUp   0.7s cubic-bezier(0.16,1,0.3,1) 0.46s both; }
        .s5 { animation: fadeUp   0.7s cubic-bezier(0.16,1,0.3,1) 0.58s both; }
        .fl { animation: fadeLeft  0.7s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
        .fr { animation: fadeRight 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both; }

        @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes rotateSlow { to{transform:rotate(360deg)} }
        @keyframes driftX     { 0%,100%{transform:translateX(0) translateY(0)} 33%{transform:translateX(10px) translateY(-7px)} 66%{transform:translateX(-7px) translateY(9px)} }
        @keyframes twinkle    { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.25)} }
        @keyframes sparkle    { 0%,100%{opacity:0;transform:rotate(0deg) scale(0.5)} 50%{opacity:0.65;transform:rotate(180deg) scale(1)} }
        @keyframes bounce     { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(5px)} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }

        .shimmer-text {
          background: linear-gradient(90deg,var(--rose) 0%,var(--lavender) 28%,var(--sage-d) 55%,var(--rose) 78%,var(--lavender) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 5s linear infinite;
        }

        /* Shimmer for lavender slide — purple/rose tones */
        .shimmer-lav {
          background: linear-gradient(90deg,var(--lavender-d) 0%,var(--rose) 30%,var(--lavender) 60%,var(--lavender-d) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 5s linear infinite;
        }

        .blob { position:absolute; border-radius:50%; pointer-events:none; }
        .ring { position:absolute; border-radius:50%; pointer-events:none; }
        .star { position:absolute; pointer-events:none; font-style:normal; }
        .star-twinkle { animation: twinkle var(--dur,3s) ease-in-out infinite; }
        .star-sparkle { animation: sparkle var(--dur,4s) ease-in-out infinite; }

        .dot-nav {
          position: absolute; right: 18px; top: 50%;
          transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 8px; z-index: 50;
          transition: opacity 0.3s, transform 0.3s;
        }
        .dot-nav.auth-open { opacity: 0; pointer-events: none; transform: translateY(-50%) translateX(12px); }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(42,34,32,0.2); border: none; cursor: pointer; padding: 0;
          transition: background 0.3s, height 0.3s; touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .dot.active { background: var(--ink); height: 22px; border-radius: 4px; }
        .hw-dark .dot { background: rgba(240,232,228,0.25); }
        .hw-dark .dot.active { background: #F0E8E4; }

        /* On lavender slide (light), dots should be lavender-tinted */
        .dot.lav-slide { background: rgba(139,120,196,0.25); }
        .dot.lav-slide.active { background: var(--lavender-d); }

        .counter {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem; letter-spacing: 0.16em; color: var(--muted);
          z-index: 200; display: flex; align-items: center; gap: 8px;
          transition: color 0.4s, opacity 0.3s, transform 0.3s;
          pointer-events: none;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .hw-dark .counter { color: #A0908C; }
        .counter.on-lav { color: var(--lavender-d); }
        .counter.auth-open { opacity: 0; transform: translateX(-50%) translateY(8px); }

        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          font-size: 0.9rem; padding: 12px 28px; border-radius: 100px;
          border: none; cursor: pointer; letter-spacing: 0.01em;
          position: relative; overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, background 0.35s;
          -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        }

        .btn-hero { background: linear-gradient(135deg,var(--ink) 0%,#3d2e2b 100%); color: var(--cream); }
        .hw-dark .btn-hero { background: linear-gradient(135deg,#3d2e2b 0%,#2a1e1c 100%); }
        .btn-hero:hover { transform: translateY(-2px); }

        .btn-features {
          background: transparent; color: var(--ink);
          border: 1.5px solid rgba(42,34,32,0.18);
          background-image: linear-gradient(135deg,rgba(249,221,226,0.4),rgba(196,181,224,0.3));
        }
        .hw-dark .btn-features { color: #F0E8E4; border-color: rgba(240,232,228,0.18); background-image: linear-gradient(135deg,rgba(249,221,226,0.1),rgba(196,181,224,0.1)); }
        .btn-features:hover { transform: translateY(-2px); }

        .btn-why { background: linear-gradient(135deg,var(--ink) 0%,#233d33 100%); color: var(--cream); }
        .hw-dark .btn-why { background: linear-gradient(135deg,#1a2e26 0%,#0f1f18 100%); }
        .btn-why:hover { transform: translateY(-2px); }

        /* CTA slide buttons — adapted for lavender light bg */
        .btn-cta-primary {
          background: linear-gradient(135deg, var(--lavender-d) 0%, #a394d8 100%);
          color: #fff;
          box-shadow: 0 4px 18px rgba(139,120,196,0.3);
        }
        .hw-dark .btn-cta-primary { background: var(--cream); color: var(--ink); box-shadow: none; }
        .btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(139,120,196,0.4); }

        .btn-cta-outline {
          background: transparent;
          color: var(--lavender-d);
          border: 1.5px solid rgba(139,120,196,0.35);
        }
        .hw-dark .btn-cta-outline { color: var(--cream); border-color: rgba(253,248,242,0.22); }
        .btn-cta-outline:hover { background: rgba(139,120,196,0.08); transform: translateY(-2px); border-color: rgba(139,120,196,0.55); }

        .home-link {
          font-family: 'DM Sans', sans-serif; color: var(--muted); text-decoration: none;
          font-size: 0.9rem; font-weight: 400; position: relative; padding-bottom: 2px;
          background: none; border: none; cursor: pointer; touch-action: manipulation;
          transition: color 0.3s;
        }
        .hw-dark .home-link { color: #A0908C; }
        .home-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1.5px; background:var(--rose); transition:width 0.3s cubic-bezier(0.16,1,0.3,1); }
        .home-link:hover { color: var(--ink); }
        .hw-dark .home-link:hover { color: #F0E8E4; }
        .home-link:hover::after { width: 100%; }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 8vw, 5rem);
          font-weight: 900; line-height: 1.02;
          color: var(--hw-text);
          transition: color 0.35s;
        }
        .display-h {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 5vw, 2.8rem);
          font-weight: 900; line-height: 1.1;
          color: var(--hw-text);
          transition: color 0.35s;
        }
        .label { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--rose); }

        .feat-card {
          background: var(--hw-card); border-radius: 22px; padding: 22px 18px;
          border: 1.5px solid var(--hw-card-border);
          transition: transform 0.3s,box-shadow 0.3s,background 0.35s,border-color 0.35s;
        }
        .feat-card:hover { transform: translateY(-8px); }

        .why-card {
          background: var(--hw-why-card); border-radius: 18px; padding: 18px 15px;
          border: 1.5px solid var(--hw-why-border);
          transition: transform 0.3s,background 0.35s,border-color 0.35s;
        }
        .why-card:hover { transform: translateY(-5px); }

        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--hw-pill); border: 1.5px solid rgba(242,167,178,0.3);
          border-radius: 100px; padding: 6px 14px;
          font-size: 0.8rem; font-weight: 500; color: var(--hw-text);
          transition: background 0.35s, color 0.35s;
          backdrop-filter: blur(8px);
        }

        .stat-box {
          background: var(--hw-stat); border-radius: 14px; padding: 12px 8px; text-align: center;
          border: 1.5px solid rgba(242,167,178,0.18);
          transition: background 0.35s, border-color 0.35s;
        }

        /* CTA testi cards — adapted for lavender bg */
        .testi {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(196,181,224,0.3);
          border-radius: 16px; padding: 16px 18px; text-align: center;
          backdrop-filter: blur(10px);
          transition: background 0.35s, border-color 0.35s;
        }
        .hw-dark .testi {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
        }

        .scroll-hint {
          position: absolute; bottom: calc(28px + env(safe-area-inset-bottom,0px)); left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          animation: bounce 2.2s ease-in-out infinite;
          opacity: 0.4; font-size: 0.65rem; letter-spacing: 0.12em; color: var(--hw-text);
          pointer-events: none; z-index: 5;
          transition: color 0.35s;
        }

        .slide-content {
          max-width: 1100px; width: 100%;
          padding: 0 clamp(16px,5vw,48px);
          position: relative; z-index: 1;
        }

        .body-text { color: var(--hw-text2); transition: color 0.35s; }
        .title-text { color: var(--hw-text); transition: color 0.35s; }

        @media (max-width: 640px) {
          .feat-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .why-grid-outer { grid-template-columns: 1fr !important; gap: 24px !important; }
          .why-grid-inner { grid-template-columns: 1fr 1fr !important; }
          .stat-grid { grid-template-columns: repeat(3,1fr) !important; }
          .cta-testimonials { flex-direction: column !important; gap: 10px !important; }
          .testi { max-width: 100% !important; }
          .hero-buttons { gap: 12px !important; }
          .hero-pills { gap: 6px !important; }
          .btn { font-size: 0.85rem !important; padding: 11px 22px !important; }
          .dot-nav { right: 10px !important; }
        }
      `}</style>

      <HomeNavigation
        activeSlide={activeSlide}
        isDark={isDark}
        onGoTo={goTo}
        onToggleDark={toggleDark}
        isAuthOpen={isAuthOpen}
      />

      <div
        ref={containerRef}
        className={`home-wrapper${isDark ? " hw-dark" : ""}`}
        style={{ background: bg(activeSlide) }}
      >
        {/* Dot nav */}
        <nav
          className={`dot-nav${isAuthOpen ? " auth-open" : ""}`}
          aria-label="Page navigation"
          aria-hidden={isAuthOpen}
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`dot ${i === activeSlide ? "active" : ""} ${!isDark && activeSlide === 3 ? "lav-slide" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}: ${s.label}`}
              aria-current={i === activeSlide ? "true" : undefined}
              title={s.label}
            />
          ))}
        </nav>

        {/* Counter */}
        <div
          className={`counter${!isDark && activeSlide === 3 ? " on-lav" : ""}${isAuthOpen ? " auth-open" : ""}`}
          aria-hidden="true"
        >
          <span style={{ fontWeight: 500 }}>0{activeSlide + 1}</span>
          <span
            style={{
              width: 26,
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
            className={`slide ${slideClass(0)}`}
            style={{ background: bg(0) }}
          >
            <div
              className="blob"
              style={{
                width: 480,
                height: 480,
                background: "var(--blush)",
                opacity: isDark ? 0.15 : 0.5,
                top: "-18%",
                right: "-10%",
                filter: "blur(80px)",
                transform: `translate(${(mousePos.x - 0.5) * -25}px,${(mousePos.y - 0.5) * -15}px)`,
                animation: "driftX 12s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 280,
                height: 280,
                background: "var(--lavender)",
                opacity: isDark ? 0.12 : 0.28,
                bottom: "0%",
                left: "-6%",
                filter: "blur(70px)",
                animation: "driftX 15s ease-in-out infinite reverse",
              }}
            />
            <div
              className="blob"
              style={{
                width: 160,
                height: 160,
                background: "var(--sage)",
                opacity: isDark ? 0.1 : 0.2,
                top: "38%",
                left: "60%",
                filter: "blur(55px)",
              }}
            />
            <div
              className="ring"
              style={{
                width: 180,
                height: 180,
                border: "2px dashed rgba(242,167,178,0.28)",
                top: "8%",
                right: "10%",
                animation: "rotateSlow 22s linear infinite",
              }}
            />
            <div
              className="ring"
              style={{
                width: 100,
                height: 100,
                border: "2px solid rgba(196,181,224,0.25)",
                bottom: "14%",
                left: "7%",
                animation: "rotateSlow 14s linear infinite reverse",
              }}
            />
            {[
              {
                s: 55,
                x: "10%",
                y: "20%",
                c: "var(--rose)",
                d: "0s",
                dur: "5s",
              },
              {
                s: 36,
                x: "83%",
                y: "16%",
                c: "var(--lavender)",
                d: "1.3s",
                dur: "4.5s",
              },
              {
                s: 42,
                x: "74%",
                y: "74%",
                c: "var(--sage)",
                d: "0.7s",
                dur: "6s",
              },
              {
                s: 28,
                x: "23%",
                y: "76%",
                c: "var(--butter)",
                d: "1.9s",
                dur: "4s",
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
                  opacity: isDark ? 0.1 : 0.26,
                  animation: `floatY ${b.dur} ease-in-out infinite`,
                  animationDelay: b.d,
                  pointerEvents: "none",
                }}
              />
            ))}
            {[
              {
                x: "30%",
                y: "12%",
                size: 9,
                dur: "2.8s",
                del: "0s",
                c: "var(--rose)",
              },
              {
                x: "68%",
                y: "34%",
                size: 7,
                dur: "3.5s",
                del: "1.1s",
                c: "var(--lavender)",
              },
              {
                x: "18%",
                y: "55%",
                size: 11,
                dur: "4s",
                del: "0.5s",
                c: "var(--rose)",
              },
              {
                x: "88%",
                y: "60%",
                size: 6,
                dur: "2.5s",
                del: "1.8s",
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
                    ["--dur" as string]: sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            <div className="slide-content">
              <div style={{ maxWidth: 620 }}>
                <div
                  className={`label ${heroIn ? "s1" : ""}`}
                  style={{ opacity: heroIn ? undefined : 0 }}
                >
                  ✦ Crochet — unwind on your own terms
                </div>
                <h1
                  className={`hero-title ${heroIn ? "s2" : ""}`}
                  style={{ marginTop: 14, opacity: heroIn ? undefined : 0 }}
                >
                  Learn to Crochet
                  <br />
                  <span className="shimmer-text">Your Way</span>
                </h1>
                <p
                  className={`body-text ${heroIn ? "s3" : ""}`}
                  style={{
                    marginTop: 16,
                    opacity: heroIn ? undefined : 0,
                    fontSize: "clamp(0.88rem,2vw,1.02rem)",
                    lineHeight: 1.75,
                    fontWeight: 300,
                    maxWidth: 440,
                  }}
                >
                  From your first skein to a finished project — CozyStitch
                  brings you quality materials, step-by-step guidance, and a
                  community so you can crochet at your own pace.
                </p>
                <div
                  className={`hero-buttons ${heroIn ? "s4" : ""}`}
                  style={{
                    marginTop: 26,
                    opacity: heroIn ? undefined : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button className="btn btn-hero" onClick={handleGetStarted}>
                    Explore now →
                  </button>
                  <button className="home-link" onClick={handleBrowseKits}>
                    Browse DIY Kits
                  </button>
                  <button className="home-link" onClick={handleCommunity}>
                    Community
                  </button>
                </div>
                <div
                  className={`hero-pills ${heroIn ? "s5" : ""}`}
                  style={{
                    marginTop: 28,
                    opacity: heroIn ? undefined : 0,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { dot: "var(--rose)", label: "200+ products" },
                    { dot: "var(--sage-d)", label: "Step-by-step guides" },
                    { dot: "var(--lavender)", label: "Nationwide shipping" },
                  ].map((s) => (
                    <span key={s.label} className="pill">
                      <span
                        style={{
                          width: 7,
                          height: 7,
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
              <svg width="14" height="20" viewBox="0 0 16 22" fill="none">
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
            className={`slide ${slideClass(1)}`}
            style={{ background: bg(1) }}
          >
            <div
              className="blob"
              style={{
                width: 380,
                height: 380,
                background: "var(--blush)",
                opacity: isDark ? 0.12 : 0.4,
                top: "-18%",
                right: "-6%",
                filter: "blur(85px)",
                animation: "driftX 14s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 200,
                height: 200,
                background: "var(--sage)",
                opacity: isDark ? 0.08 : 0.18,
                bottom: "-10%",
                left: "20%",
                filter: "blur(65px)",
                animation: "driftX 10s ease-in-out infinite reverse",
              }}
            />

            <div className="slide-content">
              <div className="s1 label" style={{ marginBottom: 12 }}>
                What we offer
              </div>
              <h2 className="display-h s2" style={{ marginBottom: 32 }}>
                Everything you need to{" "}
                <em style={{ color: "var(--rose)", fontStyle: "italic" }}>
                  get started
                </em>
              </h2>

              <div
                className="feat-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 14,
                }}
              >
                {[
                  {
                    emoji: "🧶",
                    cls: "s3",
                    bg: "linear-gradient(135deg,#F9DDE2,#F2A7B2)",
                    title: "Made for beginners",
                    desc: "Never crocheted before? Our kits come with yarn, hooks, and video walkthroughs. Open the box and start right away.",
                  },
                  {
                    emoji: "🌿",
                    cls: "s4",
                    bg: "linear-gradient(135deg,#EDE5F7,#C4B5E0)",
                    title: "Actually de-stresses",
                    desc: "The steady rhythm of crochet pulls you away from screens. Many people pick it up after class or work — and notice the difference.",
                  },
                  {
                    emoji: "💬",
                    cls: "s5",
                    bg: "linear-gradient(135deg,#D4EDE3,#A8C5B5)",
                    title: "A real community",
                    desc: "Share your finished pieces, ask technique questions, get feedback from people who get it. No judgment — just good vibes.",
                  },
                ].map((f) => (
                  <div key={f.title} className={`feat-card ${f.cls}`}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        background: f.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        marginBottom: 16,
                      }}
                    >
                      {f.emoji}
                    </div>
                    <h3
                      className="title-text"
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "clamp(0.9rem,2vw,1.1rem)",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      className="body-text"
                      style={{
                        lineHeight: 1.65,
                        fontWeight: 300,
                        fontSize: "clamp(0.78rem,1.5vw,0.86rem)",
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
                  marginTop: 28,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
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
            className={`slide ${slideClass(2)}`}
            style={{ background: bg(2) }}
          >
            <div
              className="blob"
              style={{
                width: 420,
                height: 420,
                background: "var(--lavender)",
                opacity: isDark ? 0.1 : 0.22,
                bottom: "-18%",
                right: "-10%",
                filter: "blur(90px)",
                animation: "driftX 16s ease-in-out infinite",
              }}
            />
            <div
              className="blob"
              style={{
                width: 220,
                height: 220,
                background: "var(--rose)",
                opacity: isDark ? 0.08 : 0.16,
                top: "-10%",
                left: "10%",
                filter: "blur(70px)",
                animation: "driftX 12s ease-in-out infinite reverse",
              }}
            />
            <div
              className="blob"
              style={{
                width: 180,
                height: 180,
                background: "var(--sage)",
                opacity: isDark ? 0.06 : 0.2,
                bottom: "10%",
                left: "30%",
                filter: "blur(60px)",
                animation: "driftX 10s ease-in-out infinite",
              }}
            />

            <div className="slide-content">
              <div
                className="why-grid-outer"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.1fr",
                  gap: 48,
                  alignItems: "center",
                }}
              >
                <div className="fl">
                  <div className="label" style={{ marginBottom: 12 }}>
                    Why us
                  </div>
                  <h2 className="display-h" style={{ marginBottom: 16 }}>
                    More than a<br />
                    <span style={{ color: "var(--rose)" }}>yarn shop.</span>
                  </h2>
                  <p
                    className="body-text"
                    style={{
                      lineHeight: 1.75,
                      fontWeight: 300,
                      fontSize: "clamp(0.85rem,1.8vw,0.95rem)",
                      marginBottom: 22,
                      maxWidth: 380,
                    }}
                  >
                    CozyStitch was built by people who were also complete
                    beginners once. We know the feeling of not knowing where to
                    start — so everything here is as approachable as possible.
                  </p>

                  <div
                    className="stat-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 10,
                      marginBottom: 26,
                    }}
                  >
                    {[
                      { num: "200+", label: "Products" },
                      { num: "50+", label: "Tutorials" },
                      { num: "4.9★", label: "Rating" },
                    ].map((s) => (
                      <div key={s.label} className="stat-box">
                        <div
                          className="title-text"
                          style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: "clamp(1.1rem,3vw,1.4rem)",
                            fontWeight: 900,
                          }}
                        >
                          {s.num}
                        </div>
                        <div
                          className="body-text"
                          style={{
                            fontSize: "0.68rem",
                            marginTop: 3,
                            fontWeight: 400,
                          }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-why" onClick={handleGetStarted}>
                    Start crocheting
                  </button>
                </div>

                <div
                  className="why-grid-inner"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      emoji: "🎨",
                      title: "Curated materials",
                      desc: "Soft cotton & acrylic in trending colors — chosen to work in warm climates and on sensitive skin.",
                      d: "0.18s",
                    },
                    {
                      emoji: "📚",
                      title: "Learn at your pace",
                      desc: "Video tutorials you can rewatch any time. No pressure, no deadlines.",
                      d: "0.30s",
                    },
                    {
                      emoji: "💬",
                      title: "Ask — get answered",
                      desc: "An active community every day. Stuck on a stitch? Just ask.",
                      d: "0.42s",
                    },
                    {
                      emoji: "🌱",
                      title: "Skin-friendly",
                      desc: "Non-irritating materials, safe for beginners and sensitive skin alike.",
                      d: "0.54s",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="why-card fr"
                      style={{ animationDelay: item.d }}
                    >
                      <div style={{ fontSize: "1.35rem", marginBottom: 7 }}>
                        {item.emoji}
                      </div>
                      <h4
                        className="title-text"
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "clamp(0.82rem,1.5vw,0.9rem)",
                          fontWeight: 700,
                          marginBottom: 5,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        className="body-text"
                        style={{
                          fontSize: "clamp(0.73rem,1.3vw,0.78rem)",
                          lineHeight: 1.58,
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

        {/* ══ SLIDE 3 — CTA — Light: lavender, Dark: near-black ══ */}
        {(activeSlide === 3 || prevSlide === 3) && (
          <div
            className={`slide ${slideClass(3)}`}
            style={{ background: bg(3) }}
          >
            {/* Light mode blobs — soft lavender/rose */}
            {!isDark && (
              <>
                <div
                  className="blob"
                  style={{
                    width: 500,
                    height: 500,
                    background: "var(--lavender)",
                    opacity: 0.35,
                    top: "-20%",
                    left: "-10%",
                    filter: "blur(100px)",
                    transform: `translate(${(mousePos.x - 0.5) * 16}px,${(mousePos.y - 0.5) * 12}px)`,
                    animation: "driftX 18s ease-in-out infinite",
                  }}
                />
                <div
                  className="blob"
                  style={{
                    width: 360,
                    height: 360,
                    background: "var(--rose)",
                    opacity: 0.22,
                    bottom: "-15%",
                    right: "-8%",
                    filter: "blur(90px)",
                    animation: "driftX 22s ease-in-out infinite reverse",
                  }}
                />
                <div
                  className="blob"
                  style={{
                    width: 200,
                    height: 200,
                    background: "var(--blush)",
                    opacity: 0.3,
                    top: "40%",
                    right: "20%",
                    filter: "blur(70px)",
                    animation: "driftX 14s ease-in-out infinite",
                  }}
                />
              </>
            )}
            {/* Dark mode blobs */}
            {isDark && (
              <>
                <div
                  className="blob"
                  style={{
                    width: 460,
                    height: 460,
                    background: "var(--rose)",
                    opacity: 0.12,
                    top: "-20%",
                    left: "-10%",
                    filter: "blur(100px)",
                    transform: `translate(${(mousePos.x - 0.5) * 16}px,${(mousePos.y - 0.5) * 12}px)`,
                    animation: "driftX 18s ease-in-out infinite",
                  }}
                />
                <div
                  className="blob"
                  style={{
                    width: 340,
                    height: 340,
                    background: "var(--lavender)",
                    opacity: 0.14,
                    bottom: "-15%",
                    right: "-8%",
                    filter: "blur(90px)",
                    animation: "driftX 22s ease-in-out infinite reverse",
                  }}
                />
              </>
            )}

            <div
              className="ring"
              style={{
                width: 220,
                height: 220,
                border: `1.5px dashed ${isDark ? "rgba(242,167,178,0.15)" : "rgba(139,120,196,0.2)"}`,
                top: "5%",
                right: "7%",
                animation: "rotateSlow 24s linear infinite",
              }}
            />
            <div
              className="ring"
              style={{
                width: 120,
                height: 120,
                border: `1.5px solid ${isDark ? "rgba(196,181,224,0.1)" : "rgba(196,181,224,0.25)"}`,
                bottom: "12%",
                left: "8%",
                animation: "rotateSlow 18s linear infinite reverse",
              }}
            />

            {[
              {
                x: "8%",
                y: "18%",
                size: 11,
                dur: "3.2s",
                del: "0s",
                c: isDark ? "rgba(242,167,178,0.55)" : "rgba(139,120,196,0.5)",
              },
              {
                x: "88%",
                y: "12%",
                size: 7,
                dur: "2.6s",
                del: "1.0s",
                c: isDark ? "rgba(196,181,224,0.45)" : "rgba(242,167,178,0.55)",
              },
              {
                x: "75%",
                y: "78%",
                size: 9,
                dur: "4.0s",
                del: "0.6s",
                c: isDark ? "rgba(168,197,181,0.45)" : "rgba(168,197,181,0.55)",
              },
              {
                x: "20%",
                y: "82%",
                size: 6,
                dur: "3.6s",
                del: "1.8s",
                c: isDark ? "rgba(245,230,163,0.35)" : "rgba(196,181,224,0.6)",
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
                    ["--dur" as string]: sp.dur,
                    animationDelay: sp.del,
                  } as React.CSSProperties
                }
              >
                ✦
              </div>
            ))}

            <div
              style={{
                textAlign: "center",
                position: "relative",
                zIndex: 1,
                padding: "0 clamp(16px,5vw,48px)",
                maxWidth: 720,
                width: "100%",
              }}
            >
              <div
                className="s1 label"
                style={{ color: isDark ? "var(--rose)" : "var(--lavender-d)" }}
              >
                Ready to start?
              </div>

              <h2
                className="s2"
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(2rem,7vw,4.4rem)",
                  fontWeight: 900,
                  color: isDark ? "var(--cream)" : "var(--ink)",
                  lineHeight: 1.05,
                  marginTop: 14,
                  marginBottom: 16,
                  transition: "color 0.35s",
                }}
              >
                Your crochet journey
                <br />
                <span className={isDark ? "shimmer-text" : "shimmer-lav"}>
                  starts here.
                </span>
              </h2>

              <p
                className="s3"
                style={{
                  color: isDark
                    ? "rgba(253,248,242,0.5)"
                    : "rgba(80,60,90,0.6)",
                  fontSize: "clamp(0.85rem,2vw,0.95rem)",
                  fontWeight: 300,
                  lineHeight: 1.78,
                  maxWidth: 480,
                  margin: "0 auto 28px",
                  transition: "color 0.35s",
                }}
              >
                CozyStitch is where you find materials, follow tutorials, and
                track your progress. No prior experience needed — just show up
                and start.
              </p>

              <div
                className="s4"
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 36,
                }}
              >
                <button
                  className="btn btn-cta-primary"
                  onClick={handleGetStarted}
                >
                  Shop now →
                </button>
                <button
                  className="btn btn-cta-outline"
                  onClick={handleBrowseKits}
                >
                  Browse Kits
                </button>
              </div>

              <div
                className="s5 cta-testimonials"
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { icon: "📦", text: "Order online — delivered to your door" },
                  {
                    icon: "🎬",
                    text: "Video tutorial included with every kit",
                  },
                  { icon: "💬", text: "Technique support via community" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="testi"
                    style={{ maxWidth: 180, flex: "1 1 160px" }}
                  >
                    <div style={{ fontSize: "1.35rem", marginBottom: 8 }}>
                      {item.icon}
                    </div>
                    <p
                      style={{
                        color: isDark
                          ? "rgba(253,248,242,0.7)"
                          : "rgba(80,60,90,0.75)",
                        fontSize: "0.82rem",
                        fontWeight: 400,
                        lineHeight: 1.55,
                        margin: 0,
                        transition: "color 0.35s",
                      }}
                    >
                      {item.text}
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
