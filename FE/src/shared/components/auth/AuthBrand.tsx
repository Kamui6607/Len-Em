import { Link } from "react-router";
import "../../../styles/auth.css";
import { Wordmark } from "../brand/Wordmark";

/** Len&em logo link used across the auth pages (styles in auth.css). */
export function AuthBrand() {
  return (
    <Link to="/" className="auth-brand group" aria-label="Len&em — Home">
      <img
        src="/cuu.png"
        alt=""
        width={53}
        height={44}
        className="brand-mark h-11 w-auto"
        draggable={false}
      />
      <Wordmark className="h-8" />
    </Link>
  );
}
