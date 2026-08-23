import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Edit, Eye, Plus, BookOpen } from "lucide-react";
import { HoldToDeleteButton } from "../../../shared/components/admin/HoldToDeleteButton";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { courseService } from "../../../shared/api/courseService";
import type { Course, CourseLevel } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminTableToolbar,
  AdminSearchInput,
  AdminTableScroll,
  AdminSortableHeader,
  AdminTableHeaderCell,
  AdminTableEmptyRow,
  AdminPageLoading,
} from "../../../shared/components/admin/AdminDataTable";

type SortField = "title" | "level" | "lessons" | "duration" | "status";
type SortDirection = "asc" | "desc";

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const levelStyles: Record<CourseLevel, string> = {
  beginner: "border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]",
  intermediate: "border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
  advanced: "border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]",
};

export function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { inputValue: searchTerm, debouncedValue: debouncedSearchTerm, setInputValue: setSearchTerm } = useDebouncedSearch({ delay: 400, minChars: 0 });

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await courseService.getAll({ limit: 100 });
      setCourses(res.data.data.courses);
    } catch {
      toast.error(t("admin.courses.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (course: Course) => {
      switch (sortField) {
        case "title": return course.title;
        case "level": return course.level;
        case "lessons": return course.totalLessons;
        case "duration": return course.totalDuration;
        case "status": return course.isPublished ? "published" : "draft";
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return <AdminPageLoading title={t("admin.courses.title")} message={t("admin.courses.loading")} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.courses.title")}
        subtitle={t("admin.courses.subtitle")}
        actions={
          <Link to="/admin/courses/new" className="btn-create">
            <Plus size={18} />
            {t("admin.courses.create")}
          </Link>
        }
      />

      <AdminPanel>
        <AdminTableToolbar>
          <AdminSearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t("admin.courses.searchPlaceholder")} />
        </AdminTableToolbar>

        <AdminTableScroll>
          <thead className="bg-muted">
            <tr>
              <AdminSortableHeader label={t("admin.courses.course")} field="title" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminSortableHeader label={t("admin.courses.level")} field="level" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminSortableHeader label={t("admin.courses.lessons")} field="lessons" activeField={sortField} direction={sortDirection} onSort={handleSort} align="right" />
              <AdminSortableHeader label={t("admin.courses.duration")} field="duration" activeField={sortField} direction={sortDirection} onSort={handleSort} align="right" />
              <AdminSortableHeader label={t("admin.courses.status")} field="status" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminTableHeaderCell label={t("admin.courses.actions")} align="right" />
            </tr>
          </thead>
          <tbody>
            {sortedCourses.length > 0 ? (
              sortedCourses.map((course) => (
                <tr key={course._id} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="size-11 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-sm max-w-[300px]">{course.title}</span>
                        <span className="text-xs text-muted-foreground">{course.tags?.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={levelStyles[course.level]} variant="outline">{levelLabels[course.level]}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm">
                      <BookOpen className="size-4 text-muted-foreground" />
                      {course.totalLessons}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{course.totalDuration} min</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${course.isPublished ? "badge-green" : "badge-orange"}`}>
                      {course.isPublished ? t("admin.courses.published") : t("admin.courses.draft")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm" className="admin-action-btn view">
                        <Link to={`/learn/${course._id}`} target="_blank">
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="admin-action-btn edit">
                        <Link to={`/admin/courses/${course._id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      <HoldToDeleteButton
                        onDelete={async () => {
                          try {
                            await courseService.delete(course._id);
                            toast.success(t("admin.courses.deleteSuccess"));
                            setCourses((prev) => prev.filter((c) => c._id !== course._id));
                          } catch {
                            toast.error(t("admin.courses.deleteError"));
                          }
                        }}
                        title={t("admin.courses.holdToDelete")}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableEmptyRow colSpan={6} message={t("admin.courses.noCourses")} />
            )}
          </tbody>
        </AdminTableScroll>
      </AdminPanel>
    </div>
  );
}