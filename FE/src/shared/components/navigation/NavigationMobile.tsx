import {
  ArrowLeft,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserPlus,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { LanguageToggle } from "../LanguageToggle";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  Brand,
  ShimmerCTA,
  Counter,
  focusRingClass,
  drawerListVariants,
  drawerItemVariants,
} from "./shared";
import type { NavLink } from "./nav-links";

export interface NavigationMobileProps {
  open: boolean;
  links: NavLink[];
  isHomePage: boolean;
  isAboutPage: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFloating: boolean;
  showBackButton: boolean;
  keyboardOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  favoriteCount: number;
  cartCount: number;
  showFullActions: boolean;
  showAuthButtons: boolean;
  showAuthPlaceholder: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  onNavigate: (href: string, sectionId?: string) => void;
  isActive: (href: string, sectionId?: string) => boolean;
  onStart: () => void;
  t: (key: string, fallback?: string) => string;
}

export function NavigationMobile(props: NavigationMobileProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [props.searchOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 ease-out",
          props.isFloating
            ? "navbar-float mt-2 sm:mt-3 mx-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[22px]"
            : "border-b border-[color-mix(in_srgb,var(--border-light)_55%,transparent)] bg-[color-mix(in_srgb,var(--glass-bg)_45%,transparent)] backdrop-blur-[10px]",
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4">
          {props.showBackButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] rounded-full text-[var(--color-text)]"
              onClick={props.onBack}
              aria-label="Go back"
            >
              <ArrowLeft className="size-6" />
            </Button>
          ) : (
            <Brand tagline={props.t("nav.tagline")} />
          )}

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] rounded-full text-[var(--foreground)]"
              onClick={props.onSearchToggle}
              aria-label="Search"
            >
              <Search className="size-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-[var(--foreground)] min-h-[44px] min-w-[44px] overflow-hidden"
              onClick={() => (props.open ? props.onClose() : props.onOpen())}
              aria-label={props.open ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {props.open ? (
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
        </div>
      </header>

      {props.searchOpen && (
        <form
          onSubmit={props.onSearchSubmit}
          className="border-b bg-background px-4 py-3"
        >
          <input
            ref={searchInputRef}
            value={props.searchQuery}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder={props.searchPlaceholder}
            className="w-full h-[42px] rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] pl-4 pr-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </form>
      )}
{/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {props.open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/35"
              onClick={props.onClose}
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-50 flex h-dvh w-[82vw] max-w-sm flex-col overflow-hidden border-l border-[var(--border-light)] bg-[var(--background)] shadow-2xl"
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
                  onClick={props.onClose}
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
                  {props.links.map((item) => {
                    const Icon = item.icon;
                    const active = props.isActive(item.href, item.sectionId);
                    return (
                      <motion.button
                        key={item.label + item.href}
                        variants={drawerItemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() =>
                          props.onNavigate(item.href, item.sectionId)
                        }
                        className={cn(
                          "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl py-2.5 pl-4 pr-3 text-left font-bold text-[var(--foreground)] transition-colors min-h-[44px]",
                          focusRingClass,
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
                          animate={{
                            opacity: active ? 1 : 0,
                            scaleY: active ? 1 : 0.3,
                          }}
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
{props.showAuthPlaceholder && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-[44px] rounded-2xl bg-[var(--chip-bg)] animate-pulse" />
                      <div className="h-[44px] rounded-2xl bg-[var(--chip-bg)] animate-pulse" />
                    </div>
                  )}

                  {props.isAuthenticated && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <motion.div variants={drawerItemVariants}>
                        <Link
                          to="/love"
                          onClick={props.onClose}
                          className="relative flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[var(--chip-border)] font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--chip-hover-bg)]"
                        >
                          <Heart className="size-4" />
                          Favorites
                          {props.favoriteCount > 0 && (
                            <Counter>{props.favoriteCount}</Counter>
                          )}
                        </Link>
                      </motion.div>
                      <motion.div variants={drawerItemVariants}>
                        <Link
                          to="/cart"
                          onClick={props.onClose}
                          className="relative flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[var(--chip-border)] font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--chip-hover-bg)]"
                        >
                          <ShoppingCart className="size-4" />
                          Cart
                          {props.cartCount > 0 && (
                            <Counter>{props.cartCount}</Counter>
                          )}
                        </Link>
                      </motion.div>
                    </div>
                  )}

                  {props.showAuthButtons && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <motion.button
                        variants={drawerItemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={props.onLogin}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl border border-[var(--chip-border)] px-4 py-3 text-center font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--chip-hover-bg)] min-h-[44px]",
                          focusRingClass,
                        )}
                      >
                        <LogIn className="size-4" />
                        LOGIN
                      </motion.button>
                      <motion.button
                        variants={drawerItemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={props.onRegister}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-4 py-3 text-center font-bold text-white shadow-[0_6px_18px_rgba(107,63,160,0.28)] min-h-[44px]",
                          focusRingClass,
                        )}
                      >
                        <UserPlus className="size-4" />
                        REGISTER
                      </motion.button>
                    </div>
                  )}

                  {props.isAuthenticated &&
                    (props.isHomePage || props.isAboutPage) && (
                      <motion.div variants={drawerItemVariants} className="pt-2">
                        <ShimmerCTA full onClick={props.onStart} />
                      </motion.div>
                    )}
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

                {props.isAuthenticated && (
                  <button
                    type="button"
                    onClick={props.onLogout}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-center font-bold text-[var(--error-text)] transition-colors hover:brightness-105 min-h-[44px]",
                      focusRingClass,
                    )}
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
      {!props.open && !props.keyboardOpen && <BottomNav />}
    </>
  );
}