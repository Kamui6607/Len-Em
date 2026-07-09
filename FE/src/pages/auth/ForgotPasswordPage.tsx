import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, ArrowLeft, CircleCheck as CheckCircle2, Loader as Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";
import { AnimatedBackgroundAuth } from "../../components/motion/AnimatedBackgroundAuth";
import { CursorEffects } from "../../components/motion/CursorEffects";
import { useTheme } from "../../app/context/ThemeContext";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.sendForgotPasswordEmail(email);
      setSent(true);
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <AnimatedBackgroundAuth />
        <CursorEffects isDark={isDark} />
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 40, textDecoration: "none" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 700, color: "var(--primary)",
              }}>
                L
              </div>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 700, color: "var(--foreground)",
              }}>
                Len&Em
              </span>
            </Link>

            <div style={{
              background: "var(--dropdown-bg)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: 40,
              boxShadow: "var(--shadow-float)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "var(--primary)" }} />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 700, color: "var(--foreground)",
                margin: "0 0 8px",
              }}>
                Check your email
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14, color: "var(--foreground-muted)",
                lineHeight: 1.6, marginBottom: 24,
              }}>
                We've sent a password reset link to <strong style={{ color: "var(--primary)" }}>{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "var(--primary)", background: "none", border: "none",
                  fontFamily: "'Caveat', cursive",
                  fontSize: 16, cursor: "pointer", padding: 0,
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackgroundAuth />
      <CursorEffects isDark={isDark} />
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 700, color: "var(--primary)",
                transition: "transform 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                L
              </div>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24, fontWeight: 700, color: "var(--foreground)",
                letterSpacing: "-0.3px",
              }}>
                Len&Em
              </span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} style={{
            background: "var(--dropdown-bg)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 36,
            boxShadow: "var(--shadow-float)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 15, color: "var(--primary)",
                marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Sparkles size={14} />
                Reset password
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26, fontWeight: 700, color: "var(--foreground)",
                margin: "0 0 8px", letterSpacing: "-0.02em",
              }}>
                Forgot password?
              </h1>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14, color: "var(--foreground-muted)",
                lineHeight: 1.6, margin: 0,
              }}>
                No worries. Enter your email and we'll send you a reset link.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12, fontWeight: 600, color: "var(--foreground)",
                marginBottom: 6, letterSpacing: "0.04em",
              }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)",
                  width: 18, height: 18,
                  color: "var(--foreground-muted)", pointerEvents: "none",
                }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 44px",
                    background: "var(--background)",
                    border: "1.5px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 14,
                    color: "var(--foreground)",
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 999,
                border: "none",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "'Inter', sans-serif",
                fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "var(--shadow-md)",
                transition: "transform 0.22s, box-shadow 0.22s",
                marginBottom: 16,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>

            <p style={{ textAlign: "center", margin: 0 }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 15, color: "var(--primary)",
                  background: "none", border: "none",
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                  padding: 0,
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Back
              </button>
            </p>
          </form>

          {/* Divider + Login link */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "var(--foreground-muted)", whiteSpace: "nowrap" }}>
              Remember your password?
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <p style={{ textAlign: "center", fontSize: 14, color: "var(--foreground-muted)", margin: 0 }}>
            <Link to="/auth/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign in here
            </Link>
          </p>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}