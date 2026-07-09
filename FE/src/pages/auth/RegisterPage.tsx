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
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "sonner";
import { AnimatedBackgroundAuth } from "../../components/motion/AnimatedBackgroundAuth";
import { CursorEffects } from "../../components/motion/CursorEffects";
import { useTheme } from "../../app/context/ThemeContext";

const inputStyle = (hasIcon = true, hasError = false): React.CSSProperties => ({
  width: "100%",
  height: 46,
  padding: hasIcon ? "0 14px 0 42px" : "0 14px",
  border: `1.5px solid ${hasError ? "var(--destructive)" : "var(--border)"}`,
  borderRadius: "var(--radius-lg)",
  fontSize: 14,
  background: "var(--input-bg)",
  color: "var(--foreground)",
  outline: "none",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
  transition: "all 0.3s var(--ease-out)",
});

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
    <div style={{ marginBottom: 4 }}>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: 5,
        }}
      >
        {label}
        {optional ? (
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--foreground-muted)", marginLeft: 4 }}>
            (optional)
          </span>
        ) : (
          <span style={{ color: "var(--destructive)", marginLeft: 2 }}>*</span>
        )}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? "var(--primary)" : "var(--foreground-muted)",
              opacity: focused ? 1 : 0.6,
              pointerEvents: "none",
              transition: "color 0.18s",
            }}
          />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={form[k]}
          onChange={upd(k)}
          required={!optional}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputStyle(!!Icon, hasError),
            ...(rightSlot ? { paddingRight: 44 } : {}),
            ...(focused
              ? {
                  border: `1.5px solid ${hasError ? "var(--destructive)" : "var(--primary)"}`,
                  boxShadow: hasError
                    ? "0 0 0 3px color-mix(in srgb, var(--destructive) 15%, transparent)"
                    : "0 0 0 3px rgba(107,63,160,0.08)",
                }
              : {}),
            ...extraInputStyle,
          }}
        />
        {rightSlot}
      </div>
      {hasError && (
        <div style={{ fontSize: 11, color: "var(--destructive)", marginTop: 4, paddingLeft: 2 }}>
          {fe[k]}
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { isDark } = useTheme();

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
    else if (form.password.length < 6)
      errors.password = "Password must be at least 6 characters.";
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
      <AnimatedBackgroundAuth />
      <style>{`
        * { box-sizing: border-box; }
        .rp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body);
          padding: 24px;
          background: var(--background);
        }
        .rp-card {
          width: 100%;
          max-width: 460px;
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
        .rp-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--cta-gradient);
          opacity: 0.8;
        }
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
          background: rgba(107, 63, 160, 0.06);
          transform: translateY(-1px);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <CursorEffects isDark={isDark} />
      <div className="rp-root">
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

          {/* Progress bar */}
          <div style={{ width: "100%", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--primary)", transition: "background 0.3s" }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: step === 2 ? "var(--primary)" : "var(--border)", transition: "background 0.3s" }} />
              <span style={{ fontSize: 12, color: "var(--foreground-muted)", whiteSpace: "nowrap", marginLeft: 8, fontWeight: 500 }}>
                Step {step} of 2
              </span>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            {/* Form header */}
            <div style={{ marginBottom: 28, textAlign: "center" }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.04em",
              }}>
                <Sparkles size={14} />
                {step === 1 ? "Create account" : "Set password"}
              </div>
              <h1 style={{
                fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700,
                color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.025em",
              }}>
                {step === 1 ? "Tell us about you" : "Keep your account safe"}
              </h1>
              <p style={{ fontSize: 14, color: "var(--foreground-muted)", margin: 0, lineHeight: 1.6 }}>
                {step === 1
                  ? "We just need a few details to get you set up"
                  : "Choose a strong password you'll remember"}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "var(--destructive)",
              }}>
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
                  <Field label="Email" icon={Mail} k="email" type="email" placeholder="you@example.com" form={form} fe={fe} upd={upd} />
                  <Field label="Phone" icon={Phone} k="phone" type="tel" placeholder="0912 345 678" optional form={form} fe={fe} upd={upd} />
                  <Field label="Address" icon={MapPin} k="address" placeholder="123 Main Street, District 1" optional form={form} fe={fe} upd={upd} />

                  {/* Gender */}
                  <div style={{ marginBottom: 4 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
                      Gender
                      <span style={{ fontSize: 11, fontWeight: 400, color: "var(--foreground-muted)", marginLeft: 4 }}>(optional)</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["MALE","FEMALE","OTHER"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setForm((f) => ({ ...f, gender: value })); setFe((prev) => ({ ...prev, gender: "" })); setError(""); }}
                          style={{
                            flex: 1, height: 44, borderRadius: "var(--radius-md)",
                            border: `1.5px solid ${form.gender === value ? "var(--primary)" : "var(--border)"}`,
                            background: form.gender === value ? "rgba(107,63,160,0.06)" : "transparent",
                            color: form.gender === value ? "var(--primary)" : "var(--foreground-muted)",
                            fontSize: 14, fontWeight: 500, cursor: "pointer",
                            fontFamily: "var(--font-body)", transition: "all 0.18s",
                          }}
                        >
                          {value.charAt(0) + value.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date of birth */}
                  <div style={{ marginBottom: 4 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
                      Date of birth
                      <span style={{ fontSize: 11, fontWeight: 400, color: "var(--foreground-muted)", marginLeft: 4 }}>(optional)</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select value={dobMonth} onChange={(e) => { setDobMonth(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                        style={{ flex: 1, height: 46, padding: "0 10px", border: `1.5px solid ${fe.dateOfBirth ? "var(--destructive)" : "var(--border)"}`, borderRadius: "var(--radius-md)", fontSize: 14, background: "var(--input-bg)", color: dobMonth ? "var(--foreground)" : "var(--foreground-muted)", fontFamily: "var(--font-body)", cursor: "pointer", outline: "none" }}>
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>{(i+1).toString().padStart(2,"0")}</option>)}
                      </select>
                      <select value={dobDay} onChange={(e) => { setDobDay(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                        style={{ flex: 1, height: 46, padding: "0 10px", border: `1.5px solid ${fe.dateOfBirth ? "var(--destructive)" : "var(--border)"}`, borderRadius: "var(--radius-md)", fontSize: 14, background: "var(--input-bg)", color: dobDay ? "var(--foreground)" : "var(--foreground-muted)", fontFamily: "var(--font-body)", cursor: "pointer", outline: "none" }}>
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={String(i+1)}>{(i+1).toString().padStart(2,"0")}</option>)}
                      </select>
                      <select value={dobYear} onChange={(e) => { setDobYear(e.target.value); setFe((prev) => ({ ...prev, dateOfBirth: "" })); setError(""); }}
                        style={{ flex: 1, height: 46, padding: "0 10px", border: `1.5px solid ${fe.dateOfBirth ? "var(--destructive)" : "var(--border)"}`, borderRadius: "var(--radius-md)", fontSize: 14, background: "var(--input-bg)", color: dobYear ? "var(--foreground)" : "var(--foreground-muted)", fontFamily: "var(--font-body)", cursor: "pointer", outline: "none" }}>
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
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 5 }}>
                      Password <span style={{ color: "var(--destructive)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--foreground-muted)", opacity: 0.6, pointerEvents: "none" }} />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={upd("password")}
                        required
                        autoComplete="new-password"
                        style={{ ...inputStyle(true, !!fe.password), paddingRight: 44, width: "100%", borderColor: fe.password ? "var(--destructive)" : "var(--border)" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(107,63,160,0.08)"; }}
                        onBlur={(e) => { e.target.style.borderColor = fe.password ? "var(--destructive)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--foreground-muted)", display: "flex", alignItems: "center", borderRadius: 6 }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fe.password && <div style={{ fontSize: 11, color: "var(--destructive)", marginTop: 4, paddingLeft: 2 }}>{fe.password}</div>}
                    {form.password.length > 0 && (
                      <>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          {[0, 1, 2].map((i) => (
                            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= pwScore ? pwColor : "var(--border)", transition: "background 0.25s" }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: pwColor, marginTop: 3, fontWeight: 500 }}>
                          {pwLabel}{pwScore < 2 ? " — add numbers or uppercase" : ""}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--foreground)", marginBottom: 5 }}>
                      Confirm password <span style={{ color: "var(--destructive)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--foreground-muted)", opacity: 0.6, pointerEvents: "none" }} />
                      <input
                        type={showCp ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={upd("confirmPassword")}
                        required
                        style={{ ...inputStyle(true, !!fe.confirmPassword), paddingRight: 44, width: "100%", borderColor: fe.confirmPassword ? "var(--destructive)" : "var(--border)" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(107,63,160,0.08)"; }}
                        onBlur={(e) => { e.target.style.borderColor = fe.confirmPassword ? "var(--destructive)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
                      />
                      <button type="button" onClick={() => setShowCp(!showCp)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--foreground-muted)", display: "flex", alignItems: "center", borderRadius: 6 }}>
                        {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fe.confirmPassword && <div style={{ fontSize: 11, color: "var(--destructive)", marginTop: 4, paddingLeft: 2 }}>{fe.confirmPassword}</div>}
                    {form.confirmPassword.length > 0 && !fe.confirmPassword && (
                      <div style={{ fontSize: 11, marginTop: 3, fontWeight: 500, color: form.password === form.confirmPassword ? "var(--primary)" : "var(--foreground-muted)" }}>
                        {form.password === form.confirmPassword ? "✓ Passwords match" : "Passwords don't match yet"}
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

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 13, color: "var(--foreground-muted)", whiteSpace: "nowrap", fontWeight: 500 }}>
                Already have an account?
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--foreground-muted)", margin: 0 }}>
              <Link to="/auth/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                Sign in here
              </Link>{" "}
              and continue your journey ✦
            </p>
          </div>
        </div>
      </div>
    </>
  );
}