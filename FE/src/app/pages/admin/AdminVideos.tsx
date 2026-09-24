import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Edit, Eye, Star, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
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
import { videoService, type Video } from "../../../shared/api/videoService";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";

type SortField = "title" | "type" | "category" | "views" | "rating";
type SortDirection = "asc" | "desc";

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "community", label: "Community" },
  { value: "premium", label: "Premium" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most viewed" },
];

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const hasActiveFilters = Boolean(debouncedSearchTerm || typeFilter);

  // Sorting happens client-side on the current page (BE sort covers whole list).
  const sortedVideos = [...videos].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (video: Video) => {
      switch (sortField) {
        case "title":
          return video.title;
        case "type":
          return video.type;
        case "category":
          return video.category ?? "";
        case "views":
          return video.viewCount ?? 0;
        case "rating":
          return video.rating ?? 0;
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)), undefined, {
      numeric: true,
    });
    return sortDirection === "asc" ? cmp : -cmp;
  });

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

  if (loading) {
    // Giữ nguyên header + nút "Create" thật, chỉ bảng là skeleton.
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={t("admin.videos.title")}
          subtitle={t("admin.videos.subtitle")}
          actions={<CreateButton to="/admin/videos/new" label={t("admin.videos.create")} />}
        />
        <AdminTableSkeleton
          rows={6}
          columns={[
            { type: "media", className: "w-[320px]" },
            { type: "badge", align: "center" },
            { type: "text", align: "center" },
            { type: "number", align: "center" },
            { type: "number", align: "center" },
            { type: "actionsWide", align: "center" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.videos.title")}
        subtitle={t("admin.videos.subtitle")}
        actions={<CreateButton to="/admin/videos/new" label={t("admin.videos.create")} />}
      />

      <AdminPanel>
        {/* Search (debounce 400ms) + type filter + sort — all server-side. */}
        <AdminSearchToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: t("admin.videos.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          filters={
            <>
              <AdminSelect
                value={typeFilter}
                options={TYPE_OPTIONS.map((option) =>
                  option.value === ""
                    ? { ...option, label: t("admin.videos.allTypes") }
                    : option,
                )}
                onChange={setTypeFilter}
                className="w-40"
              />
              <AdminSelect
                value={sort}
                options={SORT_OPTIONS.map((option) =>
                  option.value === "newest"
                    ? { ...option, label: t("admin.videos.sortNewest") }
                    : option.value === "oldest"
                      ? { ...option, label: t("admin.videos.sortOldest") }
                      : { ...option, label: t("admin.videos.sortPopular") },
                )}
                onChange={setSort}
                className="w-40"
              />
            </>
          }
          onReset={
            hasActiveFilters || searchTerm
              ? () => {
                  clearSearch();
                  setTypeFilter("");
                }
              : undefined
          }
          resetLabel={t("admin.clearFilters")}
          meta={
            searchTerm || debouncedSearchTerm || typeFilter ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {total === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: total })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminTableScroll>
          <thead className="bg-muted">
            <tr>
              <AdminSortableHeader
                label={t("admin.videos.video")}
                field="title"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <AdminSortableHeader
                label={t("admin.videos.type")}
                field="type"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <AdminSortableHeader
                label={t("admin.videos.category")}
                field="category"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <AdminSortableHeader
                label={t("admin.videos.views")}
                field="views"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <AdminSortableHeader
                label={t("admin.videos.rating")}
                field="rating"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <AdminTableHeaderCell label={t("admin.videos.actions")} align="center" />
            </tr>
          </thead>
          <tbody className={refreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {sortedVideos.length > 0 ? (
              sortedVideos.map((video) => (
                <tr
                  key={video._id}
                  className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <VideoIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-sm max-w-[320px]">
                          {video.title}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[320px]">
                          {video.url?.slice(0, 60)}
                          {video.url && video.url.length > 60 ? "…" : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`badge ${video.type === "premium" ? "badge-orange" : "badge-green"}`}
                    >
                      {video.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {video.category || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {video.viewCount ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {video.rating != null ? Number(video.rating).toFixed(1) : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="admin-action-btn view"
                        title={t("admin.videos.view")}
                        onClick={() => void openDetail(video)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="admin-action-btn edit"
                        title={t("admin.videos.edit")}
                      >
                        <Link to={`/admin/videos/${video._id}`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                      {/* Admin dùng endpoint admin-delete để xóa được mọi video. */}
                      <ConfirmDeleteButton
                        onDelete={async () => {
                          try {
                            await videoService.adminDelete(video._id);
                            toast.success(t("admin.videos.deleteSuccess"));
                            void fetchVideos(page, true);
                          } catch {
                            toast.error(t("admin.videos.deleteError"));
                          }
                        }}
                        itemName={video.title}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <AdminTableEmptyRow colSpan={6} message={t("admin.videos.noVideos")} />
            )}
          </tbody>
        </AdminTableScroll>
      </AdminPanel>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={total}
        pageSize={PAGE_SIZE}
        disabled={refreshing}
      />

      {/* ── Read dialog: xem chi tiết + phát video ngay tại trang admin ── */}
      {viewingVideo && (
        <AdminModal
          title={viewingVideo.title}
          onClose={() => setViewingVideo(null)}
          className="max-w-3xl w-full"
        >
          <div className="admin-dialog-body space-y-4">
            <video
              src={viewingVideo.url}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-xl bg-black"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`badge ${viewingVideo.type === "premium" ? "badge-orange" : "badge-green"}`}
              >
                {viewingVideo.type}
              </span>
              {viewingVideo.category && (
                <span className="badge badge-green">{viewingVideo.category}</span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5" />
                {viewingVideo.viewCount ?? 0} {t("admin.videos.views")}
              </span>
            </div>

            {viewingVideo.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {viewingVideo.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("admin.videos.attachedProducts")}
                </p>
                <p className="text-sm font-medium">
                  {viewingVideo.attachedProducts?.length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("admin.videos.attachedKits")}
                </p>
                <p className="text-sm font-medium">{viewingVideo.attachedKits?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("admin.videos.rating")}</p>
                <p className="text-sm font-medium">
                  {viewingVideo.rating != null
                    ? `${Number(viewingVideo.rating).toFixed(1)} / 5`
                    : "—"}
                </p>
              </div>
            </div>

            {viewingVideo.tags && viewingVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {viewingVideo.tags.map((tag) => (
                  <span key={tag} className="badge badge-green">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("admin.videos.url")}</p>
              <a
                href={viewingVideo.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[var(--primary)] break-all hover:underline"
              >
                {viewingVideo.url}
              </a>
            </div>

            {detailLoading && (
              <p className="text-xs text-muted-foreground">{t("admin.videos.loading")}</p>
            )}
          </div>

          <div className="admin-dialog-footer">
            <button
              type="button"
              onClick={() => setViewingVideo(null)}
              className="btn-modal-cancel"
            >
              {t("common.close")}
            </button>
            <button
              type="button"
              className="btn-modal-primary"
              onClick={() => navigate(`/admin/videos/${viewingVideo._id}`)}
            >
              {t("admin.videos.edit")}
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
