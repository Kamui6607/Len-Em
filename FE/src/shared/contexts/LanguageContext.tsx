import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import enDict from "../../locales/en.json";
import viDict from "../../locales/vi.json";

type Language = "en" | "vi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, ...args: any[]) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/**
 * Last-resort fallback: turn "admin.products.create" into a readable label ("Create").
 * Used only when a key is missing from both locale dictionaries.
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
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("lenem_lang") as Language | null;
    return saved === "en" || saved === "vi" ? saved : "vi";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lenem_lang", newLang);
    document.body.classList.add("lang-switching");
    setTimeout(() => {
      document.body.classList.remove("lang-switching");
    }, 400);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string | Record<string, string | number>, params?: Record<string, string | number>): string => {
      const keys = key.split(".");

      // Support both t(key, params) and t(key, fallback, params) signatures
      const resolvedParams = params ?? (typeof fallback === "object" ? fallback : undefined);
      const stringFallback = typeof fallback === "string" ? fallback : undefined;

      const lookup = (dict: object) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = dict;
        for (const k of keys) {
          if (val && typeof val === "object" && k in val) {
            val = val[k];
          } else {
            return undefined;
          }
        }
        return typeof val === "string" ? val : undefined;
      };

      let val = lookup(lang === "en" ? enDict : viDict);
      if (val === undefined) {
        // Graceful cross-locale fallback so a missing key never renders as
        // "admin.products.create" but shows the other language's text instead.
        val = lookup(lang === "en" ? viDict : enDict);
      }
      if (val === undefined) {
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
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}