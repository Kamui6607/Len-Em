import { ArrowLeft, Search, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { cn } from "../ui/utils";
import { Brand, Counter, focusRingClass } from "./shared";

export interface NavigationMobileProps {
  isHomePage: boolean;
  isAboutPage: boolean;
  isFloating: boolean;
  showBackButton: boolean;
  keyboardOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  cartCount: number;
  showFullActions: boolean;
  onBack: () => void;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchSubmit: (event: React.FormEvent) => void;
}

/**
 * Mobile chrome: a compact sticky header (logo · search · cart) and the bottom
 * tab bar. Everything that used to live in the ☰ drawer is reachable from the
 * tabs or the "Tài khoản" sheet, so the header has no menu button.
 */
export function NavigationMobile(props: NavigationMobileProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isLanding = props.isHomePage || props.isAboutPage;

  useEffect(() => {
    if (props.searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [props.searchOpen]);

  return (
    <>
      {/* Like desktop: full-width & transparent at the very top, a floating
          pill once the page scrolls (or while search is open). */}
      <header
        className="nav-shell is-mobile"
        data-compact={props.isFloating || props.searchOpen}
      >
        <div
          className={cn(
            "nav-bar",
            (props.isFloating || props.searchOpen) && "is-floating navbar-float",
          )}
        >
          <div className="nav-row flex items-center justify-between gap-2">
            {props.showBackButton ? (
              <button
                type="button"
                className={cn("nav-icon size-11", focusRingClass)}
                onClick={props.onBack}
                aria-label="Quay lại"
              >
                <ArrowLeft className="size-[22px]" />
              </button>
            ) : (
              <Brand compact className="pl-1" />
            )}

            <div className="flex items-center gap-0.5">
              {!isLanding && (
                <button
                  type="button"
                  className={cn("nav-icon size-11", focusRingClass)}
                  onClick={props.onSearchToggle}
                  aria-label={props.searchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}
                  aria-expanded={props.searchOpen}
                >
                  {props.searchOpen ? (
                    <X className="size-[22px]" />
                  ) : (
                    <Search className="size-[22px]" />
                  )}
                </button>
              )}
              {props.showFullActions && (
                <Link
                  to="/cart"
                  aria-label={
                    props.cartCount > 0
                      ? `Giỏ hàng, ${props.cartCount} sản phẩm`
                      : "Giỏ hàng"
                  }
                  data-cart-anchor
                  className={cn("nav-icon size-11", focusRingClass)}
                >
                  <ShoppingCart className="size-[22px]" />
                  {props.cartCount > 0 && (
                    <Counter className="cart-badge">
                      {props.cartCount > 99 ? "99+" : props.cartCount}
                    </Counter>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Search drops down inside the bar */}
          <AnimatePresence initial={false}>
            {props.searchOpen && (
              <motion.form
                key="m-search"
                role="search"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={props.onSearchSubmit}
                className="overflow-hidden"
              >
                <div className="relative px-2 pb-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-5 top-[21px] -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    enterKeyHint="search"
                    value={props.searchQuery}
                    onChange={(e) => props.onSearchChange(e.target.value)}
                    placeholder={props.searchPlaceholder}
                    className="nav-search-input"
                  />
                  {props.searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        props.onSearchClear();
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-4 top-[21px] flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--foreground-muted)]"
                      aria-label="Xoá từ khoá"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </header>

      {!props.keyboardOpen && <BottomNav />}
    </>
  );
}
