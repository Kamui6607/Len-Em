import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface AdminBackHeaderProps {
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  backLabel?: string;
  actions?: ReactNode;
}

/**
 * Header for detail/edit pages that live one level below a list page
 * (ProductDetail, RoleDetail, DIYFormPage, LessonFormPage, CourseFormPage).
 *
 * Standardizes on the existing `.btn-icon` class for the back button —
 * ProductDetail/RoleDetail previously used an ad hoc
 * `p-2 hover:bg-muted rounded-lg` button instead of the design system's
 * own icon-button component.
 */
export function AdminBackHeader({ title, subtitle, onBack, backLabel = "Back", actions }: AdminBackHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <button onClick={onBack} className="btn-icon flex-shrink-0" aria-label={backLabel} title={backLabel}>
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="admin-page-title text-2xl font-semibold mb-1 truncate">{title}</h1>
          {subtitle && <div className="text-sm admin-page-subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
