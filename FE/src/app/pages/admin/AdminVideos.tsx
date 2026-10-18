import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Clapperboard, Crown, Edit, Eye, Layers, RefreshCw, Star, Trash2, Users, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminDetailGrid, AdminDetailItem, AdminModal } from "../../../shared/components/admin/AdminModal";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
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
import { videoService, type Video } from "../../../shared/api/videoService";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";


/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

const vnNumber = new Intl.NumberFormat("vi-VN");

/**
 * BE có thể trả các trường dạng object thay vì chuỗi (vd. category được
 * populate thành { _id, name }). Render thẳng object làm React ném lỗi
 * "Objects are not valid as a React child" → ErrorBoundary hiện
 * "We couldn't load this page". Luôn quy về chuỗi trước khi hiển thị.
 */
function toText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return toText(obj.name ?? obj.title ?? obj.label ?? "");
  }
  return "";
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return toNumber(obj.average ?? obj.avg ?? obj.value ?? null);
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}


export function AdminVideos() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewingVideo, setViewingVideo] = useState<Video | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearchTerm,
    setInputValue: setSearchTerm,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });

  // GET /videos is paginated + filterable server-side (type/search/page/limit/sort).
  const fetchVideos = useCallback(
    async (targetPage: number, silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await videoService.getAll({
          page: targetPage,
          limit: PAGE_SIZE,
          type: typeFilter || undefined,
          search: debouncedSearchTerm || undefined,
          sort,
        });
        const data = res.data.data ?? { videos: [] };
        setVideos(data.videos ?? []);
        setTotalPages(data.pagination?.totalPages ?? data.totalPages ?? 1);
        setTotal(data.pagination?.total ?? data.total ?? data.videos?.length ?? 0);
      } catch {
        toast.error(t("admin.videos.loadError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearchTerm, sort, t, typeFilter],
  );

  useEffect(() => {
    void fetchVideos(page);
  }, [fetchVideos, page]);

  // A new search / filter narrows the list — jump back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, typeFilter, sort]);

  const hasActiveFilters = Boolean(debouncedSearchTerm || typeFilter);

  // Số lượng cho thẻ loại video (limit=1, chỉ đọc total).
  const fetchCounts = useCallback(async () => {
    const keys = ["", "community", "premium"];
    const results = await Promise.allSettled(
      keys.map((type) => videoService.getAll({ page: 1, limit: 1, type: type || undefined })),
    );
    const next: Record<string, number | undefined> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const data = r.value.data.data;
        next[keys[i] || "all"] = data?.pagination?.total ?? data?.total;
      }
    });
    setCounts(next);
  }, []);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  // Opening the detail dialog fetches the latest data — GET /videos/{id}
  // also refreshes the view count on the BE.
  const openDetail = async (video: Video) => {
    setViewingVideo(video);
    setDetailLoading(true);
    try {
      const res = await videoService.getById(video._id);
      const detail = res.data.data?.video;
      if (detail) setViewingVideo(detail);
    } catch {
      // Keep the row data already shown instead of closing the dialog.
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (video: Video) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: toText(video.title) }),
      description: t("admin.videos.deleteWarning"),
      confirmLabel: t("admin.videos.delete"),
      danger: true,
      icon: Trash2,
    });
    if (!ok) return;
    // Admin dùng endpoint admin-delete để xóa được mọi video.
    try {
      await videoService.adminDelete(video._id);
      toast.success(t("admin.videos.deleteSuccess"));
      void fetchVideos(page, true);
      void fetchCounts();
    } catch {
      toast.error(t("admin.videos.deleteError"));
    }
  };

  const typePill = (video: Video) => {
    const type = toText(video.type);
    return (
      <AdminPill tone={type === "premium" ? "violet" : "cyan"}>
        {type === "premium" ? t("admin.videos.typePremium") : t("admin.videos.typeCommunity")}
      </AdminPill>
    );
  };

  // Sorting happens client-side on the current page (BE sort covers whole list).
  const { sort: gridSort, apply: applySort } = useAdminGridSort<Video>((video, field) => {
    if (field === "title") return toText(video.title);
    if (field === "type") return toText(video.type);
    if (field === "category") return toText(video.category);
    if (field === "views") return toNumber(video.viewCount) ?? 0;
    if (field === "rating") return toNumber(video.averageRating ?? video.rating) ?? 0;
    return null;
  });
  const rows = applySort(videos);

  const columns: AdminGridColumn<Video>[] = [
    {
      key: "title",
      header: t("admin.videos.video"),
      width: "minmax(260px, 2.2fr)",
      minWidth: 260,
      sortable: true,
      card: "title",
      render: (video) => {
        const url = toText(video.url);
        let host = url;
        try {
          host = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          host = url.slice(0, 40);
        }
        return <AdminCellStack media={<VideoIcon />} primary={toText(video.title)} secondary={host} />;
      },
    },
    {
      key: "type",
      header: t("admin.videos.type"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: typePill,
    },
    {
      key: "category",
      header: t("admin.videos.category"),
      width: "minmax(110px, 1fr)",
      minWidth: 110,
      sortable: true,
      render: (video) => <span className="adm-gprimary">{toText(video.category) || "—"}</span>,
    },
    {
      key: "views",
      header: t("admin.videos.views"),
      width: "100px",
      minWidth: 100,
      align: "right",
      sortable: true,
      render: (video) => <span className="adm-gnum">{vnNumber.format(toNumber(video.viewCount) ?? 0)}</span>,
    },
    {
      key: "rating",
      header: t("admin.videos.rating"),
      width: "100px",
      minWidth: 100,
      align: "right",
      sortable: true,
      render: (video) => {
        const rating = toNumber(video.averageRating ?? video.rating);
        return rating != null ? (
          <span className="adm-gnum inline-flex items-center gap-1">
            <Star className="size-3.5 text-[var(--warning-text)]" fill="currentColor" />
            {rating.toFixed(1)}
          </span>
        ) : (
          <span className="adm-gsecondary">—</span>
        );
      },
    },
    {
      key: "actions",
      header: t("admin.videos.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (video) => (
        <AdminRowActions>
          <AdminActionButton
            icon={Edit}
            label={t("admin.videos.edit")}
            onClick={() => navigate(`/admin/videos/${video._id}`)}
          />
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.videos.view"), icon: Eye, onSelect: () => void openDetail(video) },
              {
                label: t("admin.videos.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                onSelect: () => void handleDelete(video),
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
        title={t("admin.videos.title")}
        subtitle={t("admin.videos.subtitle")}
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                void fetchVideos(page, true);
                void fetchCounts();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            <CreateButton to="/admin/videos/new" label={t("admin.videos.create")} />
          </>
        }
      />

      <AdminStatusTabs<string>
        ariaLabel={t("admin.videos.type")}
        value={typeFilter}
        onChange={setTypeFilter}
        tabs={[
          { value: "", label: t("admin.videos.allTypes"), icon: Layers, count: counts.all },
          { value: "community", label: t("admin.videos.typeCommunity"), icon: Users, tone: "cyan", count: counts.community },
          { value: "premium", label: t("admin.videos.typePremium"), icon: Crown, tone: "violet", count: counts.premium },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        {/* Search (debounce 400ms) + sort — all server-side. */}
        <AdminGridToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.videos.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          filters={
            <AdminSelect
              value={sort}
              options={[
                { value: "newest", label: t("admin.videos.sortNewest") },
                { value: "oldest", label: t("admin.videos.sortOldest") },
                { value: "popular", label: t("admin.videos.sortPopular") },
              ]}
              onChange={setSort}
            />
          }
          onReset={
            hasActiveFilters || searchTerm
              ? () => {
                  clearSearch();
                  setTypeFilter("");
                }
              : undefined
          }
          meta={
            debouncedSearchTerm ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {total === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: total })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<Video>
          ariaLabel={t("admin.videos.title")}
          rows={rows}
          rowKey={(v) => v._id}
          columns={columns}
          loading={loading}
          refreshing={refreshing}
          sort={gridSort}
          onRowClick={(v) => void openDetail(v)}
          empty={{ icon: Clapperboard, title: t("admin.videos.noVideos") }}
        />

        <AdminGridFooter
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          disabled={refreshing}
        />
      </AdminPanel>

      {confirmDialog}

      {/* ── Read dialog: xem chi tiết + phát video ngay tại trang admin ── */}
      {viewingVideo && (
        <AdminModal
          variant="view"
          size="xl"
          icon={Clapperboard}
          eyebrow="Video"
          title={toText(viewingVideo.title)}
          badges={
            <>
              {typePill(viewingVideo)}
              {toText(viewingVideo.category) && (
                <AdminPill tone="neutral" fixed={false}>{toText(viewingVideo.category)}</AdminPill>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5" />
                {toNumber(viewingVideo.viewCount) ?? 0} {t("admin.videos.views")}
              </span>
            </>
          }
          onClose={() => setViewingVideo(null)}
          footer={
            <>
              <button type="button" onClick={() => setViewingVideo(null)} className="btn-modal-cancel">
                {t("common.close")}
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => navigate(`/admin/videos/${viewingVideo._id}`)}
              >
                {t("admin.videos.edit")}
              </button>
            </>
          }
        >
          <div className="admin-dialog-body">
            <video
              src={toText(viewingVideo.url)}
              controls
              preload="metadata"
              className="adm-video"
            />

            {toText(viewingVideo.description) && (
              <p className="text-sm text-muted-foreground leading-relaxed">{toText(viewingVideo.description)}</p>
            )}

            <AdminDetailGrid className="cols-3">
              <AdminDetailItem label={t("admin.videos.attachedProducts")}>
                {viewingVideo.attachedProducts?.length ?? 0}
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.videos.attachedKits")}>
                {viewingVideo.attachedKits?.length ?? 0}
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.videos.rating")}>
                {toNumber(viewingVideo.averageRating ?? viewingVideo.rating) != null ? `${toNumber(viewingVideo.averageRating ?? viewingVideo.rating)!.toFixed(1)} / 5` : null}
              </AdminDetailItem>
            </AdminDetailGrid>

            {Array.isArray(viewingVideo.tags) && viewingVideo.tags.length > 0 && (
              <div className="adm-chips">
                {viewingVideo.tags.map((tag, index) => (
                  <span key={`${toText(tag)}-${index}`} className="adm-chip">
                    #{toText(tag)}
                  </span>
                ))}
              </div>
            )}

            <AdminDetailItem label={t("admin.videos.url")}>
              <a
                href={toText(viewingVideo.url)}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--primary)] break-all hover:underline"
              >
                {toText(viewingVideo.url)}
              </a>
            </AdminDetailItem>

            {detailLoading && <p className="text-xs text-muted-foreground">{t("admin.videos.loading")}</p>}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
