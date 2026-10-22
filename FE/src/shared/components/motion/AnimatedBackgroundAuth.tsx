import "../../../styles/auth.css";

/**
 * Background for auth pages — simpler than the main background,
 * with no cursor effects. Pure CSS (see `.auth-bg` in auth.css): a light
 * and a dark layer are stacked and cross-faded by the `.dark` class, so
 * toggling the theme fades smoothly instead of snapping between gradients.
 */
export function AnimatedBackgroundAuth() {
  return (
    <div aria-hidden className="auth-bg">
      <div className="auth-bg-layer auth-bg-light" />
      <div className="auth-bg-layer auth-bg-dark" />
    </div>
  );
}
