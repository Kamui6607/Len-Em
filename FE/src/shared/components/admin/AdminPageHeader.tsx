import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Standard header for every admin page: title + optional subtitle on the
 * left, primary action(s) (e.g. "Create") on the right. Every admin page
 * should render this once, right below <AdminLayout>.
 *
 * Replaces the previously inconsistent per-page markup:
 *   - AdminDashboard used  <h1 className="admin-page-title mb-1">
 *   - AdminCourses used    <h1 className="mb-2">  (no admin-page-title)
 *   - ProductDetail used   <h1 className="mb-1">  (no admin-page-title)
 * All three now render identically.
 */
export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="admin-page-title text-2xl font-semibold mb-1">{title}</h1>
        {subtitle && <p className="admin-page-subtitle text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
