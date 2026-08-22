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
  BookOpen,
  Palette,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { AnimatedBackgroundAuth } from "../../components/motion/AnimatedBackgroundAuth";

const welcomeFeatures = [
  {
    icon: BookOpen,
    title: "Lộ trình học đan móc bài bản",
    desc: "Từ mũi đan đầu tiên đến thành phẩm hoàn chỉnh",
  },
  {
    icon: Palette,
    title: "Kho cảm hứng DIY mỗi tuần",
    desc: "Mẫu mới, kỹ thuật mới từ cộng đồng Len&Em",
  },
  {
    icon: ShoppingBag,
    title: "Kit nguyên liệu chọn sẵn",
    desc: "Đủ len, kim, phụ kiện — giao tận nơi",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const id = email.trim();
    const isEmail = id.includes("@");
    const rememberMe =
      (e.currentTarget.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement | null)?.checked ?? true;
    const credentials = isEmail
      ? { email: id, password, rememberMe }
      : { username: id, password, rememberMe };
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
        .login-shell {
          min-height: 100vh;
          display: flex;
          background: var(--background);
        }

        /* ============================================================
           LEFT — Welcome panel (desktop only)
           ============================================================ */
        .welcome-panel {
          display: none;
          position: relative;
          width: 44%;
          min-height: 100vh;
          padding: 56px 48px;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background: linear-gradient(160deg, var(--brand-600, var(--primary)) 0%, var(--brand-700, var(--primary-hover)) 65%, var(--brand-800, var(--primary-pressed)) 100%);
          color: #fff;
          transition: background 0.4s ease;
        }
        @media (min-width: 1024px) {
          .welcome-panel { display: flex; }
        }
        /* Dark mode: swap the vivid daytime gradient for the site's night-atelier glow */
        .dark .welcome-panel {
          background: linear-gradient(165deg, var(--bg-1) 0%, var(--bg-2) 55%, var(--bg-3) 100%);
          border-right: 1px solid var(--border-light);
          box-shadow: inset -1px 0 0 rgba(140,123,255,0.06);
        }

        /* Yarn-dot texture */
        .welcome-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 22px 22px;
          opacity: 0.5;
          pointer-events: none;
        }
        /* Soft glow blob — sunlit highlight in light mode */
        .welcome-panel::after {
          content: '';
          position: absolute;
          top: -120px;
          right: -100px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%);
          pointer-events: none;
          transition: background 0.4s ease;
        }
        .dark .welcome-panel::after {
          background: radial-gradient(circle, rgba(140,123,255,0.32) 0%, transparent 70%);
        }
        /* Multi-point ambient glow — only lit up at night */
        .welcome-atmosphere {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          background:
            radial-gradient(420px 320px at 12% 18%, rgba(140,123,255,0.26), transparent 62%),
            radial-gradient(380px 320px at 88% 78%, rgba(140,123,255,0.18), transparent 62%);
        }
        .dark .welcome-atmosphere { opacity: 1; }

        .welcome-stitch-ring {
          position: absolute;
          bottom: -140px;
          left: -140px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.18);
          animation: spin-slow 60s linear infinite;
          pointer-events: none;
          transition: border-color 0.4s ease, filter 0.4s ease;
        }
        .welcome-stitch-ring--inner {
          position: absolute;
          bottom: -70px;
          left: -70px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.14);
          animation: spin-slow-rev 46s linear infinite;
          pointer-events: none;
          transition: border-color 0.4s ease, filter 0.4s ease;
        }
        .dark .welcome-stitch-ring {
          border-color: rgba(140,123,255,0.38);
          filter: drop-shadow(0 0 22px rgba(140,123,255,0.22));
        }
        .dark .welcome-stitch-ring--inner {
          border-color: rgba(140,123,255,0.3);
          filter: drop-shadow(0 0 16px rgba(140,123,255,0.18));
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes spin-slow-rev { to { transform: rotate(-360deg); } }

        .welcome-content { position: relative; z-index: 1; }

        .welcome-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 64px;
        }
        .welcome-logo-mark {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.15rem;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .dark .welcome-logo-mark {
          background: rgba(140,123,255,0.16);
          border-color: rgba(140,123,255,0.4);
          box-shadow: 0 0 22px rgba(140,123,255,0.25);
        }
        .welcome-logo-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.4rem;
          letter-spacing: -0.01em;
        }

        .welcome-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          margin-bottom: 18px;
        }
        .welcome-eyebrow-dash {
          width: 22px;
          height: 0;
          border-bottom: 2px dashed rgba(255,255,255,0.55);
          transition: border-color 0.4s ease;
        }
        .dark .welcome-eyebrow-dash {
          border-bottom-color: rgba(140,123,255,0.65);
        }

        .welcome-title {
          font-family: var(--font-heading);
          font-size: clamp(1.9rem, 2.6vw, 2.5rem);
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: -0.02em;
          max-width: 420px;
          margin-bottom: 16px;
        }
        .welcome-sub {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.78);
          max-width: 380px;
          margin-bottom: 44px;
        }

        .welcome-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .welcome-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .welcome-feature-icon {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .dark .welcome-feature-icon {
          background: rgba(140,123,255,0.14);
          border-color: rgba(140,123,255,0.32);
          box-shadow: 0 0 14px rgba(140,123,255,0.15);
        }
        .welcome-feature-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .welcome-feature-desc {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
        }

        .welcome-quote {
          position: relative;
          z-index: 1;
          padding-top: 28px;
          border-top: 1px dashed rgba(255,255,255,0.22);
          transition: border-color 0.4s ease;
        }
        .dark .welcome-quote {
          border-top-color: rgba(140,123,255,0.32);
        }
        .welcome-quote-text {
          font-family: var(--font-script);
          font-size: 1.5rem;
          line-height: 1.4;
          color: #fff;
          margin-bottom: 6px;
        }
        .welcome-quote-by {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.04em;
        }

        /* ============================================================
           RIGHT — Form side
           ============================================================ */
        .login-form-side {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
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
          background-image: repeating-linear-gradient(90deg, var(--primary) 0 10px, transparent 10px 18px);
          opacity: 0.85;
        }
        .mobile-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .mobile-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          background: var(--cta-gradient);
          color: #fff;
          font-family: var(--font-heading);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-brand-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--foreground);
        }
        @media (min-width: 1024px) {
          .mobile-brand { display: none; }
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

        @media (prefers-reduced-motion: reduce) {
          .welcome-stitch-ring, .welcome-stitch-ring--inner { animation: none; }
        }
      `}</style>

      <div className="login-shell">
        {/* ── Left: welcome panel (lg and up) ── */}
        <aside className="welcome-panel">
          <span className="welcome-atmosphere" aria-hidden="true" />
          <span className="welcome-stitch-ring" aria-hidden="true" />
          <span className="welcome-stitch-ring--inner" aria-hidden="true" />

          <div className="welcome-content">
            <div className="welcome-logo">
              <span className="welcome-logo-mark">L</span>
              <span className="welcome-logo-name">
                Len&amp;em
              </span>
            </div>

            <div className="welcome-eyebrow">
              <span className="welcome-eyebrow-dash" />
              Chào mừng trở lại
            </div>
            <h1 className="welcome-title">
              Nơi từng mũi đan kể một câu chuyện ấm áp
            </h1>
            <p className="welcome-sub">
              Đăng nhập để tiếp tục hành trình sáng tạo của bạn — lưu mẫu yêu thích,
              theo dõi đơn hàng và nhận gợi ý được chọn riêng cho bạn.
            </p>

            <div className="welcome-features">
              {welcomeFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <div className="welcome-feature" key={f.title}>
                    <span className="welcome-feature-icon">
                      <Icon size={17} />
                    </span>
                    <div>
                      <div className="welcome-feature-title">{f.title}</div>
                      <div className="welcome-feature-desc">{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="welcome-quote">
            <p className="welcome-quote-text">
              “Mỗi mũi chỉ là một nhịp thở chậm lại.”
            </p>
            <p className="welcome-quote-by">— Len&amp;Em</p>
          </div>
        </aside>

        {/* ── Right: form ── */}
        <div className="login-form-side">
          <AnimatedBackgroundAuth />
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

            <div className="mobile-brand">
              <span className="mobile-brand-mark">L</span>
              <span className="mobile-brand-name">Len&amp;em</span>
            </div>

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
                    placeholder="you@gmail.com"
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
          </div>
        </div>
      </div>
    </>
  );
}