import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Palette,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BottomNav } from "../../components/mobile/BottomNav";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";

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
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
};
const drawerItemVariants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Shared "glass chip" treatment for icon-only buttons in the desktop bar ──
const iconChipClass =
  "relative flex items-center justify-center rounded-full min-h-[42px] min-w-[42px] border border-[var(--chip-border)] bg-[var(--chip-bg)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)] hover:bg-[var(--chip-hover-bg)] hover:border-[var(--primary)]/40";

export function Navigation({ cartCount }: NavigationProps) {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites, favoriteKits } = useFavorites();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  const showAuthButtons = !isAuthenticated && !isLoading;
  const showAuthPlaceholder = isLoading;

  // Navbar bo tròn khi scroll (ngược với behavior cũ)
  const isFloating = scrolled;

  // Scroll helpers
  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Search: navigate to the current active nav link's page with search query ──
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Find the active nav link based on current path
    const currentNav = navLinks.find((link) => location.pathname.startsWith(link.href));
    if (currentNav) {
      // Navigate to the active link's page with search param
      navigate(`${currentNav.href}?search=${encodeURIComponent(q)}`);
    } else {
      // Fallback: navigate to SHOP (most common search target)
      navigate(`/shop?search=${encodeURIComponent(q)}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const toggleSearch = () => {
    setSearchOpen((o) => !o);
    // Focus input when opening
    setTimeout(() => {
      if (!searchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
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

  // Close search on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

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
      <header
        className={cn(
          "sticky top-0 z-50 border transition-all duration-300",
          isFloating
            ? "mt-3 mx-4 rounded-[24px] border-[var(--border-light)] bg-[var(--glass-bg)] backdrop-blur-[20px] shadow-[0_8px_30px_rgba(60,40,100,0.12)]"
            : "border-[var(--border-light)] border-t-0 border-x-0 bg-[var(--glass-bg)] backdrop-blur-[20px]",
        )}
      >
        {/* Thread seam — a hairline running-stitch that appears once the bar lifts off the page */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: isFloating ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-x-6 -bottom-px h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--primary) 0 6px, transparent 6px 12px)",
            opacity: 0.35,
          }}
        />

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

          {/* Logo — mark reads as a wound spool: a dashed thread ring that loosens on hover */}
          <Link to="/" className="group relative flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center">
              <motion.span
                aria-hidden="true"
                className="absolute inset-[-5px] rounded-full border border-dashed"
                style={{ borderColor: "var(--primary)", opacity: 0.35 }}
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 50 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
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
            </div>
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
                {t("nav.tagline")}
              </p>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {displayedNavLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href,
                "sectionId" in item ? (item.sectionId as string) : undefined,
              );
              return (
                <motion.button
                  key={item.label + item.href}
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
                    "group/link relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold tracking-[0.1em] select-none",
                    active
                      ? "text-[var(--primary)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {/* Soft hover/active wash */}
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
                        className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
                      />
                    )}
                  </AnimatePresence>

                  {/* Running-stitch underline — draws in on active, peeks on hover */}
                  <span className="pointer-events-none absolute bottom-1 left-3 right-3 flex justify-center overflow-hidden">
                    <motion.span
                      className="h-0 w-full border-b-2 border-dashed"
                      style={{ borderColor: "var(--primary)" }}
                      initial={false}
                      animate={{
                        scaleX: active ? 1 : 0,
                        opacity: active ? 0.55 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    />
                  </span>
                  <span className="pointer-events-none absolute bottom-1 left-3 right-3 flex justify-center overflow-hidden opacity-0 transition-opacity duration-200 group-hover/link:opacity-40">
                    {!active && (
                      <span
                        className="h-0 w-full border-b-2 border-dashed"
                        style={{ borderColor: "var(--foreground-muted)" }}
                      />
                    )}
                  </span>

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
            {/* ── Search button + input ── */}
            {isAuthenticated && !isHomePage && !isAboutPage && (
            <div className="relative flex items-center">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.form
                    key="search-form"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 224, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={handleSearch}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          location.pathname.startsWith("/shop")
                            ? t("nav.searchProducts")
                            : location.pathname.startsWith("/learn")
                              ? t("nav.searchLessons")
                              : location.pathname.startsWith("/diy")
                                ? t("nav.searchDiy")
                                : t("nav.search")
                        }
                        className="w-full h-[42px] pl-9 pr-3 rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:shadow-[var(--input-focus-shadow)] transition-colors"
                      />
                    </div>
                  </motion.form>
                ) : (
                  <motion.button
                    key="search-btn"
                    type="button"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSearch}
                    className={iconChipClass}
                    aria-label="Search"
                  >
                    <Search className="size-[18px]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            )}

            {showFullActions && (
              <>
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/love"
                    aria-label="Favorites"
                    className={cn(iconChipClass, "overflow-visible")}
                  >
                    <Heart className="size-[18px]" />
                    {favorites.length + favoriteKits.length > 0 && (
                      <Counter>{favorites.length + favoriteKits.length}</Counter>
                    )}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/cart"
                    aria-label="Cart"
                    className={cn(iconChipClass, "overflow-visible")}
                  >
                    <ShoppingCart className="size-[18px]" />
                    {cartCount > 0 && <Counter>{cartCount}</Counter>}
                  </Link>
                </motion.div>
              </>
            )}

            <div className="mx-1 h-6 w-px bg-[var(--divider)]" aria-hidden="true" />

            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="nav-icon-btn">
              <LanguageToggle />
            </motion.div>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="nav-icon-btn">
              <ThemeToggle />
            </motion.div>

            {showAuthPlaceholder && (
              <div className="ml-1 flex items-center gap-1.5">
                {/* Skeleton placeholder while checking auth state */}
                <div className="h-[38px] w-[100px] rounded-full bg-[var(--chip-bg)] animate-pulse" />
                <div className="h-[38px] w-[120px] rounded-full bg-[var(--chip-bg)] animate-pulse" />
              </div>
            )}
            {showAuthButtons && (
              <div className="ml-1 flex items-center gap-1.5">
                <motion.button
                  whileHover={{ y: -1 }}
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-bold tracking-[0.1em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
                >
                  <LogIn className="size-4" />
                  LOGIN
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => navigate("/auth/register")}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-4 py-2 text-sm font-bold tracking-[0.1em] text-white shadow-[0_6px_18px_rgba(107,63,160,0.28)] transition-shadow hover:shadow-[0_10px_26px_rgba(107,63,160,0.38)]"
                >
                  <UserPlus className="size-4" />
                  REGISTER
                </motion.button>
              </div>
            )}
            {isAuthenticated && !isHomePage && !isAboutPage && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="nav-icon-btn ml-1"
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
      </header>

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
              className="fixed right-0 top-0 z-50 flex h-dvh w-[82vw] max-w-sm flex-col overflow-hidden border-l border-[var(--border-light)] bg-[var(--background)] shadow-2xl md:hidden"
            >
              {/* Seam along the hinge edge — reads as a stitched fold */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-px"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(180deg, var(--primary) 0 6px, transparent 6px 12px)",
                  opacity: 0.3,
                }}
              />

              <div className="flex items-center justify-between p-5 pb-4">
                <p className="font-heading text-2xl font-bold text-[var(--foreground)]">
                  Len<span className="text-[var(--primary)]">&</span>em
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] rounded-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <motion.nav
                  variants={drawerListVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-1"
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
                        key={item.label + item.href}
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
                            "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl py-2.5 pl-4 pr-3 text-left font-bold text-[var(--foreground)] transition-colors min-h-[44px]",
                            active
                              ? "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]"
                              : "hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]",
                          )}
                      >
                        {/* Stitch marker — replaces the plain active dot */}
                        <motion.span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full"
                          style={{ background: "var(--primary)" }}
                          initial={false}
                          animate={{ opacity: active ? 1 : 0, scaleY: active ? 1 : 0.3 }}
                          transition={{ duration: 0.2 }}
                        />
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            active
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--chip-bg)] text-[var(--foreground-muted)]",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        {item.label}
                      </motion.button>
                    );
                  })}

                  {showAuthPlaceholder && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-[44px] rounded-2xl bg-[var(--chip-bg)] animate-pulse" />
                      <div className="h-[44px] rounded-2xl bg-[var(--chip-bg)] animate-pulse" />
                    </div>
                  )}
                  {showAuthButtons && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <motion.button
                        variants={drawerItemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => navigateTo("/auth/login")}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--chip-border)] px-4 py-3 text-center font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--chip-hover-bg)] min-h-[44px]"
                      >
                        <LogIn className="size-4" />
                        LOGIN
                      </motion.button>
                      <motion.button
                        variants={drawerItemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => navigateTo("/auth/register")}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-4 py-3 text-center font-bold text-white shadow-[0_6px_18px_rgba(107,63,160,0.28)] min-h-[44px]"
                      >
                        <UserPlus className="size-4" />
                        REGISTER
                      </motion.button>
                    </div>
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
              </div>

              <div className="shrink-0 border-t border-[var(--border-light)] px-5 py-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--border-light)] px-4 py-3">
                  <span className="text-sm font-bold text-[var(--foreground-muted)]">
                    Ngôn ngữ & Giao diện
                  </span>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>

                {showFullActions && (
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      navigate("/auth/login", { replace: true });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-center font-bold text-[var(--error-text)] transition-colors hover:brightness-105 min-h-[44px]"
                  >
                    <LogOut className="size-5" />
                    LOGOUT
                  </button>
                )}
              </div>
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
        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-white shadow-sm z-10 ring-2 ring-[var(--background)]"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}