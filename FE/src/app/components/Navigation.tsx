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
import { motion, AnimatePresence } from "motion/react";
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
    label: "HOW IT WORKS",
    href: "/",
    icon: Sparkles,
    sectionId: "section-how-it-works",
    protected: false,
  },
  {
    label: "LEARN",
    href: "/",
    icon: BookOpen,
    sectionId: "section-learn",
    protected: false,
  },
  {
    label: "SHOP",
    href: "/",
    icon: ShoppingBag,
    sectionId: "section-shop",
    protected: false,
  },
  {
    label: "DIY",
    href: "/",
    icon: Palette,
    sectionId: "section-diy",
    protected: false,
  },
  {
    label: "ABOUT US",
    href: "/about",
    icon: Heart,
    sectionId: undefined,
    protected: false,
  },
];

// ── Stagger cho danh sách link trong mobile drawer ─────────────────────────────
const drawerListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const drawerItemVariants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Navigation({ cartCount }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites, favoriteKits } = useFavorites();
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
  const isAboutPage = location.pathname === "/about";
  
  // Only use homeNavLinks on Home and About Us pages, otherwise use navLinks
  const displayedNavLinks = (isHomePage || isAboutPage) ? homeNavLinks : navLinks;

  const showFullActions = isAuthenticated && !isHomePage && !isAboutPage;
  const showAuthButtons = !isAuthenticated;

  // Navbar "nổi" chỉ khi đang ở đầu trang Home, chưa cuộn
  const isFloating = isHomePage && !scrolled;

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
    ["section-how-it-works", "section-learn", "section-shop", "section-diy"].forEach((id) => {
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
    
    // If clicking HOME (href="/"), always scroll to top
    if (href === "/" && !sectionId) {
      if (!isHomePage) {
        navigate("/");
        setTimeout(() => {
          scrollToSection("top");
        }, 100);
      } else {
        scrollToSection("top");
      }
      return;
    }
    
    // If on About Us page and clicking a section link, go to Home first then scroll
    if (isAboutPage && sectionId) {
      navigate("/");
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
      return;
    }
    
    // If on Home page and clicking a section link, just scroll
    if (isHomePage && sectionId) {
      scrollToSection(sectionId);
      return;
    }
    
    // Otherwise, navigate to the href
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
      <motion.header
        layout
        animate={{
          marginTop: isFloating ? 12 : 0,
          marginLeft: isFloating ? 16 : 0,
          marginRight: isFloating ? 16 : 0,
          borderRadius: isFloating ? 24 : 0,
          boxShadow: isFloating
            ? "0 8px 30px rgba(60,40,100,0.12)"
            : scrolled
              ? "0 4px 20px rgba(60,40,100,0.08)"
              : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className={cn(
          "sticky top-0 z-50 border transition-all duration-300",
          isFloating
            ? "border-[var(--border-light)] bg-[var(--glass-bg)] backdrop-blur-[20px]"
            : "border-[var(--border-light)] border-t-0 border-x-0 bg-[var(--glass-bg)] backdrop-blur-[20px]",
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
          <Link to="/" className="group relative flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileHover={{ rotate: -6, scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-lg font-bold text-white shadow-[0_8px_24px_rgba(107,63,160,0.25)]"
            >
              L
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="pointer-events-none absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm"
              >
                <Sparkles className="size-2.5" />
              </motion.span>
            </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="leading-none"
              >
                <p className="font-heading text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  Len<span className="text-[var(--primary)]">&</span>em
                </p>
                <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--foreground-muted)] sm:block">
                  Learn • Buy • Create
                </p>
              </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {displayedNavLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href,
                "sectionId" in item ? (item.sectionId as string) : undefined,
              );
              return (
                <motion.button
                  key={item.href}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    navigateTo(
                      item.href,
                      "sectionId" in item
                        ? (item.sectionId as string)
                        : undefined,
                    )
                  }
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold tracking-[0.1em] select-none",
                    active
                      ? "text-[var(--primary)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {/* Pill background - AnimatePresence ensures smooth crossfade between links */}
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.span
                        key="pill"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 28,
                          mass: 0.6,
                        }}
                        className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Underline */}
                  <motion.span
                    className="absolute -bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[var(--primary)]"
                    initial={false}
                    animate={active ? { scaleX: 1, opacity: 0.5 } : { scaleX: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26, mass: 0.6 }}
                    style={{ transformOrigin: "center" }}
                  />
                  
                  {/* Icon */}
                  <span style={{ color: active ? "var(--primary)" : undefined }}>
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                </motion.button>
              );
            })}
          </nav>

          {/* Desktop Right */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && !isHomePage && !isAboutPage && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="nav-icon-btn"
              >
                <NotificationsBell />
              </motion.div>
            )}
            {showFullActions && (
              <>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="nav-icon-btn"
                >
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full text-[var(--foreground)] min-h-[44px] min-w-[44px] hover:bg-[var(--accent-blush)] transition-colors overflow-visible"
                  >
                    <Link to="/love" aria-label="Favorites">
                      <Heart className="size-5" />
                      {favorites.length + favoriteKits.length > 0 && (
                        <Counter>
                          {favorites.length + favoriteKits.length}
                        </Counter>
                      )}
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="nav-icon-btn"
                >
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full text-[var(--foreground)] min-h-[44px] min-w-[44px] hover:bg-[var(--accent-blush)] transition-colors overflow-visible"
                  >
                    <Link to="/cart" aria-label="Cart">
                      <ShoppingCart className="size-5" />
                      {cartCount > 0 && <Counter>{cartCount}</Counter>}
                    </Link>
                  </Button>
                </motion.div>
              </>
            )}

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="nav-icon-btn"
            >
              <ThemeToggle />
            </motion.div>
            {showAuthButtons && (
              <>
                <motion.button
                  whileHover={{ y: -1 }}
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-[0.12em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
                >
                  <LogIn className="size-4" />
                  LOGIN
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  type="button"
                  onClick={() => navigate("/auth/register")}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-[0.12em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
                >
                  <UserPlus className="size-4" />
                  REGISTER
                </motion.button>
              </>
            )}
            {isAuthenticated && !isHomePage && !isAboutPage && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="nav-icon-btn"
              >
                <div className="relative">
                  <UserMenu position="top" />
                </div>
              </motion.div>
            )}
            {(isAuthenticated && isHomePage) || (isAuthenticated && isAboutPage) ? (
              <ShimmerCTA onClick={() => navigate("/learn")} />
            ) : null}
          </div>

          {/* Mobile hamburger ⇄ X morph */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-[var(--foreground)] md:hidden min-h-[44px] min-w-[44px] overflow-hidden"
            onClick={() => setIsMobileMenuOpen((o) => !o)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  <X className="size-6" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  <Menu className="size-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.header>

      {/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/35 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-50 h-dvh w-[82vw] max-w-sm border-l border-[var(--border-light)] bg-[var(--background)] p-5 shadow-2xl md:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <p className="font-heading text-2xl font-bold text-[var(--foreground)]">
                  Len<span className="text-[var(--primary)]">&</span>em
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

              <motion.nav
                variants={drawerListVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {displayedNavLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(
                    item.href,
                    "sectionId" in item
                      ? (item.sectionId as string)
                      : undefined,
                  );
                  return (
                    <motion.button
                      key={item.href}
                      variants={drawerItemVariants}
                      whileTap={{ scale: 0.98 }}
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
                        "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left font-bold text-[var(--foreground)] transition-colors min-h-[44px]",
                        active
                          ? "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]"
                          : "hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
                      )}
                    >
                      <Icon className="size-5" />
                      {item.label}
                      {active && (
                        <motion.span
                          layoutId="mobile-active-dot"
                      className="ml-auto size-2 rounded-full bg-[var(--primary)]"
                        />
                      )}
                    </motion.button>
                  );
                })}

                {showAuthButtons && (
                  <>
                    <motion.button
                      variants={drawerItemVariants}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => navigateTo("/auth/login")}
                       className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] min-h-[44px]"
                     >
                       <LogIn className="size-5" />
                       LOGIN
                     </motion.button>
                     <motion.button
                       variants={drawerItemVariants}
                       whileTap={{ scale: 0.98 }}
                       type="button"
                       onClick={() => navigateTo("/auth/register")}
                       className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] min-h-[44px]"
                     >
                      <UserPlus className="size-5" />
                      REGISTER
                    </motion.button>
                  </>
                )}

                {(isAuthenticated && isHomePage) || (isAuthenticated && isAboutPage) ? (
                  <motion.div variants={drawerItemVariants} className="pt-2">
                    <ShimmerCTA
                      full
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/learn");
                      }}
                    />
                  </motion.div>
                ) : null}
              </motion.nav>

              {showFullActions && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-8 grid grid-cols-2 gap-3"
                >
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full min-h-[44px]"
                  >
                    <Link to="/love" onClick={() => setIsMobileMenuOpen(false)}>
                      Saved ({favorites.length + favoriteKits.length})
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
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--border-light)] p-3"
              >
                <span className="text-sm font-bold text-[var(--foreground-muted)]">
                  Theme
                </span>
                <ThemeToggle />
              </motion.div>

              {showFullActions && (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/auth/login", { replace: true });
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--foreground-muted)] transition-colors hover:bg-destructive/10 min-h-[44px]"
                >
                  <LogOut className="size-5" />
                  LOGOUT
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      {isMobile && !isMobileMenuOpen && !keyboardOpen && <BottomNav />}
    </>
  );
}

// ── Nút CTA "Start" ──────────────────────────────────────

function ShimmerCTA({
  onClick,
  full = false,
}: {
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-5 py-2 text-sm font-bold tracking-[0.08em] text-white shadow-[0_6px_20px_rgba(107,63,160,0.3)] transition-shadow hover:shadow-[0_10px_28px_rgba(107,63,160,0.4)]",
        full && "w-full px-10 py-3",
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative">Start</span>
      <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-1" />
    </motion.button>
  );
}

// ── Badge số — background đỏ chữ trắng ──────────────────

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={String(children)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-white shadow-sm z-10"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}