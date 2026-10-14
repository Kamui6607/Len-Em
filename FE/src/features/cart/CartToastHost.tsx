import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AlertTriangle, Check, ShoppingBag, Undo2, X, XCircle } from "lucide-react";
import { formatPrice } from "../../lib/formatPrice";
import { useIsMobile } from "../../shared/hooks/useMediaQuery";
import { setFloatRowLift } from "../../lib/floatLift";
import { cartToast, useCartToastStore, type CartToast } from "./cartToastStore";
import "../../styles/cart-toast.css";

/**
 * Desktop placement:
 *  - "anchor": under the cart icon that is currently visible — works for both
 *    header states (full bar at the top, floating pill when scrolled). Right
 *    edge aligned with the icon's right edge; centered on the icon if that
 *    would overflow; always ≥16px from the viewport edges; 12px below the
 *    header; a caret points at the icon.
 *  - "corner": top-right, 12px under the header.
 * If the header is hidden, toasts go to the top-right corner (16px + safe area).
 * Mobile (<768px): bottom, full width minus 16px, above the bottom nav; the
 * floating row ("+" button, buy bars) is lifted while toasts are visible.
 * For design review, `localStorage.lenem_cart_toast_placement = "corner"`
 * overrides the default.
 */
export type CartToastPlacement = "anchor" | "corner";

const PLACEMENT_KEY = "lenem_cart_toast_placement";
const TOAST_WIDTH = 360;
const EDGE = 16;
const GAP_BELOW_HEADER = 12;
/** Caret centre ≥ this far from the toast's edges — clear of the 20px corner radius. */
const CARET_INSET = 32;
/** Preferred caret position: this far in from the toast's right edge. */
const CARET_FROM_RIGHT = 40;
/** Scrolled past this → the page counts as scrolled (used by OrderToastHost). */
export const SCROLLED_PX = 8;

type Position = { top: number | string; left?: number; right?: number; arrowX?: number };

const VARIANT_ICON = {
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
  info: Undo2,
} as const;

function isShown(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= window.innerHeight) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05;
}

/** The header bar in whichever state it is (full bar or floating pill). */
function findHeaderBar(): HTMLElement | null {
  const el = document.querySelector(".navx-bar, .nav-bar");
  return isShown(el) ? el : null;
}

function findCartAnchor(): HTMLElement | null {
  for (const el of document.querySelectorAll("[data-cart-anchor]")) {
    if (isShown(el)) return el;
  }
  return null;
}

function computePosition(mode: CartToastPlacement): Position {
  const vw = document.documentElement.clientWidth; // excludes the scrollbar
  const width = Math.min(TOAST_WIDTH, vw - EDGE * 2);
  const header = findHeaderBar();
  const anchor = mode === "anchor" && header ? findCartAnchor() : null;

  if (!header) {
    // Header hidden → top-right corner, clear of the notch.
    return { top: `calc(${EDGE}px + env(safe-area-inset-top, 0px))`, right: EDGE };
  }

  const top = Math.round(header.getBoundingClientRect().bottom + GAP_BELOW_HEADER);
  if (!anchor) return { top, right: EDGE };

  const r = anchor.getBoundingClientRect();
  const center = r.left + r.width / 2;
  // Caret sits CARET_FROM_RIGHT in from the toast's right edge, straight under
  // the icon (flush with the icon's edge put it on the rounded corner); if that
  // runs off the left side, center on the icon instead; keep 16px from edges.
  let left = center + CARET_FROM_RIGHT - width;
  if (left < EDGE) left = center - width / 2;
  left = Math.round(Math.min(Math.max(left, EDGE), vw - width - EDGE));
  const arrowX = Math.round(Math.min(Math.max(center - left, CARET_INSET), width - CARET_INSET));
  return { top, left, arrowX };
}

function samePos(a: Position, b: Position) {
  return a.top === b.top && a.left === b.left && a.right === b.right && a.arrowX === b.arrowX;
}

