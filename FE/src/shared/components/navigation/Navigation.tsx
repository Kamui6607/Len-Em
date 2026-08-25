import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../contexts/CartContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { NavigationDesktop } from "./NavigationDesktop";
import { NavigationMobile } from "./NavigationMobile";
import { navLinks, homeNavLinks, type NavLink } from "./nav-links";

/**
 * Orchestrates the shared navigation state used by both the desktop and mobile
 * bars: active section tracking (Home), scroll/floating detection, search, auth
 * and mobile-drawer state. Renders either NavigationDesktop or NavigationMobile.
 */
export function Navigation({ cartCount }: { cartCount: number }) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { favorites, favoriteKits } = useFavorites();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { totalItems } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  // Detect keyboard open to hide the bottom nav on mobile.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () =>
      setKeyboardOpen(window.innerHeight - viewport.height > 150);
    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  const isHomePage = location.pathname === "/";
  const isAboutPage = location.pathname === "/about";

  // Only use homeNavLinks on Home and About pages, otherwise use navLinks.
  const displayedNavLinks: NavLink[] =
    isHomePage || isAboutPage ? homeNavLinks : navLinks;

  const showFullActions = isAuthenticated && !isHomePage && !isAboutPage;
  const showAuthButtons = !isAuthenticated && !isLoading;
  const showAuthPlaceholder = isLoading;

  // Navbar rounds off on scroll.
  const isFloating = scrolled;

  // ── Scroll helpers ──
  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Search: update the URL search param on the current page ──
  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(location.search);
    params.delete("search");
    const url = params.toString()
      ? `${location.pathname}?${params.toString()}`
      : location.pathname;
    navigate(url, { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      clearSearch();
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set("search", q);
    navigate(`${location.pathname}?${params.toString()}`);
    // Keep the search bar open so the user can see the query.
  };

  const toggleSearch = () => {
    const willOpen = !searchOpen;
    setSearchOpen(willOpen);
    if (!willOpen) {
      setSearchQuery("");
      const params = new URLSearchParams(location.search);
      params.delete("search");
      const url = params.toString()
        ? `${location.pathname}?${params.toString()}`
        : location.pathname;
      navigate(url, { replace: true });
    }
  };
// Effects
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the Home section link matching whatever section is
  // currently under the navbar — works for scrolling by hand, not only on click.
  // Sections are stacked top→bottom, so the active one is the last section whose
  // top edge has crossed a reference line just below the sticky navbar.
  useEffect(() => {
    if (location.pathname !== "/") return;

    const SECTION_IDS = [
      "section-how-it-works",
      "section-learn",
      "section-shop",
      "section-diy",
    ];

    // Reference line sits right under the navbar (h-20 = 80px + a little air).
    const NAV_OFFSET = 120;

    const updateActive = () => {
      let current: string = "top";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= NAV_OFFSET) current = id;
      }
      setActiveSection(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close search on Escape.
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

  // Reset search on route change.
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  // Helpers
  const isActive = (href: string, sectionId?: string) => {
    if (isHomePage) return sectionId ? activeSection === sectionId : false;
    return href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);
  };

  const navigateTo = (href: string, sectionId?: string) => {
    setMobileOpen(false);

    // Clicking HOME (href="/", no section) always scrolls to top.
    if (href === "/" && !sectionId) {
      if (!isHomePage) {
        navigate("/");
        setTimeout(() => scrollToSection("top"), 100);
      } else {
        scrollToSection("top");
      }
      return;
    }

    // On About page, section links go Home first, then scroll.
    if (isAboutPage && sectionId) {
      navigate("/");
      setTimeout(() => scrollToSection(sectionId), 100);
      return;
    }

    // On Home page, section links just scroll.
    if (isHomePage && sectionId) {
      scrollToSection(sectionId);
      return;
    }

    navigate(href);
  };

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

  const searchPlaceholder = useMemo(() => {
    if (location.pathname.startsWith("/shop"))
      return t("nav.searchProducts", "Search products");
    if (location.pathname.startsWith("/learn"))
      return t("nav.searchLessons", "Search lessons");
    if (location.pathname.startsWith("/diy"))
      return t("nav.searchDiy", "Search DIY");
    if (location.pathname.startsWith("/kits"))
      return t("nav.searchKits", "Search kits");
    return t("nav.search", "Search");
  }, [location.pathname, t]);

  const favoriteCount = favorites.length + favoriteKits.length;
  const cartTotal = cartCount || totalItems;

  if (isMobile)
    return (
      <NavigationMobile
        open={mobileOpen}
        links={displayedNavLinks}
        isHomePage={isHomePage}
        isAboutPage={isAboutPage}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        isFloating={isFloating}
        showBackButton={showBackButton}
        keyboardOpen={keyboardOpen}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        searchPlaceholder={searchPlaceholder}
        favoriteCount={favoriteCount}
        cartCount={cartTotal}
        showFullActions={showFullActions}
        showAuthButtons={showAuthButtons}
        showAuthPlaceholder={showAuthPlaceholder}
        onOpen={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
        onBack={() => navigate(-1)}
        onLogin={() => {
          setMobileOpen(false);
          navigate("/auth/login");
        }}
        onRegister={() => {
          setMobileOpen(false);
          navigate("/auth/register");
        }}
        onLogout={() => {
          signOut();
          navigate("/auth/login", { replace: true });
        }}
        onSearchToggle={toggleSearch}
        onSearchChange={setSearchQuery}
        onSearchClear={clearSearch}
        onSearchSubmit={handleSearch}
        onNavigate={navigateTo}
        isActive={isActive}
        onStart={() => {
          setMobileOpen(false);
          navigate("/learn");
        }}
        t={t}
      />
    );

  if (keyboardOpen) return null;

  return (
    <NavigationDesktop
      links={displayedNavLinks}
      isHomePage={isHomePage}
      isAboutPage={isAboutPage}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      isFloating={isFloating}
      searchOpen={searchOpen}
      searchQuery={searchQuery}
      searchPlaceholder={searchPlaceholder}
      favoriteCount={favoriteCount}
      cartCount={cartTotal}
      showFullActions={showFullActions}
      showAuthButtons={showAuthButtons}
      showAuthPlaceholder={showAuthPlaceholder}
      onSearchToggle={toggleSearch}
      onSearchChange={setSearchQuery}
      onSearchClear={clearSearch}
      onSearchSubmit={handleSearch}
      onLogin={() => navigate("/auth/login")}
      onRegister={() => navigate("/auth/register")}
      onNavigate={navigateTo}
      isActive={isActive}
      onStart={() => navigate("/learn")}
      t={t}
    />
  );
}