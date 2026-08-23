import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Lock, ArrowLeft, CircleCheck as CheckCircle2, Loader as Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../../shared/api/authService";
import { AnimatedBackgroundAuth } from "../../../shared/components/motion/AnimatedBackgroundAuth";

export function ResetNewPasswordPage() {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid") || "";

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const verifyLink = async () => {
      if (!uuid) {
        toast.error("Invalid reset link");
        setVerifying(false);
        return;
      }

      try {
        const response = await authService.verifyForgotPasswordLink(uuid);
        const data = response.data as { isValid?: string } | undefined;
        if (data?.isValid) {
          setEmail(data.isValid);
          setVerified(true);
        } else {
          toast.error("Invalid or expired reset link");
        }
      } catch {
        toast.error("Link is invalid or expired!");
      } finally {
        setVerifying(false);
      }
    };

    verifyLink();
  }, [uuid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ uuid, newPassword: password, confirmPassword });
      setResetSuccess(true);
      toast.success("Password reset successfully!");
    } catch {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <>
        <AnimatedBackgroundAuth />
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
            <div style={{
              background: "var(--dropdown-bg)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: 40,
              boxShadow: "var(--shadow-float)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}>
              <Loader2 style={{ 
                width: 48, 
                height: 48, 
                color: "var(--primary)",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px"
              }} />
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: "0 0 8px",
              }}>
                Verifying link...
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.6,
                margin: 0,
              }}>
                Please wait while we verify your reset link
              </p>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  if (!verified && !verifying) {
    return (
      <>
        <AnimatedBackgroundAuth />
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
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--primary)",
                  transition: "transform 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  L
                </div>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "-0.3px",
                }}>
                  Len&Em
                </span>
              </Link>
            </div>

            <div style={{
              background: "var(--dropdown-bg)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: 36,
              boxShadow: "var(--shadow-float)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              textAlign: "center",
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "color-mix(in srgb, #ef4444 8%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <AlertCircle style={{ width: 32, height: 32, color: "#ef4444" }} />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: "0 0 8px",
              }}>
                Invalid or Expired Link
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.6,
                marginBottom: 24,
              }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/auth/forgot-password"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                Request new link
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (resetSuccess) {
    return (
      <>
        <AnimatedBackgroundAuth />
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
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--primary)",
              }}>
                L
              </div>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--foreground)",
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
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "var(--primary)" }} />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: "0 0 8px",
              }}>
                Password reset successful!
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.6,
                marginBottom: 24,
              }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                to="/auth/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackgroundAuth />
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
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--primary)",
                transition: "transform 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                L
              </div>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--foreground)",
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
                fontSize: 15,
                color: "var(--primary)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}>
                <Sparkles size={14} />
                Reset password
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}>
                Create new password
              </h1>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.6,
                margin: 0,
              }}>
                Enter your new password below for <strong style={{ color: "var(--primary)" }}>{email}</strong>
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 18,
                  height: 18,
                  color: "var(--foreground-muted)",
                  pointerEvents: "none",
                }} />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
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

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
                letterSpacing: "0.04em",
              }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 18,
                  height: 18,
                  color: "var(--foreground-muted)",
                  pointerEvents: "none",
                }} />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
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
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "var(--shadow-md)",
                transition: "transform 0.22s, box-shadow 0.22s",
                marginBottom: 16,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>

            <p style={{ textAlign: "center", margin: 0 }}>
              <Link
                to="/auth/login"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 15,
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  textDecoration: "none",
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}