export function CartToastHost({ placement = "anchor" }: { placement?: CartToastPlacement }) {
  const toasts = useCartToastStore((s) => s.toasts);
  const bump = useCartToastStore((s) => s.bump);
  const dismissNewest = useCartToastStore((s) => s.dismissNewest);
  const isMobile = useIsMobile();
  const regionRef = useRef<HTMLElement>(null);

  const [mode] = useState<CartToastPlacement>(() => {
    try {
      const saved = localStorage.getItem(PLACEMENT_KEY);
      return saved === "corner" || saved === "anchor" ? saved : placement;
    } catch {
      return placement;
    }
  });
  const [pos, setPos] = useState<Position>({ top: 96, right: EDGE });
  const hasToasts = toasts.length > 0;

  // Re-anchor every frame while toasts are visible: covers scrolling,
  // resizing and the header's full ⇄ pill morph (which moves the cart icon
  // over ~400ms). Only re-renders when the position actually changes.
  useEffect(() => {
    if (!hasToasts || isMobile) return;
    let frame = 0;
    let last: Position = { top: -1 };
    const tick = () => {
      const next = computePosition(mode);
      if (!samePos(next, last)) {
        last = next;
        setPos(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [hasToasts, isMobile, mode]);

  // Mobile: lift the floating row ("+" button, buy bars) above the toasts.
  useEffect(() => {
    if (!isMobile || !hasToasts || !regionRef.current) {
      setFloatRowLift("cart-toast", 0);
      return;
    }
    const region = regionRef.current;
    const update = () =>
      setFloatRowLift("cart-toast", Math.ceil(region.getBoundingClientRect().height) + 12);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(region);
    return () => {
      observer.disconnect();
      setFloatRowLift("cart-toast", 0);
    };
  }, [isMobile, hasToasts]);

  // Bounce the cart badge once per "added" toast.
  const firstBump = useRef(true);
  useEffect(() => {
    if (firstBump.current) {
      firstBump.current = false;
      return;
    }
    const anchors = document.querySelectorAll<HTMLElement>("[data-cart-anchor]");
    anchors.forEach((el) => {
      el.classList.remove("cart-bump");
      void el.offsetWidth; // restart the animation
      el.classList.add("cart-bump");
    });
    const id = window.setTimeout(() => anchors.forEach((el) => el.classList.remove("cart-bump")), 650);
    return () => window.clearTimeout(id);
  }, [bump]);

  // Esc closes the newest toast.
  useEffect(() => {
    if (!hasToasts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) dismissNewest();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasToasts, dismissNewest]);

  // Persistent live regions — reliably announced (a freshly mounted
  // role="status" node often is not). Errors use role="alert".
  const newest = toasts[0];
  // A merged toast's title already says "N sản phẩm" — only name a single item.
  const announce = newest
    ? [newest.title, newest.items.length === 1 ? newest.items[0].name : undefined, newest.message]
        .filter(Boolean)
        .join(". ")
    : "";
  const politeText = newest && newest.variant !== "error" ? announce : "";
  const alertText = newest?.variant === "error" ? announce : "";

  const anchored = !isMobile && pos.arrowX !== undefined;
  const style = isMobile ? undefined : { top: pos.top, left: pos.left, right: pos.right };

  return createPortal(
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {politeText}
      </div>
      <div className="sr-only" role="alert" aria-atomic="true">
        {alertText}
      </div>
      <section
        ref={regionRef}
        className={`ct-region${isMobile ? " is-mobile" : ""}`}
        style={style}
        aria-label="Thông báo giỏ hàng"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast, index) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              fromBelow={isMobile}
              arrowX={anchored && index === 0 ? pos.arrowX : undefined}
            />
          ))}
        </AnimatePresence>
      </section>
    </>,
    document.body,
  );
}

