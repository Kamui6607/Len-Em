import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader as Loader2,
  User as UserIcon,
  Phone,
  AtSign,
  MapPin,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../../shared/store/auth.store";
import { toast } from "sonner";
import { parseApiError } from "../../../lib/apiError";
import { GoogleAuthButton } from "../../../shared/components/auth/GoogleAuthButton";
import { AuthBrand } from "../../../shared/components/auth/AuthBrand";
import { AuthError } from "../../../shared/components/auth/AuthError";
import { AnimatedBackgroundAuth } from "../../../shared/components/motion/AnimatedBackgroundAuth";
import "../../../styles/auth.css";
import "../../../styles/auth-fit.css";

type Step = 1 | 2 | 3;

const STEPS: { label: string; story: string; storyDesc: string }[] = [
  { label: "Account", story: "Tạo tài khoản", storyDesc: "Tên, username và email của bạn" },
  { label: "Contact", story: "Thông tin liên hệ", storyDesc: "Số điện thoại & địa chỉ nhận kit" },
  { label: "Password", story: "Đặt mật khẩu", storyDesc: "Giữ tài khoản và đơn hàng an toàn" },
];

/** Which step owns each field — used to jump back on backend errors. */
const FIELD_STEP: Record<string, Step> = {
  fullName: 1,
  username: 1,
  email: 1,
  phone: 2,
  address: 2,
  gender: 2,
  dateOfBirth: 2,
  password: 3,
  confirmPassword: 3,
};

/** Mirrors the checks in validatePassword() — shown live as a checklist. */
const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special char", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const genders = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const heads: Record<Step, { eyebrow: string; title: [string, string]; sub: string }> = {
  1: { eyebrow: "Create account", title: ["Join", "Len&Em"], sub: "Start with the basics — it takes a minute." },
  2: { eyebrow: "Nice to meet you", title: ["Where to", "ship?"], sub: "So we can deliver your orders." },
  3: { eyebrow: "Last step", title: ["Keep it", "safe"], sub: "Choose a strong password you'll remember." },
};

const swap = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
} as const;

type FormState = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  gender: string;
  dateOfBirth: string;
};

