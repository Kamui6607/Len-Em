import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import {
  Edit,
  Plus,
  Search,
  Video,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { HoldToDeleteButton } from "../../components/admin/HoldToDeleteButton";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { lessonService } from "../../../api/lessonService";
import type { Lesson } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../context/LanguageContext";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";

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

  function SortableHeader({
    label,
    field,
    align = "left",
  }: {
    label: string;
    field: SortField;
    align?: "left" | "right";
  }) {
    const active = sortField === field;
    return (
      <th
        className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {label}
          <span className="flex flex-col items-center justify-center -space-y-[3px]">
            <ChevronUp
              className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
            />
            <ChevronDown
              className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
            />
          </span>
        </button>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t("admin.lessons.title")}</h1>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          {t("admin.lessons.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">{t("admin.lessons.title")}</h1>
          <p className="text-muted-foreground">{t("admin.lessons.subtitle")}</p>
        </div>
        <Link to="/admin/lessons/new" className="btn-create">
          <Plus size={18} />
          {t("admin.lessons.create")}
        </Link>
      </div>

      {/* Table */}
      <div
        className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Filters */}
        <div
          className="p-6 border-b border-border"
          style={{ background: "var(--surface)" }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("admin.lessons.searchPlaceholder")}
              className="w-full pl-12 input"
              style={{
                paddingLeft: "3rem",
                paddingRight: "1rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
              }}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead className="bg-muted">
              <tr>
                <SortableHeader label={t("admin.lessons.lesson")} field="title" />
                <SortableHeader label={t("admin.lessons.order")} field="order" align="right" />
                <SortableHeader
                  label={t("admin.lessons.duration")}
                  field="duration"
                  align="right"
                />
                <SortableHeader
                  label={t("admin.lessons.products")}
                  field="products"
                  align="right"
                />
                <SortableHeader label={t("admin.lessons.preview")} field="preview" />
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground w-[120px]">
                  {t("admin.lessons.actions")}
                </th>
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
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    {t("admin.lessons.noLessons")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}