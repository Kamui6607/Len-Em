"use client";

import type { ToasterProps } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <>
      <style>{`
        [data-sonner-toaster] {
          pointer-events: none !important;
        }
        [data-sonner-toaster] [data-sonner-toast] {
          pointer-events: auto !important;
        }

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
            padding: 12px 16px !important;
            border-radius: 14px !important;
          }
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
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            borderRadius: "16px",
            padding: "14px 18px",
          },
        }}
        style={
          {
            "--normal-bg": "var(--card) !important",
            "--normal-text": "var(--foreground) !important",
            "--normal-border": "var(--border) !important",
            "--success-bg": "var(--accent-green) !important",
            "--success-text": "var(--accent-green-text) !important",
            "--error-bg": "var(--accent-red) !important",
            "--error-text": "var(--accent-red-text) !important",
            pointerEvents: "none",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
};

export { Toaster };