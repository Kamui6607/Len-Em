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
  Check,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "sonner";

/* ─── Design tokens (shared với LoginPage) ─── */
const T = {
  ink: "#2C2C28", // sidebar background (dark olive)
  inkHover: "#3a3a34",
  cream: "#F5F0EA", // form background
  surface: "#FFFFFF",
  sage: "#4A7C65", // accent xanh rêu
  sageLight: "rgba(74,124,101,0.12)",
  gold: "#C8974A", // accent italic "journey"
  muted: "#7A6E6B",
  mutedLight: "rgba(122,110,107,0.35)",
  border: "rgba(42,34,32,0.12)",
  borderFocus: "#4A7C65",
  errorRed: "#C0392B",
  errorBg: "rgba(192,57,43,0.07)",
  errorBorder: "rgba(192,57,43,0.25)",
  textLight: "#F0EDE6",
  textMuted: "rgba(240,237,230,0.45)",
} as const;

/* ─── Shared input style factory ─── */
const inputStyle = (hasIcon = true, hasError = false): React.CSSProperties => ({
  width: "100%",
  height: 46,
  padding: hasIcon ? "0 14px 0 42px" : "0 14px",
  border: `1.5px solid ${hasError ? T.errorRed : T.border}`,
  borderRadius: 10,
  fontSize: 14,
  background: T.surface,
  color: T.ink,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border 0.18s, box-shadow 0.18s",
});

