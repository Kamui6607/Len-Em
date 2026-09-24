import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Edit, Eye, Video } from "lucide-react";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { lessonService } from "../../../shared/api/lessonService";
import type { Lesson } from "../../../features/learn/types/learn.types";
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

type SortField = "title" | "order" | "duration" | "products" | "preview";
type SortDirection = "asc" | "desc";

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

export function AdminLessons() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { inputValue: searchTerm, debouncedValue: debouncedSearchTerm, setInputValue: setSearchTerm, isWaiting: searchIsWaiting, clear: clearSearch } = useDebouncedSearch({ delay: 400, minChars: 0 });

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lessonService.getAll();
      setLessons(res.data.data.lessons);
    } catch {
      toast.error(t("admin.lessons.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (lesson: Lesson) => {
      switch (sortField) {
        case "title":
          return lesson.title;
        case "order":
          return lesson.order;
        case "duration":
          return lesson.duration;
        case "products":
          return lesson.linkedProduct?.length ?? 0;
        case "preview":
          return lesson.isPreview ? "yes" : "no";
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // The API returns every lesson at once, so paging happens here.
  const totalPages = Math.max(1, Math.ceil(sortedLessons.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLessons = sortedLessons.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
    // Header + nút "Create" giữ thật; bảng là skeleton 6 cột (bài học, thứ tự,
    // thời lượng, sản phẩm, preview, thao tác).
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={t("admin.lessons.title")}
          subtitle={t("admin.lessons.subtitle")}
          actions={
            <CreateButton to="/admin/lessons/new" label={t("admin.lessons.create")} />
          }
        />

        <AdminTableSkeleton
          rows={6}
          columns={[
            { type: "icon", className: "w-[400px]", align: "center" },
            { type: "number", align: "center" },
            { type: "number", align: "center" },
            { type: "number", align: "center" },
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
        title={t("admin.lessons.title")}
        subtitle={t("admin.lessons.subtitle")}
        actions={
          <CreateButton to="/admin/lessons/new" label={t("admin.lessons.create")} />
        }
      />

      <AdminPanel>
        {/* Search dùng chung: debounce 400ms + spinner khi đang chờ */}
        <AdminSearchToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.lessons.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={searchTerm ? clearSearch : undefined}
          resetLabel={t("admin.clearFilters")}
          meta={
            searchTerm || debouncedSearchTerm ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {filteredLessons.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: filteredLessons.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminTableScroll>
          <thead className="bg-muted">
            <tr>
              <AdminSortableHeader label={t("admin.lessons.lesson")} field="title" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.lessons.order")} field="order" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.lessons.duration")} field="duration" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.lessons.products")} field="products" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminSortableHeader label={t("admin.lessons.preview")} field="preview" activeField={sortField} direction={sortDirection} onSort={handleSort} align="center" />
              <AdminTableHeaderCell label={t("admin.lessons.actions")} align="center" />
            </tr>
          </thead>
          <tbody>
            {sortedLessons.length > 0 ? (
              pagedLessons.map((lesson) => (
                <tr
                  key={lesson._id}
                  className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
                        <Video className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-sm max-w-[400px]">
                          {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lesson.videoUrl?.slice(0, 50)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {lesson.order}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {lesson.duration} min
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {lesson.linkedProduct?.length ?? 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`badge ${lesson.isPreview ? "badge-green" : "badge-red"}`}
                    >
                      {lesson.isPreview ? t("admin.lessons.preview") : t("admin.lessons.locked")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="admin-action-btn view"
                        title={t("admin.lessons.view")}
                        onClick={() => setViewingLesson(lesson)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="admin-action-btn edit"
                      >
                        <Link to={`/admin/lessons/${lesson._id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      <ConfirmDeleteButton
                        onDelete={async () => {
                          try {
                            await lessonService.delete(lesson._id);
                            toast.success(t("admin.lessons.deleteSuccess"));
                            setLessons((prev) => prev.filter((l) => l._id !== lesson._id));
                          } catch {
                            toast.error(t("admin.lessons.deleteError"));
                          }
                        }}
                        itemName={lesson.title}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableEmptyRow colSpan={6} message={t("admin.lessons.noLessons")} />
            )}
          </tbody>
        </AdminTableScroll>
      </AdminPanel>

      <AdminPagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={sortedLessons.length}
        pageSize={PAGE_SIZE}
      />

      {/* ── Read dialog: xem chi tiết bài học ngay tại trang admin, không chuyển trang ── */}
      {viewingLesson && (
        <AdminModal
          title={viewingLesson.title}
          onClose={() => setViewingLesson(null)}
          className="max-w-2xl w-full"
        >
          <div className="admin-dialog-body">
            {/* Trạng thái preview */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${viewingLesson.isPreview ? "badge-green" : "badge-red"}`}>
                {viewingLesson.isPreview ? t("admin.lessons.preview") : t("admin.lessons.locked")}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.lessons.orderLabel")}</p>
                <p className="text-sm font-medium">{viewingLesson.order}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.lessons.durationLabel")}</p>
                <p className="text-sm font-medium">{viewingLesson.duration} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.lessons.productsLabel")}</p>
                <p className="text-sm font-medium">{viewingLesson.linkedProduct?.length ?? 0}</p>
              </div>
            </div>

            {/* Video URL */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("admin.lessons.videoUrl")}</p>
              <a
                href={viewingLesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[var(--primary)] break-all hover:underline"
              >
                {viewingLesson.videoUrl}
              </a>
            </div>
          </div>

          <div className="admin-dialog-footer">
            <button type="button" onClick={() => setViewingLesson(null)} className="btn-modal-cancel">
              {t("common.close")}
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}