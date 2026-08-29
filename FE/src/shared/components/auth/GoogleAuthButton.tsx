// ============================================================
// GoogleAuthButton — "Continue with Google" button
// ============================================================
// Opens the Google OAuth popup via @react-oauth/google, then exchanges
// the Google access_token for the app's own JWT pair through
// POST /auth/google. The backend handles BOTH login and signup with that
// endpoint (auto-creates the account when the email has never been seen),
// so the same button is reused on LoginPage and RegisterPage.

import { useState } from "react";
import { useNavigate } from "react-router";
import { useGoogleLogin } from "@react-oauth/google";
import { Loader as Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

/**
 * Origins currently registered in Google Cloud Console for this Client ID
 * (Authorized JavaScript origins). Clicking the button from any other origin
 * makes Google reject the request with `400: origin_mismatch`.
 */
const KNOWN_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://len-em.vercel.app",
];

/** Official multi-colour Google "G" mark */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86a5.4 5.4 0 0 1-5.06-3.72H.94v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.94 10.7a5.41 5.41 0 0 1 0-3.4V4.96H.94a9 9 0 0 0 0 8.08l3-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .94 4.96l3 2.34A5.4 5.4 0 0 1 9 3.58z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  label = "Continue with Google",
  onError,
}: {
  /** Button text — e.g. "Continue with Google" / "Sign up with Google" */
  label?: string;
  /** Optional callback so the hosting page can render its own error banner */
  onError?: (message: string) => void;
}) {
  const navigate = useNavigate();
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exchangeToken = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      try {
        // Send the Google access_token to the backend — it verifies the token
        // and returns { accessToken, refreshToken, user, subscription } just
        // like POST /auth/login does.
        await googleLogin(tokenResponse.access_token);

        // Same role-based redirect as the regular login form
        const { user } = useAuthStore.getState();
        if (!user || !user.roleId) navigate("/");
        else if (user.roleId === "admin") navigate("/admin");
        else if (user.roleId === "staff") navigate("/staff");
        else navigate("/shop");
      } catch (err: unknown) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        console.error("Google auth failed:", err);
        onError?.(
          axiosError?.response?.data?.message ||
            "Google sign-in failed. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      console.error("Google login failed or popup closed");
      onError?.("Google sign-in failed. Please try again.");
    },
  });

  return (
    <>
      <style>{`
        .gauth-btn {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          background: var(--background);
          color: var(--foreground);
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
        }
        .gauth-btn:hover:not(:disabled) {
          background: var(--surface-secondary);
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
        }
        .gauth-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .gauth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @keyframes gauth-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="button"
        className="gauth-btn"
        onClick={() => {
          // DX hint: warn devs before Google rejects the request with
          // `400: origin_mismatch` when the page is served from an origin
          // that is not in the Client ID's Authorized JavaScript origins.
          const origin = window.location.origin;
          if (import.meta.env.DEV && !KNOWN_ORIGINS.includes(origin)) {
            console.warn(
              `[Google OAuth] Current origin "${origin}" is probably NOT registered in Google Cloud Console. ` +
                "Open the app via http://localhost:5173, or add this origin under " +
                "APIs & Services → Credentials → your OAuth Client → Authorized JavaScript origins.",
            );
          }
          exchangeToken();
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={17}
              style={{ animation: "gauth-spin 0.8s linear infinite" }}
            />
            Connecting…
          </>
        ) : (
          <>
            <GoogleIcon />
            {label}
          </>
        )}
      </button>
    </>
  );
}
