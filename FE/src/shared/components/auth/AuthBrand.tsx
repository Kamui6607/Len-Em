import { Link } from "react-router";
import "../../../styles/auth.css";

/** Len&em logo link used across the auth pages (styles in auth.css). */
export function AuthBrand() {
  return (
    <Link to="/" className="auth-brand" aria-label="Len&em — Home">
      <span className="auth-brand-mark">
        <img
          src="/yarn-shop-2-removebg-preview.vng.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 object-contain"
          draggable={false}
        />
      </span>
      <span className="auth-brand-name">
        Len<span>&</span>em
      </span>
    </Link>
  );
}
