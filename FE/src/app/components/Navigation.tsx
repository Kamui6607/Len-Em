import { useEffect, useState } from "react";
import { BookOpen, Heart, Menu, Palette, ShoppingBag, ShoppingCart, Sparkles, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useFavorites } from "../context/FavoritesContext";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface NavigationProps {
  cartCount: number;
}

const navLinks = [
  { label: "LEARN", href: "/learn", icon: BookOpen, protected: false },
  { label: "SHOP", href: "/shop", icon: ShoppingBag, protected: true },
  { label: "DIY", href: "/diy", icon: Palette, protected: false },
];

const homeNavLinks = [
  { label: "HOME", href: "/", icon: Sparkles, sectionId: "top", protected: false },
  { label: "LEARN", href: "/learn", icon: BookOpen, sectionId: "section-learn", protected: false },
  { label: "SHOP", href: "/shop", icon: ShoppingBag, sectionId: "section-shop", protected: true },
  { label: "DIY", href: "/diy", icon: Palette, sectionId: "section-diy", protected: false },
];

export function Navigation({ cartCount }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const isHomePage = location.pathname === "/";
  const displayedNavLinks = isHomePage ? homeNavLinks : navLinks;

  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const isActive = (href: string, sectionId?: string) => {
    if (isHomePage) return sectionId ? activeSection === sectionId : false;
    return href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
  };

  const navigateTo = (href: string, isProtected: boolean, sectionId?: string) => {
    setIsMobileMenuOpen(false);
    if (isHomePage && sectionId) {
      scrollToSection(sectionId);
      return;
    }
    navigate(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur-xl transition-shadow duration-300",
        scrolled && "shadow-[0_12px_34px_rgba(44,36,32,0.08)]",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-2 md:flex">
          {displayedNavLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, "sectionId" in item ? (item.sectionId as string) : undefined);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href, item.protected, "sectionId" in item ? (item.sectionId as string) : undefined)}
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

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="icon" className="relative rounded-full text-[var(--color-text)]">
            <Link to="/love" aria-label="Favorites">
              <Heart className="size-5" />
              {favorites.length > 0 && <Counter>{favorites.length}</Counter>}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative rounded-full text-[var(--color-text)]">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && <Counter>{cartCount}</Counter>}
            </Link>
          </Button>
          <ThemeToggle />
          <UserMenu />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-[var(--color-text)] md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/35 opacity-0 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />
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
          <Button type="button" variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <nav className="space-y-2">
          {displayedNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href, item.protected, "sectionId" in item ? (item.sectionId as string) : undefined)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-[var(--color-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
                  isActive(item.href, "sectionId" in item ? (item.sectionId as string) : undefined) && "bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/love" onClick={() => setIsMobileMenuOpen(false)}>Saved ({favorites.length})</Link>
          </Button>
          <Button asChild className="rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]">
            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>Cart ({cartCount})</Link>
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--color-border)] p-3">
          <span className="text-sm font-bold text-[var(--color-text-muted)]">Theme</span>
          <ThemeToggle />
        </div>

        <div className="mt-4">
          <UserMenu />
        </div>
      </aside>
    </header>
  );
}

function Counter({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
      {children}
    </span>
  );
}
