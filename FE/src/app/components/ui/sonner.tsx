"use client";

import type { ToasterProps } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <>
      <style>{`
        /* ── Container: never block interactions ── */
        [data-sonner-toaster] {
          pointer-events: none !important;
        }
        [data-sonner-toaster] [data-sonner-toast] {
          pointer-events: auto !important;
        }

        /* ── Desktop: top-right ── */
        @media (min-width: 769px) {
          [data-sonner-toaster] {
            right: 16px !important;
            left: auto !important;
            top: 16px !important;
            bottom: auto !important;
            align-items: flex-end !important;
          }
          [data-sonner-toaster] [data-sonner-toast] {
            width: 380px !important;
          }
        }

        /* ── Mobile: top-center, avoid bottom nav ── */
        @media (max-width: 768px) {
          [data-sonner-toaster] {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            top: max(12px, env(safe-area-inset-top, 12px)) !important;
            bottom: auto !important;
            align-items: center !important;
            padding: 0 8px !important;
          }
          [data-sonner-toaster] [data-sonner-toast] {
            width: 100% !important;
            max-width: 400px !important;
            font-size: 0.875rem !important;
            padding: 10px 14px !important;
            border-radius: 12px !important;
          }
          /* Compact close button on mobile */
          [data-sonner-toaster] [data-sonner-toast] [data-close-button] {
            transform: scale(0.85) !important;
          }
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        duration={3000}
        closeButton
        visibleToasts={5}
        gap={8}
        offset={16}
        toastOptions={{
          style: {
            pointerEvents: "auto",
          },
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            pointerEvents: "none",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
};

export { Toaster };