function ToastCard({
  toast,
  fromBelow,
  arrowX,
}: {
  toast: CartToast;
  fromBelow: boolean;
  arrowX?: number;
}) {
  const dismiss = useCartToastStore((s) => s.dismiss);
  const reduceMotion = useReducedMotion();
  const Icon = VARIANT_ICON[toast.variant];
  const [first, second] = toast.items;
  const multiple = toast.items.length > 1;
  const totalPrice = toast.items.reduce((sum, item) => sum + item.price, 0);
  const totalQty = toast.items.reduce((sum, item) => sum + item.quantity, 0);
  // Slide 8px (down from above on desktop, up from below on mobile); fade only
  // with prefers-reduced-motion.
  const offset = reduceMotion ? 0 : fromBelow ? 8 : -8;

  const handleUndo = () => {
    toast.undo?.();
    dismiss(toast.id);
    cartToast.info("Đã hoàn tác", multiple ? "Các sản phẩm đã được bỏ khỏi giỏ." : undefined);
  };

  return (
    <motion.div
      layout={!reduceMotion}
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: offset / 2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="ct-toast"
      data-variant={toast.variant}
      role="group"
      aria-label={toast.title}
    >
      {/* Caret — outside the clipped inner box so it isn't cut off */}
      {arrowX !== undefined && <span className="ct-arrow" style={{ left: arrowX }} aria-hidden="true" />}

      <div className="ct-inner">
        <div className="ct-main">
          {/* Thumbnail — clean, nothing drawn over it */}
          <div className={`ct-thumb${multiple ? " is-stack" : ""}`}>
            {first?.image ? (
              <>
                <img src={first.image} alt="" />
                {multiple && second?.image && <img src={second.image} alt="" />}
              </>
            ) : (
              <span className="ct-thumb-fallback">
                {toast.variant === "info" ? <Undo2 size={22} /> : <ShoppingBag size={22} />}
              </span>
            )}
            {multiple && <span className="ct-thumb-count">{toast.items.length}</span>}
          </div>

          <div className="ct-body">
            <p className="ct-status">
              <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
              {toast.title}
            </p>

            {first && (
              <>
                <p className="ct-name" title={multiple ? undefined : first.name}>
                  {multiple ? `${first.name} và ${toast.items.length - 1} sản phẩm khác` : first.name}
                </p>
                <p className="ct-meta">
                  {multiple ? (
                    <span>{totalQty} sản phẩm</span>
                  ) : (
                    <>
                      {first.variantLabel && (
                        <span className="inline-flex items-center gap-1.5">
                          {first.hexCode && (
                            <span className="ct-dot" style={{ background: first.hexCode }} aria-hidden="true" />
                          )}
                          {first.variantLabel}
                        </span>
                      )}
                      {first.variantLabel && <span className="ct-sep" aria-hidden="true">·</span>}
                      <span>SL {first.quantity}</span>
                    </>
                  )}
                  <span className="ct-sep" aria-hidden="true">·</span>
                  <span className="ct-price">{formatPrice(multiple ? totalPrice : first.price)}</span>
                </p>
              </>
            )}

            {toast.message && <p className="ct-msg">{toast.message}</p>}
          </div>
        </div>

        {/* Close — lined up with the status line, 32×32 hit area */}
        <button type="button" className="ct-close" onClick={() => dismiss(toast.id)} aria-label="Đóng thông báo">
          <X size={18} />
        </button>

        {toast.added && (
          <div className="ct-actions">
            <Link to="/cart" className="ct-primary" onClick={() => dismiss(toast.id)}>
              <ShoppingBag size={15} />
              Xem giỏ hàng
            </Link>
            {toast.undo && (
              <button type="button" className="ct-undo" onClick={handleUndo}>
                Hoàn tác
              </button>
            )}
          </div>
        )}

        {/* Countdown: full width, 3px, clipped by the rounded corners */}
        <span className="ct-progress-track" aria-hidden="true">
          <span
            className="ct-progress"
            style={{ animationDuration: `${toast.duration}ms` }}
            onAnimationEnd={() => dismiss(toast.id)}
          />
        </span>
      </div>
    </motion.div>
  );
}
