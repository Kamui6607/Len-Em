import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Heart, Menu, X } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";

interface NavigationProps {
  cartCount: number;
  onSignIn: () => void;
  onSignUp: () => void;
}

const NAV_LINKS = [
  { label: "Shop", href: "/shop", protected: true },
  { label: "DIY Kits", href: "/kits", protected: true },
  { label: "Community", href: "/community", protected: false },
  { label: "Learn", href: "/learn", protected: false },
];

export function Navigation({ cartCount, onSignIn, onSignUp }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-root {
          position: sticky;
          top: 0;
          z-index: 40;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Navbar bar ── */
        .nav-bar {
          background: rgba(255, 249, 245, 0.88);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border-bottom: 1px solid rgba(236, 180, 160, 0.22);
          transition: box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
        }
        .nav-bar.scrolled {
          box-shadow: 0 4px 32px rgba(200, 120, 90, 0.1), 0 1px 0 rgba(236, 180, 160, 0.3);
          border-bottom-color: rgba(236, 180, 160, 0.4);
        }
        .dark .nav-bar {
          background: rgba(22, 16, 14, 0.9);
          border-bottom-color: rgba(160, 90, 70, 0.2);
        }
        .dark .nav-bar.scrolled {
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45), 0 1px 0 rgba(160, 90, 70, 0.3);
          border-bottom-color: rgba(160, 90, 70, 0.35);
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        /* ── Logo ── */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #E8997A, #D4756A);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(212, 117, 106, 0.35);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }
        .nav-logo:hover .nav-logo-icon {
          transform: rotate(-6deg) scale(1.08);
          box-shadow: 0 4px 16px rgba(212, 117, 106, 0.45);
        }
        .nav-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: #2A1A14;
          letter-spacing: -0.01em;
          line-height: 1;
          transition: color 0.3s;
        }
        .dark .nav-logo-text { color: #F5EDE8; }

        /* ── Desktop links ── */
        .nav-links {
          display: none;
          align-items: center;
          gap: 4px;
        }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 400;
          color: #5A3E35;
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: color 0.18s, background 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 14px;
          right: 14px;
          height: 1.5px;
          background: linear-gradient(90deg, #E8997A, #D4756A);
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link:hover { color: #C1604E; background: rgba(232, 153, 122, 0.08); }
        .nav-link:hover::after { transform: scaleX(1); }
        .dark .nav-link { color: #C8A99A; }
        .dark .nav-link:hover { color: #F0C4B0; background: rgba(232, 153, 122, 0.1); }

        /* ── Actions ── */
        .nav-actions { display: flex; align-items: center; gap: 6px; }

        .nav-icon-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          color: #5A3E35;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.18s, background 0.18s, transform 0.15s;
          text-decoration: none;
        }
        .nav-icon-btn:hover { color: #C1604E; background: rgba(232, 153, 122, 0.1); transform: translateY(-1px); }
        .dark .nav-icon-btn { color: #C8A99A; }
        .dark .nav-icon-btn:hover { color: #F0C4B0; background: rgba(232, 153, 122, 0.12); }

        .nav-badge {
          position: absolute;
          top: 2px; right: 2px;
          min-width: 17px; height: 17px;
          padding: 0 4px;
          background: linear-gradient(135deg, #E8997A, #C1604E);
          color: white;
          font-size: 10px; font-weight: 600;
          border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 4px rgba(193, 96, 78, 0.5);
          line-height: 1;
        }

        .nav-divider {
          width: 1px; height: 22px;
          background: rgba(232, 153, 122, 0.25);
          margin: 0 2px;
          transition: background 0.3s;
        }
        .dark .nav-divider { background: rgba(160, 90, 70, 0.25); }

        .btn-signin {
          display: none;
          padding: 8px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          color: #5A3E35;
          background: transparent;
          border: 1.5px solid rgba(232, 153, 122, 0.3);
          border-radius: 10px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.18s;
        }
        .btn-signin:hover { border-color: rgba(193, 96, 78, 0.5); background: rgba(232, 153, 122, 0.06); color: #C1604E; }
        @media (min-width: 640px) { .btn-signin { display: flex; align-items: center; } }
        .dark .btn-signin { color: #C8A99A; border-color: rgba(232, 153, 122, 0.2); }
        .dark .btn-signin:hover { color: #F0C4B0; border-color: rgba(232, 153, 122, 0.45); background: rgba(232, 153, 122, 0.08); }

        .btn-signup {
          display: none;
          padding: 8px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          color: white;
          background: linear-gradient(135deg, #E8997A, #C1604E);
          border: none; border-radius: 10px;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 10px rgba(193, 96, 78, 0.3);
          transition: all 0.18s;
        }
        .btn-signup:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(193, 96, 78, 0.4); }
        .btn-signup:active { transform: translateY(0); }
        @media (min-width: 640px) { .btn-signup { display: flex; align-items: center; } }
        .dark .btn-signup { box-shadow: 0 2px 14px rgba(193, 96, 78, 0.5); }
        .dark .btn-signup:hover { box-shadow: 0 4px 22px rgba(193, 96, 78, 0.65); }

        .nav-hamburger {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px;
          border-radius: 11px;
          color: #5A3E35;
          background: transparent; border: none;
          cursor: pointer;
          transition: color 0.18s, background 0.18s;
        }
        .nav-hamburger:hover { color: #C1604E; background: rgba(232, 153, 122, 0.1); }
        @media (min-width: 768px) { .nav-hamburger { display: none; } }
        .dark .nav-hamburger { color: #C8A99A; }
        .dark .nav-hamburger:hover { color: #F0C4B0; background: rgba(232, 153, 122, 0.1); }

        /* ── Mobile overlay ── */
        .mobile-overlay {
          position: fixed; inset: 0; z-index: 30;
          background: rgba(20, 10, 8, 0.5);
          backdrop-filter: blur(2px);
          animation: overlayIn 0.2s ease both;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Mobile drawer ── */
        .mobile-drawer {
          position: fixed; top: 0; right: 0; z-index: 50;
          height: 100%; width: 288px;
          background: #FFF9F5;
          border-left: 1px solid rgba(232, 153, 122, 0.18);
          box-shadow: -8px 0 40px rgba(150, 80, 60, 0.14);
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, border-color 0.3s;
          display: flex; flex-direction: column;
        }
        .mobile-drawer.open { transform: translateX(0); }
        @media (min-width: 768px) { .mobile-drawer { display: none; } }
        .dark .mobile-drawer {
          background: #1A110E;
          border-left-color: rgba(160, 90, 70, 0.18);
          box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
        }

        .drawer-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(232, 153, 122, 0.13);
          display: flex; align-items: center; justify-content: space-between;
          transition: border-color 0.3s;
        }
        .dark .drawer-header { border-bottom-color: rgba(160, 90, 70, 0.15); }

        .drawer-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem; font-style: italic;
          color: #2A1A14;
          transition: color 0.3s;
        }
        .dark .drawer-title { color: #F5EDE8; }

        .drawer-close {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9px; border: none; background: transparent;
          color: #8A6860;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .drawer-close:hover { background: rgba(232, 153, 122, 0.1); color: #C1604E; }
        .dark .drawer-close { color: #7A5E58; }
        .dark .drawer-close:hover { background: rgba(232, 153, 122, 0.1); color: #F0C4B0; }

        .drawer-body { flex: 1; padding: 12px; overflow-y: auto; }

        .drawer-link {
          display: flex; align-items: center;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.95rem; font-weight: 400;
          color: #5A3E35;
          text-decoration: none; border: none; background: transparent;
          cursor: pointer; width: 100%; text-align: left;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          transition: background 0.15s, color 0.15s;
          margin-bottom: 2px;
        }
        .drawer-link:hover { background: rgba(232, 153, 122, 0.1); color: #C1604E; }
        .dark .drawer-link { color: #C8A99A; }
        .dark .drawer-link:hover { color: #F0C4B0; background: rgba(232, 153, 122, 0.1); }

        .drawer-footer {
          padding: 16px;
          border-top: 1px solid rgba(232, 153, 122, 0.13);
          display: flex; flex-direction: column; gap: 8px;
          transition: border-color 0.3s;
        }
        .dark .drawer-footer { border-top-color: rgba(160, 90, 70, 0.15); }

        .drawer-btn-signin {
          width: 100%; padding: 12px;
          border-radius: 12px;
          border: 1.5px solid rgba(232, 153, 122, 0.32);
          background: transparent;
          color: #5A3E35;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; font-weight: 500;
          cursor: pointer; transition: all 0.18s; letter-spacing: 0.01em;
        }
        .drawer-btn-signin:hover { border-color: #C1604E; color: #C1604E; }
        .dark .drawer-btn-signin { color: #C8A99A; border-color: rgba(232, 153, 122, 0.2); }
        .dark .drawer-btn-signin:hover { color: #F0C4B0; border-color: rgba(232, 153, 122, 0.45); }

        .drawer-btn-signup {
          width: 100%; padding: 12px;
          border-radius: 12px; border: none;
          background: linear-gradient(135deg, #E8997A, #C1604E);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(193, 96, 78, 0.35);
          letter-spacing: 0.01em;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .drawer-btn-signup:hover { box-shadow: 0 4px 20px rgba(193, 96, 78, 0.5); transform: translateY(-1px); }
        .dark .drawer-btn-signup { box-shadow: 0 2px 16px rgba(193, 96, 78, 0.5); }
        .dark .drawer-btn-signup:hover { box-shadow: 0 4px 24px rgba(193, 96, 78, 0.65); }
      `}</style>

      <nav className="nav-root">
        <div className={`nav-bar${scrolled ? " scrolled" : ""}`}>
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              <div className="nav-logo-icon">🧶</div>
              <span className="nav-logo-text">CozyStitch</span>
            </Link>

            <div className="nav-links">
              {NAV_LINKS.map(({ label, href, protected: isProtected }) =>
                isProtected && !isAuthenticated ? (
                  <button key={label} className="nav-link" onClick={onSignIn}>
                    {label}
                  </button>
                ) : (
                  <Link key={label} to={href} className="nav-link">
                    {label}
                  </Link>
                ),
              )}
            </div>

            <div className="nav-actions">
              {isAuthenticated && (
                <Link
                  to="/love"
                  className="nav-icon-btn"
                  aria-label="Favourites"
                >
                  <Heart size={18} />
                  {favorites.length > 0 && (
                    <span className="nav-badge">{favorites.length}</span>
                  )}
                </Link>
              )}

              <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="nav-badge">{cartCount}</span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="nav-divider" />
                  <UserMenu />
                  <ThemeToggle size="sm" />
                </>
              ) : (
                <>
                  <div className="nav-divider" />
                  <ThemeToggle size="sm" />
                  <button className="btn-signin" onClick={onSignIn}>
                    Sign In
                  </button>
                  <button className="btn-signup" onClick={onSignUp}>
                    Sign Up
                  </button>
                </>
              )}

              <button
                className="nav-hamburger"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div
          ref={mobileMenuRef}
          className={`mobile-drawer${isMobileMenuOpen ? " open" : ""}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="drawer-header">
            <span className="drawer-title">Menu</span>
            <button
              className="drawer-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="drawer-body">
            {NAV_LINKS.map(({ label, href, protected: isProtected }) =>
              isProtected && !isAuthenticated ? (
                <button
                  key={label}
                  className="drawer-link"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignIn();
                  }}
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className="drawer-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ),
            )}
          </div>

          {!isAuthenticated && (
            <div className="drawer-footer">
              <button
                className="drawer-btn-signin"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignIn();
                }}
              >
                Sign In
              </button>
              <button
                className="drawer-btn-signup"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignUp();
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
