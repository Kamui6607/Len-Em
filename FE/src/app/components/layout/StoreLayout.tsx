import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSwipeBack } from "../../../hooks/useSwipeBack";
import { BackToTop } from "../../../components/motion/BackToTop";
import { useCart } from "../../../context/CartContext";

interface StoreLayoutProps {
  children: ReactNode;
}

// Routes that should NOT render Navigation or Footer
const NO_NAV_ROUTES = ["/order/success"];

export function StoreLayout({
  children,
}: StoreLayoutProps) {
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

        <div className={`main-content flex-1 ${!hideNav ? "pb-20 md:pb-0" : ""}`}>
          {isMobile && !shouldReduceMotion ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            children
          )}
        </div>

        <BackToTop />
        {!hideNav && location.pathname !== "/" && <Footer />}
      </div>
    </motion.div>
  );
}
