import { useTheme } from "../../app/context/ThemeContext";

/**
 * Background for auth pages — simpler than the main background,
 * with no cursor effects. Theme-aware for light/dark mode.
 */
export function AnimatedBackgroundAuth() {
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

      {/* ── Very subtle vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(10,6,16,0.35) 100%)"
            : "radial-gradient(120% 90% at 50% 45%, transparent 60%, rgba(58,42,77,0.05) 100%)",
        }}
      />

      {/* ── Dark mode subtle starfield overlay (lightweight CSS only) ── */}
      {isDark && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.3,
            backgroundImage: `radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 30% 60%, rgba(200,200,255,0.3) 0%, transparent 100%),
              radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.35) 0%, transparent 100%),
              radial-gradient(1.2px 1.2px at 70% 40%, rgba(200,200,255,0.25) 0%, transparent 100%),
              radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.3) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 15% 85%, rgba(200,200,255,0.2) 0%, transparent 100%),
              radial-gradient(1px 1px at 45% 30%, rgba(255,255,255,0.35) 0%, transparent 100%),
              radial-gradient(1px 1px at 65% 70%, rgba(200,200,255,0.3) 0%, transparent 100%),
              radial-gradient(1.2px 1.2px at 85% 15%, rgba(255,255,255,0.25) 0%, transparent 100%),
              radial-gradient(1px 1px at 25% 45%, rgba(200,200,255,0.2) 0%, transparent 100%)`,
            backgroundSize: "100% 100%",
          }}
        />
      )}
    </div>
  );
}
