import { useTheme } from "../../app/context/ThemeContext";

/**
 * Global animated background — uses CSS theme variables so colors
 * automatically switch between light/dark mode.
 *
 * Renders a soft gradient wash + slow ambient glow blooms + fine
 * fiber texture. No cursor effects, no heavy canvas.
 */
export function AnimatedBackground() {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* ── Base wash ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "linear-gradient(160deg, #1C1526 0%, #241A34 55%, #180F22 100%)"
            : "var(--bg-gradient-160)",
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Ambient glow blooms ── */}
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          filter: "blur(72px) saturate(1.15)",
          transition: "background 0.6s ease",
          background: isDark
            ? `radial-gradient(38% 32% at 20% 20%, rgba(107,63,160,0.42) 0%, transparent 70%),
               radial-gradient(32% 28% at 80% 16%, rgba(155,111,214,0.28) 0%, transparent 70%),
               radial-gradient(44% 38% at 52% 84%, rgba(70,40,110,0.32) 0%, transparent 70%)`
            : `radial-gradient(40% 34% at 16% 18%, rgba(245,239,168,0.55) 0%, transparent 70%),
               radial-gradient(36% 30% at 84% 14%, rgba(240,196,224,0.48) 0%, transparent 70%),
               radial-gradient(46% 40% at 50% 86%, rgba(255,214,170,0.42) 0%, transparent 70%)`,
        }}
      />

      {/* ── Fine fiber texture ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isDark ? 0.05 : 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='1' height='1' fill='${
            isDark ? "%239B6FD6" : "%236B3FA0"
          }' fill-opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(10,6,16,0.35) 100%)"
            : "radial-gradient(120% 90% at 50% 45%, transparent 60%, rgba(58,42,77,0.05) 100%)",
        }}
      />
    </div>
  );
}