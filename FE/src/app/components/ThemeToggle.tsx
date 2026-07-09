import { useTheme } from "../context/ThemeContext";
import "../../styles/theme-toggle.css";

interface ThemeToggleProps {
  size?: "sm" | "md";
  variant?: "icon" | "row";
}

/** The 9 dot/ray pieces that morph between a sun and a moon crescent */
function ThemeIconParts() {
  return (
    <span className="theme__icon" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span className="theme__icon-part" key={i} />
      ))}
    </span>
  );
}

export function ThemeToggle({ size = "md", variant = "icon" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const switchEl = (
    <label className={`theme ${size === "sm" ? "theme--sm" : ""}`}>
      <span className="theme__toggle-wrap">
        <input
          className="theme__toggle"
          type="checkbox"
          role="switch"
          checked={isDark}
          onChange={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
        <ThemeIconParts />
      </span>
    </label>
  );

  if (variant === "row") {
    return (
      <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--foreground-secondary)" }}
        >
          Theme
        </span>
        {switchEl}
      </div>
    );
  }

  return switchEl;
}