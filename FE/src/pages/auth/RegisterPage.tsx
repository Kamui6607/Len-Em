import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Phone,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /* Basic client-side validation before hitting API */
  const validateStep1 = () => {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (!form.username.trim()) return "Please choose a username.";
    if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username))
      return "Username must be 3+ characters (letters, numbers, underscores only).";
    if (!form.email.includes("@")) return "Please enter a valid email.";
    return "";
  };

  const validateStep2 = () => {
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");

    try {
      await register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      const { user } = useAuthStore.getState();
      if (!user || !user.roleId) navigate("/");
      else if (user.roleId === "admin") navigate("/admin");
      else if (user.roleId === "staff") navigate("/staff");
      else navigate("/shop");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError?.response?.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --rose:     #F2A7B2;
          --blush:    #F9DDE2;
          --sage:     #A8C5B5;
          --sage-d:   #6FA08A;
          --lavender: #C4B5E0;
          --cream:    #FDF8F2;
          --ink:      #2A2220;
          --muted:    #7A6E6B;
          --surface:  #FFFFFF;
          --bdr:      rgba(42,34,32,0.10);
        }

        .reg-root {
          min-height: 100vh;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .reg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .rb-rose     { width: 420px; height: 420px; background: var(--blush); opacity: 0.55; top: -80px; right: -60px; animation: bm1 20s ease-in-out infinite; }
        .rb-lavender { width: 280px; height: 280px; background: var(--lavender); opacity: 0.22; bottom: -40px; left: 5%; animation: bm2 25s ease-in-out infinite; }
        .rb-sage     { width: 180px; height: 180px; background: var(--sage); opacity: 0.18; top: 40%; left: 38%; animation: bm3 18s ease-in-out infinite; }

        @keyframes bm1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,25px)} }
        @keyframes bm2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes bm3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-15px,20px) scale(1.1)} }

        .reg-mesh {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(242,167,178,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,167,178,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        /* ── Left brand panel ── */
        .reg-left {
          flex: 0 0 42%;
          background: linear-gradient(160deg, #2A2220 60%, #1a2e26 100%);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 40px;
          position: relative; overflow: hidden; z-index: 1;
          animation: panelIn 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes panelIn { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }

        .rlib { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
        .rlib-1 { width: 320px; height: 320px; background: var(--sage); opacity: 0.10; top: -60px; right: -80px; }
        .rlib-2 { width: 200px; height: 200px; background: var(--lavender); opacity: 0.09; bottom: 20px; left: -40px; }
        .rlib-3 { width: 150px; height: 150px; background: var(--rose); opacity: 0.08; top: 45%; left: 50%; }

        .left-logo {
          display: flex; align-items: center; gap: 12px;
          position: relative; z-index: 1; text-decoration: none;
        }
        .left-logo-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center; font-size: 22px;
          animation: wiggle 4s ease-in-out infinite;
        }
        @keyframes wiggle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        .left-logo-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--cream); letter-spacing: -0.3px; }
        .left-logo-sub { font-size: 11px; color: rgba(253,248,242,0.4); margin-top: 1px; font-weight: 300; }

        .left-mid {
          position: relative; z-index: 1;
          flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0;
        }
        .left-eyebrow {
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--sage); font-weight: 500; margin-bottom: 14px;
          display: flex; align-items: center; gap: 6px;
        }
        .left-eyebrow::before { content:''; display:inline-block; width:20px; height:1px; background:var(--sage); }
        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px,3.2vw,36px);
          font-weight: 900; color: var(--cream); line-height: 1.15; margin-bottom: 16px;
        }
        .left-headline em { font-style: italic; color: var(--sage); }
        .left-body { font-size: 13.5px; color: rgba(253,248,242,0.5); line-height: 1.75; font-weight: 300; max-width: 260px; }

        .left-steps { display: flex; flex-direction: column; gap: 0; margin-top: 30px; }
        .lstep {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 12px 0;
          border-left: 1px solid rgba(255,255,255,0.07);
          padding-left: 16px; margin-left: 11px;
          position: relative;
        }
        .lstep::before {
          content: '';
          position: absolute; left: -6px; top: 16px;
          width: 11px; height: 11px; border-radius: 50%;
          background: rgba(168,197,181,0.35);
          border: 2px solid var(--sage);
          transition: background 0.3s;
        }
        .lstep.active::before { background: var(--sage); }
        .lstep:last-child { border-left-color: transparent; }
        .lstep-num { font-size: 10px; color: var(--sage); font-weight: 700; letter-spacing: 0.1em; margin-top: 1px; }
        .lstep-label { font-size: 12.5px; color: rgba(253,248,242,0.55); font-weight: 400; line-height: 1.5; }
        .lstep.active .lstep-label { color: rgba(253,248,242,0.85); }

        .left-footer { position: relative; z-index: 1; }
        .reg-guarantee {
          background: rgba(168,197,181,0.08);
          border: 1px solid rgba(168,197,181,0.15);
          border-radius: 16px; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .guarantee-item { display: flex; align-items: center; gap: 9px; font-size: 12px; color: rgba(253,248,242,0.5); font-weight: 300; }
        .g-check {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(168,197,181,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 10px;
        }

        /* ── Right form panel ── */
        .reg-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 48px; position: relative; z-index: 1;
          animation: formIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @keyframes formIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .form-wrap { width: 100%; max-width: 380px; }

        /* Step indicator */
        .step-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 26px; }
        .step-pill {
          height: 4px; border-radius: 100px; flex: 1;
          background: rgba(42,34,32,0.1);
          transition: background 0.4s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden; position: relative;
        }
        .step-pill.done { background: var(--sage-d); }
        .step-pill.active { background: rgba(42,34,32,0.1); }
        .step-pill.active::after {
          content: '';
          position: absolute; inset: 0;
          background: var(--sage-d);
          animation: fillPill 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fillPill { from{width:0} to{width:100%} }
        .step-label { font-size: 11px; color: var(--muted); white-space: nowrap; }

        .form-header { margin-bottom: 24px; }
        .form-eyebrow { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sage-d); font-weight: 500; margin-bottom: 10px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; color: var(--ink); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 6px; }
        .form-sub { font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.6; }

        /* Step animation */
        .step-fields {
          animation: stepIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes stepIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }

        .field { margin-bottom: 13px; }
        .field-label { display: block; font-size: 12px; font-weight: 500; color: var(--ink); margin-bottom: 6px; }
        .field-label span { color: var(--rose); margin-left: 2px; }
        .field-wrap { position: relative; transition: transform 0.2s; }
        .field-wrap:focus-within { transform: scale(1.01); }
        .field-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: var(--muted); pointer-events: none; transition: color 0.2s;
        }
        .field-wrap:focus-within .field-icon { color: var(--sage-d); }
        .field-input {
          width: 100%; padding: 12px 13px 12px 40px;
          background: var(--surface); color: var(--ink);
          border: 1.5px solid var(--bdr); border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: rgba(122,110,107,0.35); }
        .field-input:focus { border-color: var(--sage-d); box-shadow: 0 0 0 3px rgba(111,160,138,0.12); }
        .field-input-pr { padding-right: 44px; }
        .eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 0;
          color: var(--muted); display: flex; align-items: center; transition: color 0.2s;
        }
        .eye-btn:hover { color: var(--ink); }

        /* Password strength */
        .pw-strength { margin-top: 7px; display: flex; gap: 4px; }
        .pw-bar {
          flex: 1; height: 3px; border-radius: 100px;
          background: rgba(42,34,32,0.1);
          transition: background 0.3s;
        }
        .pw-bar.filled-weak   { background: #F2A7B2; }
        .pw-bar.filled-ok     { background: var(--butter, #F5E6A3); }
        .pw-bar.filled-strong { background: var(--sage-d); }
        .pw-hint { font-size: 11px; color: var(--muted); margin-top: 4px; }

        .err-box {
          display: flex; align-items: flex-start; gap: 8px;
          background: #FEF2F2; border: 1.5px solid #FECACA;
          border-radius: 10px; padding: 10px 13px;
          font-size: 12.5px; color: #991B1B; margin-bottom: 14px;
          animation: shake 0.3s;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

        .btn-row { display: flex; gap: 10px; margin-top: 4px; }

        .back-btn {
          padding: 13.5px 22px; border-radius: 100px;
          border: 1.5px solid var(--bdr); cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          background: transparent; color: var(--ink);
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .back-btn:hover { background: rgba(42,34,32,0.05); border-color: rgba(42,34,32,0.2); }

        .submit-btn {
          flex: 1; padding: 13.5px; border-radius: 100px; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 500;
          background: linear-gradient(135deg, #2A2220 0%, #233d33 100%);
          color: var(--cream);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(42,34,32,0.2); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .submit-btn.full { flex: none; width: 100%; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .divider-line { flex: 1; height: 1px; background: var(--bdr); }
        .divider span { font-size: 11.5px; color: var(--muted); white-space: nowrap; }

        .login-txt { text-align: center; font-size: 13px; color: var(--muted); }
        .login-txt a { color: var(--sage-d); text-decoration: none; font-weight: 500; }
        .login-txt a:hover { text-decoration: underline; }

        /* Terms note */
        .terms-note {
          font-size: 11.5px; color: var(--muted); text-align: center;
          line-height: 1.6; margin-top: 14px;
        }
        .terms-note a { color: var(--sage-d); text-decoration: none; }
        .terms-note a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .reg-left { display: none; }
          .reg-right { padding: 32px 24px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="reg-root">
        <div className="reg-blob rb-rose" />
        <div className="reg-blob rb-lavender" />
        <div className="reg-blob rb-sage" />
        <div className="reg-mesh" />

        {/* ── Left brand panel ── */}
        <div className="reg-left">
          <div className="rlib rlib-1" />
          <div className="rlib rlib-2" />
          <div className="rlib rlib-3" />

          <Link to="/" className="left-logo">
            <div className="left-logo-icon">🧶</div>
            <div>
              <div className="left-logo-name">CozyStitch</div>
              <div className="left-logo-sub">your craft, your story</div>
            </div>
          </Link>

          <div className="left-mid">
            <div className="left-eyebrow">Join our community</div>
            <div className="left-headline">
              Start your<br />
              crafting<br />
              <em>journey</em>
            </div>
            <p className="left-body">
              Create your account in two simple steps and unlock a world of cozy crochet.
            </p>

            <div className="left-steps">
              {[
                { label: "Your info — name, username & email", num: "01" },
                { label: "Set a secure password", num: "02" },
              ].map((s, i) => (
                <div key={i} className={`lstep${step === i + 1 ? " active" : ""}`}>
                  <div>
                    <div className="lstep-num">Step {s.num}</div>
                    <div className="lstep-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="left-footer">
            <div className="reg-guarantee">
              {[
                "Free to join, no credit card needed",
                "Your data is safe & never sold",
                "Cancel or delete account anytime",
              ].map((g) => (
                <div className="guarantee-item" key={g}>
                  <div className="g-check">✓</div>
                  {g}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="reg-right">
          <div className="form-wrap">

            {/* Step progress bar */}
            <div className="step-bar">
              <div className={`step-pill${step === 1 ? " active" : " done"}`} />
              <div className={`step-pill${step === 2 ? " active" : step > 2 ? " done" : ""}`} />
              <span className="step-label">Step {step} of 2</span>
            </div>

            <div className="form-header">
              <div className="form-eyebrow">
                {step === 1 ? "✦ Create account" : "✦ Almost there"}
              </div>
              <div className="form-title">
                {step === 1 ? "Tell us about you" : "Secure your account"}
              </div>
              <p className="form-sub">
                {step === 1
                  ? "We just need a few details to get you set up"
                  : "Choose a strong password to protect your account"}
              </p>
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <form onSubmit={handleNext}>
                {error && (
                  <div className="err-box">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0 }}>{error}</p>
                  </div>
                )}

                <div className="step-fields">
                  <div className="field">
                    <label className="field-label">Full name<span>*</span></label>
                    <div className="field-wrap">
                      <UserIcon size={16} className="field-icon" />
                      <input
                        type="text"
                        className="field-input"
                        placeholder="Nguyen Van A"
                        value={form.fullName}
                        onChange={set("fullName")}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Username<span>*</span></label>
                    <div className="field-wrap">
                      <span className="field-icon" style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)", top: "50%", transform: "translateY(-50%)", left: 13 }}>@</span>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="your_username"
                        value={form.username}
                        onChange={set("username")}
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Email<span>*</span></label>
                    <div className="field-wrap">
                      <Mail size={16} className="field-icon" />
                      <input
                        type="email"
                        className="field-input"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">
                      Phone <span style={{ color: "var(--muted)", fontWeight: 300, fontSize: 11 }}>(optional)</span>
                    </label>
                    <div className="field-wrap">
                      <Phone size={16} className="field-icon" />
                      <input
                        type="tel"
                        className="field-input"
                        placeholder="0912 345 678"
                        value={form.phone}
                        onChange={set("phone")}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-btn full" style={{ marginTop: 6 }}>
                  Continue <ArrowRight size={17} />
                </button>
              </form>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="err-box">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0 }}>{error}</p>
                  </div>
                )}

                <div className="step-fields">
                  <div className="field">
                    <label className="field-label">Password<span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span></label>
                    <div className="field-wrap">
                      <Lock size={16} className="field-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="field-input field-input-pr"
                        placeholder="At least 6 characters"
                        value={form.password}
                        onChange={set("password")}
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {form.password.length > 0 && (() => {
                      const len = form.password.length;
                      const hasUpper = /[A-Z]/.test(form.password);
                      const hasNum = /[0-9]/.test(form.password);
                      const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0);
                      const cls = score <= 0 ? "filled-weak" : score === 1 ? "filled-ok" : "filled-strong";
                      const label = score <= 0 ? "Weak" : score === 1 ? "Fair" : "Strong";
                      return (
                        <>
                          <div className="pw-strength">
                            {[0,1,2].map(i => <div key={i} className={`pw-bar${i <= score - 1 ? " " + cls : ""}`} />)}
                          </div>
                          <div className="pw-hint">{label} password{score < 2 ? " — add numbers or uppercase letters" : ""}</div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="field">
                    <label className="field-label">Confirm password<span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span></label>
                    <div className="field-wrap">
                      <Lock size={16} className="field-icon" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        className="field-input field-input-pr"
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                      <div className="pw-hint" style={{ color: "var(--rose)" }}>Passwords don't match yet</div>
                    )}
                    {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                      <div className="pw-hint" style={{ color: "var(--sage-d)" }}>✓ Passwords match</div>
                    )}
                  </div>
                </div>

                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button type="button" className="back-btn" onClick={() => { setError(""); setStep(1); }}>
                    ← Back
                  </button>
                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }} />
                        Creating…
                      </>
                    ) : (
                      <>Create account <ArrowRight size={17} /></>
                    )}
                  </button>
                </div>

                <p className="terms-note">
                  By creating an account you agree to our{" "}
                  <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>
              </form>
            )}

            <div className="divider">
              <div className="divider-line" />
              <span>Already have an account?</span>
              <div className="divider-line" />
            </div>

            <p className="login-txt">
              <Link to="/auth/login">Sign in here</Link> and continue your journey ✦
            </p>
          </div>
        </div>
      </div>
    </>
  );
}