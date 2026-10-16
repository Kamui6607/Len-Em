import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("lenEm_theme");
    return (saved as Theme) || "light";
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.style.colorScheme = theme;
    localStorage.setItem("lenEm_theme", theme);
    // The inline script in index.html already applied the theme before paint;
    // animating on mount would fade from light to dark.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Add theme-transition class for smooth theme-aware transitions
    body.classList.add("theme-transition");
    // Remove transition class after animation completes to prevent side effects
    const timer = setTimeout(() => {
      body.classList.remove("theme-transition");
    }, 400);
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}