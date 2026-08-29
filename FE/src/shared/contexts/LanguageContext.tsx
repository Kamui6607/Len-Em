import { createContext, useContext, useCallback, type ReactNode } from "react";
import viDict from "../../locales/vi.json";

interface LanguageContextType {
  t: (
    key: string,
    fallback?: string | Record<string, unknown>,
    params?: Record<string, unknown>,
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/**
 * Last-resort fallback: turn "admin.products.create" into a readable label ("Create").
 * Used only when a key is missing from the vi locale dictionary.
 */
function humanizeKey(key: string): string {
  const seg = key.split(".").pop() ?? key;
  return seg
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const t = useCallback(
    (
      key: string,
      fallback?: string | Record<string, unknown>,
      params?: Record<string, unknown>,
    ): string => {
      const keys = key.split(".");

      // Support both t(key, params) and t(key, fallback, params) signatures
      const resolvedParams = params ?? (typeof fallback === "object" ? fallback : undefined);
      const stringFallback = typeof fallback === "string" ? fallback : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let val: any = viDict;
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }
      if (typeof val !== "string") {
        return stringFallback ?? humanizeKey(key);
      }

      // Replace placeholders with params if provided
      if (resolvedParams) {
        return val.replace(/\{(\w+)\}/g, (match, paramKey) => {
          if (paramKey in resolvedParams) {
            return String(resolvedParams[paramKey]);
          }
          return match;
        });
      }

      return val;
    },
    [],
  );

  return <LanguageContext.Provider value={{ t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}