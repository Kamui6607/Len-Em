"use client";

import { useEffect, useState } from "react";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "../../contexts/ThemeContext";
import "../../../styles/toast.css";

/**
 * App-wide toaster. Placement and look are configured here only — styling
 * comes from styles/toast.css via the `lt-toast` class, so per-type accents
 * (success / error / warning / info) actually show (inline `style` on toasts
 * used to override them).
 *
 * At the top of the page toasts sit BELOW the sticky navigation (desktop
 * header is 84px tall, the mobile top bar ~72px). Once the page is scrolled
 * they move up to the top-right corner of the viewport.
 */
const Toaster = (props: ToasterProps) => {
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 8);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      duration={4000}
      closeButton
      visibleToasts={4}
      gap={10}
      offset={{ top: scrolled ? 16 : 96, right: 16 }}
      mobileOffset={{ top: 80, left: 12, right: 12 }}
      toastOptions={{ className: "lt-toast" }}
      {...props}
    />
  );
};

export { Toaster };
