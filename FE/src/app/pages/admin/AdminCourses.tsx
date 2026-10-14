import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { BookOpen, CheckCircle2, Clock, Edit, Eye, FileEdit, GraduationCap, Layers, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { courseService } from "../../../shared/api/courseService";
import type { Course, CourseLevel } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminGridFooter,
  AdminGridToolbar,
  AdminMoney,
  AdminPill,
  AdminRowActions,
  AdminRowMenu,
  AdminStatusTabs,
  useAdminConfirm,
  useAdminGridSort,
  type AdminGridColumn,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

type StatusFilter = "all" | "published" | "draft";

const LEVEL_TONE: Record<CourseLevel, AdminTone> = {
  beginner: "green",
  mid: "amber",
  pro: "rose",
};
const LEVEL_ORDER: CourseLevel[] = ["beginner", "mid", "pro"];

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

export function AdminCourses() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearchTerm,
    setInputValue: setSearchTerm,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });

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

  // A new search / filter narrows the list — jump back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  const levelLabel = (level: CourseLevel) => t(`admin.courses.levels.${level}`);

  const handleDelete = async (course: Course) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: course.title }),
      description: t("admin.courses.deleteWarning"),
      confirmLabel: t("admin.courses.delete"),
      danger: true,
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await courseService.delete(course._id);
      toast.success(t("admin.courses.deleteSuccess"));
      setCourses((prev) => prev.filter((c) => c._id !== course._id));
    } catch {
      toast.error(t("admin.courses.deleteError"));
    }
  };

  // The API returns the whole catalogue in one go — filter, sort and page here.
  const needle = debouncedSearchTerm.toLowerCase();
  const matched = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(needle) &&
      (statusFilter === "all" || (statusFilter === "published") === course.isPublished),
  );
  const { sort, apply: applySort } = useAdminGridSort<Course>((course, field) => {
    if (field === "title") return course.title;
    if (field === "level") return LEVEL_ORDER.indexOf(course.level);
    if (field === "content") return course.totalLessons;
    if (field === "price") return course.price ?? 0;
    if (field === "status") return course.isPublished ? 1 : 0;
    return null;
  });
  const sorted = applySort(matched);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const publishedCount = courses.filter((c) => c.isPublished).length;
  const counts = loading
    ? { all: undefined, published: undefined, draft: undefined }
    : { all: courses.length, published: publishedCount, draft: courses.length - publishedCount };

  const priceCell = (price?: number) =>
    (price ?? 0) > 0 ? <AdminMoney value={price ?? 0} /> : <span className="adm-gprimary">{t("admin.grid.free")}</span>;

  const columns: AdminGridColumn<Course>[] = [
    {
      key: "title",
      header: t("admin.courses.course"),
      width: "minmax(240px, 2fr)",
      minWidth: 240,
      sortable: true,
      card: "title",
      render: (course) => (
        <AdminCellStack
          media={course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy" /> : <GraduationCap />}
          primary={course.title}
          secondary={course.tags?.slice(0, 3).join(", ")}
        />
      ),
    },
    {
      key: "level",
      header: t("admin.courses.level"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      render: (course) => <AdminPill tone={LEVEL_TONE[course.level] ?? "neutral"}>{levelLabel(course.level)}</AdminPill>,
    },
    {
      key: "content",
      header: t("admin.courses.content"),
      width: "120px",
      minWidth: 120,
      align: "right",
      sortable: true,
      render: (course) => (
        <>
          <span className="adm-gprimary adm-gnum-plain">{t("admin.courses.lessonsShort", { count: course.totalLessons })}</span>
          <span className="adm-gsecondary adm-gnum-plain">
            {t("admin.courses.durationMin", { duration: course.totalDuration })}
          </span>
        </>
      ),
    },
    {
      key: "price",
      header: t("admin.courses.price"),
      width: "120px",
      minWidth: 120,
      align: "right",
      sortable: true,
      render: (course) => priceCell(course.price),
    },
    {
      key: "status",
      header: t("admin.courses.status"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: (course) => (
        <AdminPill tone={course.isPublished ? "green" : "amber"}>
          {course.isPublished ? t("admin.courses.published") : t("admin.courses.draft")}
        </AdminPill>
      ),
    },
    {
      key: "actions",
      header: t("admin.courses.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (course) => (
        <AdminRowActions>
          <AdminActionButton
            icon={Edit}
            label={t("admin.courses.edit")}
            onClick={() => navigate(`/admin/courses/${course._id}`)}
          />
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.courses.view"), icon: Eye, onSelect: () => setViewingCourse(course) },
              {
                label: t("admin.courses.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                onSelect: () => void handleDelete(course),
              },
            ]}
          />
        </AdminRowActions>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow={t("admin.courses.eyebrow")}
        title={t("admin.courses.title")}
        subtitle={t("admin.courses.subtitle")}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => void fetchCourses()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            <CreateButton to="/admin/courses/new" label={t("admin.courses.create")} />
          </>
        }
      />

      <AdminStatusTabs<StatusFilter>
        ariaLabel={t("admin.courses.status")}
        value={statusFilter}
        onChange={setStatusFilter}
        tabs={[
          { value: "all", label: t("admin.courses.allCourses"), icon: Layers, count: counts.all },
          { value: "published", label: t("admin.courses.published"), icon: CheckCircle2, tone: "green", count: counts.published },
          { value: "draft", label: t("admin.courses.draft"), icon: FileEdit, tone: "amber", count: counts.draft },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.courses.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={
            searchTerm || statusFilter !== "all"
              ? () => {
                  clearSearch();
                  setStatusFilter("all");
                }
              : undefined
          }
          meta={
            debouncedSearchTerm ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {matched.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: matched.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<Course>
          ariaLabel={t("admin.courses.title")}
          rows={rows}
          rowKey={(c) => c._id}
          columns={columns}
          loading={loading}
          sort={sort}
          onRowClick={(c) => setViewingCourse(c)}
          rowAccent={(c) => (c.isPublished ? null : "amber")}
          empty={{ icon: GraduationCap, title: t("admin.courses.noCourses") }}
        />

        <AdminGridFooter
          page={safePage}
          totalPages={totalPages}
          total={sorted.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </AdminPanel>

      {confirmDialog}

      {/* ── Read dialog: xem chi tiết ngay tại trang admin, không chuyển trang ── */}
      {viewingCourse && (
        <AdminModal
          variant="view"
          size="lg"
          icon={GraduationCap}
          eyebrow={t("admin.courses.course")}
          title={viewingCourse.title}
          media={
            viewingCourse.thumbnail ? <img src={viewingCourse.thumbnail} alt="" className="adm-dlg-thumb" /> : undefined
          }
          badges={
            <>
              <AdminPill tone={LEVEL_TONE[viewingCourse.level] ?? "neutral"}>{levelLabel(viewingCourse.level)}</AdminPill>
              <AdminPill tone={viewingCourse.isPublished ? "green" : "amber"}>
                {viewingCourse.isPublished ? t("admin.courses.published") : t("admin.courses.draft")}
              </AdminPill>
            </>
          }
          onClose={() => setViewingCourse(null)}
          footer={
            <>
              <button type="button" onClick={() => setViewingCourse(null)} className="btn-modal-cancel">
                {t("common.close")}
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => navigate(`/admin/courses/${viewingCourse._id}`)}
              >
                <Edit className="w-4 h-4" /> {t("admin.courses.edit")}
              </button>
            </>
          }
        >
          <div className="admin-dialog-body">
            {viewingCourse.description && (
              <AdminDetailItem label={t("admin.courses.description")}>
                <p className="whitespace-pre-wrap leading-relaxed font-normal">{viewingCourse.description}</p>
              </AdminDetailItem>
            )}
            <AdminDetailGrid>
              <AdminDetailItem label={t("admin.courses.lessonsCount")}>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-4 text-muted-foreground" /> {viewingCourse.totalLessons}
                </span>
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.courses.duration")}>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-muted-foreground" />
                  {t("admin.courses.durationMin", { duration: viewingCourse.totalDuration })}
                </span>
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.courses.price")}>{priceCell(viewingCourse.price)}</AdminDetailItem>
              <AdminDetailItem label={t("admin.courses.tags")}>
                {viewingCourse.tags && viewingCourse.tags.length > 0 ? (
                  <div className="adm-chips">
                    {viewingCourse.tags.map((tag) => (
                      <span key={tag} className="adm-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </AdminDetailItem>
            </AdminDetailGrid>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
