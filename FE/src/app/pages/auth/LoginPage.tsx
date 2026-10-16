import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader as Loader2,
  BookOpen,
  Palette,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "../../../shared/store/auth.store";
import { GoogleAuthButton } from "../../../shared/components/auth/GoogleAuthButton";
import { AuthError } from "../../../shared/components/auth/AuthError";
import { AuthBrand } from "../../../shared/components/auth/AuthBrand";
import { AnimatedBackgroundAuth } from "../../../shared/components/motion/AnimatedBackgroundAuth";
import "../../../styles/auth.css";
import "../../../styles/auth-fit.css";

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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const id = email.trim();
    const isEmail = id.includes("@");
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
    <div className="auth-shell auth-fit">
      <AnimatedBackgroundAuth />

      {/* ── Left: stitched story panel (lg and up, hidden on very short screens) ── */}
      <aside className="auth-story">
        <span className="auth-ring" aria-hidden="true" />

        <AuthBrand />

        <div>
          <span className="auth-eyebrow">Chào mừng trở lại</span>
          <h1 className="auth-story-title">
            Nơi từng mũi đan kể một <em>câu chuyện ấm áp</em>
          </h1>
          <div className="auth-stitch" aria-hidden="true" />
          <p className="auth-story-sub">
            Đăng nhập để tiếp tục hành trình sáng tạo — lưu mẫu yêu thích, theo
            dõi đơn hàng và nhận gợi ý được chọn riêng cho bạn.
          </p>

          <ul className="auth-features">
            {welcomeFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <li className="auth-feature" key={f.title}>
                  <span className="auth-feature-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="auth-feature-title">{f.title}</div>
                    <div className="auth-feature-desc">{f.desc}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <figure className="auth-quote">
          <blockquote className="auth-quote-text">
            “Mỗi mũi chỉ là một nhịp thở chậm lại.”
          </blockquote>
          <figcaption className="auth-quote-by">— Len&amp;Em</figcaption>
        </figure>

        <img
          src="/mascot-sheep.png"
          alt=""
          aria-hidden="true"
          className="auth-mascot"
          draggable={false}
        />
      </aside>

      {/* ── Right: form — sized to always fit one screen ── */}
      <main className="fit-main">
        <div className="fit-top">
          <Link to="/" className="auth-back" aria-label="Trang chủ">
            <ArrowLeft size={16} />
            <span>Trang chủ</span>
          </Link>
          <div className="auth-topbar-brand">
            <AuthBrand />
          </div>
        </div>

        <div className={`fit-center${error ? " has-error" : ""}`}>
          <div className="fit-head">
            <div className="min-w-0">
              <span className="auth-eyebrow">Welcome back</span>
              <h2 className="auth-title">
                Sign <em>in</em>
              </h2>
              <div className="auth-stitch" aria-hidden="true" />
              <p className="fit-sub">
                Pick up your yarn right where you left it.
              </p>
            </div>
            <img
              src="/mascot-sheep.png"
              alt=""
              aria-hidden="true"
              className="fit-mascot"
              draggable={false}
            />
          </div>

          <AuthError error={error} />

          <form onSubmit={handleSubmit} className="fit-form">
            <div className="fit-fields">
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-id" className="auth-label">
                    Email or username
                  </label>
                </div>
                <div className="auth-input-wrap">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    id="login-id"
                    type="text"
                    className="auth-input"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password" className="auth-label">
                    Password
                  </label>
                  <Link to="/auth/forgot-password" className="auth-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="auth-input has-toggle"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Keep me signed in
              </label>
            </div>

            <div className="fit-actions">
              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="auth-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={18} className="auth-arrow" />
                  </>
                )}
              </button>

              <div className="auth-divider">or continue with</div>

              {/* Its buttons are type="button", so they never submit this form */}
              <GoogleAuthButton onError={setError} />

              <p className="fit-register">
                New to Len&amp;Em?
                <Link to="/auth/register">
                  Create an account <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="fit-foot">
          © {new Date().getFullYear()} Len&amp;Em · Made with yarn &amp; love
        </p>
      </main>
    </div>
  );
}
