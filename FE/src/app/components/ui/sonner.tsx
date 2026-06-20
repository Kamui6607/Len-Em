"use client";

import type { ToasterProps } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <>
      {/* Responsive: desktop top-right, mobile top-center */}
      <style>{`
        /* Desktop: top-right */
        [data-sonner-toaster] {
          pointer-events: none !important;
        }
        [data-sonner-toaster] [data-sonner-toast] {
          pointer-events: auto !important;
        }
        /* Mobile: center the toaster and use top-center positioning */
        @media (max-width: 768px) {
          [data-sonner-toaster] {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            top: 12px !important;
            bottom: auto !important;
            align-items: center !important;
          }
          [data-sonner-toaster] [data-sonner-toast] {
            width: calc(100vw - 24px) !important;
            max-width: 400px !important;
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