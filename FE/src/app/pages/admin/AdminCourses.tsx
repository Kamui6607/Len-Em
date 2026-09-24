import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Edit, Eye, BookOpen } from "lucide-react";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { formatPrice } from "../../../lib/formatPrice";
import { courseService } from "../../../shared/api/courseService";
import type { Course, CourseLevel } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import {
  AdminTableScroll,
  AdminSortableHeader,
  AdminTableHeaderCell,
  AdminTableEmptyRow,
} from "../../../shared/components/admin/AdminDataTable";
import {
  AdminSearchMeta,
  AdminSearchToolbar,
} from "../../../shared/components/admin/AdminSearch";
import { AdminTableSkeleton } from "../../../shared/components/skeletons/AdminSkeleton";

type SortField = "title" | "level" | "lessons" | "duration" | "status" | "price";
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

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

export function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { inputValue: searchTerm, debouncedValue: debouncedSearchTerm, setInputValue: setSearchTerm, isWaiting: searchIsWaiting, clear: clearSearch } = useDebouncedSearch({ delay: 400, minChars: 0 });

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
        case "price": return course.price ?? 0;
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // The API returns the whole catalogue in one go, so paging happens here.
  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedCourses = sortedCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // A new search narrows the list — jump back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    // Giữ nguyên header + nút "Create" thật, chỉ bảng là skeleton (đúng 7 cột:
    // khoá học, level, số bài, thời lượng, giá, trạng thái, thao tác).
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={t("admin.courses.title")}
          subtitle={t("admin.courses.subtitle")}
          actions={
            <CreateButton to="/admin/courses/new" label={t("admin.courses.create")} />
          }
        />

        <AdminTableSkeleton
          rows={6}
          columns={[
            { type: "media", className: "w-[300px]" },
            { type: "badge", align: "center" },
            { type: "number", align: "center" },
            { type: "number", align: "center" },
            { type: "money", align: "center" },
            { type: "badge", align: "center" },
            { type: "actions", align: "center" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.courses.title")}
        subtitle={t("admin.courses.subtitle")}
        actions={
          <CreateButton to="/admin/courses/new" label={t("admin.courses.create")} />
        }
      />

      <AdminPanel>
        {/* Search: debounce 400ms qua useDebouncedSearch + hiện spinner khi đang chờ */}
        <AdminSearchToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.courses.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={searchTerm ? clearSearch : undefined}
          resetLabel={t("admin.clearFilters")}
          meta={
            searchTerm || debouncedSearchTerm ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {filteredCourses.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: filteredCourses.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminTableScroll>
          <thead className="bg-muted">
            <tr>
              <AdminSortableHeader label={t("admin.courses.course")} field="title" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminSortableHeader label={t("admin.courses.level")} field="level" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.courses.lessons")} field="lessons" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.courses.duration")} field="duration" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.courses.price")} field="price" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.courses.status")} field="status" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminTableHeaderCell label={t("admin.courses.actions")} align="center" />
            </tr>
          </thead>
          <tbody>
            {sortedCourses.length > 0 ? (
              pagedCourses.map((course) => (
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
                  <td className="px-6 py-4 text-center">
                    <Badge className={levelStyles[course.level]} variant="outline">{levelLabels[course.level]}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex justify-center items-center gap-1.5 text-sm">
                      <BookOpen className="size-4 text-muted-foreground" />
                      {course.totalLessons}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">{course.totalDuration} min</td>
                  <td className="px-6 py-4 text-sm text-center">
                    {(course.price ?? 0) > 0 ? formatPrice(course.price ?? 0) : "Free"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${course.isPublished ? "badge-green" : "badge-orange"}`}>
                      {course.isPublished ? t("admin.courses.published") : t("admin.courses.draft")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={() => setViewingCourse(course)} variant="ghost" size="sm" className="admin-action-btn view" title={t("admin.courses.view")}>
                        <Eye className="size-4" />
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="admin-action-btn edit">
                        <Link to={`/admin/courses/${course._id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      <ConfirmDeleteButton
                        onDelete={async () => {
                          try {
                            await courseService.delete(course._id);
                            toast.success(t("admin.courses.deleteSuccess"));
                            setCourses((prev) => prev.filter((c) => c._id !== course._id));
                          } catch {
                            toast.error(t("admin.courses.deleteError"));
                          }
                        }}
                        itemName={course.title}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableEmptyRow colSpan={7} message={t("admin.courses.noCourses")} />
            )}
          </tbody>
        </AdminTableScroll>
      </AdminPanel>

      <AdminPagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={sortedCourses.length}
        pageSize={PAGE_SIZE}
      />

      {/* ── Read dialog: xem chi tiết ngay tại trang admin, không chuyển trang ── */}
      {viewingCourse && (
        <AdminModal
          title={viewingCourse.title}
          onClose={() => setViewingCourse(null)}
          className="max-w-3xl w-full"
        >
          <div className="admin-dialog-body">
            {/* Thumbnail + badges + description */}
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={viewingCourse.thumbnail}
                alt={viewingCourse.title}
                className="w-full sm:w-40 aspect-square shrink-0 rounded-xl object-cover bg-muted"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={levelStyles[viewingCourse.level]} variant="outline">
                    {levelLabels[viewingCourse.level]}
                  </Badge>
                  <span className={`badge ${viewingCourse.isPublished ? "badge-green" : "badge-orange"}`}>
                    {viewingCourse.isPublished ? t("admin.courses.published") : t("admin.courses.draft")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {viewingCourse.description}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.courses.level")}</p>
                <p className="text-sm font-medium">{levelLabels[viewingCourse.level]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.courses.lessonsCount")}</p>
                <p className="text-sm font-medium">{viewingCourse.totalLessons}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.courses.duration")}</p>
                <p className="text-sm font-medium">
                  {t("admin.courses.durationMin", { duration: viewingCourse.totalDuration })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.courses.price")}</p>
                <p className="text-sm font-medium">
                  {(viewingCourse.price ?? 0) > 0 ? formatPrice(viewingCourse.price ?? 0) : "Free"}
                </p>
              </div>
            </div>

            {/* Tags */}
            {viewingCourse.tags && viewingCourse.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t("admin.courses.tags")}</p>
                <div className="flex flex-wrap gap-2">
                  {viewingCourse.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="admin-dialog-footer">
            <button type="button" onClick={() => setViewingCourse(null)} className="btn-modal-cancel">
              {t("common.close")}
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}