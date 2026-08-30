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

export function StoreLayout({ children }: StoreLayoutProps) {
  const { totalItems: cartCount } = useCart();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const shouldReduceMotion = useReducedMotion();
  const hideNav = NO_NAV_ROUTES.includes(location.pathname);

  useSwipeBack(isMobile);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <motion.div className="min-h-screen flex flex-col">
      <div style={{ position: "relative", zIndex: 1 }}>
        {!hideNav && <Navigation cartCount={cartCount} />}

        <div
          className={`main-content flex-1 ${!hideNav ? "pb-20 md:pb-0" : ""}`}
        >
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

        <ArchiveFloatingMenu />
        {!hideNav && location.pathname !== "/" && <Footer />}
      </div>
    </motion.div>
  );
}
