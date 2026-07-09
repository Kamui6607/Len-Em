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

      {/* ── Particles (dark mode only) ── */}
      {isDark && (
        <div
          className="bg-particles"
          id="particlesBg"
          style={{
            position: "absolute",
            width: "100%",
            minHeight: "300px",
            inset: 0,
          }}
        >
          <span
            className="bg-label"
            style={{
              position: "absolute",
              color: "rgba(255,255,255,0.3)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Particles
          </span>
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "90.5893%",
              animationDelay: "4.44033s",
              animationDuration: "8.62872s",
              width: "3.39375px",
              height: "3.39375px",
              opacity: "0.34294",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "87.881%",
              animationDelay: "3.36726s",
              animationDuration: "7.79457s",
              width: "4.66676px",
              height: "4.66676px",
              opacity: "0.418503",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "54.8156%",
              animationDelay: "0.208145s",
              animationDuration: "14.179s",
              width: "5.72823px",
              height: "5.72823px",
              opacity: "0.952164",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "90.9829%",
              animationDelay: "1.0484s",
              animationDuration: "10.8976s",
              width: "5.93719px",
              height: "5.93719px",
              opacity: "0.804315",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "70.3343%",
              animationDelay: "1.81387s",
              animationDuration: "12.2959s",
              width: "5.6192px",
              height: "5.6192px",
              opacity: "0.6372",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "87.6497%",
              animationDelay: "3.90077s",
              animationDuration: "10.0884s",
              width: "4.15209px",
              height: "4.15209px",
              opacity: "0.588661",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "62.46%",
              animationDelay: "4.45381s",
              animationDuration: "12.9175s",
              width: "5.71963px",
              height: "5.71963px",
              opacity: "0.695436",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "56.6112%",
              animationDelay: "9.48194s",
              animationDuration: "7.32675s",
              width: "3.87464px",
              height: "3.87464px",
              opacity: "0.644704",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "80.7508%",
              animationDelay: "5.43058s",
              animationDuration: "13.6137s",
              width: "5.24877px",
              height: "5.24877px",
              opacity: "0.752891",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "57.6617%",
              animationDelay: "5.86294s",
              animationDuration: "5.22049s",
              width: "4.74235px",
              height: "4.74235px",
              opacity: "0.636365",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "74.6169%",
              animationDelay: "5.01211s",
              animationDuration: "13.2965s",
              width: "5.79001px",
              height: "5.79001px",
              opacity: "0.63599",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "69.2779%",
              animationDelay: "8.25324s",
              animationDuration: "10.402s",
              width: "3.46325px",
              height: "3.46325px",
              opacity: "0.496524",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "6.99965%",
              animationDelay: "6.04981s",
              animationDuration: "6.93312s",
              width: "3.80742px",
              height: "3.80742px",
              opacity: "0.581927",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "38.8967%",
              animationDelay: "7.23472s",
              animationDuration: "9.09794s",
              width: "5.86785px",
              height: "5.86785px",
              opacity: "0.633803",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "4.19432%",
              animationDelay: "1.31484s",
              animationDuration: "11.5116s",
              width: "3.93533px",
              height: "3.93533px",
              opacity: "0.442768",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "83.4693%",
              animationDelay: "3.03911s",
              animationDuration: "13.0885s",
              width: "3.78386px",
              height: "3.78386px",
              opacity: "0.71362",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "83.762%",
              animationDelay: "1.39057s",
              animationDuration: "9.40918s",
              width: "2.14462px",
              height: "2.14462px",
              opacity: "0.865588",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "89.4466%",
              animationDelay: "1.62986s",
              animationDuration: "8.052s",
              width: "3.62992px",
              height: "3.62992px",
              opacity: "0.327191",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "45.3375%",
              animationDelay: "4.58503s",
              animationDuration: "11.4105s",
              width: "3.28909px",
              height: "3.28909px",
              opacity: "0.954582",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "59.7957%",
              animationDelay: "2.74879s",
              animationDuration: "5.47785s",
              width: "3.33285px",
              height: "3.33285px",
              opacity: "0.788944",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "79.3045%",
              animationDelay: "5.75479s",
              animationDuration: "5.64746s",
              width: "3.95071px",
              height: "3.95071px",
              opacity: "0.913196",
              background: "var(--decor-particle-1)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "95.6517%",
              animationDelay: "4.89289s",
              animationDuration: "12.8418s",
              width: "3.25877px",
              height: "3.25877px",
              opacity: "0.562901",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "70.0664%",
              animationDelay: "4.605s",
              animationDuration: "11.492s",
              width: "4.31894px",
              height: "4.31894px",
              opacity: "0.492941",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "5.16691%",
              animationDelay: "0.984274s",
              animationDuration: "13.4532s",
              width: "4.74525px",
              height: "4.74525px",
              opacity: "0.830071",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "30.2216%",
              animationDelay: "7.87296s",
              animationDuration: "6.97554s",
              width: "5.55273px",
              height: "5.55273px",
              opacity: "0.96313",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "77.7576%",
              animationDelay: "3.08756s",
              animationDuration: "7.77686s",
              width: "2.34381px",
              height: "2.34381px",
              opacity: "0.623775",
              background: "var(--decor-particle-2)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "92.6579%",
              animationDelay: "3.03948s",
              animationDuration: "11.4625s",
              width: "3.70212px",
              height: "3.70212px",
              opacity: "0.965245",
              background: "var(--decor-particle-4)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "28.294%",
              animationDelay: "8.42389s",
              animationDuration: "8.18569s",
              width: "5.68567px",
              height: "5.68567px",
              opacity: "0.550714",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "38.4973%",
              animationDelay: "1.95929s",
              animationDuration: "7.44715s",
              width: "2.26005px",
              height: "2.26005px",
              opacity: "0.659427",
              background: "var(--decor-particle-3)",
            }}
          />
          <div
            className="particle"
            style={{
              position: "absolute",
              left: "2.12928%",
              animationDelay: "6.86315s",
              animationDuration: "7.93877s",
              width: "4.01125px",
              height: "4.01125px",
              opacity: "0.907174",
              background: "var(--decor-particle-4)",
            }}
          />
        </div>
      )}
    </div>
  );
}
