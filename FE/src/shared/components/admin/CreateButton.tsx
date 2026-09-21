// ============================================================
// CreateButton — the "+ Create" CTA used on every admin list header
// ============================================================
// Pill button with the icon inside its own frosted chip and a shine sweep on
// hover (styles live in globals.css under `.btn-create-cta`).
// Renders a router <Link> when `to` is given, otherwise a plain button, so the
// pages that open a modal and the ones that navigate to a form share one look.
// ============================================================

import type { ElementType } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";

export interface CreateButtonProps {
  /** Visible label (usually an i18n string). */
  label: string;
  /** Opens a modal / runs an action. Ignored when `to` is set. */
  onClick?: () => void;
  /** Navigates to a form page instead of running an action. */
  to?: string;
  /** Icon shown inside the chip. Defaults to a plus sign. */
  icon?: ElementType;
  disabled?: boolean;
  /** Tooltip; defaults to the label. */
  title?: string;
  className?: string;
}

export function CreateButton({
  label,
  onClick,
  to,
  icon: Icon = Plus,
  disabled = false,
  title,
  className,
}: CreateButtonProps) {
  const classes = className ? `btn-create-cta ${className}` : "btn-create-cta";
  const content = (
    <>
      <span className="btn-create-cta__icon">
        <Icon />
      </span>
      {label}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} title={title ?? label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={title ?? label}
    >
      {content}
    </button>
  );
}
