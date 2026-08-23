import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCart } from "../../contexts/CartContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { NavigationDesktop } from "./NavigationDesktop";
import { NavigationMobile } from "./NavigationMobile";

export function Navigation({ cartCount }: { cartCount: number }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { favorites, favoriteKits } = useFavorites();
  const { isAuthenticated, isLoading } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () =>
      setKeyboardOpen(window.innerHeight - viewport.height > 150);
    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery(new URLSearchParams(location.search).get("search") ?? "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    else params.delete("search");
    navigate(`${location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  if (isMobile)
    return (
      <NavigationMobile
        open={mobileOpen}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        activePath={location.pathname}
        onOpen={() => setMobileOpen(true)}
        onClose={() => setMobileOpen(false)}
        onLogin={() => {
          setMobileOpen(false);
          navigate("/auth/login");
        }}
        onRegister={() => {
          setMobileOpen(false);
          navigate("/auth/register");
        }}
        onBack={() => navigate(-1)}
        showBackButton={showBackButton}
        onLogout={() => {
          signOut();
          navigate("/auth/login", { replace: true });
        }}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        searchPlaceholder={searchPlaceholder}
        onSearchToggle={() => setSearchOpen((open) => !open)}
        onSearchChange={setSearchQuery}
        onSearchSubmit={submitSearch}
        favoriteCount={favorites.length + favoriteKits.length}
        cartCount={cartCount || totalItems}
        t={t}
      />
    );
  if (keyboardOpen) return null;
  return (
    <NavigationDesktop
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      cartCount={cartCount || totalItems}
      favoriteCount={favorites.length + favoriteKits.length}
      searchOpen={searchOpen}
      searchQuery={searchQuery}
      searchPlaceholder={searchPlaceholder}
      activePath={location.pathname}
      onSearchToggle={() => setSearchOpen((open) => !open)}
      onSearchChange={setSearchQuery}
      onSearchSubmit={submitSearch}
      onLogin={() => navigate("/auth/login")}
      onRegister={() => navigate("/auth/register")}
    />
  );
}
