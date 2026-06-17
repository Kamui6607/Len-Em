import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface HomeNavigationProps {
  activeSlide: number;
  isDark: boolean;
  onGoTo: (idx: number) => void;
  onToggleDark: () => void;
  isAuthOpen?: boolean;
}

const SLIDES = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "why", label: "Why Us" },
  { id: "cta", label: "Start Now" },
];

export function HomeNavigation({
  activeSlide,
  isDark,
  onGoTo,
  onToggleDark,
  isAuthOpen = false,
}: HomeNavigationProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (path: string) => {
    if (isAuthenticated) navigate(path);
    else navigate("/auth/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .hn-root {
          --hn-rose:         #F2A7B2;
          --hn-lav:          #C4B5E0;
          --hn-sage:         #6FA08A;
          --hn-cream:        #FDF8F2;
          --hn-ink:          #2A2220;

          --hn-text:         #2A2220;
          --hn-text2:        #7A6E6B;
          --hn-border:       rgba(242,167,178,0.22);
          --hn-nav-bg:       rgba(253,248,242,0.93);
          --hn-link-active:  rgba(242,167,178,0.13);
          --hn-link-hover:   rgba(242,167,178,0.07);
          --hn-theme-border: rgba(242,167,178,0.22);
        }

        .hn-root.hn-dark {
          --hn-text:         #F0E8E4;
          --hn-text2:        #A0908C;
          --hn-border:       rgba(242,167,178,0.1);
          --hn-nav-bg:       rgba(20,12,10,0.93);
          --hn-link-active:  rgba(242,167,178,0.1);
          --hn-link-hover:   rgba(242,167,178,0.05);
          --hn-theme-border: rgba(242,167,178,0.12);
        }

        .hn-root.hn-auth-open {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
          transition: opacity 0.3s, transform 0.3s;
        }

        .hn-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 68px;
          background: var(--hn-nav-bg);
          backdrop-filter: blur(18px) saturate(1.5);
          -webkit-backdrop-filter: blur(18px) saturate(1.5);
          border-bottom: 0.5px solid var(--hn-border);
          font-family: 'DM Sans', sans-serif;
          transition: background 0.35s, border-color 0.35s;
        }

        .hn-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
          transition: transform 0.25s;
          background: none;
          border: none;
        }
        .hn-logo:hover { transform: translateY(-1px); }

        .hn-logo-orb {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F9DDE2, #F2A7B2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border: 1.5px solid rgba(242,167,178,0.4);
          flex-shrink: 0;
        }

        .hn-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--hn-text);
          letter-spacing: -0.01em;
          transition: color 0.3s;
        }

        .hn-links {
          display: flex;
          align-items: center;
          gap: 2px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        @media (max-width: 600px) {
          .hn-links { display: none; }
        }

        .hn-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 400;
          color: var(--hn-text2);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }

        .hn-link-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--hn-rose);
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.2s, transform 0.2s;
          flex-shrink: 0;
        }

        .hn-link.hn-active {
          color: var(--hn-text);
          background: var(--hn-link-active);
          font-weight: 500;
        }
        .hn-link.hn-active .hn-link-dot { opacity: 1; transform: scale(1); }
        .hn-link:hover:not(.hn-active) {
          color: var(--hn-text);
          background: var(--hn-link-hover);
        }

        .hn-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hn-theme-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid var(--hn-theme-border);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: var(--hn-text2);
          transition: border-color 0.2s, background 0.2s, transform 0.25s;
          -webkit-tap-highlight-color: transparent;
        }
        .hn-theme-btn:hover {
          border-color: rgba(242,167,178,0.55);
          background: rgba(242,167,178,0.08);
          transform: rotate(18deg);
        }

        /* Sign In — prominent gradient pill */
        .hn-btn-signin {
          padding: 8px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #FDF8F2;
          background: linear-gradient(135deg, #C4B5E0 0%, #F2A7B2 55%, #F9A86C 100%);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 14px rgba(242,167,178,0.35);
          transition: opacity 0.22s, transform 0.22s, box-shadow 0.22s;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          overflow: hidden;
        }
        .hn-btn-signin::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%);
          border-radius: inherit;
          pointer-events: none;
        }
        .hn-btn-signin:hover {
          opacity: 0.9;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 20px rgba(242,167,178,0.5);
        }
        .hn-btn-signin:active { transform: translateY(0); opacity: 1; }

        /* Shop now (authenticated) */
        .hn-btn-shop {
          padding: 8px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #FDF8F2;
          background: linear-gradient(135deg, #2A2220 0%, #3d2e2b 100%);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .hn-btn-shop:hover { opacity: 0.82; transform: translateY(-1px); }

        .hn-progress {
          height: 2px;
          background: rgba(242,167,178,0.15);
        }
        .hn-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--hn-rose), var(--hn-lav), var(--hn-sage));
          transition: width 0.55s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>

      <div
        className={`hn-root${isDark ? " hn-dark" : ""}${isAuthOpen ? " hn-auth-open" : ""}`}
      >
        <div className="hn-bar">
          {/* Logo */}
          <button
            className="hn-logo"
            onClick={() => onGoTo(0)}
            aria-label="Go to hero slide"
          >
            <div className="hn-logo-orb">🧶</div>
            <span className="hn-logo-name">Len&Em</span>
          </button>

          {/* Slide links */}
          <nav className="hn-links" aria-label="Slide navigation">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                className={`hn-link${activeSlide === i ? " hn-active" : ""}`}
                onClick={() => onGoTo(i)}
                aria-current={activeSlide === i ? "true" : undefined}
                aria-label={`Go to slide ${i + 1}: ${s.label}`}
              >
                <span className="hn-link-dot" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hn-actions">
            <button
              className="hn-theme-btn"
              onClick={onToggleDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? "🌙" : "☀️"}
            </button>

            {!isAuthenticated && (
              <button
                className="hn-btn-signin"
                onClick={() => navigate("/auth/login")}
              >
                Sign In →
              </button>
            )}

            {isAuthenticated && (
              <button
                className="hn-btn-shop"
                onClick={() => requireAuth("/shop")}
              >
                Shop now →
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="hn-progress" aria-hidden="true">
          <div
            className="hn-progress-fill"
            style={{ width: `${((activeSlide + 1) / SLIDES.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}