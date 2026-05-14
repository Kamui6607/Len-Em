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

export function Navigation({
  cartCount,
  onSignIn,
  onSignUp,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
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

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-root {
          position: sticky;
          top: 0;
          z-index: 40;
          font-family: 'DM Sans', sans-serif;
        }

        .nav-bar {
          background: rgba(255, 249, 245, 0.88);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border-bottom: 1px solid rgba(236, 180, 160, 0.22);

          transition:
            box-shadow 0.3s ease,
            border-color 0.3s ease,
            background 0.3s ease;
        }

        .nav-bar.scrolled {
          box-shadow:
            0 4px 32px rgba(200, 120, 90, 0.1),
            0 1px 0 rgba(236, 180, 160, 0.3);

          border-bottom-color: rgba(236, 180, 160, 0.4);
        }

        .dark .nav-bar {
          background: rgba(22, 16, 14, 0.9);
          border-bottom-color: rgba(160, 90, 70, 0.2);
        }

        .dark .nav-bar.scrolled {
          box-shadow:
            0 4px 32px rgba(0, 0, 0, 0.45),
            0 1px 0 rgba(160, 90, 70, 0.3);

          border-bottom-color: rgba(160, 90, 70, 0.35);
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          height: 72px;
        }

        /* ───────────────── Logo ───────────────── */

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 14px;

          text-decoration: none;
          flex-shrink: 0;

          transition: transform 0.25s ease;
        }

        .nav-logo:hover {
          transform: translateY(-1px);
        }

        .nav-logo-icon {
          width: 56px;
          height: 56px;

          border-radius: 50%;
          overflow: hidden;
          position: relative;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,0.9),
              rgba(255,245,240,0.85)
            );

          border: 2px solid rgba(232, 153, 122, 0.25);

          box-shadow:
            0 4px 18px rgba(212, 117, 106, 0.22),
            0 2px 6px rgba(0,0,0,0.04);

          display: flex;
          align-items: center;
          justify-content: center;

          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.35s ease,
            border-color 0.3s ease;
        }

        .nav-logo-icon::before {
          content: "";
          position: absolute;
          inset: -3px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              rgba(232,153,122,0.35),
              rgba(212,117,106,0.15),
              rgba(255,192,203,0.28)
            );

          z-index: -1;
          opacity: 0;

          transition: opacity 0.3s ease;
        }

        .nav-logo:hover .nav-logo-icon {
          transform:
            rotate(-5deg)
            scale(1.08);

          box-shadow:
            0 10px 28px rgba(212,117,106,0.35),
            0 4px 10px rgba(0,0,0,0.08);

          border-color: rgba(232, 153, 122, 0.5);
        }

        .nav-logo:hover .nav-logo-icon::before {
          opacity: 1;
        }

        .nav-logo-img {
          width: 100%;
          height: 100%;

          object-fit: cover;

          transition:
            transform 0.4s ease,
            filter 0.3s ease;
        }

        .nav-logo:hover .nav-logo-img {
          transform: scale(1.06);
        }

        .nav-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 600;

          color: #2A1A14;

          letter-spacing: -0.02em;
          line-height: 1;

          transition:
            color 0.3s ease,
            transform 0.25s ease;
        }

        .nav-logo:hover .nav-logo-text {
          color: #C1604E;
        }

        .dark .nav-logo-text {
          color: #F5EDE8;
        }

        .dark .nav-logo:hover .nav-logo-text {
          color: #F0C4B0;
        }

        .dark .nav-logo-icon {
          background:
            linear-gradient(
              135deg,
              rgba(35,25,22,0.95),
              rgba(28,18,16,0.9)
            );

          border-color: rgba(232,153,122,0.18);

          box-shadow:
            0 6px 22px rgba(0,0,0,0.45);
        }

        /* ───────────────── Desktop Links ───────────────── */

        .nav-links {
          display: none;
          align-items: center;
          gap: 4px;
        }

        @media (min-width: 768px) {
          .nav-links {
            display: flex;
          }
        }

        .nav-link {
          position: relative;

          display: inline-flex;
          align-items: center;

          padding: 8px 14px;

          border-radius: 10px;

          font-size: 0.9rem;
          font-weight: 400;

          color: #5A3E35;

          text-decoration: none;
          background: transparent;
          border: none;

          cursor: pointer;

          transition:
            color 0.18s,
            background 0.18s;
        }

        .nav-link::after {
          content: '';

          position: absolute;

          bottom: 4px;
          left: 14px;
          right: 14px;

          height: 1.5px;

          background:
            linear-gradient(
              90deg,
              #E8997A,
              #D4756A
            );

          border-radius: 2px;

          transform: scaleX(0);
          transform-origin: left;

          transition:
            transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-link:hover {
          color: #C1604E;
          background: rgba(232, 153, 122, 0.08);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .dark .nav-link {
          color: #C8A99A;
        }

        .dark .nav-link:hover {
          color: #F0C4B0;
          background: rgba(232, 153, 122, 0.1);
        }

        /* ───────────────── Actions ───────────────── */

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-icon-btn {
          position: relative;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          width: 40px;
          height: 40px;

          border-radius: 12px;

          color: #5A3E35;

          background: transparent;
          border: none;

          cursor: pointer;

          transition:
            color 0.18s,
            background 0.18s,
            transform 0.15s;

          text-decoration: none;
        }

        .nav-icon-btn:hover {
          color: #C1604E;
          background: rgba(232, 153, 122, 0.1);
          transform: translateY(-1px);
        }

        .dark .nav-icon-btn {
          color: #C8A99A;
        }

        .dark .nav-icon-btn:hover {
          color: #F0C4B0;
          background: rgba(232, 153, 122, 0.12);
        }

        .nav-badge {
          position: absolute;

          top: 2px;
          right: 2px;

          min-width: 17px;
          height: 17px;

          padding: 0 4px;

          background:
            linear-gradient(
              135deg,
              #E8997A,
              #C1604E
            );

          color: white;

          font-size: 10px;
          font-weight: 600;

          border-radius: 999px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-divider {
          width: 1px;
          height: 22px;

          background: rgba(232, 153, 122, 0.25);

          margin: 0 2px;
        }

        .dark .nav-divider {
          background: rgba(160, 90, 70, 0.25);
        }

        .btn-signin,
        .btn-signup {
          display: none;
        }

        @media (min-width: 640px) {
          .btn-signin,
          .btn-signup {
            display: flex;
            align-items: center;
          }
        }

        .btn-signin {
          padding: 8px 16px;

          font-size: 0.85rem;
          font-weight: 500;

          color: #5A3E35;

          background: transparent;

          border: 1.5px solid rgba(232, 153, 122, 0.3);
          border-radius: 10px;

          cursor: pointer;

          transition: all 0.18s;
        }

        .btn-signin:hover {
          border-color: rgba(193, 96, 78, 0.5);
          background: rgba(232, 153, 122, 0.06);
          color: #C1604E;
        }

        .btn-signup {
          padding: 8px 18px;

          font-size: 0.85rem;
          font-weight: 500;

          color: white;

          background:
            linear-gradient(
              135deg,
              #E8997A,
              #C1604E
            );

          border: none;
          border-radius: 10px;

          cursor: pointer;

          box-shadow:
            0 2px 10px rgba(193, 96, 78, 0.3);

          transition: all 0.18s;
        }

        .btn-signup:hover {
          transform: translateY(-1px);

          box-shadow:
            0 4px 18px rgba(193, 96, 78, 0.4);
        }

        /* mobile button */

        .nav-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 40px;
          height: 40px;

          border-radius: 12px;

          background: transparent;
          border: none;

          color: #5A3E35;

          cursor: pointer;
        }

        @media (min-width: 768px) {
          .nav-hamburger {
            display: none;
          }
        }
      `}</style>

      <nav className="nav-root">
        <div className={`nav-bar${scrolled ? " scrolled" : ""}`}>
          <div className="nav-inner">
            {/* LOGO */}
            <Link to="/" className="nav-logo">
              <div className="nav-logo-icon">
                <img
                  src="/yarn-shop-2-removebg-preview.svg"
                  alt="Yarn Shop"
                  className="nav-logo-img"
                />
              </div>

              <span className="nav-logo-text">Yarn Shop</span>
            </Link>

            {/* LINKS */}
            <div className="nav-links">
              {NAV_LINKS.map(({ label, href, protected: isProtected }) =>
                isProtected && !isAuthenticated ? (
                  <button
                    key={label}
                    className="nav-link"
                    onClick={onSignIn}
                  >
                    {label}
                  </button>
                ) : (
                  <Link key={label} to={href} className="nav-link">
                    {label}
                  </Link>
                )
              )}
            </div>

            {/* ACTIONS */}
            <div className="nav-actions">
              {isAuthenticated && (
                <Link
                  to="/love"
                  className="nav-icon-btn"
                  aria-label="Favourites"
                >
                  <Heart size={18} />

                  {favorites.length > 0 && (
                    <span className="nav-badge">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              )}

              <Link
                to="/cart"
                className="nav-icon-btn"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />

                {cartCount > 0 && (
                  <span className="nav-badge">
                    {cartCount}
                  </span>
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

                  <button
                    className="btn-signin"
                    onClick={onSignIn}
                  >
                    Sign In
                  </button>

                  <button
                    className="btn-signup"
                    onClick={onSignUp}
                  >
                    Sign Up
                  </button>
                </>
              )}

              <button
                className="nav-hamburger"
                onClick={() =>
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                }
              >
                {isMobileMenuOpen ? (
                  <X size={20} />
                ) : (
                  <Menu size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}