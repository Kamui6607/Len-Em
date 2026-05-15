import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

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
      if (user?.roleId === "admin") navigate("/admin");
      else if (user?.roleId === "staff") navigate("/staff");
      else navigate(from);
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

        .login-root {
          min-height: 100vh;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .login-blob {
          position: fixed; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 0;
        }
        .lb-rose     { width: 420px; height: 420px; background: var(--blush); opacity: 0.55; top: -80px; right: -60px; animation: bm1 20s ease-in-out infinite; }
        .lb-lavender { width: 280px; height: 280px; background: var(--lavender); opacity: 0.22; bottom: -40px; left: 5%; animation: bm2 25s ease-in-out infinite; }
        .lb-sage     { width: 180px; height: 180px; background: var(--sage); opacity: 0.18; top: 40%; left: 38%; animation: bm3 18s ease-in-out infinite; }

        @keyframes bm1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,25px)} }
        @keyframes bm2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes bm3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-15px,20px) scale(1.1)} }

        .login-mesh {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(242,167,178,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,167,178,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        /* ── Left brand panel ── */
        .login-left {
          flex: 0 0 42%;
          background: var(--ink);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 40px;
          position: relative; overflow: hidden; z-index: 1;
          animation: panelIn 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes panelIn { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }

        .lib { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
        .lib-1 { width: 300px; height: 300px; background: var(--rose); opacity: 0.12; top: -60px; right: -80px; }
        .lib-2 { width: 200px; height: 200px; background: var(--lavender); opacity: 0.10; bottom: 20px; left: -40px; }

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
        .left-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--cream); letter-spacing: -0.3px;
        }
        .left-logo-sub { font-size: 11px; color: rgba(253,248,242,0.4); margin-top: 1px; font-weight: 300; }

        .left-mid {
          position: relative; z-index: 1;
          flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0;
        }
        .left-eyebrow {
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--rose); font-weight: 500; margin-bottom: 14px;
          display: flex; align-items: center; gap: 6px;
        }
        .left-eyebrow::before { content: ''; display: inline-block; width: 20px; height: 1px; background: var(--rose); }
        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3.2vw, 36px);
          font-weight: 900; color: var(--cream); line-height: 1.15; margin-bottom: 16px;
        }
        .left-headline em { font-style: italic; color: var(--rose); }
        .left-body { font-size: 13.5px; color: rgba(253,248,242,0.5); line-height: 1.75; font-weight: 300; max-width: 260px; }

        .left-features { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }
        .left-feat { display: flex; align-items: center; gap: 10px; }
        .feat-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--rose); flex-shrink: 0;
          animation: pulse 2.5s ease-in-out infinite;
        }
        .left-feat:nth-child(2) .feat-dot { animation-delay: 0.5s; }
        .left-feat:nth-child(3) .feat-dot { animation-delay: 1s; }
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        .feat-text { font-size: 12.5px; color: rgba(253,248,242,0.55); font-weight: 300; }

        .left-footer { position: relative; z-index: 1; }
        .testimonial {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px 18px;
        }
        .testimonial-text {
          font-size: 12.5px; color: rgba(253,248,242,0.6); font-weight: 300;
          line-height: 1.65; font-style: italic; margin-bottom: 12px;
        }
        .testimonial-author { display: flex; align-items: center; gap: 8px; }
        .t-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, var(--rose), var(--lavender));
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: var(--ink); flex-shrink: 0;
        }
        .t-name { font-size: 11.5px; color: rgba(253,248,242,0.45); font-weight: 500; }

        /* ── Right form panel ── */
        .login-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 48px; position: relative; z-index: 1;
          animation: formIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @keyframes formIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .form-wrap { width: 100%; max-width: 360px; }
        .form-header { margin-bottom: 28px; }
        .form-eyebrow { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--rose); font-weight: 500; margin-bottom: 10px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; color: var(--ink); letter-spacing: -0.3px; line-height: 1.1; margin-bottom: 6px; }
        .form-sub { font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.6; }

        .field { margin-bottom: 14px; }
        .field-label { display: block; font-size: 12px; font-weight: 500; color: var(--ink); margin-bottom: 6px; }
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

        .form-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .remember { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--muted); cursor: pointer; }
        .remember input { width: 14px; height: 14px; accent-color: var(--sage-d); }
        .forgot-link { font-size: 12.5px; color: var(--sage-d); text-decoration: none; font-weight: 500; }
        .forgot-link:hover { text-decoration: underline; }

        .err-box {
          display: flex; align-items: flex-start; gap: 8px;
          background: #FEF2F2; border: 1.5px solid #FECACA;
          border-radius: 10px; padding: 10px 13px;
          font-size: 12.5px; color: #991B1B; margin-bottom: 14px;
          animation: shake 0.3s;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

        .submit-btn {
          width: 100%; padding: 13.5px; border-radius: 100px; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 500;
          background: var(--ink); color: var(--cream);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(42,34,32,0.2); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .divider-line { flex: 1; height: 1px; background: var(--bdr); }
        .divider span { font-size: 11.5px; color: var(--muted); white-space: nowrap; }

        .reg-txt { text-align: center; font-size: 13px; color: var(--muted); }
        .reg-txt a { color: var(--sage-d); text-decoration: none; font-weight: 500; }
        .reg-txt a:hover { text-decoration: underline; }

        .sep { height: 1px; background: var(--bdr); margin: 18px 0; }

        .demo-box {
          background: var(--blush);
          border: 1.5px solid rgba(242,167,178,0.3);
          border-radius: 14px; padding: 12px 14px;
        }
        .demo-title {
          font-size: 11px; color: #7A2233; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 9px;
        }
        .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .demo-chip {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(242,167,178,0.25);
          border-radius: 9px; padding: 7px 10px;
          font-size: 11px; color: #7A2233;
          cursor: default; transition: all 0.18s;
        }
        .demo-chip:hover { background: rgba(255,255,255,0.85); transform: translateY(-1px); }
        .demo-chip.full { grid-column: span 2; }
        .demo-role { font-weight: 500; font-size: 10px; color: #4A1020; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; }
        .demo-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .dot-r { background: #E05C6A; }
        .dot-a { background: #D4913A; }
        .dot-p { background: #A08AC4; }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 32px 24px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="login-blob lb-rose" />
        <div className="login-blob lb-lavender" />
        <div className="login-blob lb-sage" />
        <div className="login-mesh" />

        {/* ── Left brand panel ── */}
        <div className="login-left">
          <div className="lib lib-1" />
          <div className="lib lib-2" />

          <Link to="/" className="left-logo">
            <div className="left-logo-icon">🧶</div>
            <div>
              <div className="left-logo-name">CozyStitch</div>
              <div className="left-logo-sub">your craft, your story</div>
            </div>
          </Link>

          <div className="left-mid">
            <div className="left-eyebrow">Handcrafted with love</div>
            <div className="left-headline">
              Where every
              <br />
              stitch tells a<br />
              <em>story</em>
            </div>
            <p className="left-body">
              Premium yarns, curated kits, and tools for every crafter — from
              beginner to artisan.
            </p>
            <div className="left-features">
              {[
                "500+ yarn colors & textures",
                "Curated DIY kits for all levels",
                "Free shipping over 500k VND",
              ].map((f) => (
                <div className="left-feat" key={f}>
                  <div className="feat-dot" />
                  <span className="feat-text">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="left-footer">
            <div className="testimonial">
              <div className="testimonial-text">
                "CozyStitch has completely changed how I shop for yarn. The
                quality is unmatched and the kits are just perfect."
              </div>
              <div className="testimonial-author">
                <div className="t-avatar">TN</div>
                <div className="t-name">Tran Ngoc — loyal customer ✦</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="login-right">
          <div className="form-wrap">
            <div className="form-header">
              <div className="form-eyebrow">✦ Welcome back</div>
              <div className="form-title">Sign in to your account</div>
              <p className="form-sub">Continue your cozy crafting journey</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="err-box">
                  <AlertCircle
                    size={15}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <p>{error}</p>
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
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" /> Remember me
                </label>
                <Link to="/auth/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2
                      size={17}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
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
              <span>New to CozyStitch?</span>
              <div className="divider-line" />
            </div>

            <p className="reg-txt">
              <Link to="/auth/register">Create an account</Link> and start your
              journey ✦
            </p>

            <div className="sep" />

            <div className="demo-box">
              <div className="demo-title">
                🔑 Demo accounts — password: <strong>123</strong>
              </div>
              <div className="demo-grid">
                <div className="demo-chip">
                  <div className="demo-role">
                    <span className="demo-dot dot-r" />
                    Admin
                  </div>
                  admin@gmail.com
                </div>
                <div className="demo-chip">
                  <div className="demo-role">
                    <span className="demo-dot dot-a" />
                    Staff
                  </div>
                  staff@gmail.com
                </div>
                <div className="demo-chip full">
                  <div className="demo-role">
                    <span className="demo-dot dot-p" />
                    User
                  </div>
                  tranngoc5979@gmail.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
