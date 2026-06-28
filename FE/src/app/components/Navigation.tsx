import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Palette,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BottomNav } from "../../components/mobile/BottomNav";
import { NotificationsBell } from "./NotificationsBell";

interface NavigationProps {
  cartCount: number;
}

const navLinks = [
  { label: "LEARN", href: "/learn", icon: BookOpen, protected: false },
  { label: "SHOP", href: "/shop", icon: ShoppingBag, protected: true },
  { label: "DIY", href: "/diy", icon: Palette, protected: false },
];

const homeNavLinks = [
  {
    label: "HOME",
    href: "/",
    icon: Sparkles,
    sectionId: "top",
    protected: false,
  },
  {
    label: "LEARN",
    href: "/learn",
    icon: BookOpen,
    sectionId: "section-learn",
    protected: false,
  },
  {
    label: "SHOP",
    href: "/shop",
    icon: ShoppingBag,
    sectionId: "section-shop",
    protected: true,
  },
  {
    label: "DIY",
    href: "/diy",
    icon: Palette,
    sectionId: "section-diy",
    protected: false,
  },
];

export function Navigation({ cartCount }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { isAuthenticated, signOut } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Detect keyboard open to hide bottom nav
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      const isKeyboard = window.innerHeight - viewport.height > 150;
      setKeyboardOpen(isKeyboard);
    };
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  const isHomePage = location.pathname === "/";
  const displayedNavLinks = isHomePage ? homeNavLinks : navLinks;

  const showFullActions = isAuthenticated && !isHomePage;
  const showAuthButtons = !isAuthenticated;

  // Scroll helpers
  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Effects
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHomePage) return;
    const onScroll = () => {
      if (window.scrollY < 260) setActiveSection("top");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { threshold: 0.4 },
    );
    ["section-learn", "section-shop", "section-diy"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHomePage]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Helpers
  const isActive = (href: string, sectionId?: string) => {
    if (isHomePage) return sectionId ? activeSection === sectionId : false;
    return href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);
  };

  const navigateTo = (href: string, sectionId?: string) => {
    setIsMobileMenuOpen(false);
    if (isHomePage && sectionId) {
      scrollToSection(sectionId);
      return;
    }
    navigate(href);
  };

  // Determine if back button should be shown on mobile
  const topLevelPaths = [
    "/learn",
    "/shop",
    "/diy",
    "/profile",
    "/auth/login",
    "/auth/register",
  ];
  const showBackButton =
    isMobile &&
    location.pathname !== "/" &&
    !topLevelPaths.includes(location.pathname);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur-xl transition-shadow duration-300",
          scrolled && "shadow-[0_12px_34px_rgba(44,36,32,0.08)]",
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Back button for mobile */}
          {showBackButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px] rounded-full text-[var(--color-text)]"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="size-6" />
            </Button>
          )}

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-bold text-white shadow-[0_10px_24px_rgba(196,94,62,0.28)] transition-transform group-hover:-translate-y-0.5">
              L
            </div>
            <div className="leading-none">
              <p className="font-heading text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Len<span className="text-[var(--color-primary)]">&</span>em
              </p>
              <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)] sm:block">
                Learn • Buy • Create
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {displayedNavLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href,
                "sectionId" in item ? (item.sectionId as string) : undefined,
              );
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() =>
                    navigateTo(
                      item.href,
                      "sectionId" in item
                        ? (item.sectionId as string)
                        : undefined,
                    )
                  }
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]",
                    active && "text-[var(--color-text)]",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 -bottom-2 h-[3px] origin-left rounded-full bg-[var(--color-primary)] transition-transform duration-200",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          {/* Desktop Right */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && !isHomePage && (
              <>
                <div className="NotificationsBell">
                  <NotificationsBell />
                </div>
              </>
            )}
            {showFullActions && (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-[var(--color-text)] min-h-[44px] min-w-[44px]"
                >
                  <Link to="/love" aria-label="Favorites">
                    <Heart className="size-5" />
                    {favorites.length > 0 && (
                      <Counter>{favorites.length}</Counter>
                    )}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-[var(--color-text)] min-h-[44px] min-w-[44px]"
                >
                  <Link to="/cart" aria-label="Cart">
                    <ShoppingCart className="size-5" />
                    {cartCount > 0 && <Counter>{cartCount}</Counter>}
                  </Link>
                </Button>
              </>
            )}

            <ThemeToggle />
            {showAuthButtons && (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                >
                  <LogIn className="size-4" />
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/auth/register")}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                >
                  <UserPlus className="size-4" />
                  REGISTER
                </button>
              </>
            )}
            {isAuthenticated && !isHomePage && (
              <>
                <div className="relative">
                  <UserMenu position="top" />
                </div>
              </>
            )}
            {isAuthenticated && isHomePage && (
              <button
                type="button"
                onClick={() => navigate("/learn")}
                className="group flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold tracking-[0.08em] text-white shadow-[0_6px_20px_rgba(196,94,62,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(196,94,62,0.45)]"
              >
                Start
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-[var(--color-text)] md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </Button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/35 opacity-0 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-dvh w-[82vw] max-w-sm border-l border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-2xl transition-transform duration-300 ease-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <p className="font-heading text-2xl font-bold text-[var(--color-text)]">
            Len<span className="text-[var(--color-primary)]">&</span>em
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Mobile nav links */}
        <nav className="space-y-2">
          {displayedNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  navigateTo(
                    item.href,
                    "sectionId" in item
                      ? (item.sectionId as string)
                      : undefined,
                  )
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] min-h-[44px]",
                  isActive(
                    item.href,
                    "sectionId" in item
                      ? (item.sectionId as string)
                      : undefined,
                  ) &&
                    "bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}

          {showAuthButtons && (
            <>
              <button
                type="button"
                onClick={() => navigateTo("/auth/login")}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] min-h-[44px]"
              >
                <LogIn className="size-5" />
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/auth/register")}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] min-h-[44px]"
              >
                <UserPlus className="size-5" />
                REGISTER
              </button>
            </>
          )}

          {isAuthenticated && isHomePage && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate("/learn");
              }}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-10 py-3 text-sm font-bold tracking-[0.08em] text-white shadow-[0_6px_20px_rgba(196,94,62,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(196,94,62,0.45)]"
            >
              Start
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          )}
        </nav>

        {showFullActions && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-full min-h-[44px]"
            >
              <Link to="/love" onClick={() => setIsMobileMenuOpen(false)}>
                Saved ({favorites.length})
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] min-h-[44px]"
            >
              <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--color-border)] p-3">
          <span className="text-sm font-bold text-[var(--color-text-muted)]">
            Theme
          </span>
          <ThemeToggle />
        </div>

        {showFullActions && (
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--color-text-muted)] transition-colors hover:bg-destructive/10 min-h-[44px]"
          >
            <LogOut className="size-5" />
            LOGOUT
          </button>
        )}
      </aside>

      {/* Bottom nav - hide when mobile menu open or keyboard visible */}
      {isMobile && !isMobileMenuOpen && !keyboardOpen && <BottomNav />}
    </>
  );
}

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
      {children}
    </span>
  );
}
