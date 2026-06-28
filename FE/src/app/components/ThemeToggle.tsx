import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  size?: "sm" | "md";
  variant?: "icon" | "row";
}

export function ThemeToggle({
  size = "md",
  variant = "icon",
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const btnSize = size === "sm" ? "w-8 h-8" : "w-9 h-9";

  const animatedIcon = (className: string) => (
    <motion.span
      key={isDark ? "moon" : "sun"}
      initial={{ rotate: -30, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      exit={{ rotate: 30, opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex items-center justify-center"
    >
      {isDark ? <Moon className={className} /> : <Sun className={className} />}
    </motion.span>
  );

  if (variant === "row") {
    return (
      <div className="w-full flex items-center gap-3 px-3 py-1 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
          {animatedIcon(
            isDark
              ? "w-3.5 h-3.5 text-slate-400"
              : "w-3.5 h-3.5 text-amber-400",
          )}
        </div>

        <span className="text-sm text-muted-foreground flex-1 text-left">
          Theme
        </span>

        {/* Pill với border, mỗi option hover riêng */}
        <div className="flex items-center border border-border rounded-full p-0.5">
          <motion.button
            onClick={() => isDark && toggleTheme()}
            whileTap={{ scale: 0.95 }}
            className={`text-[11px] px-3 py-1 rounded-full transition-all duration-200 min-w-[40px] text-center ${
              !isDark
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Light
          </motion.button>
          <motion.button
            onClick={() => !isDark && toggleTheme()}
            whileTap={{ scale: 0.95 }}
            className={`text-[11px] px-3 py-1 rounded-full transition-all duration-200 min-w-[40px] text-center ${
              isDark
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Dark
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`${btnSize} rounded-full flex items-center justify-center transition-colors duration-300 border border-border bg-card hover:bg-muted text-foreground`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {animatedIcon(
        isDark ? "w-3.5 h-3.5 text-slate-400" : "w-3.5 h-3.5 text-amber-400",
      )}
    </motion.button>
  );
}
