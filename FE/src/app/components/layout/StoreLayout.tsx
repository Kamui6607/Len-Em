import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";

interface StoreLayoutProps {
  children: ReactNode;
  cartCount: number;
}

export function StoreLayout({
  children,
  cartCount,
}: StoreLayoutProps) {
  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col"
    >
      <Navigation
        cartCount={cartCount}
      />

      <div className="flex-1">{children}</div>

      <Footer />
    </motion.div>
  );
}