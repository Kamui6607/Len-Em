import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader,
  AlertCircle,
  User as UserIcon,
  Phone,
  AtSign,
  MapPin,
  Sparkles,
  Heart,
  Gift,
  Users,
} from "lucide-react";
import { useAuthStore } from "../../../shared/store/auth.store";
import { toast } from "sonner";
import { AnimatedBackgroundAuth } from "../../../shared/components/motion/AnimatedBackgroundAuth";

const welcomeFeatures = [
  {
    icon: Gift,
    title: "Ưu đãi chào mừng thành viên mới",
    desc: "Mã giảm giá riêng cho đơn kit đầu tiên",
  },
  {
    icon: Heart,
    title: "Lưu mẫu & theo dõi đơn hàng",
    desc: "Một nơi cho mọi dự án đang dở dang của bạn",
  },
  {
    icon: Users,
    title: "Cộng đồng đan móc thân thiện",
    desc: "Chia sẻ thành phẩm, hỏi đáp cùng người mới lẫn thợ lành nghề",
  },
];

/* Input styles được gộp vào CSS class .rp-input trong <style> phiên bản mới */

function Field({
  label,
  icon: Icon,
  k,
  type = "text",
  placeholder,
  form,
  fe,
  upd,
  optional,
  rightSlot,
  extraInputStyle,
}: {
  label: string;
  icon?: React.ElementType;
  k: string;
  type?: string;
  placeholder?: string;
  form: Record<string, string>;
  fe: Record<string, string>;
  upd: (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
  rightSlot?: React.ReactNode;
  extraInputStyle?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!fe[k];

  return (
    <div className="rp-field">
      <label className="rp-field-label">
        {label}
        {optional ? (
          <span className="rp-opt">(optional)</span>
        ) : (
          <span className="rp-req">*</span>
        )}
      </label>
      <div
        className={`rp-field-wrap${focused ? " rp-focused" : ""}${hasError ? " rp-error" : ""}`}
      >
        {Icon && <Icon size={15} className="rp-field-icon" />}
        <input
          type={type}
          placeholder={placeholder}
          value={form[k]}
          onChange={upd(k)}
          required={!optional}
          className={`rp-input${rightSlot ? " rp-input-right" : ""}`}
          style={extraInputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightSlot}
      </div>
      {hasError && <div className="rp-err-msg">{fe[k]}</div>}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    gender: "OTHER",
    dateOfBirth: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [error, setError] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");

  const getDobString = () => {
    if (!dobMonth || !dobDay || !dobYear) return "";
    return `${dobMonth.padStart(2, "0")}/${dobDay.padStart(2, "0")}/${dobYear}`;
  };

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFe((prev) => ({ ...prev, [k]: "" }));
    setError("");
  };

  const v1 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = "Please enter your full name.";
    if (!form.username.trim()) errors.username = "Please choose a username.";
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username))
      errors.username = "3+ chars: letters, numbers, underscores only.";
    if (!form.email.trim()) errors.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Please enter a valid email address.";
    if (form.phone && !/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, "")))
      errors.phone = "Enter a valid 10-11 digit phone number.";
    if (form.dateOfBirth) {
      const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dobRegex.test(form.dateOfBirth)) {
        errors.dateOfBirth = "Please enter a valid date (MM/DD/YYYY).";
      }
    }
    return errors;
  };

  const v2 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.password) errors.password = "Please enter a password.";
    else if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password))
      errors.password = "Password must include an uppercase letter.";
    else if (!/[a-z]/.test(form.password))
      errors.password = "Password must include a lowercase letter.";
    else if (!/[0-9]/.test(form.password))
      errors.password = "Password must include a number.";
    else if (!/[^A-Za-z0-9]/.test(form.password))
      errors.password = "Password must include a special character.";
    if (!form.confirmPassword)
      errors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    return errors;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = v1();
    if (Object.keys(errors).length > 0) {
      setFe(errors);
      setError("Please fix the errors below.");
      return;
    }
    setFe({});
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = v2();
    if (Object.keys(errors).length > 0) {
      setFe(errors);
      setError("Please fix the errors below.");
      return;
    }
    setFe({});
    setError("");
    try {
      await register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || "",
        password: form.password,
        address: form.address,
        gender: form.gender as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: getDobString(),
      });
      toast.success("Account created! Please sign in.");
      navigate("/auth/login");
    } catch (err: unknown) {
      const ax = err as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const status = ax?.response?.status;
      const data = ax?.response?.data;
      if (status === 400 && data?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data.errors).forEach(([f, ms]) => {
          fieldErrors[f] = Array.isArray(ms) ? ms[0] : String(ms);
        });
        setFe(fieldErrors);
        setError("Please fix the errors below.");
        return;
      }
      if (status === 409) {
        const message = data?.message || "User already exists";
        const lower = message.toLowerCase();
        if (lower.includes("email")) setFe({ email: message });
        else if (lower.includes("username")) setFe({ username: message });
        else if (lower.includes("phone")) setFe({ phone: message });
        else setError(message);
        return;
      }
      setError(data?.message || "Registration failed. Please try again.");
    }
  };

  const pwScore =
    form.password.length === 0
      ? -1
      : form.password.length < 6
        ? 0
        : form.password.length < 10
          ? 1
          : 2;
  const pwLabel = pwScore <= 0 ? "Weak" : pwScore === 1 ? "Fair" : "Strong";
  const pwColor = pwScore <= 0 ? "var(--destructive)" : pwScore === 1 ? "var(--warning-text)" : "var(--primary)";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .rp-shell {
          height: 100vh;
          height: 100dvh;
          display: flex;
          overflow: hidden;
          font-family: var(--font-body);
          background: var(--background);
        }

        /* ============================================================
           LEFT — Welcome panel (desktop only)
           ============================================================ */
        .rp-welcome {
          display: none;
          position: relative;
          width: 44%;
          height: 100%;
          padding: 40px 40px;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background: linear-gradient(160deg, var(--brand-600, var(--primary)) 0%, var(--brand-700, var(--primary-hover)) 65%, var(--brand-800, var(--primary-pressed)) 100%);
          color: #fff;
          transition: background 0.4s ease;
        }
        @media (min-width: 1024px) {
          .rp-welcome { display: flex; }
        }
        /* Dark mode: swap the vivid daytime gradient for the site's night-atelier glow */
        .dark .rp-welcome {
          background: linear-gradient(165deg, var(--bg-1) 0%, var(--bg-2) 55%, var(--bg-3) 100%);
          border-right: 1px solid var(--border-light);
          box-shadow: inset -1px 0 0 rgba(140,123,255,0.06);
        }
        .rp-welcome::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 22px 22px;
          opacity: 0.5;
          pointer-events: none;
        }
        .rp-welcome::after {
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
        .dark .rp-welcome::after {
          background: radial-gradient(circle, rgba(140,123,255,0.32) 0%, transparent 70%);
        }
        /* Multi-point ambient glow — only lit up at night */
        .rp-atmosphere {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          background:
            radial-gradient(420px 320px at 12% 18%, rgba(140,123,255,0.26), transparent 62%),
            radial-gradient(380px 320px at 88% 78%, rgba(140,123,255,0.18), transparent 62%);
        }
        .dark .rp-atmosphere { opacity: 1; }

        .rp-ring {
          position: absolute;
          bottom: -140px;
          left: -140px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.18);
          animation: rp-spin 60s linear infinite;
          pointer-events: none;
          transition: border-color 0.4s ease, filter 0.4s ease;
        }
        .rp-ring--inner {
          position: absolute;
          bottom: -70px;
          left: -70px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.14);
          animation: rp-spin-rev 46s linear infinite;
          pointer-events: none;
          transition: border-color 0.4s ease, filter 0.4s ease;
        }
        .dark .rp-ring {
          border-color: rgba(140,123,255,0.38);
          filter: drop-shadow(0 0 22px rgba(140,123,255,0.22));
        }
        .dark .rp-ring--inner {
          border-color: rgba(140,123,255,0.3);
          filter: drop-shadow(0 0 16px rgba(140,123,255,0.18));
        }
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        @keyframes rp-spin-rev { to { transform: rotate(-360deg); } }

        .rp-welcome-content { position: relative; z-index: 1; }

        .rp-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 36px; }
        .rp-logo-mark {
          width: 42px; height: 42px; border-radius: 14px;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.28);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .dark .rp-logo-mark {
          background: rgba(140,123,255,0.16);
          border-color: rgba(140,123,255,0.4);
          box-shadow: 0 0 22px rgba(140,123,255,0.25);
        }
        .rp-logo-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.4rem; letter-spacing: -0.01em; }

        .rp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.75); margin-bottom: 18px;
        }
        .rp-eyebrow-dash {
          width: 22px; height: 0; border-bottom: 2px dashed rgba(255,255,255,0.55);
          transition: border-color 0.4s ease;
        }
        .dark .rp-eyebrow-dash { border-bottom-color: rgba(140,123,255,0.65); }

        .rp-welcome-title {
          font-family: var(--font-heading);
          font-size: clamp(1.6rem, 2.2vw, 2.25rem);
          font-weight: 700; line-height: 1.18; letter-spacing: -0.02em;
          max-width: 420px; margin-bottom: 12px;
        }
        .rp-welcome-sub {
          font-size: 0.875rem; line-height: 1.6; color: rgba(255,255,255,0.78);
          max-width: 380px; margin-bottom: 28px;
        }

        /* Step progress echoed on the welcome panel — “vạch chỉ” 2 chấm */
        .rp-welcome-progress {
          display: flex; align-items: center; gap: 8px; margin-bottom: 28px; max-width: 300px;
        }
        .rp-welcome-dots { display: flex; gap: 6px; }
        .rp-welcome-dots span {
          width: 26px; height: 6px; border-radius: 999px;
          background: rgba(255,255,255,0.22);
          transition: all 0.35s var(--ease-out);
        }
        .dark .rp-welcome-dots span { background: rgba(140,123,255,0.25); }
        .rp-welcome-dots span.is-done {
          background: #fff;
          box-shadow: 0 0 10px rgba(140,123,255,0.5);
        }
        .rp-welcome-progress-label {
          font-size: 0.75rem; color: rgba(255,255,255,0.7); white-space: nowrap; font-weight: 600;
        }

        .rp-welcome-features { display: flex; flex-direction: column; gap: 12px; }
        .rp-welcome-feature { display: flex; align-items: flex-start; gap: 14px; }
        .rp-welcome-feature-icon {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .dark .rp-welcome-feature-icon {
          background: rgba(140,123,255,0.14);
          border-color: rgba(140,123,255,0.32);
          box-shadow: 0 0 14px rgba(140,123,255,0.15);
        }
        .rp-welcome-feature-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 2px; }
        .rp-welcome-feature-desc { font-size: 0.8125rem; color: rgba(255,255,255,0.65); line-height: 1.5; }

        .rp-quote {
          position: relative; z-index: 1; padding-top: 16px;
          border-top: 1px dashed rgba(255,255,255,0.22);
          transition: border-color 0.4s ease;
        }
        .dark .rp-quote { border-top-color: rgba(140,123,255,0.32); }
        .rp-quote-text { font-family: var(--font-script); font-size: 1.5rem; line-height: 1.4; color: #fff; margin-bottom: 6px; }
        .rp-quote-by { font-size: 0.75rem; color: rgba(255,255,255,0.6); letter-spacing: 0.04em; }

        /* ============================================================
           RIGHT — Form side
           ============================================================ */
        .rp-form-side {
          position: relative;
          flex: 1;
          min-width: 0;
          display: flex;
          overflow-y: auto;
          padding: 16px;
        }
        .rp-card {
          margin: auto;
          width: min(100%, 460px);
          background: var(--dropdown-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-3xl);
          box-shadow: var(--shadow-float);
          padding: 28px 32px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .rp-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background-image: repeating-linear-gradient(90deg, var(--primary) 0 10px, transparent 10px 18px);
          opacity: 0.85;
        }
        .rp-mobile-brand {
          display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;
        }
        .rp-mobile-brand-mark {
          width: 34px; height: 34px; border-radius: 11px; background: var(--cta-gradient); color: #fff;
          font-family: var(--font-heading); font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .rp-mobile-brand-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; color: var(--foreground); }
        @media (min-width: 1024px) { .rp-mobile-brand { display: none; } }

        .rp-subbtn {
          width: 100%;
          height: 48px;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--cta-gradient);
          color: var(--primary-foreground);
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-body);
          transition: all 0.3s var(--ease-out);
          box-shadow: var(--cta-shadow);
          position: relative;
          overflow: hidden;
        }
        .rp-subbtn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .rp-subbtn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--cta-shadow-hover);
        }
        .rp-subbtn:hover::before { opacity: 1; }
        .rp-subbtn:active:not(:disabled) { transform: scale(0.97); }
        .rp-subbtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-back {
          flex: 1;
          height: 48px;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--primary);
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary);
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.3s var(--ease-out);
        }
        .rp-back:hover {
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          transform: translateY(-1px);
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .rp-ring, .rp-ring--inner { animation: none; }
        }

        /* ── Viewport thấp: nhồi nhẹ để vừa khít, không phải cuộn ngoài ── */
        @media (max-height: 800px) {
          .rp-logo { margin-bottom: 24px; }
          .rp-eyebrow { margin-bottom: 14px; }
          .rp-welcome-features { gap: 10px; }
          .rp-welcome-feature-icon { width: 30px; height: 30px; }
          .rp-welcome-progress { margin-bottom: 20px; }
          .rp-quote { padding-top: 14px; }
          .rp-card { padding: 22px 24px; }
        }
        @media (max-height: 640px) {
          .rp-welcome-title { font-size: clamp(1.45rem, 4vw, 1.8rem); margin-bottom: 8px; }
          .rp-welcome-sub { margin-bottom: 16px; }
          .rp-quote { display: none; }
        }
      /* ============================================================
           DESIGN v7 — Register form: field/input, segmented, select,
           steps, error banner, pw strength, divider — dark-aware
           ============================================================ */

        /* ── Field ── */
        .rp-field { margin-bottom: 2px; }
        .rp-field-label {
          display: block; font-size: 12.5px; font-weight: 600;
          color: var(--foreground); margin-bottom: 5px;
        }
        .rp-field-label .rp-opt {
          font-size: 11px; font-weight: 400; color: var(--foreground-muted); margin-left: 4px;
        }
        .rp-field-label .rp-req { color: var(--destructive); margin-left: 2px; }
        .rp-field-wrap { position: relative; display: flex; align-items: center; }
        .rp-field-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: var(--foreground-muted); opacity: .6; pointer-events: none;
          transition: color .2s ease, opacity .2s ease;
        }
        .rp-field-wrap:hover .rp-field-icon { color: var(--foreground); opacity: .8; }
        .rp-field-wrap.rp-focused .rp-field-icon { color: var(--primary); opacity: 1; }
        .rp-field-wrap.rp-error .rp-field-icon { color: var(--destructive); opacity: 1; }
        .rp-input {
          width: 100%; height: 46px; padding: 0 14px 0 42px;
          border: 1.5px solid var(--border); border-radius: var(--radius-lg);
          font-size: 14px; background: var(--input-bg); color: var(--foreground);
          outline: none; font-family: var(--font-body); box-sizing: border-box;
          transition: border-color .25s var(--ease-out), box-shadow .25s var(--ease-out);
        }
        .rp-input-right { padding-right: 44px; }
        .rp-input::placeholder { color: var(--foreground-muted); opacity: .45; }
        .rp-field-wrap:hover .rp-input:not(:focus) {
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
        }
        .rp-field-wrap .rp-input:focus,
        .rp-field-wrap.rp-focused .rp-input {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
        }
        .rp-field-wrap.rp-error .rp-input,
        .rp-field-wrap.rp-error .rp-input:focus {
          border-color: var(--destructive);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--destructive) 15%, transparent);
        }
        .rp-err-msg { font-size: 11px; color: var(--destructive); margin-top: 4px; padding-left: 2px; }
        .rp-eye {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: var(--foreground-muted); display: flex; align-items: center; border-radius: 6px;
          transition: all .2s ease;
        }
        .rp-eye:hover { color: var(--foreground); background: var(--chip-bg); }

      /* ── Segmented control (Gender) ── */
        .rp-seg-label {
          display: block; font-size: 12.5px; font-weight: 600;
          color: var(--foreground); margin-bottom: 8px;
        }
        .rp-seg { display: flex; gap: 8px; }
        .rp-seg-btn {
          flex: 1; height: 44px; border-radius: var(--radius-md);
          border: 1.5px solid var(--border); background: transparent;
          color: var(--foreground-muted); font-size: 14px; font-weight: 500;
          cursor: pointer; font-family: var(--font-body);
          transition: all .2s ease;
        }
        .rp-seg-btn:hover {
          border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
          color: var(--foreground); transform: translateY(-1px);
        }
        .rp-seg-btn.is-active {
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 10%, transparent);
          color: var(--primary); font-weight: 600;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 8%, transparent);
        }

        /* ── Select (DOB) ── */
        .rp-select {
          flex: 1; height: 46px; padding: 0 12px;
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          font-size: 14px; background: var(--input-bg); color: var(--foreground);
          font-family: var(--font-body); cursor: pointer; outline: none;
          appearance: none; -webkit-appearance: none;
          transition: all .25s ease;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
        }
        .rp-select.rp-empty { color: var(--foreground-muted); }
        .rp-select:hover { border-color: color-mix(in srgb, var(--primary) 45%, var(--border)); }
        .rp-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
        }
        .rp-select.rp-select-err { border-color: var(--destructive); }

        /* ── Steps (form side) ── */
        .rp-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
        .rp-steps-dots { display: flex; gap: 6px; flex: 1; }
        .rp-steps-dots span {
          width: 28px; height: 6px; border-radius: 999px;
          background: var(--border); transition: all .35s var(--ease-out);
        }
        .rp-steps-dots span.is-done {
          background: var(--primary);
          box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 40%, transparent);
        }
        .rp-steps-label {
          font-size: 12px; color: var(--foreground-muted); font-weight: 500;
          white-space: nowrap; margin-left: 8px;
        }

        /* ── Form header ── */
        .rp-form-header { margin-bottom: 28px; text-align: center; }
        .rp-form-eyebrow {
          font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 12px;
          display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: .04em;
        }
        .rp-form-title {
          font-family: var(--font-heading); font-size: 28px; font-weight: 700;
          color: var(--foreground); margin: 0 0 6px; line-height: 1.1; letter-spacing: -.025em;
        }
        .rp-form-sub { font-size: 14px; color: var(--foreground-muted); margin: 0; line-height: 1.6; }

      /* ── Error banner / pw strength / divider / footer ── */
        .rp-error-banner {
          display: flex; align-items: flex-start; gap: 8px;
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
          border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px;
          font-size: 13px; color: var(--destructive);
        }
        .pw-bars { display: flex; gap: 4px; margin-top: 6px; }
        .pw-bar { height: 3px; flex: 1; border-radius: 2px; transition: background .25s ease; }
        .rp-divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0 12px;
          color: var(--foreground-muted);
        }
        .rp-divider::before, .rp-divider::after {
          content: ''; flex: 1; height: 1px;
          background: repeating-linear-gradient(90deg, var(--border) 0 4px, transparent 4px 9px);
        }
        .rp-divider-text { font-size: 13px; white-space: nowrap; font-weight: 500; }
        .rp-signin-foot { text-align: center; font-size: 13.5px; color: var(--foreground-muted); margin: 0; }
        .rp-signin-foot a {
          color: var(--primary); font-weight: 600; text-decoration: none;
          transition: color .2s ease;
        }
        .rp-signin-foot a:hover { color: var(--link-hover); text-decoration: underline; }

        /* ── Compact viewport: form co nhịp nhẹ ── */
        @media (max-height: 800px) {
          .rp-steps { margin-bottom: 20px; }
          .rp-form-header { margin-bottom: 20px; }
        }
      `}</style>

      <div className="rp-shell">
        {/* ── Left: welcome panel (lg and up) ── */}
        <aside className="rp-welcome">
          <span className="rp-atmosphere" aria-hidden="true" />
          <span className="rp-ring" aria-hidden="true" />
          <span className="rp-ring--inner" aria-hidden="true" />

          <div className="rp-welcome-content">
            <div className="rp-logo">
              <span className="rp-logo-mark">L</span>
              <span className="rp-logo-name">Len&amp;em</span>
            </div>

            <div className="rp-eyebrow">
              <span className="rp-eyebrow-dash" />
              Bắt đầu hành trình
            </div>
            <h1 className="rp-welcome-title">
              Tham gia cộng đồng yêu len tại Len&amp;Em
            </h1>
            <p className="rp-welcome-sub">
              Chỉ mất một phút để tạo tài khoản — lưu thiết kế yêu thích, theo dõi
              đơn kit và nhận gợi ý được chọn riêng cho gu của bạn.
            </p>

            <div className="rp-welcome-progress">
              <div className="rp-welcome-dots">
                <span className={step === 1 ? "is-done" : ""} />
                <span className={step === 2 ? "is-done" : ""} />
              </div>
              <span className="rp-welcome-progress-label">Bước {step}/2</span>
            </div>

            <div className="rp-welcome-features">
              {welcomeFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <div className="rp-welcome-feature" key={f.title}>
                    <span className="rp-welcome-feature-icon">
                      <Icon size={17} />
                    </span>
                    <div>
                      <div className="rp-welcome-feature-title">{f.title}</div>
                      <div className="rp-welcome-feature-desc">{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rp-quote">
            <p className="rp-quote-text">“Bắt đầu từ một cuộn len, một người bạn.”</p>
            <p className="rp-quote-by">— Len&amp;Em</p>
          </div>
        </aside>

        {/* ── Right: form ── */}
        <div className="rp-form-side">
          <AnimatedBackgroundAuth />
          <div className="rp-card">
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

            <div className="rp-mobile-brand">
              <span className="rp-mobile-brand-mark">L</span>
              <span className="rp-mobile-brand-name">Len&amp;em</span>
            </div>

            {/* Steps */}
            <div className="rp-steps">
              <div className="rp-steps-dots">
                <span className="is-done" />
                <span className={step === 2 ? "is-done" : ""} />
              </div>
              <span className="rp-steps-label">Step {step} of 2</span>
            </div>

            <div style={{ width: "100%" }}>
              {/* Form header */}
              <div className="rp-form-header">
                <div className="rp-form-eyebrow">
                  <Sparkles size={14} />
                  {step === 1 ? "Create account" : "Set password"}
                </div>
                <h1 className="rp-form-title">
                  {step === 1 ? "Tell us about you" : "Keep your account safe"}
                </h1>
                <p className="rp-form-sub">
                  {step === 1
                    ? "We just need a few details to get you set up"
                    : "Choose a strong password you'll remember"}
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="rp-error-banner">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <form onSubmit={handleNext}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Field label="Full name" icon={UserIcon} k="fullName" placeholder="Nguyen Van A" form={form} fe={fe} upd={upd} />
                    <Field label="Username" icon={AtSign} k="username" placeholder="your_username" form={form} fe={fe} upd={upd} />
                    <Field label="Email" icon={Mail} k="email" type="email" placeholder="your@gmail.com" form={form} fe={fe} upd={upd} />
                    <Field label="Phone" icon={Phone} k="phone" type="tel" placeholder="0912 345 678" optional form={form} fe={fe} upd={upd} />
                    <Field label="Address" icon={MapPin} k="address" placeholder="123 Main Street, District 1" optional form={form} fe={fe} upd={upd} />

                    {/* Gender */}
                    <div style={{ marginBottom: 4 }}>
                      <label className="rp-seg-label">
                        Gender
                        <span className="rp-opt">(optional)</span>
                      </label>
                      <div className="rp-seg" role="group" aria-label="Gender">
                        {(["MALE","FEMALE","OTHER"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`rp-seg-btn ${form.gender === value ? "is-active" : ""}`}
                            onClick={() => { setForm((f) => ({ ...f, gender: value })); setFe((prev) => ({ ...prev, gender: "" })); setError(""); }}
                          >
                            {value.charAt(0) + value.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date of birth */}
                    <div style={{ marginBottom: 4 }}>
                      <label className="rp-seg-label">
                        Date of birth
                        <span className="rp-opt">(optional)</span>
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          value={dobMonth}
                          onChange={(e) => { setDobMonth(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                          className={`rp-select${!dobMonth ? " rp-empty" : ""}${fe.dateOfBirth ? " rp-select-err" : ""}`}
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>{(i+1).toString().padStart(2,"0")}</option>)}
                        </select>
                        <select
                          value={dobDay}
                          onChange={(e) => { setDobDay(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                          className={`rp-select${!dobDay ? " rp-empty" : ""}${fe.dateOfBirth ? " rp-select-err" : ""}`}
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={String(i+1)}>{(i+1).toString().padStart(2,"0")}</option>)}
                        </select>
                        <select
                          value={dobYear}
                          onChange={(e) => { setDobYear(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                          className={`rp-select${!dobYear ? " rp-empty" : ""}${fe.dateOfBirth ? " rp-select-err" : ""}`}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => <option key={i} value={String(new Date().getFullYear() - i)}>{new Date().getFullYear() - i}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <button type="submit" className="rp-subbtn">
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ marginBottom: 4 }}>
                      <label className="rp-field-label">
                        Password <span className="rp-req">*</span>
                      </label>
                      <div className={`rp-field-wrap${fe.password ? " rp-error" : ""}`}>
                        <Lock size={15} className="rp-field-icon" />
                        <input
                          type={showPw ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={form.password}
                          onChange={upd("password")}
                          required
                          autoComplete="new-password"
                          className="rp-input rp-input-right"
                        />
                        <button
                          type="button"
                          className="rp-eye"
                          onClick={() => setShowPw(!showPw)}
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {fe.password && <div className="rp-err-msg">{fe.password}</div>}
                      {form.password.length > 0 && (
                        <>
                          <div className="pw-bars">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="pw-bar"
                                style={{ background: i <= pwScore ? pwColor : "var(--border)" }}
                              />
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: pwColor, marginTop: 3, fontWeight: 500 }}>
                            {pwLabel}
                            {pwScore < 2 ? " — add numbers or uppercase" : ""}
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ marginBottom: 4 }}>
                      <label className="rp-field-label">
                        Confirm password <span className="rp-req">*</span>
                      </label>
                      <div className={`rp-field-wrap${fe.confirmPassword ? " rp-error" : ""}`}>
                        <Lock size={15} className="rp-field-icon" />
                        <input
                          type={showCp ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={form.confirmPassword}
                          onChange={upd("confirmPassword")}
                          required
                          className="rp-input rp-input-right"
                        />
                        <button
                          type="button"
                          className="rp-eye"
                          onClick={() => setShowCp(!showCp)}
                          aria-label={showCp ? "Hide password" : "Show password"}
                        >
                          {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {fe.confirmPassword && <div className="rp-err-msg">{fe.confirmPassword}</div>}
                      {form.confirmPassword.length > 0 && !fe.confirmPassword && (
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 3,
                            fontWeight: 500,
                            color:
                              form.password === form.confirmPassword
                                ? "var(--primary)"
                                : "var(--foreground-muted)",
                          }}
                        >
                          {form.password === form.confirmPassword
                            ? "✓ Passwords match"
                            : "Passwords don't match yet"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    <button type="button" className="rp-back" onClick={() => { setError(""); setStep(1); }}>← Back</button>
                    <button type="submit" className="rp-subbtn" disabled={isLoading} style={{ flex: 2 }}>
                      {isLoading ? (
                        <><Loader size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Creating…</>
                      ) : (
                        <>Create account <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>

                  <p style={{ fontSize: 11.5, color: "var(--foreground-muted)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                    By creating an account you agree to our{" "}
                    <a href="#" style={{ color: "var(--primary)", fontWeight: 500 }}>Terms</a> and{" "}
                    <a href="#" style={{ color: "var(--primary)", fontWeight: 500 }}>Privacy Policy</a>.
                  </p>
                </form>
              )}

              <div className="rp-divider">
                <span className="rp-divider-text">Already have an account?</span>
              </div>
              <p className="rp-signin-foot">
                <Link to="/auth/login">Sign in here</Link>{" "}
                and continue your journey ✦
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}