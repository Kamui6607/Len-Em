import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  MailCheck,
  ArrowLeft,
  ArrowRight,
  Loader as Loader2,
  RotateCw,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../../shared/api/authService";
import { AuthError } from "../../../shared/components/auth/AuthError";
import { AuthBrand } from "../../../shared/components/auth/AuthBrand";
import { AnimatedBackgroundAuth } from "../../../shared/components/motion/AnimatedBackgroundAuth";
import "../../../styles/auth.css";

const RESEND_COOLDOWN = 30;

const steps = [
  { title: "Nhập email của bạn", desc: "Email bạn đã dùng để đăng ký Len&Em" },
  { title: "Mở hộp thư", desc: "Bấm vào liên kết đặt lại mật khẩu chúng tôi gửi" },
  { title: "Đặt mật khẩu mới", desc: "Rồi quay lại đan tiếp thôi!" },
];

const swap = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
} as const;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const sendEmail = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.sendForgotPasswordEmail(email.trim());
      return true;
    } catch (err: unknown) {
      // Hiển thị thông báo lỗi THẬT từ backend (vd: "User not found") thay vì
      // nuốt mất nó bằng một câu tĩnh — chỉ fallback khi BE không trả message.
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError?.response?.data?.message ||
          "Failed to send reset email. Please try again.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (await sendEmail()) {
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    if (await sendEmail()) {
      setCooldown(RESEND_COOLDOWN);
      toast.success("Reset link sent again");
    }
  };

  const stepState = (i: number) => {
    const current = sent ? 1 : 0;
    return i < current ? "done" : i === current ? "current" : "todo";
  };

  return (
    <div className="auth-shell">
      <AnimatedBackgroundAuth />

      {/* ── Left: stitched story panel (lg and up) ── */}
      <aside className="auth-story">
        <span className="auth-ring" aria-hidden="true" />

        <AuthBrand />

        <div>
          <span className="auth-eyebrow">Lỡ quên mật khẩu?</span>
          <h1 className="auth-story-title">
            Tuột mũi một chút, <em>mình khâu lại nhé</em>
          </h1>
          <div className="auth-stitch" aria-hidden="true" />
          <p className="auth-story-sub">
            Chuyện thường thôi — chỉ ba bước nhỏ là bạn đã quay lại với những
            dự án đang dang dở.
          </p>

          <ol className="auth-steps" aria-label="Các bước đặt lại mật khẩu">
            {steps.map((s, i) => (
              <li className="auth-step" data-state={stepState(i)} key={s.title}>
                <span className="auth-step-num">{i + 1}</span>
                <div className="auth-step-card">
                  <div className="auth-feature-title">{s.title}</div>
                  <div className="auth-feature-desc">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <figure className="auth-quote">
          <blockquote className="auth-quote-text">
            “Không mũi đan nào hỏng mà không gỡ lại được.”
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

      {/* ── Right: form / sent state ── */}
      <main className="auth-main">
        <div className="auth-topbar">
          <Link to="/auth/login" className="auth-back">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          <div className="auth-topbar-brand">
            <AuthBrand />
          </div>
        </div>

        <div className="auth-form-wrap">
          <AnimatePresence mode="wait" initial={false}>
            {!sent ? (
              <motion.div key="request" {...swap}>
                <img
                  src="/mascot-sheep.png"
                  alt=""
                  aria-hidden="true"
                  className="auth-mobile-mascot"
                  draggable={false}
                />
                <span className="auth-eyebrow">Reset password</span>
                <h2 className="auth-title">
                  Forgot your <em>password?</em>
                </h2>
                <div className="auth-stitch" aria-hidden="true" />
                <p className="auth-sub mb-7">
                  No worries. Enter the email on your account and we&apos;ll
                  send you a link to set a new one.
                </p>

                <form onSubmit={handleSubmit}>
                  <AuthError error={error} />

                  <div className="auth-field mb-5">
                    <div className="auth-label-row">
                      <label htmlFor="forgot-email" className="auth-label">
                        Email
                      </label>
                    </div>
                    <div className="auth-input-wrap">
                      <Mail size={17} className="auth-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        className="auth-input"
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="auth-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send reset link{" "}
                        <ArrowRight size={18} className="auth-arrow" />
                      </>
                    )}
                  </button>
                </form>

                <Link to="/auth/login" className="auth-switch">
                  <span className="auth-switch-icon">
                    <LogIn size={18} />
                  </span>
                  <span>
                    <span className="auth-switch-title block">
                      Remembered it?
                    </span>
                    <span className="auth-switch-sub block">
                      Head back and sign in
                    </span>
                  </span>
                  <ArrowRight size={18} className="auth-switch-arrow" />
                </Link>
              </motion.div>
            ) : (
              <motion.div key="sent" {...swap} aria-live="polite">
                <div className="auth-sent-icon">
                  <MailCheck size={34} />
                </div>
                <span className="auth-eyebrow">Almost there</span>
                <h2 className="auth-title">
                  Check your <em>inbox</em>
                </h2>
                <div className="auth-stitch" aria-hidden="true" />
                <p className="auth-sub mb-3">
                  We&apos;ve sent a password reset link to
                </p>
                <span className="auth-email-chip">
                  <Mail size={15} className="shrink-0 text-[var(--primary)]" />
                  <span>{email.trim()}</span>
                </span>

                <ul className="auth-tips">
                  <li>The link may take a minute or two to arrive.</li>
                  <li>Can&apos;t find it? Check your Spam or Promotions folder.</li>
                </ul>

                <AuthError error={error} />

                <button
                  type="button"
                  className="auth-btn-outline"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                >
                  {loading ? (
                    <Loader2 size={17} className="auth-spin" />
                  ) : (
                    <RotateCw size={17} />
                  )}
                  {cooldown > 0
                    ? `Resend link in ${cooldown}s`
                    : "Resend link"}
                </button>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={() => {
                      setSent(false);
                      setError("");
                    }}
                  >
                    Use a different email
                  </button>
                  <Link to="/auth/login" className="auth-link">
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="auth-footnote">
          © {new Date().getFullYear()} Len&amp;Em · Made with yarn &amp; love
        </p>
      </main>
    </div>
  );
}

