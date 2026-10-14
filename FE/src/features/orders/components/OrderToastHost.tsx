import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Check, Package, X } from "lucide-react";
import { useIsMobile } from "../../../shared/hooks/useMediaQuery";
import { setFloatRowLift } from "../../../lib/floatLift";
import { ORDER_TOAST_DURATION, useOrderToastStore, type OrderToast } from "../orderToastStore";
import "../../../styles/cart-toast.css";
import { SCROLLED_PX } from "../../cart/CartToastHost";
import "../../../styles/order-toast.css";

/**
 * Toast "Đặt hàng thành công" — cùng ngôn ngữ với toast giỏ hàng (ct-*).
 *  - Desktop: ở đầu trang → góc trên phải, 12px dưới header; đã cuộn xuống
 *    → sát góc trên phải màn hình (16px). Luôn cách mép phải 24px.
 *  - Mobile (<768px): đáy màn hình, full width trừ lề 16px, ngay trên thanh
 *    tab; hàng nút nổi ("+") được đẩy lên trên toast qua --float-row-lift.
 * Tự ẩn sau 5s (thanh tiến trình), dừng đếm khi rê chuột / focus vào toast.
 */
const EDGE_TOP = 16;
const GAP_BELOW_HEADER = 12;

function headerBottom(): number | null {
  const el = document.querySelector(".navx-bar, .nav-bar");
  if (!(el instanceof HTMLElement)) return null;
  const r = el.getBoundingClientRect();
  if (r.height === 0 || r.bottom <= 0) return null;
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) <= 0.05) return null;
  return r.bottom;
}

export function OrderToastHost() {
  const toasts = useOrderToastStore((s) => s.toasts);
  const isMobile = useIsMobile();
  const regionRef = useRef<HTMLElement>(null);
  const [top, setTop] = useState<number | string>(96);
  const hasToasts = toasts.length > 0;

  // Desktop: bám theo mép dưới header (full bar ⇄ viên thuốc khi cuộn).
  useEffect(() => {
    if (!hasToasts || isMobile) return;
    let frame = 0;
    let last: number | string = -1;
    const tick = () => {
      const bottom = window.scrollY > SCROLLED_PX ? null : headerBottom();
      const next =
        bottom === null
          ? `calc(${EDGE_TOP}px + env(safe-area-inset-top, 0px))`
          : Math.round(bottom + GAP_BELOW_HEADER);
      if (next !== last) {
        last = next;
        setTop(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [hasToasts, isMobile]);

  // Mobile: nhấc hàng nút nổi lên trên toast.
  useEffect(() => {
    if (!isMobile || !hasToasts || !regionRef.current) {
      setFloatRowLift("order-toast", 0);
      return;
    }
    const region = regionRef.current;
    const update = () => setFloatRowLift("order-toast", Math.ceil(region.getBoundingClientRect().height) + 12);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(region);
    return () => {
      observer.disconnect();
      setFloatRowLift("order-toast", 0);
    };
  }, [isMobile, hasToasts]);

  const newest = toasts[0];
  const announce = newest ? `Đặt hàng thành công. Đơn #${newest.code} đã được tiếp nhận và đang chờ xử lý.` : "";

  return createPortal(
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <section
        ref={regionRef}
        className={`ct-region ot-region${isMobile ? " is-mobile" : ""}`}
        style={isMobile ? undefined : { top }}
        aria-label="Thông báo đơn hàng"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <OrderToastCard key={toast.id} toast={toast} fromBelow={isMobile} />
          ))}
        </AnimatePresence>
      </section>
    </>,
    document.body,
  );
}

function OrderToastCard({ toast, fromBelow }: { toast: OrderToast; fromBelow: boolean }) {
  const dismiss = useOrderToastStore((s) => s.dismiss);
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : fromBelow ? 8 : -8;

  return (
    <motion.div
      layout={!reduceMotion}
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: offset / 2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="ct-toast"
      data-variant="success"
      role="group"
      aria-label="Đặt hàng thành công"
    >
      <div className="ct-inner">
        <div className="ct-main">
          <span className="ot-icon" aria-hidden="true">
            <Package size={20} />
          </span>
          <div className="ct-body">
            <p className="ct-status">
              <Check size={16} strokeWidth={2.6} aria-hidden="true" />
              Đặt hàng thành công
            </p>
            <p className="ot-text">
              Đơn <b>#{toast.code}</b> đã được tiếp nhận và đang chờ xử lý.
            </p>
            {toast.paymentMethod === "COD" && <p className="ot-sub">Thanh toán khi nhận hàng</p>}
          </div>
        </div>

        <button type="button" className="ct-close" onClick={() => dismiss(toast.id)} aria-label="Đóng thông báo">
          <X size={18} />
        </button>

        <div className="ct-actions ot-actions">
          <Link
            to={`/purchased/${toast.orderId}`}
            className="ct-primary"
            onClick={() => {
              toast.onOpen?.();
              dismiss(toast.id);
            }}
          >
            Xem đơn hàng
          </Link>
        </div>

        <span className="ct-progress-track" aria-hidden="true">
          <span
            className="ct-progress"
            style={{ animationDuration: `${ORDER_TOAST_DURATION}ms` }}
            onAnimationEnd={() => dismiss(toast.id)}
          />
        </span>
      </div>
    </motion.div>
  );
}
