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
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { UserMenu } from "../UserMenu";
import { cn } from "../ui/utils";
import {
  focusRingClass,
  iconChipClass,
  Brand,
  ShimmerCTA,
  Counter,
} from "./shared";
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

export function NavigationDesktop(props: NavigationDesktopProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus the search input once the bar expands.
  useEffect(() => {
    if (props.searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [props.searchOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-out",
        props.isFloating
          ? "navbar-float mt-2 sm:mt-3 mx-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[22px]"
          : "border-b border-[color-mix(in_srgb,var(--border-light)_55%,transparent)] bg-[color-mix(in_srgb,var(--glass-bg)_45%,transparent)] backdrop-blur-[10px]",
      )}
    >
      {/* Thread seam — hairline running-stitch that appears once the bar lifts off */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: props.isFloating ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute inset-x-6 -bottom-px h-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--primary) 0 6px, transparent 6px 12px)",
          opacity: 0.35,
        }}
      />

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand tagline={props.t("nav.tagline")} />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {props.links.map((item) => {
            const Icon = item.icon;
            const active = props.isActive(item.href, item.sectionId);
            return (
              <motion.button
                key={item.label + item.href}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => props.onNavigate(item.href, item.sectionId)}
                className={cn(
                  "group/link relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold tracking-[0.1em] select-none",
                  focusRingClass,
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
                    initial={{ opacity: 0, scale: 0.85 }}
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
                <span
                  style={{ color: active ? "var(--primary)" : undefined }}
                >
                  <Icon className="size-4" />
                </span>
                {item.label}
              </motion.button>
            );
          })}
        </nav>
{/* Desktop Right */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Search button + input (hidden on landing pages) */}
          {!props.isHomePage && !props.isAboutPage && (
            <div className="relative flex items-center">
              <AnimatePresence mode="wait">
                {props.searchOpen ? (
                  <motion.form
                    key="search-form"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 224, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={props.onSearchSubmit}
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
                        value={props.searchQuery}
                        onChange={(e) => props.onSearchChange(e.target.value)}
                        placeholder={props.searchPlaceholder}
                        className="w-full h-[42px] pl-9 pr-8 rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:shadow-[var(--input-focus-shadow)] transition-colors"
                      />
                      {props.searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            props.onSearchClear();
                            searchInputRef.current?.focus();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
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
                    onClick={props.onSearchToggle}
                    className={iconChipClass}
                    aria-label="Search"
                  >
                    <Search className="size-[18px]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {props.showFullActions && (
            <>
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/love"
                  aria-label="Favorites"
                  className={cn(iconChipClass, "overflow-visible")}
                >
                  <Heart className="size-[18px]" />
                  {props.favoriteCount > 0 && (
                    <Counter>{props.favoriteCount}</Counter>
                  )}
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/cart"
                  aria-label="Cart"
                  className={cn(iconChipClass, "overflow-visible")}
                >
                  <ShoppingCart className="size-[18px]" />
                  {props.cartCount > 0 && <Counter>{props.cartCount}</Counter>}
                </Link>
              </motion.div>
            </>
          )}

          <div
            className="mx-1 h-6 w-px bg-[var(--divider)]"
            aria-hidden="true"
          />

          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="nav-icon-btn"
          >
            <LanguageToggle />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="nav-icon-btn"
          >
            <ThemeToggle />
          </motion.div>
          {props.showAuthPlaceholder && (
            <div className="ml-1 flex items-center gap-1.5">
              <div className="h-[38px] w-[100px] rounded-full bg-[var(--chip-bg)] animate-pulse" />
              <div className="h-[38px] w-[120px] rounded-full bg-[var(--chip-bg)] animate-pulse" />
            </div>
          )}
          {props.showAuthButtons && (
            <div className="ml-1 flex items-center gap-1.5">
              <motion.button
                whileHover={{ y: -1 }}
                type="button"
                onClick={props.onLogin}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold tracking-[0.1em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]",
                  focusRingClass,
                )}
              >
                <LogIn className="size-4" />
                LOGIN
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={props.onRegister}
                className={cn(
                  "flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-4 py-2 text-sm font-bold tracking-[0.1em] text-white shadow-[0_6px_18px_rgba(107,63,160,0.28)] transition-shadow hover:shadow-[0_10px_26px_rgba(107,63,160,0.38)]",
                  focusRingClass,
                )}
              >
                <UserPlus className="size-4" />
                REGISTER
              </motion.button>
            </div>
          )}
          {props.isAuthenticated && !props.isHomePage && !props.isAboutPage && (
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
          {props.isAuthenticated &&
            (props.isHomePage || props.isAboutPage) && (
              <ShimmerCTA onClick={props.onStart} />
            )}
        </div>
      </div>
    </header>
  );
}