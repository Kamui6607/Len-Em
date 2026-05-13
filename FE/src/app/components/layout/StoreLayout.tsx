import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";

interface StoreLayoutProps {
  children: ReactNode;
  cartCount: number;
  authPanelOpen: boolean;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

export function StoreLayout({
  children,
  cartCount,
  authPanelOpen,
  onOpenSignIn,
  onOpenSignUp,
}: StoreLayoutProps) {
  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col"
      animate={{
        scale: authPanelOpen ? 0.97 : 1,
        filter: authPanelOpen ? "blur(3px)" : "blur(0px)",
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{ willChange: authPanelOpen ? "transform, filter" : "auto" }}
    >
      <Navigation
        cartCount={cartCount}
        onSignIn={onOpenSignIn}
        onSignUp={onOpenSignUp}
      />

      <div className="flex-1">{children}</div>

      <Footer />
    </motion.div>
  );
}