import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Edit, Eye, Layers, Lock, PlayCircle, RefreshCw, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { lessonService } from "../../../shared/api/lessonService";
import type { Lesson } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminDetailGrid, AdminDetailItem, AdminModal } from "../../../shared/components/admin/AdminModal";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminGridFooter,
  AdminGridToolbar,
  AdminPill,
  AdminRowActions,
  AdminRowMenu,
  AdminStatusTabs,
  useAdminConfirm,
  useAdminGridSort,
  type AdminGridColumn,
} from "../../../shared/components/admin/AdminDataGrid";

type AccessFilter = "all" | "preview" | "locked";

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

/** "youtube.com/watch?v=…" → "youtube.com" (đủ để nhận ra nguồn video). */
function videoHost(url?: string): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

export function AdminLessons() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [access, setAccess] = useState<AccessFilter>("all");
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearchTerm,
    setInputValue: setSearchTerm,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });

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

  // A new search / filter narrows the list — jump back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, access]);

  const handleDelete = async (lesson: Lesson) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: lesson.title }),
      description: t("admin.lessons.deleteWarning"),
      confirmLabel: t("admin.lessons.delete"),
      danger: true,
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await lessonService.delete(lesson._id);
      toast.success(t("admin.lessons.deleteSuccess"));
      setLessons((prev) => prev.filter((l) => l._id !== lesson._id));
    } catch {
      toast.error(t("admin.lessons.deleteError"));
    }
  };

  // The API returns every lesson at once — filter, sort and page here.
  const needle = debouncedSearchTerm.toLowerCase();
  const matched = lessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(needle) &&
      (access === "all" || (access === "preview") === Boolean(lesson.isPreview)),
  );
  const { sort, apply: applySort } = useAdminGridSort<Lesson>((lesson, field) => {
    if (field === "order") return lesson.order;
    if (field === "title") return lesson.title;
    if (field === "duration") return lesson.duration;
    if (field === "products") return lesson.linkedProduct?.length ?? 0;
    if (field === "access") return lesson.isPreview ? 1 : 0;
    return null;
  });
  const sorted = applySort(matched);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const previewCount = lessons.filter((l) => l.isPreview).length;

  const accessPill = (lesson: Lesson) => (
    <AdminPill tone={lesson.isPreview ? "green" : "neutral"}>
      {lesson.isPreview ? t("admin.lessons.preview") : t("admin.lessons.locked")}
    </AdminPill>
  );

  const columns: AdminGridColumn<Lesson>[] = [
    {
      key: "order",
      header: t("admin.lessons.orderShort"),
      width: "72px",
      minWidth: 72,
      align: "center",
      sortable: true,
      card: "hidden",
      render: (lesson) => <span className="adm-gid">{String(lesson.order).padStart(2, "0")}</span>,
    },
    {
      key: "title",
      header: t("admin.lessons.lesson"),
      width: "minmax(260px, 2.4fr)",
      minWidth: 260,
      sortable: true,
      card: "title",
      render: (lesson) => (
        <AdminCellStack media={<Video />} primary={lesson.title} secondary={videoHost(lesson.videoUrl)} />
      ),
    },
    {
      key: "duration",
      header: t("admin.lessons.duration"),
      width: "120px",
      minWidth: 120,
      align: "right",
      sortable: true,
      render: (lesson) => (
        <span className="adm-gprimary adm-gnum-plain">{t("admin.lessons.minutes", { count: lesson.duration })}</span>
      ),
    },
    {
      key: "products",
      header: t("admin.lessons.products"),
      width: "110px",
      minWidth: 110,
      align: "right",
      sortable: true,
      render: (lesson) => <span className="adm-gnum">{lesson.linkedProduct?.length ?? 0}</span>,
    },
    {
      key: "access",
      header: t("admin.lessons.access"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: accessPill,
    },
    {
      key: "actions",
      header: t("admin.lessons.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (lesson) => (
        <AdminRowActions>
          <AdminActionButton
            icon={Edit}
            label={t("admin.lessons.edit")}
            onClick={() => navigate(`/admin/lessons/${lesson._id}`)}
          />
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.lessons.view"), icon: Eye, onSelect: () => setViewingLesson(lesson) },
              {
                label: t("admin.lessons.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                onSelect: () => void handleDelete(lesson),
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
        title={t("admin.lessons.title")}
        subtitle={t("admin.lessons.subtitle")}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => void fetchLessons()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            <CreateButton to="/admin/lessons/new" label={t("admin.lessons.create")} />
          </>
        }
      />

      <AdminStatusTabs<AccessFilter>
        ariaLabel={t("admin.lessons.access")}
        value={access}
        onChange={setAccess}
        tabs={[
          { value: "all", label: t("admin.lessons.all"), icon: Layers, count: loading ? undefined : lessons.length },
          { value: "preview", label: t("admin.lessons.preview"), icon: PlayCircle, tone: "green", count: loading ? undefined : previewCount },
          { value: "locked", label: t("admin.lessons.locked"), icon: Lock, tone: "neutral", count: loading ? undefined : lessons.length - previewCount },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.lessons.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={
            searchTerm || access !== "all"
              ? () => {
                  clearSearch();
                  setAccess("all");
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

        <AdminDataGrid<Lesson>
          ariaLabel={t("admin.lessons.title")}
          rows={rows}
          rowKey={(l) => l._id}
          columns={columns}
          loading={loading}
          sort={sort}
          onRowClick={(l) => setViewingLesson(l)}
          empty={{ icon: Video, title: t("admin.lessons.noLessons") }}
        />

        <AdminGridFooter page={safePage} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </AdminPanel>

      {confirmDialog}

      {/* ── Read dialog: xem chi tiết bài học ngay tại trang admin, không chuyển trang ── */}
      {viewingLesson && (
        <AdminModal
          variant="view"
          size="md"
          icon={Video}
          eyebrow={t("admin.lessons.lesson")}
          title={viewingLesson.title}
          badges={accessPill(viewingLesson)}
          onClose={() => setViewingLesson(null)}
          footer={
            <>
              <button type="button" onClick={() => setViewingLesson(null)} className="btn-modal-cancel">
                {t("common.close")}
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => navigate(`/admin/lessons/${viewingLesson._id}`)}
              >
                <Edit className="w-4 h-4" /> {t("admin.lessons.edit")}
              </button>
            </>
          }
        >
          <div className="admin-dialog-body">
            <AdminDetailGrid className="cols-3">
              <AdminDetailItem label={t("admin.lessons.orderLabel")}>{viewingLesson.order}</AdminDetailItem>
              <AdminDetailItem label={t("admin.lessons.durationLabel")}>
                {t("admin.lessons.minutes", { count: viewingLesson.duration })}
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.lessons.productsLabel")}>
                {viewingLesson.linkedProduct?.length ?? 0}
              </AdminDetailItem>
            </AdminDetailGrid>
            <AdminDetailItem label={t("admin.lessons.videoUrl")} mono>
              <a
                href={viewingLesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-[var(--primary)] hover:underline"
              >
                {viewingLesson.videoUrl}
              </a>
            </AdminDetailItem>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
