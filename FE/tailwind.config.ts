import type { Config } from "tailwindcss";

/**
 * Len&Em design tokens — all values resolve from CSS custom properties
 * defined in src/styles/theme.css (single source of truth).
 */
export default {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
        },
        popover: {
          DEFAULT: "var(--popover-bg)",
          foreground: "var(--foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          pressed: "var(--primary-pressed)",
          soft: "var(--primary-soft)",
          disabled: "var(--primary-disabled)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--foreground-muted)",
        },
        accent: {
          DEFAULT: "var(--chip-active-bg)",
          foreground: "var(--foreground)",
          pink: "var(--accent-blush)",
          yellow: "var(--accent-yellow)",
          peach: "var(--accent-peach)",
          lavender: "var(--accent-lavender)",
          warm: "var(--accent-warm)",
          "warm-soft": "var(--accent-warm-soft)",
        },
        decor: {
          1: "var(--decor-1-bg)",
          2: "var(--decor-2-bg)",
          3: "var(--decor-3-bg)",
          4: "var(--decor-4-bg)",
          5: "var(--decor-5-bg)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input-border)",
        ring: "var(--primary)",
        success: {
          DEFAULT: "var(--success-bg)",
          foreground: "var(--success-text)",
        },
        warning: {
          DEFAULT: "var(--warning-bg)",
          foreground: "var(--warning-text)",
        },
        error: {
          DEFAULT: "var(--error-bg)",
          foreground: "var(--error-text)",
        },
        info: {
          DEFAULT: "var(--info-bg)",
          foreground: "var(--info-text)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        float: "var(--shadow-float)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
    },
  },
} satisfies Config;
