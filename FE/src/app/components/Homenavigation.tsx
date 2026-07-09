import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";

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
          --hn-rose:         var(--accent-blush);
          --hn-lav:          var(--accent-lavender);
          --hn-sage:         var(--accent-green-text);
          --hn-warm:         var(--accent-warm);
          --hn-cream:        var(--bg-1);
          --hn-ink:          var(--foreground);

          --hn-text:         var(--foreground);
          --hn-text2:        var(--foreground-muted);
          --hn-border:       color-mix(in srgb, var(--accent-blush) 22%, transparent);
          --hn-nav-bg:       rgba(var(--bg-1-rgb), 0.93);
          --hn-link-active:  color-mix(in srgb, var(--accent-blush) 13%, transparent);
          --hn-link-hover:   color-mix(in srgb, var(--accent-blush) 7%, transparent);
        }

        .hn-root.hn-dark {
          --hn-rose:         var(--accent-pink);
          --hn-lav:          var(--primary);
          --hn-sage:         var(--accent-green-text);
          --hn-warm:         var(--accent-warm-soft);
          --hn-text:         var(--foreground);
          --hn-text2:        var(--foreground-muted);
          --hn-border:       color-mix(in srgb, var(--accent-pink) 10%, transparent);
          --hn-nav-bg:       rgba(28, 21, 38, 0.93);
          --hn-link-active:  color-mix(in srgb, var(--accent-pink) 10%, transparent);
          --hn-link-hover:   color-mix(in srgb, var(--accent-pink) 5%, transparent);
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
          background: linear-gradient(135deg, var(--accent-blush), var(--accent-pink));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border: 1.5px solid color-mix(in srgb, var(--accent-blush) 40%, transparent);
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

        /* Sign In — prominent gradient pill */
        .hn-btn-signin {
          padding: 8px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--primary-foreground);
          background: linear-gradient(135deg, var(--accent-lavender) 0%, var(--accent-blush) 55%, var(--accent-warm) 100%);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 14px color-mix(in srgb, var(--accent-blush) 35%, transparent);
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
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent-blush) 50%, transparent);
        }
        .hn-btn-signin:active { transform: translateY(0); opacity: 1; }

        .hn-root.hn-dark .hn-btn-signin {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent-pink) 55%, var(--accent-warm-soft) 100%);
          box-shadow: 0 2px 14px rgba(155, 111, 214, 0.35);
        }
        .hn-root.hn-dark .hn-btn-signin:hover {
          box-shadow: 0 4px 20px rgba(155, 111, 214, 0.45);
        }

        /* Shop now (authenticated) */
        .hn-btn-shop {
          padding: 8px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--primary-foreground);
          background: linear-gradient(135deg, var(--foreground) 0%, var(--foreground-secondary) 100%);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .hn-btn-shop:hover { opacity: 0.82; transform: translateY(-1px); }

        .hn-root.hn-dark .hn-btn-shop {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
        }

        .hn-progress {
          height: 2px;
          background: color-mix(in srgb, var(--accent-blush) 15%, transparent);
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
            {/* Shared Uiverse-style theme switch — same control used in Navigation.tsx.
                It reads/writes ThemeContext directly, so it stays in sync with isDark
                regardless of the onToggleDark prop passed down from the page. */}
            <ThemeToggle size="sm" />

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