/* ─── Field component ─── */
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
          color: T.ink,
          marginBottom: 5,
        }}
      >
        {label}
        {optional ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: T.muted,
              marginLeft: 4,
            }}
          >
            (optional)
          </span>
        ) : (
          <span style={{ color: "#C0392B", marginLeft: 2 }}>*</span>
        )}
      </label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? T.sage : T.muted,
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
                  border: `1.5px solid ${hasError ? T.errorRed : T.borderFocus}`,
                  boxShadow: hasError
                    ? `0 0 0 3px ${T.errorBg}`
                    : `0 0 0 3px ${T.sageLight}`,
                }
              : {}),
            ...extraInputStyle,
          }}
        />
        {rightSlot}
      </div>
      {hasError && (
        <div
          style={{
            fontSize: 11,
            color: T.errorRed,
            marginTop: 4,
            paddingLeft: 2,
          }}
        >
          {fe[k]}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */
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

  /* ─── Date of birth picker state ─── */
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");

  /** Combine 3 dropdown values into MM/DD/YYYY string for the API */
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
      errors.phone = "Enter a valid 10–11 digit phone number.";
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
  const pwColor = pwScore <= 0 ? "#C0392B" : pwScore === 1 ? "#C8974A" : T.sage;

  /* ─── Sidebar step indicator ─── */
  const steps = [
    { n: "01", title: "Your info", desc: "Name, email, address & more" },
    { n: "02", title: "Set password", desc: "Secure your account" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .rp-root { min-height: 100vh; display: flex; font-family: 'DM Sans', system-ui, sans-serif; }
        .rp-left { width: 42%; min-height: 100vh; background: ${T.ink}; display: flex; flex-direction: column; justify-content: space-between; padding: 44px 40px; position: relative; overflow: hidden; }
        .rp-right { flex: 1; background: ${T.cream}; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 40px 48px; overflow-y: auto; }
        .rp-left-blob1 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: ${T.sage}; opacity: 0.08; top: -80px; right: -60px; filter: blur(60px); pointer-events: none; }
        .rp-left-blob2 { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: ${T.gold}; opacity: 0.07; bottom: 20px; left: -30px; filter: blur(50px); pointer-events: none; }
        .rp-subbtn { width: 100%; height: 48px; border-radius: 100px; border: none; background: ${T.ink}; color: white; font-size: 14.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s; }
        .rp-subbtn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(44,44,40,0.22); }
        .rp-subbtn:active:not(:disabled) { transform: scale(0.97); }
        .rp-subbtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-back { flex: 1; height: 48px; border-radius: 100px; border: 1.5px solid ${T.border}; background: transparent; font-size: 14px; font-weight: 500; color: ${T.muted}; cursor: pointer; font-family: inherit; transition: border-color 0.18s, color 0.18s; }
        .rp-back:hover { border-color: ${T.ink}; color: ${T.ink}; }
        .rp-input-focus:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.sageLight} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .rp-left { display: none; }
          .rp-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="rp-root">
        {/* ── LEFT SIDEBAR ── */}
        <div className="rp-left">
          <div className="rp-left-blob1" />
          <div className="rp-left-blob2" />

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🧶
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  fontWeight: 700,
                  color: T.textLight,
                  letterSpacing: "-0.2px",
                }}
              >
                Len&amp;Em
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.textMuted,
                  fontWeight: 300,
                  marginTop: 1,
                }}
              >
                your craft, your story
              </div>
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: T.sage,
                fontWeight: 500,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 20, height: 1, background: T.sage }} />
              Join our community
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 3vw, 38px)",
                fontWeight: 900,
                color: T.textLight,
                lineHeight: 1.12,
                marginBottom: 14,
              }}
            >
              Start your
              <br />
              crafting
              <br />
              <em style={{ fontStyle: "italic", color: T.gold }}>journey</em>
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: T.textMuted,
                lineHeight: 1.75,
                fontWeight: 300,
                maxWidth: 260,
                marginBottom: 36,
              }}
            >
              Create your account in two simple steps and unlock a world of cozy
              crochet.
            </p>

            {/* Step indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map((s, i) => {
                const isActive = step === i + 1;
                const isDone = step > i + 1;
                return (
                  <div
                    key={s.n}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: isDone
                            ? T.sage
                            : isActive
                              ? T.sage
                              : "transparent",
                          border: `2px solid ${isActive || isDone ? T.sage : "rgba(240,237,230,0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            isActive || isDone
                              ? "white"
                              : "rgba(240,237,230,0.3)",
                        }}
                      >
                        {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            height: 32,
                            background: isDone
                              ? T.sage
                              : "rgba(240,237,230,0.1)",
                            margin: "3px 0",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        paddingTop: 2,
                        paddingBottom: i < steps.length - 1 ? 0 : 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isActive
                            ? T.textLight
                            : isDone
                              ? T.sage
                              : "rgba(240,237,230,0.4)",
                        }}
                      >
                        Step {s.n} — {s.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: isActive
                            ? "rgba(240,237,230,0.55)"
                            : "rgba(240,237,230,0.25)",
                          fontWeight: 300,
                          marginTop: 1,
                        }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            {[
              "Free to join, no credit card needed",
              "Your data is safe & never sold",
              "Cancel or delete account anytime",
            ].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(74,124,101,0.25)",
                    border: "1px solid rgba(74,124,101,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={10} color={T.sage} strokeWidth={3} />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(240,237,230,0.5)",
                    fontWeight: 300,
                  }}
                >
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="rp-right">
          {/* Progress bar */}
          <div style={{ width: "100%", maxWidth: 440, marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: T.sage,
                  transition: "background 0.3s",
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: step === 2 ? T.sage : "rgba(42,34,32,0.12)",
                  transition: "background 0.3s",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: T.muted,
                  whiteSpace: "nowrap",
                  marginLeft: 8,
                }}
              >
                Step {step} of 2
              </span>
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: 440 }}>
            {/* Form header */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.sage,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                + {step === 1 ? "Create account" : "Set password"}
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 30,
                  fontWeight: 900,
                  color: T.ink,
                  margin: "0 0 6px",
                  lineHeight: 1.1,
                }}
              >
                {step === 1 ? "Tell us about you" : "Keep your account safe"}
              </h1>
              <p
                style={{
                  fontSize: 13.5,
                  color: T.muted,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {step === 1
                  ? "We just need a few details to get you set up"
                  : "Choose a strong password you'll remember"}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 9,
                  background: T.errorBg,
                  border: `1.5px solid ${T.errorBorder}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: T.errorRed,
                }}
              >
                <AlertCircle
                  size={15}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleNext}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <Field
                    label="Full name"
                    icon={UserIcon}
                    k="fullName"
                    placeholder="Nguyen Van A"
                    form={form}
                    fe={fe}
                    upd={upd}
                  />
                  <Field
                    label="Username"
                    icon={AtSign}
                    k="username"
                    placeholder="your_username"
                    form={form}
                    fe={fe}
                    upd={upd}
                  />
                  <Field
                    label="Email"
                    icon={Mail}
                    k="email"
                    type="email"
                    placeholder="you@example.com"
                    form={form}
                    fe={fe}
                    upd={upd}
                  />
                  <Field
                    label="Phone"
                    icon={Phone}
                    k="phone"
                    type="tel"
                    placeholder="0912 345 678"
                    optional
                    form={form}
                    fe={fe}
                    upd={upd}
                  />
                  <Field
                    label="Address"
                    icon={MapPin}
                    k="address"
                    placeholder="123 Main Street, District 1, Ho Chi Minh City"
                    optional
                    form={form}
                    fe={fe}
                    upd={upd}
                  />

                  {/* Gender — custom radio buttons */}
                  <div style={{ marginBottom: 4 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: T.ink,
                        marginBottom: 8,
                      }}
                    >
                      Gender
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: T.muted,
                          marginLeft: 4,
                        }}
                      >
                        (optional)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(
                        [
                          { value: "MALE", label: "Male" },
                          { value: "FEMALE", label: "Female" },
                          { value: "OTHER", label: "Other" },
                        ] as const
                      ).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, gender: value }));
                            setFe((prev) => ({ ...prev, gender: "" }));
                            setError("");
                          }}
                          style={{
                            flex: 1,
                            height: 46,
                            borderRadius: 10,
                            border: `1.5px solid ${
                              form.gender === value ? T.sage : T.border
                            }`,
                            background:
                              form.gender === value ? T.sageLight : T.surface,
                            color: form.gender === value ? T.sage : T.muted,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.18s",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {fe.gender && (
                      <div
                        style={{
                          fontSize: 11,
                          color: T.errorRed,
                          marginTop: 4,
                          paddingLeft: 2,
                        }}
                      >
                        {fe.gender}
                      </div>
                    )}
                  </div>

                  {/* Date of Birth — 3 dropdowns */}
                  <div style={{ marginBottom: 4 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: T.ink,
                        marginBottom: 8,
                      }}
                    >
                      Date of birth
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: T.muted,
                          marginLeft: 4,
                        }}
                      >
                        (optional)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={dobMonth}
                        onChange={(e) => {
                          setDobMonth(e.target.value);
                          setFe((prev) => ({ ...prev, dateOfBirth: "" }));
                          setError("");
                        }}
                        style={{
                          flex: 1,
                          height: 46,
                          padding: "0 10px",
                          border: `1.5px solid ${fe.dateOfBirth ? T.errorRed : T.border}`,
                          borderRadius: 10,
                          fontSize: 14,
                          background: T.surface,
                          color: dobMonth ? T.ink : T.muted,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = String(i + 1);
                          return (
                            <option key={m} value={m}>
                              {m.padStart(2, "0")}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        value={dobDay}
                        onChange={(e) => {
                          setDobDay(e.target.value);
                          setFe((prev) => ({ ...prev, dateOfBirth: "" }));
                          setError("");
                        }}
                        style={{
                          flex: 1,
                          height: 46,
                          padding: "0 10px",
                          border: `1.5px solid ${fe.dateOfBirth ? T.errorRed : T.border}`,
                          borderRadius: 10,
                          fontSize: 14,
                          background: T.surface,
                          color: dobDay ? T.ink : T.muted,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => {
                          const d = String(i + 1);
                          return (
                            <option key={d} value={d}>
                              {d.padStart(2, "0")}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        value={dobYear}
                        onChange={(e) => {
                          setDobYear(e.target.value);
                          setFe((prev) => ({ ...prev, dateOfBirth: "" }));
                          setError("");
                        }}
                        style={{
                          flex: 1,
                          height: 46,
                          padding: "0 10px",
                          border: `1.5px solid ${fe.dateOfBirth ? T.errorRed : T.border}`,
                          borderRadius: 10,
                          fontSize: 14,
                          background: T.surface,
                          color: dobYear ? T.ink : T.muted,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const y = String(new Date().getFullYear() - i);
                          return (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {fe.dateOfBirth && (
                      <div
                        style={{
                          fontSize: 11,
                          color: T.errorRed,
                          marginTop: 4,
                          paddingLeft: 2,
                        }}
                      >
                        {fe.dateOfBirth}
                      </div>
                    )}
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
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {/* Password */}
                  <div style={{ marginBottom: 4 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: T.ink,
                        marginBottom: 5,
                      }}
                    >
                      Password <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        size={15}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: T.muted,
                          opacity: 0.6,
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={upd("password")}
                        required
                        autoComplete="new-password"
                        className="rp-input-focus"
                        style={{
                          ...inputStyle(true, !!fe.password),
                          paddingRight: 44,
                          width: "100%",
                          borderColor: fe.password ? T.errorRed : T.border,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: T.muted,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fe.password && (
                      <div
                        style={{
                          fontSize: 11,
                          color: T.errorRed,
                          marginTop: 4,
                          paddingLeft: 2,
                        }}
                      >
                        {fe.password}
                      </div>
                    )}
                    {form.password.length > 0 && (
                      <>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                height: 3,
                                flex: 1,
                                borderRadius: 2,
                                background: i <= pwScore ? pwColor : T.border,
                                transition: "background 0.25s",
                              }}
                            />
                          ))}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: pwColor,
                            marginTop: 3,
                            fontWeight: 500,
                          }}
                        >
                          {pwLabel}
                          {pwScore < 2 ? " — add numbers or uppercase" : ""}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div style={{ marginBottom: 4 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: T.ink,
                        marginBottom: 5,
                      }}
                    >
                      Confirm password{" "}
                      <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        size={15}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: T.muted,
                          opacity: 0.6,
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        type={showCp ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={upd("confirmPassword")}
                        required
                        className="rp-input-focus"
                        style={{
                          ...inputStyle(true, !!fe.confirmPassword),
                          paddingRight: 44,
                          width: "100%",
                          borderColor: fe.confirmPassword
                            ? T.errorRed
                            : T.border,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCp(!showCp)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: T.muted,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fe.confirmPassword && (
                      <div
                        style={{
                          fontSize: 11,
                          color: T.errorRed,
                          marginTop: 4,
                          paddingLeft: 2,
                        }}
                      >
                        {fe.confirmPassword}
                      </div>
                    )}
                    {form.confirmPassword.length > 0 && !fe.confirmPassword && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 3,
                          fontWeight: 500,
                          color:
                            form.password === form.confirmPassword
                              ? T.sage
                              : T.muted,
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
                  <button
                    type="button"
                    className="rp-back"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="rp-subbtn"
                    disabled={isLoading}
                    style={{ flex: 2 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader
                          size={16}
                          style={{ animation: "spin 0.8s linear infinite" }}
                        />{" "}
                        Creating…
                      </>
                    ) : (
                      <>
                        Create account <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

                <p
                  style={{
                    fontSize: 11.5,
                    color: T.muted,
                    textAlign: "center",
                    marginTop: 16,
                    lineHeight: 1.6,
                  }}
                >
                  By creating an account you agree to our{" "}
                  <a href="#" style={{ color: T.ink, fontWeight: 500 }}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" style={{ color: T.ink, fontWeight: 500 }}>
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            )}

            {/* Sign in link */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "24px 0 12px",
              }}
            >
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span
                style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}
              >
                Already have an account?
              </span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 13.5,
                color: T.muted,
                margin: 0,
              }}
            >
              <Link
                to="/auth/login"
                style={{
                  color: T.sage,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Sign in here
              </Link>{" "}
              and continue your journey +
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