function Field({
  id,
  label,
  icon: Icon,
  k,
  type = "text",
  placeholder,
  form,
  fe,
  upd,
  optional,
  autoComplete,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  k: keyof FormState;
  type?: string;
  placeholder?: string;
  form: FormState;
  fe: Record<string, string>;
  upd: (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
  autoComplete?: string;
}) {
  const error = fe[k];
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id} className="auth-label">
          {label}
          {optional ? (
            <span className="auth-opt">(optional)</span>
          ) : (
            <span className="auth-req" aria-hidden="true">*</span>
          )}
        </label>
      </div>
      <div className="auth-input-wrap">
        <Icon size={17} className="auth-input-icon" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={form[k]}
          onChange={upd(k)}
          required={!optional}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`auth-input${error ? " is-invalid" : ""}`}
        />
      </div>
      {error && (
        <div id={`${id}-err`} className="auth-field-msg">
          {error}
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState<FormState>({
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
  const [step, setStep] = useState<Step>(1);
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");

  const getDobString = () => {
    if (!dobMonth || !dobDay || !dobYear) return "";
    return `${dobMonth.padStart(2, "0")}/${dobDay.padStart(2, "0")}/${dobYear}`;
  };

  const upd = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFe((prev) => ({ ...prev, [k]: "" }));
    setError("");
  };

  const clearDobError = () => {
    setFe((prev) => ({ ...prev, dateOfBirth: "" }));
    setError("");
  };

  /** Backend expects a bare 10-digit number: /^0[0-9]{9}$/ */
  const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, "");

  const validateAccount = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = "Please enter your full name.";
    if (!form.username.trim()) errors.username = "Please choose a username.";
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username))
      errors.username = "3+ chars: letters, numbers, underscores only.";
    if (!form.email.trim()) errors.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Please enter a valid email address.";
    return errors;
  };

  const validateContact = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.phone.trim()) errors.phone = "Please enter your phone number.";
    else if (!/^0[0-9]{9}$/.test(normalizePhone(form.phone)))
      errors.phone = "Phone must be 10 digits and start with 0 (e.g. 0912345678).";
    if (!form.address.trim()) errors.address = "Please enter your address.";
    if (form.dateOfBirth) {
      const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dobRegex.test(form.dateOfBirth)) {
        errors.dateOfBirth = "Please enter a valid date (MM/DD/YYYY).";
      }
    }
    return errors;
  };

  const validatePassword = (): Record<string, string> => {
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

  const goTo = (next: Step) => {
    setFe({});
    setError("");
    setStep(next);
  };

  const advance =
    (validate: () => Record<string, string>, next: Step) =>
    (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        setFe(errors);
        setError("Please fix the errors below.");
        return;
      }
      goTo(next);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePassword();
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
        phone: normalizePhone(form.phone),
        password: form.password,
        address: form.address,
        gender: form.gender as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: getDobString(),
      });
      toast.success("Account created! Please sign in.");
      navigate("/auth/login");
    } catch (err: unknown) {
      const { status, message, fieldErrors } = parseApiError(err);
      // Backend validation can also reject earlier-step fields (duplicate
      // username, bad phone…) — jump back to the earliest step with an error.
      const errorSteps = Object.keys(fieldErrors)
        .map((field) => FIELD_STEP[field])
        .filter(Boolean);
      setFe(fieldErrors);
      if (errorSteps.length) setStep(Math.min(...errorSteps) as Step);

      const firstField = Object.keys(fieldErrors)[0];
      if (firstField) {
        // Banner repeats the first problem so it is visible even when the
        // offending input is out of view.
        setError(fieldErrors[firstField]);
        return;
      }
      if (status === 409) {
        const lower = message.toLowerCase();
        const field = lower.includes("email")
          ? "email"
          : lower.includes("username")
            ? "username"
            : lower.includes("phone")
              ? "phone"
              : null;
        if (field) {
          setFe({ [field]: message });
          setStep(FIELD_STEP[field]);
        } else setError(message || "User already exists");
        return;
      }
      setError(message || "Registration failed. Please try again.");
    }
  };

  const passed = passwordRules.filter((r) => r.test(form.password)).length;
  const strengthColor =
    passed <= 2
      ? "var(--destructive)"
      : passed <= 4
        ? "var(--warning-text)"
        : "var(--primary)";
  const confirmMatches =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const currentYear = new Date().getFullYear();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const head = heads[step];

  const backButton = (to: Step) => (
    <button type="button" className="auth-btn-outline" onClick={() => goTo(to)}>
      <ArrowLeft size={17} />
      Back
    </button>
  );

  return (
    <div className="auth-shell auth-fit is-steps">
      <AnimatedBackgroundAuth />

      {/* ── Left: stitched story panel (lg and up, hidden on very short screens) ── */}
      <aside className="auth-story">
        <span className="auth-ring" aria-hidden="true" />

        <AuthBrand />

        <div>
          <span className="auth-eyebrow">Bắt đầu hành trình</span>
          <h1 className="auth-story-title">
            Một cuộn len, <em>thêm một người bạn</em>
          </h1>
          <div className="auth-stitch" aria-hidden="true" />
          <p className="auth-story-sub">
            Tham gia cộng đồng yêu len — lưu mẫu yêu thích, theo dõi đơn kit và
            nhận ưu đãi thành viên mới cho kit đầu tiên.
          </p>

          <ol className="auth-steps" aria-label="Các bước tạo tài khoản">
            {STEPS.map((s, i) => {
              const n = (i + 1) as Step;
              return (
                <li
                  className="auth-step"
                  key={s.label}
                  data-state={n < step ? "done" : n === step ? "current" : "todo"}
                >
                  <span className="auth-step-num">
                    {n < step ? <Check size={18} /> : n}
                  </span>
                  <div className="auth-step-card">
                    <div className="auth-feature-title">{s.story}</div>
                    <div className="auth-feature-desc">{s.storyDesc}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <figure className="auth-quote">
          <blockquote className="auth-quote-text">
            “Bắt đầu từ một cuộn len, một người bạn.”
          </blockquote>
          <figcaption className="auth-quote-by">— Len&amp;Em</figcaption>
        </figure>

        <img
          src="/mascot.png"
          alt=""
          aria-hidden="true"
          className="auth-mascot"
          draggable={false}
        />
      </aside>

      {/* ── Right: form — each step sized to fit one screen ── */}
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

        <div className={`fit-center is-wide${error ? " has-error" : ""}`}>
          <div className="auth-progress" aria-label={`Step ${step} of 3`}>
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className="auth-progress-item"
                data-active={i + 1 <= step}
              >
                {i + 1} · {s.label}
              </span>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...swap}>
              <div className="fit-head">
                <div className="min-w-0">
                  <span className="auth-eyebrow">{head.eyebrow}</span>
                  <h2 className="auth-title">
                    {head.title[0]} <em>{head.title[1]}</em>
                  </h2>
                  <div className="auth-stitch" aria-hidden="true" />
                  <p className="fit-sub">{head.sub}</p>
                </div>
                <img
                  src="/mascot.png"
                  alt=""
                  aria-hidden="true"
                  className="fit-mascot"
                  draggable={false}
                />
              </div>

              <AuthError error={error} />

              {/* ── Step 1: account ── */}
              {step === 1 && (
                <form onSubmit={advance(validateAccount, 2)} noValidate>
                  <div className="fit-grid-landscape">
                    <Field id="reg-fullname" label="Full name" icon={UserIcon} k="fullName" placeholder="Nguyen Van A" autoComplete="name" form={form} fe={fe} upd={upd} />
                    <Field id="reg-username" label="Username" icon={AtSign} k="username" placeholder="your_username" autoComplete="username" form={form} fe={fe} upd={upd} />
                  </div>
                  <Field id="reg-email" label="Email" icon={Mail} k="email" type="email" placeholder="you@gmail.com" autoComplete="email" form={form} fe={fe} upd={upd} />

                  <div className="fit-inline-actions">
                    <button type="submit" className="auth-submit">
                      Continue <ArrowRight size={18} className="auth-arrow" />
                    </button>
                    <div className="auth-divider">or sign up with</div>
                    {/* Its buttons are type="button", so they never submit this form */}
                    <GoogleAuthButton label="Sign up with Google" onError={setError} />
                  </div>
                </form>
              )}

              {/* ── Step 2: contact ── */}
              {step === 2 && (
                <form onSubmit={advance(validateContact, 3)} noValidate>
                  <div className="fit-grid-landscape">
                    <Field id="reg-phone" label="Phone" icon={Phone} k="phone" type="tel" placeholder="0912345678" autoComplete="tel" form={form} fe={fe} upd={upd} />
                    <Field id="reg-address" label="Address" icon={MapPin} k="address" placeholder="123 Main Street, District 1" autoComplete="street-address" form={form} fe={fe} upd={upd} />
                  </div>

                  <div className="fit-grid-landscape">
                    <div className="auth-field">
                      <div className="auth-label-row">
                        <span className="auth-label" id="reg-gender-label">
                          Gender<span className="auth-opt">(optional)</span>
                        </span>
                      </div>
                      <div className="auth-seg" role="group" aria-labelledby="reg-gender-label">
                        {genders.map((g) => {
                          const active = form.gender === g.value;
                          return (
                            <button
                              key={g.value}
                              type="button"
                              aria-pressed={active}
                              className="auth-seg-btn"
                              onClick={() => {
                                setForm((f) => ({ ...f, gender: g.value }));
                                setFe((prev) => ({ ...prev, gender: "" }));
                                setError("");
                              }}
                            >
                              {active && (
                                <motion.span
                                  layoutId="reg-gender-patch"
                                  className="auth-seg-patch"
                                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                />
                              )}
                              <span>{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-label-row">
                        <span className="auth-label" id="reg-dob-label">
                          Date of birth<span className="auth-opt">(optional)</span>
                        </span>
                      </div>
                      <div className="auth-dob" role="group" aria-labelledby="reg-dob-label">
                        <select
                          aria-label="Month"
                          value={dobMonth}
                          onChange={(e) => { setDobMonth(e.target.value); clearDobError(); }}
                          className={`auth-select${!dobMonth ? " is-empty" : ""}${fe.dateOfBirth ? " is-invalid" : ""}`}
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{pad(i + 1)}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Day"
                          value={dobDay}
                          onChange={(e) => { setDobDay(e.target.value); clearDobError(); }}
                          className={`auth-select${!dobDay ? " is-empty" : ""}${fe.dateOfBirth ? " is-invalid" : ""}`}
                        >
                          <option value="">DD</option>
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{pad(i + 1)}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Year"
                          value={dobYear}
                          onChange={(e) => { setDobYear(e.target.value); clearDobError(); }}
                          className={`auth-select${!dobYear ? " is-empty" : ""}${fe.dateOfBirth ? " is-invalid" : ""}`}
                        >
                          <option value="">YYYY</option>
                          {Array.from({ length: 100 }, (_, i) => (
                            <option key={i} value={String(currentYear - i)}>{currentYear - i}</option>
                          ))}
                        </select>
                      </div>
                      {fe.dateOfBirth && <div className="auth-field-msg">{fe.dateOfBirth}</div>}
                    </div>
                  </div>

                  <div className="auth-btn-row">
                    {backButton(1)}
                    <button type="submit" className="auth-submit">
                      Continue <ArrowRight size={18} className="auth-arrow" />
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 3: password ── */}
              {step === 3 && (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Hidden username helps password managers save the pair */}
                  <input type="text" name="username" autoComplete="username" value={form.username} readOnly hidden />

                  <div className="fit-grid-landscape">
                    <div className="auth-field">
                      <div className="auth-label-row">
                        <label htmlFor="reg-password" className="auth-label">
                          Password<span className="auth-req" aria-hidden="true">*</span>
                        </label>
                      </div>
                      <div className="auth-input-wrap">
                        <Lock size={17} className="auth-input-icon" />
                        <input
                          id="reg-password"
                          type={showPw ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={form.password}
                          onChange={upd("password")}
                          required
                          autoComplete="new-password"
                          aria-invalid={!!fe.password}
                          aria-describedby="reg-password-rules"
                          className={`auth-input has-toggle${fe.password ? " is-invalid" : ""}`}
                        />
                        <button
                          type="button"
                          className="auth-input-toggle"
                          onClick={() => setShowPw((v) => !v)}
                          aria-label={showPw ? "Hide password" : "Show password"}
                          aria-pressed={showPw}
                        >
                          {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {fe.password && <div className="auth-field-msg">{fe.password}</div>}
                      <div className="auth-strength" aria-hidden="true">
                        {passwordRules.map((r, i) => (
                          <span
                            key={r.label}
                            style={{ background: i < passed ? strengthColor : undefined }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-label-row">
                        <label htmlFor="reg-confirm" className="auth-label">
                          Confirm password<span className="auth-req" aria-hidden="true">*</span>
                        </label>
                      </div>
                      <div className="auth-input-wrap">
                        <Lock size={17} className="auth-input-icon" />
                        <input
                          id="reg-confirm"
                          type={showCp ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={form.confirmPassword}
                          onChange={upd("confirmPassword")}
                          required
                          autoComplete="new-password"
                          aria-invalid={!!fe.confirmPassword}
                          className={`auth-input has-toggle${fe.confirmPassword ? " is-invalid" : ""}`}
                        />
                        <button
                          type="button"
                          className="auth-input-toggle"
                          onClick={() => setShowCp((v) => !v)}
                          aria-label={showCp ? "Hide password" : "Show password"}
                          aria-pressed={showCp}
                        >
                          {showCp ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {fe.confirmPassword ? (
                        <div className="auth-field-msg">{fe.confirmPassword}</div>
                      ) : (
                        form.confirmPassword.length > 0 && (
                          <div className={`auth-field-msg ${confirmMatches ? "is-ok" : "is-muted"}`}>
                            {confirmMatches ? "✓ Passwords match" : "Passwords don't match yet"}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <ul className="auth-rules mb-3" id="reg-password-rules">
                    {passwordRules.map((r) => {
                      const ok = r.test(form.password);
                      return (
                        <li key={r.label} className="auth-rule" data-ok={ok}>
                          <span className="auth-rule-dot">
                            <Check size={10} strokeWidth={3.5} />
                          </span>
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="auth-btn-row">
                    {backButton(2)}
                    <button type="submit" className="auth-submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="auth-spin" />
                          Creating…
                        </>
                      ) : (
                        <>
                          Create account <ArrowRight size={18} className="auth-arrow" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="auth-legal">
                    By creating an account you agree to our{" "}
                    <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <p className="fit-register">
            Already have an account?
            <Link to="/auth/login">
              Sign in <ArrowRight size={14} />
            </Link>
          </p>
        </div>

        <p className="fit-foot">
          © {currentYear} Len&amp;Em · Made with yarn &amp; love
        </p>
      </main>
    </div>
  );
}
