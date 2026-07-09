import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader as Loader2,
  CircleAlert as AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { AnimatedBackgroundAuth } from "../../components/motion/AnimatedBackgroundAuth";
import { CursorEffects } from "../../components/motion/CursorEffects";
import { useTheme } from "../../app/context/ThemeContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const isEmail = email.includes("@");
    const credentials = isEmail
      ? { email, password }
      : { username: email, password };
    try {
      await login(credentials);
      const { user } = useAuthStore.getState();
      if (!user || !user.roleId) navigate("/");
      else if (user.roleId === "admin") navigate("/admin");
      else if (user.roleId === "staff") navigate("/staff");
      else navigate("/shop");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError?.response?.data?.message ||
          "Invalid credentials. Please try again.",
      );
    }
  };

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--background);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-3xl);
          box-shadow: var(--shadow-float);
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--cta-gradient);
          opacity: 0.8;
        }
        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .form-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.04em;
        }
        .form-title {
          font-family: var(--font-heading);
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .form-sub {
          font-size: var(--text-sm);
          color: var(--foreground-muted);
          line-height: 1.6;
        }
        .field {
          margin-bottom: 20px;
        }
        .field-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 6px;
        }
        .field-wrap {
          position: relative;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--foreground-muted);
          pointer-events: none;
          width: 16px;
          height: 16px;
          transition: color 0.2s ease;
        }
        .field-wrap:focus-within .field-icon {
          color: var(--primary);
        }
        .field-input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: var(--input-bg);
          color: var(--foreground);
          border: 1.5px solid var(--input-border);
          border-radius: var(--radius-lg);
          font-family: var(--font-body);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s var(--ease-out);
          box-sizing: border-box;
        }
        .field-input:hover {
          border-color: var(--primary);
        }
        .field-input::placeholder {
          color: var(--foreground-muted);
          opacity: 0.4;
        }
        .field-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent);
        }
        .field-input-pr {
          padding-right: 44px;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--foreground-muted);
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .eye-btn:hover {
          color: var(--foreground);
          background: var(--chip-bg);
        }
        .form-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--foreground-muted);
          cursor: pointer;
        }
        .remember input {
          width: 16px;
          height: 16px;
          accent-color: var(--primary);
          border-radius: 4px;
        }
        .forgot-link {
          font-size: 0.8125rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover {
          text-decoration: underline;
        }
        .err-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-size: 0.8125rem;
          color: var(--destructive);
          margin-bottom: 20px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-lg);
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 0.9375rem;
          font-weight: 600;
          background: var(--cta-gradient);
          color: var(--primary-foreground);
          transition: all 0.3s var(--ease-out);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--cta-shadow);
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--cta-shadow-hover);
        }
        .submit-btn:hover::before {
          opacity: 1;
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .divider span {
          font-size: 0.8125rem;
          color: var(--foreground-muted);
          white-space: nowrap;
          font-weight: 500;
        }
        .reg-txt {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--foreground-muted);
        }
        .reg-txt a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
        .reg-txt a:hover {
          text-decoration: underline;
        }
        .sep {
          height: 1px;
          background: var(--border-subtle);
          margin: 24px 0;
        }
        .demo-box {
          background: var(--surface-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 16px 18px;
        }
        .demo-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--foreground-secondary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .demo-chip {
          background: var(--chip-bg);
          border: 1px solid var(--chip-border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          font-size: 0.8125rem;
          color: var(--foreground);
          cursor: default;
          transition: all 0.2s ease;
        }
        .demo-chip:hover {
          background: var(--chip-hover-bg);
          transform: translateY(-1px);
        }
        .demo-role {
          font-weight: 600;
          font-size: 0.6875rem;
          color: var(--primary);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .demo-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot-admin { background: var(--primary); }
        .dot-staff { background: var(--accent-blush); }
        .dot-user { background: var(--accent-butter); }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <AnimatedBackgroundAuth />
      <CursorEffects isDark={isDark} />
      <div className="login-root">
        <div className="login-card">
          {/* Decorative glow */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
              opacity: 0.08,
              pointerEvents: "none",
            }}
          />

          <div className="form-header">
            <div className="form-eyebrow">
              <Sparkles size={14} />
              Welcome back
            </div>
            <div className="form-title">Sign in</div>
            <p className="form-sub">Continue your cozy crafting journey</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="err-box">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label className="field-label">Email or Username</label>
              <div className="field-wrap">
                <Mail size={16} className="field-icon" />
                <input
                  type="text"
                  className="field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="field-input field-input-pr"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="remember">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <Link to="/auth/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span>New to Len&Em?</span>
            <div className="divider-line" />
          </div>

          <p className="reg-txt">
            <Link to="/auth/register">Create an account</Link> and start your journey ✦
          </p>

          <div className="sep" />

          <div className="demo-box">
            <div className="demo-title">
              🔑 Demo accounts — password: <strong>123456</strong>
            </div>
            <div className="demo-grid">
              <div className="demo-chip">
                <div className="demo-role">
                  <span className="demo-dot dot-admin" />
                  Admin
                </div>
                admin
              </div>
              <div className="demo-chip">
                <div className="demo-role">
                  <span className="demo-dot dot-staff" />
                  Staff
                </div>
                staff1
              </div>
              <div className="demo-chip">
                <div className="demo-role">
                  <span className="demo-dot dot-user" />
                  Customer
                </div>
                customer1
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}