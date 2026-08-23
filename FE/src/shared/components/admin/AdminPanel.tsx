import type { ReactNode } from "react";

interface AdminPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * The single rounded/bordered "glass" container used everywhere in admin:
 * table wrappers, form cards, detail cards. Previously each page hand-rolled
 * a slightly different version of this:
 *   - AdminCourses/AdminLessons: admin-panel-glow rounded-2xl border ... hover:shadow-lg + inline borderColor
 *   - DIYFormPage:                rounded-2xl border p-6 ... + inline background/borderColor (no glow)
 *   - ProductDetail/RoleDetail:   bg-card border border-border rounded-2xl (plain Tailwind, no CSS vars, no glow)
 * All three are now the same component so hover/glow/border behave identically
 * and switch themes correctly everywhere.
 */
export function AdminPanel({ children, className = "", hover = true }: AdminPanelProps) {
  return (
    <div
      className={`admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 ${hover ? "hover:shadow-lg" : ""} ${className}`}
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      {children}
    </div>
  );
}

interface AdminPanelHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Header row inside an AdminPanel: optional icon chip + title (+ optional
 * subtitle/count on the right). Used for dashboard side panels
 * ("Recent Activity", "Order Statistics") and detail-page sections
 * ("Assigned Permissions", "Variants").
 */
export function AdminPanelHeader({ icon, title, subtitle, actions }: AdminPanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 p-6 border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className="admin-section-icon w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

/** Padded content area to use inside an AdminPanel body. */
export function AdminPanelBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
