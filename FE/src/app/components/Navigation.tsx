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

export function Navigation({ cartCount, onSignIn, onSignUp }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground">🧶</span>
            </div>
            <span className="font-semibold text-xl text-foreground">CozyStitch</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <Link to="/shop" className="text-foreground hover:text-primary transition-colors">
                Shop
              </Link>
            ) : (
              <button
                onClick={onSignIn}
                className="text-foreground hover:text-primary transition-colors"
              >
                Shop
              </button>
            )}
            {isAuthenticated ? (
              <Link to="/kits" className="text-foreground hover:text-primary transition-colors">
                DIY Kits
              </Link>
            ) : (
              <button
                onClick={onSignIn}
                className="text-foreground hover:text-primary transition-colors"
              >
                DIY Kits
              </button>
            )}
            <Link to="/community" className="text-foreground hover:text-primary transition-colors">
              Community
            </Link>
            <Link to="/learn" className="text-foreground hover:text-primary transition-colors">
              Learn
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <Link to="/love" className="relative text-foreground hover:text-primary transition-colors">
                <Heart className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/cart" className="relative text-foreground hover:text-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {!isAuthenticated && (
              <Link to="/cart" className="relative text-foreground hover:text-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <UserMenu />
                <ThemeToggle size="sm" />
              </div>
            ) : (
              <>
                <ThemeToggle size="sm" />
                <button
                  onClick={onSignIn}
                  className="hidden sm:block text-foreground hover:text-primary transition-colors px-4 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="hidden sm:block bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-foreground hover:text-primary transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" />
      )}

      {/* Mobile menu drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 z-40 h-full w-72 bg-card shadow-2xl border-l border-border transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <span className="font-semibold text-lg text-foreground">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
          {isAuthenticated ? (
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
            >
              Shop
            </Link>
          ) : (
            <button
              onClick={() => { setIsMobileMenuOpen(false); onSignIn(); }}
              className="block w-full text-left text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
            >
              Shop
            </button>
          )}
          {isAuthenticated ? (
            <Link
              to="/kits"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
            >
              DIY Kits
            </Link>
          ) : (
            <button
              onClick={() => { setIsMobileMenuOpen(false); onSignIn(); }}
              className="block w-full text-left text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
            >
              DIY Kits
            </button>
          )}
          <Link
            to="/community"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
          >
            Community
          </Link>
          <Link
            to="/learn"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-muted"
          >
            Learn
          </Link>
          {!isAuthenticated && (
            <div className="pt-4 border-t border-border space-y-3 mt-4">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onSignIn(); }}
                className="block w-full text-center bg-primary text-primary-foreground px-5 py-3 rounded-full hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onSignUp(); }}
                className="block w-full text-center bg-primary text-primary-foreground px-5 py-3 rounded-full hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}