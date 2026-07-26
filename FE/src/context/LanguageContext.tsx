import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import enDict from "../locales/en.json";
import viDict from "../locales/vi.json";

type Language = "en" | "vi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, ...args: any[]) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

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
    (key: string, fallback?: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let val: any = lang === "en" ? enDict : viDict;
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          return fallback ?? key;
        }
      }
      if (typeof val !== "string") return fallback ?? key;
      
      // Replace placeholders with params if provided
      if (params) {
        return val.replace(/\{(\w+)\}/g, (match, paramKey) => {
          if (paramKey in params) {
            return String(params[paramKey]);
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