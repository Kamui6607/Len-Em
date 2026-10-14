import {
  Heart,
  LogIn,
  Search,
  ShoppingCart,
  UserPlus,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { ThemeToggle } from "../ThemeToggle";
import { UserMenu } from "../UserMenu";
import { cn } from "../ui/utils";
import { focusRingClass, Brand, ShimmerCTA, Counter } from "./shared";
import type { NavLink } from "./nav-links";

export interface NavigationDesktopProps {
  links: NavLink[];
  isHomePage: boolean;
  isAboutPage: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFloating: boolean;
  searchOpen: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  favoriteCount: number;
  cartCount: number;
  showFullActions: boolean;
  showAuthButtons: boolean;
  showAuthPlaceholder: boolean;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  onLogin: () => void;
  onRegister: () => void;
  onNavigate: (href: string, sectionId?: string) => void;
  isActive: (href: string, sectionId?: string) => boolean;
  onStart: () => void;
  t: (key: string, fallback?: string) => string;
}

/** Shared spring for the top ⇄ condensed morph. */
const morph = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const;

/**
 * Desktop bar — "centered pill + split".
 * At the top of the page: logo left · links in a centered pill · actions right.
 * Once scrolled: everything condenses into one floating pill in the middle.
 */
export function NavigationDesktop(props: NavigationDesktopProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isLanding = props.isHomePage || props.isAboutPage;
  const compact = props.isFloating;

  // Focus the search input once the field expands.
  useEffect(() => {
    if (props.searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [props.searchOpen]);

  return (
    <header className="navx" data-compact={compact}>
      <LayoutGroup>
        <motion.div
          layout
          transition={morph}
          className={cn("navx-bar", compact && "navbar-float")}
          // Inline radius lets motion correct it while the bar scales.
          style={{ borderRadius: 999 }}
        >
          <motion.div layout="position" transition={morph} className="navx-brand">
            <Brand tagline={props.t("nav.tagline")} markOnly={compact} compact={compact} />
          </motion.div>

          {compact && <span className="navx-sep" aria-hidden="true" />}

          {/* Links — a fabric "tape" with a stitched patch sliding to the active item */}
          <motion.nav layout="position" transition={morph} aria-label="Main" className="nav-track">
            {props.links.map((item) => {
              const Icon = item.icon;
              const active = props.isActive(item.href, item.sectionId);
              return (
                <button
                  key={item.label + item.href}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => props.onNavigate(item.href, item.sectionId)}
                  className={cn("nav-link", focusRingClass)}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-patch"
                      className="nav-patch"
                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                    />
                  )}
                  <Icon className={cn("size-4", compact ? "hidden" : "hidden xl:block")} />
                  {item.label}
                </button>
              );
            })}
          </motion.nav>

          {compact && <span className="navx-sep" aria-hidden="true" />}

          <motion.div layout="position" transition={morph} className="navx-actions">
            {/* Search (hidden on landing pages) */}
            {!isLanding && (
              <AnimatePresence mode="wait" initial={false}>
                {props.searchOpen ? (
                  <motion.form
                    key="search-form"
                    role="search"
                    initial={{ width: 42, opacity: 0 }}
                    animate={{ width: compact ? 200 : 240, opacity: 1 }}
                    exit={{ width: 42, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={props.onSearchSubmit}
                    className="relative overflow-hidden rounded-full"
                  >
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={props.searchQuery}
                      onChange={(e) => props.onSearchChange(e.target.value)}
                      onBlur={() => {
                        if (!props.searchQuery) props.onSearchToggle();
                      }}
                      placeholder={props.searchPlaceholder}
                      className="nav-search-input"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (props.searchQuery) {
                          props.onSearchClear();
                          searchInputRef.current?.focus();
                        } else {
                          props.onSearchToggle();
                        }
                      }}
                      className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--chip-hover-bg)] hover:text-[var(--foreground)]"
                      aria-label={props.searchQuery ? "Clear search" : "Close search"}
                    >
                      <X size={14} />
                    </button>
                  </motion.form>
                ) : (
                  <motion.button
                    key="search-btn"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={props.onSearchToggle}
                    className={cn("nav-icon", focusRingClass)}
                    aria-label="Search"
                  >
                    <Search className="size-[19px]" />
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            {props.showFullActions && (
              <>
                <span className="navx-compact-hide">
                  <Link
                    to="/love"
                    aria-label="Favorites"
                    className={cn("nav-icon", focusRingClass)}
                  >
                    <Heart className="size-[19px]" />
                    {props.favoriteCount > 0 && <Counter>{props.favoriteCount}</Counter>}
                  </Link>
                </span>
                <Link
                  to="/cart"
                  aria-label="Cart"
                  data-cart-anchor
                  className={cn("nav-icon", focusRingClass)}
                >
                  <ShoppingCart className="size-[19px]" />
                  {props.cartCount > 0 && <Counter className="cart-badge">{props.cartCount}</Counter>}
                </Link>
              </>
            )}

            <span className="navx-compact-hide">
              <span className="nav-divider" aria-hidden="true" />
              <span className="nav-icon-btn flex items-center px-1">
                <ThemeToggle />
              </span>
            </span>

            {props.showAuthPlaceholder && (
              <div className="ml-1 flex items-center gap-1.5">
                <div className="h-[38px] w-[84px] animate-pulse rounded-full bg-[var(--chip-bg)]" />
                <div className="h-[38px] w-[104px] animate-pulse rounded-full bg-[var(--chip-bg)]" />
              </div>
            )}

            {props.showAuthButtons && (
              <div className="ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={props.onLogin}
                  className={cn("nav-btn-ghost", focusRingClass)}
                >
                  <LogIn className="size-4" />
                  Log in
                </button>
                <button
                  type="button"
                  onClick={props.onRegister}
                  className={cn("nav-btn-primary", focusRingClass)}
                >
                  <UserPlus className="size-4" />
                  Sign up
                </button>
              </div>
            )}

            {props.isAuthenticated && !isLanding && (
              <div className="relative ml-1">
                <UserMenu position="top" />
              </div>
            )}

            {props.isAuthenticated && isLanding && (
              <div className="ml-1">
                <ShimmerCTA onClick={props.onStart} />
              </div>
            )}
          </motion.div>
        </motion.div>
      </LayoutGroup>
    </header>
  );
}
