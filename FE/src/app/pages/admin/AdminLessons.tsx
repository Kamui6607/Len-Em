import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Edit, Plus, Video } from "lucide-react";
import { HoldToDeleteButton } from "../../../shared/components/admin/HoldToDeleteButton";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { lessonService } from "../../../shared/api/lessonService";
import type { Lesson } from "../../../features/learn/types/learn.types";
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

type SortField = "title" | "order" | "duration" | "products" | "preview";
type SortDirection = "asc" | "desc";

export function AdminLessons() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { inputValue: searchTerm, debouncedValue: debouncedSearchTerm, setInputValue: setSearchTerm } = useDebouncedSearch({ delay: 400, minChars: 0 });

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return <AdminPageLoading title={t("admin.lessons.title")} message={t("admin.lessons.loading")} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.lessons.title")}
        subtitle={t("admin.lessons.subtitle")}
        actions={
          <Link to="/admin/lessons/new" className="btn-create">
            <Plus size={18} />
            {t("admin.lessons.create")}
          </Link>
        }
      />

      <AdminPanel>
        <AdminTableToolbar>
          <AdminSearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t("admin.lessons.searchPlaceholder")} />
        </AdminTableToolbar>

        <AdminTableScroll>
          <thead className="bg-muted">
            <tr>
              <AdminSortableHeader label={t("admin.lessons.lesson")} field="title" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminSortableHeader label={t("admin.lessons.order")} field="order" activeField={sortField} direction={sortDirection} onSort={handleSort} align="right" />
              <AdminSortableHeader label={t("admin.lessons.duration")} field="duration" activeField={sortField} direction={sortDirection} onSort={handleSort} align="right" />
              <AdminSortableHeader label={t("admin.lessons.products")} field="products" activeField={sortField} direction={sortDirection} onSort={handleSort} align="right" />
              <AdminSortableHeader label={t("admin.lessons.preview")} field="preview" activeField={sortField} direction={sortDirection} onSort={handleSort} />
              <AdminTableHeaderCell label={t("admin.lessons.actions")} align="right" />
            </tr>
          </thead>
          <tbody>
            {sortedLessons.length > 0 ? (
              sortedLessons.map((lesson) => (
                <tr
                  key={lesson._id}
                  className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
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
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {lesson.order}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {lesson.duration} min
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {lesson.linkedProduct?.length ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${lesson.isPreview ? "badge-green" : "badge-red"}`}
                    >
                      {lesson.isPreview ? t("admin.lessons.preview") : t("admin.lessons.locked")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="admin-action-btn view"
                      >
                        <Link to={`/admin/lessons/${lesson._id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      <HoldToDeleteButton
                        onDelete={async () => {
                          try {
                            await lessonService.delete(lesson._id);
                            toast.success(t("admin.lessons.deleteSuccess"));
                            setLessons((prev) => prev.filter((l) => l._id !== lesson._id));
                          } catch {
                            toast.error(t("admin.lessons.deleteError"));
                          }
                        }}
                        title={t("admin.lessons.holdToDelete")}
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
    </div>
  );
}