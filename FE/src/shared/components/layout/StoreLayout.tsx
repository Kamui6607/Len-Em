import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router";
import { Navigation } from "../navigation/Navigation";

import { Footer } from "../Footer";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipeBack } from "../../hooks/useSwipeBack";
import { ArchiveFloatingMenu } from "../motion/ArchiveFloatingMenu";
import { useCart } from "../../contexts/CartContext";

interface StoreLayoutProps {
  children: ReactNode;
}

// Routes that should NOT render Navigation or Footer
const NO_NAV_ROUTES = ["/order/success", "/chatbot"];

// Bottom-tab roots: coming back to one restores where the user left it.
const TAB_ROOTS = ["/learn", "/shop", "/diy"];
const tabScroll = new Map<string, number>();

/** Scroll to `y` once the page is tall enough (lazy routes / data still loading). */
function restoreScroll(y: number) {
  let frame = 0;
  let tries = 0;
  const attempt = () => {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.min(y, Math.max(maxY, 0)), behavior: "instant" });
    if (maxY >= y || ++tries > 60) return;
    frame = requestAnimationFrame(attempt);
  };
  attempt();
  return () => cancelAnimationFrame(frame);
}

export function StoreLayout({ children }: StoreLayoutProps) {
  const { totalItems: cartCount } = useCart();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const shouldReduceMotion = useReducedMotion();
  const hideNav = NO_NAV_ROUTES.includes(location.pathname);

  useSwipeBack(isMobile);

  // Remember the scroll position of each tab root while the user is on it.
  useEffect(() => {
    const path = location.pathname;
    if (!TAB_ROOTS.includes(path)) return;
    const onScroll = () => tabScroll.set(path, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // On route change: tab roots resume their last position, other pages start at top.
  useEffect(() => {
    const saved = tabScroll.get(location.pathname);
    if (saved) return restoreScroll(saved);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <motion.div className={`min-h-dvh flex flex-col${hideNav ? "" : " has-tabbar"}`}>
      <div style={{ position: "relative", zIndex: 1 }}>
        {!hideNav && <Navigation cartCount={cartCount} />}

        <div className="main-content flex-1">
          {/* Page fade-in theo route — CHỈ opacity (KHÔNG transform để tránh
              bóp position:fixed của nền, KHÔNG AnimatePresence mode="wait"
              vì exit có thể bị treo với lazy/Suspense khiến trang mới không
              mount → "hiện rồi biến mất/bị che"). Áp dụng cho cả desktop &
              mobile với tốc độ đủ mềm (0.3s) để không bị giật. */}
          {!shouldReduceMotion ? (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          ) : (
            children
          )}
        </div>

        {/* /chatbot là màn hình chat toàn trang — FAB sẽ đè lên tin nhắn & ô nhập */}
        {location.pathname !== "/chatbot" && <ArchiveFloatingMenu />}
        {!hideNav && location.pathname !== "/" && <Footer />}
      </div>
    </motion.div>
  );
}
