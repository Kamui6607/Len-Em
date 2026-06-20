import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useSwipeBack } from "../../../hooks/useSwipeBack";
import { ScrollToTop } from "../../../components/mobile/ScrollToTop";

interface StoreLayoutProps {
  children: ReactNode;
  cartCount: number;
}

export function StoreLayout({
  children,
  cartCount,
}: StoreLayoutProps) {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const shouldReduceMotion = useReducedMotion();

  useSwipeBack(isMobile);

  return (
    <motion.div className="min-h-screen bg-background flex flex-col">
      <Navigation cartCount={cartCount} />

      <div className="main-content flex-1 pb-20 md:pb-0">
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

      <ScrollToTop />
      <Footer />
    </motion.div>
  );
}
