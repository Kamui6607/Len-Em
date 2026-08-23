import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  const toggle = () => {
    setLang(lang === "en" ? "vi" : "en");
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="nav-icon-btn flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors relative"
      aria-label={lang === "en" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
    >
      <Globe className="size-5" />
      <AnimatePresence mode="wait">
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: -8, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.5 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute -bottom-0.5 right-0 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: "var(--primary)",
            textShadow: "0 0 4px rgba(107,63,160,0.3)",
          }}
        >
          {lang}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}