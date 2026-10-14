import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { diyService } from "../../../features/diy/services/diy.service";
import type { DIYPost } from "../../../features/diy/types/diy.types";
import {
  Check,
  CheckCircle,
  Clock,
  Eye,
  Edit3,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Scissors,
  Trash2,
} from "lucide-react";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { ReportButton } from "../../../shared/components/ReportButton";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminDateCell,
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
} from "../../../shared/components/admin/AdminDataGrid";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminDialogSection,
  AdminField,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";

function formatCreatedAt(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}


export function AdminDIYPosts() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<DIYPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  // Search chung: debounce 400ms (ô gõ phản hồi ngay, API chỉ gọi khi ngừng gõ).
  const {
    inputValue: searchInput,
    debouncedValue: debouncedSearch,
    setInputValue: setSearchInput,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const isSearching = debouncedSearch.trim().length > 0;

  const [selectedPost, setSelectedPost] = useState<DIYPost | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<DIYPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", tags: "", price: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Khi đang search: tải một cửa sổ rộng (100 bài) rồi LỌC + PHÂN TRANG ở
      // FE → tìm được trong toàn danh sách thay vì 10 dòng của trang hiện tại
      // (BE /diy-posts chưa hỗ trợ tham số `search`).
      const { data } = await diyService.getAllPosts({
        page: isSearching ? 1 : page,
        limit: isSearching ? 100 : 10,
        status: filterStatus || undefined,
      });
      setPosts(data.data.posts);
      setTotal(data.data.total ?? data.data.posts.length);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error(t("admin.diyPosts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, isSearching, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, debouncedSearch, filterStatus]);

  // Số lượng cho thẻ trạng thái (limit=1, chỉ đọc `total`).
  const fetchCounts = useCallback(async () => {
    const keys = ["", "Pending", "Done"];
    const results = await Promise.allSettled(
      keys.map((status) => diyService.getAllPosts({ page: 1, limit: 1, status: status || undefined })),
    );
    const next: Record<string, number | undefined> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") next[keys[i] || "all"] = r.value.data.data.total;
    });
    setCounts(next);
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const openEditModal = (post: DIYPost) => {
    setEditModal(post);
    setEditForm({
      title: post.title,
      description: post.description || "",
      tags: (post.tags || []).join(", "),
      price: post.price ?? 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSavingEdit(true);
    try {
      await diyService.updatePost(editModal._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        price: editForm.price,
      });
      toast.success(t("admin.diyPosts.updateSuccess"));
      setEditModal(null);
      fetchPosts();
    } catch {
      toast.error(t("admin.diyPosts.updateError"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmPost = async (id: string) => {
    setStatusUpdating(true);
    try {
      await diyService.updatePostStatus(id, { status: "Done" });
      toast.success(t("admin.diyPosts.updateSuccess"));
      setSelectedPost(null);
      fetchPosts();
      fetchCounts();
    } catch {
      toast.error(t("admin.diyPosts.updateError"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (post: DIYPost) => {
    try {
      await diyService.deletePost(post._id);
      toast.success(t("admin.diyPosts.deleteSuccess"));
      fetchPosts();
      fetchCounts();
    } catch {
      toast.error(t("admin.diyPosts.deleteError"));
    }
  };

  // Lọc theo search (title / id / tags) trên cửa sổ dữ liệu đã tải, rồi
  // phân trang ở FE khi đang search (mỗi trang 10 kết quả).
  const searchNeedle = debouncedSearch.trim().toLowerCase();
  const matchedPosts = searchNeedle
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchNeedle) ||
          post._id.toLowerCase().includes(searchNeedle) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(searchNeedle)),
      )
    : posts;
  const visiblePosts = isSearching
    ? matchedPosts.slice((page - 1) * 10, page * 10)
    : matchedPosts;
  const displayTotalPages = isSearching
    ? Math.max(1, Math.ceil(matchedPosts.length / 10))
    : totalPages;
  const displayTotal = isSearching ? matchedPosts.length : total;

  const statusKey = (post: DIYPost) => {
    const st = (post.status || "Pending").toLowerCase();
    return st === "done" ? "Done" : st === "cancel" ? "Cancel" : "Pending";
  };
  const isPending = (post: DIYPost) => statusKey(post) === "Pending";
  const statusPill = (post: DIYPost) => {
    const key = statusKey(post);
    return (
      <AdminPill tone={key === "Done" ? "green" : key === "Cancel" ? "rose" : "amber"}>
        {t(`admin.diyPosts.status${key}`)}
      </AdminPill>
    );
  };
  const authorName = (post: DIYPost) =>
    typeof post.creatorId === "object" && post.creatorId
      ? post.creatorId.fullName || post.creatorId.username || "—"
      : "—";

  const { sort, apply: applySort } = useAdminGridSort<DIYPost>((post, field) => {
    if (field === "title") return post.title;
    if (field === "author") return authorName(post);
    if (field === "price") return post.price ?? 0;
    if (field === "date") return new Date(post.createdAt).getTime();
    if (field === "status") return statusKey(post);
    return null;
  });
  const rows = applySort(visiblePosts);
  const selectedRows = rows.filter((p) => selected.has(p._id));
  const approvable = selectedRows.filter(isPending);

  const handleBulkApprove = async () => {
    if (approvable.length === 0) return;
    setStatusUpdating(true);
    const results = await Promise.allSettled(
      approvable.map((p) => diyService.updatePostStatus(p._id, { status: "Done" })),
    );
    setStatusUpdating(false);
    const done = results.filter((r) => r.status === "fulfilled").length;
    if (done) toast.success(t("admin.diyPosts.bulkApproved", { count: done }));
    if (approvable.length - done) toast.error(t("admin.diyPosts.bulkFailed", { count: approvable.length - done }));
    setSelected(new Set());
    fetchPosts();
    fetchCounts();
  };

  const confirmDelete = async (post: DIYPost) => {
    const ok = await confirm({
      title: t("admin.diyPosts.deleteConfirm"),
      description: t("admin.diyPosts.deleteWarning", { title: post.title }),
      confirmLabel: t("admin.diyPosts.delete"),
      danger: true,
      icon: Trash2,
    });
    if (ok) await handleDelete(post);
  };

  const columns: AdminGridColumn<DIYPost>[] = [
    {
      key: "title",
      header: t("admin.diyPosts.post"),
      width: "minmax(230px, 2fr)",
      minWidth: 230,
      sortable: true,
      card: "title",
      render: (post) => (
        <AdminCellStack
          media={post.images?.[0] ? <img src={post.images[0]} alt="" loading="lazy" /> : <Scissors />}
          primary={post.title}
          secondary={
            <>
              <span className="adm-gmono">#{post._id.slice(-8).toUpperCase()}</span>
              {post.tags?.length ? ` · ${post.tags.slice(0, 3).map((tag) => `#${tag}`).join(" ")}` : ""}
            </>
          }
        />
      ),
    },
    {
      key: "author",
      header: t("admin.diyPosts.author"),
      width: "minmax(130px, 1fr)",
      minWidth: 130,
      sortable: true,
      render: (post) => (
        <AdminCellStack
          primary={authorName(post)}
          secondary={t("admin.diyPosts.likes", { count: post.likeCount ?? 0 })}
        />
      ),
    },
    {
      key: "price",
      header: t("admin.diyPosts.price"),
      width: "120px",
      minWidth: 120,
      align: "right",
      sortable: true,
      render: (post) => (
        <>
          {post.price && post.price > 0 ? (
            <AdminMoney value={post.price} />
          ) : (
            <span className="adm-gprimary">{t("admin.grid.free")}</span>
          )}
          <span className="adm-gsecondary">{t("admin.diyPosts.purchases", { count: post.purchaseCount ?? 0 })}</span>
        </>
      ),
    },
    {
      key: "date",
      header: t("admin.diyPosts.created"),
      width: "100px",
      minWidth: 100,
      sortable: true,
      render: (post) => <AdminDateCell value={post.createdAt} />,
    },
    {
      key: "status",
      header: t("admin.diyPosts.status"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: statusPill,
    },
    {
      key: "actions",
      header: t("admin.diyPosts.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (post) => (
        <AdminRowActions>
          {isPending(post) ? (
            <AdminActionButton
              icon={CheckCircle}
              tone="green"
              label={t("admin.diyPosts.approve")}
              busy={statusUpdating}
              onClick={() => void handleConfirmPost(post._id)}
            />
          ) : (
            <AdminActionButton icon={Edit3} label={t("admin.diyPosts.edit")} onClick={() => openEditModal(post)} />
          )}
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.diyPosts.view"), icon: Eye, onSelect: () => setSelectedPost(post) },
              isPending(post) && { label: t("admin.diyPosts.edit"), icon: Edit3, onSelect: () => openEditModal(post) },
              {
                label: t("admin.diyPosts.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                onSelect: () => void confirmDelete(post),
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
        eyebrow={t("admin.diyPosts.eyebrow")}
        title={t("admin.diyPosts.title")}
        subtitle={t("admin.diyPosts.subtitle")}
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                fetchPosts();
                fetchCounts();
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            <CreateButton to="/admin/diy-posts/new" label={t("admin.diyPosts.createPost")} />
          </>
        }
      />

      <AdminStatusTabs<string>
        ariaLabel={t("admin.diyPosts.filterStatus")}
        value={filterStatus}
        onChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        tabs={[
          { value: "", label: t("admin.diyPosts.allStatus"), icon: Layers, count: counts.all },
          { value: "Pending", label: t("admin.diyPosts.statusPending"), icon: Clock, tone: "amber", count: counts.Pending },
          { value: "Done", label: t("admin.diyPosts.statusDone"), icon: CheckCircle, tone: "green", count: counts.Done },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchInput,
            onChange: (value) => {
              setSearchInput(value);
              setPage(1);
            },
            placeholder: t("admin.diyPosts.searchPlaceholder"),
            isSearching: searchIsWaiting || loading,
          }}
          onReset={
            searchInput || filterStatus
              ? () => {
                  clearSearch();
                  setFilterStatus("");
                  setPage(1);
                }
              : undefined
          }
          selectedCount={selectedRows.length}
          onClearSelection={() => setSelected(new Set())}
          bulkActions={
            <AdminActionButton
              icon={CheckCircle}
              tone="green"
              fixedWidth={false}
              busy={statusUpdating}
              disabled={approvable.length === 0}
              label={`${t("admin.diyPosts.approveSelected")}${approvable.length && approvable.length !== selectedRows.length ? ` (${approvable.length})` : ""}`}
              onClick={() => void handleBulkApprove()}
            />
          }
          meta={
            debouncedSearch ? (
              <AdminSearchMeta searching={searchIsWaiting || loading}>
                {matchedPosts.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: matchedPosts.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<DIYPost>
          ariaLabel={t("admin.diyPosts.title")}
          rows={rows}
          rowKey={(p) => p._id}
          columns={columns}
          loading={loading && posts.length === 0}
          refreshing={loading && posts.length > 0}
          sort={sort}
          selection={{ selected, onChange: setSelected }}
          onRowClick={(p) => setSelectedPost(p)}
          rowAccent={(p) => (isPending(p) ? "amber" : null)}
          empty={{ icon: Scissors, title: t("admin.diyPosts.noPostsFound") }}
        />

        <AdminGridFooter
          page={page}
          totalPages={displayTotalPages}
          total={displayTotal}
          pageSize={10}
          onPageChange={setPage}
          disabled={loading}
        />
      </AdminPanel>

      {confirmDialog}

      {/* View Detail Modal */}
      {selectedPost && (
        <AdminModal
          variant="view"
          icon={Scissors}
          eyebrow="Bài DIY"
          title={selectedPost.title}
          subtitle={<>ID <span className="font-mono">{selectedPost._id.slice(-8)}</span> · {formatCreatedAt(selectedPost.createdAt)}</>}
          media={selectedPost.images?.[0] ? <img src={selectedPost.images[0]} alt="" className="adm-dlg-thumb" /> : undefined}
          badges={statusPill(selectedPost)}
          headerActions={
            <ReportButton targetType="diy_post" targetId={selectedPost._id} targetTitle={selectedPost.title} />
          }
          onClose={() => setSelectedPost(null)}
          footer={
            <>
              <button type="button" onClick={() => setSelectedPost(null)} className="btn-modal-cancel">
                {t("admin.grid.close")}
              </button>
              {isPending(selectedPost) && (
                <button
                  type="button"
                  onClick={() => handleConfirmPost(selectedPost._id)}
                  disabled={statusUpdating}
                  className="btn-modal-primary"
                >
                  <CheckCircle className="w-4 h-4" /> {t("admin.diyPosts.approve")}
                </button>
              )}
            </>
          }
        >
          <div className="admin-dialog-body">
            <AdminDetailItem label={t("admin.diyPosts.modal.descriptionField") || "Description"}>
              {selectedPost.description ? (
                <p className="whitespace-pre-wrap leading-relaxed font-normal">{selectedPost.description}</p>
              ) : (
                <span className="italic text-muted-foreground font-normal">No description provided</span>
              )}
            </AdminDetailItem>

            <AdminDetailGrid>
              <AdminDetailItem label={t("admin.diyPosts.modal.tagsField") || "Tags"}>
                {selectedPost.tags && selectedPost.tags.length > 0 ? (
                  <div className="adm-chips">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="adm-chip">#{tag}</span>
                    ))}
                  </div>
                ) : (
                  <span className="italic text-muted-foreground font-normal">No tags</span>
                )}
              </AdminDetailItem>
              <AdminDetailItem label={t("admin.diyPosts.modal.priceField") || "Price"}>
                <span className="text-base font-semibold text-primary">
                  {selectedPost.price && selectedPost.price > 0
                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedPost.price)
                    : "Free"}
                </span>
              </AdminDetailItem>
            </AdminDetailGrid>

            {selectedPost.images && selectedPost.images.length > 0 && (
              <>
                <AdminDialogSection icon={ImageIcon}>Attached images ({selectedPost.images.length})</AdminDialogSection>
                <div className="adm-gallery">
                  {selectedPost.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noreferrer" className="adm-gallery-item">
                      <img src={img} alt="" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </AdminModal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <AdminModal
          variant="edit"
          eyebrow={t("admin.diyPosts.editingTitle")}
          title={editForm.title || editModal.title}
          subtitle={<>ID <span className="font-mono">{editModal._id.slice(-8)}</span></>}
          onClose={() => setEditModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                disabled={savingEdit}
                className="btn-modal-cancel"
              >
                {t("admin.diyPosts.modal.cancel")}
              </button>
              <button type="submit" form="diy-edit-form" disabled={savingEdit} className="btn-modal-primary">
                {savingEdit ? (
                  t("admin.diyPosts.modal.saving")
                ) : (
                  <>
                    <Check className="w-4 h-4" /> {t("admin.diyPosts.modal.updatePost")}
                  </>
                )}
              </button>
            </>
          }
        >
          <form
            id="diy-edit-form"
            className="admin-dialog-body admin-dialog-grid"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
          >
            <AdminField label={t("admin.diyPosts.modal.titleField")} required span htmlFor="diy-edit-title">
              <input
                id="diy-edit-title"
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="input w-full"
                placeholder="Enter the post title..."
              />
            </AdminField>
            <AdminField label={t("admin.diyPosts.modal.descriptionField")} span htmlFor="diy-edit-desc">
              <textarea
                id="diy-edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                className="input w-full resize-none py-3"
                placeholder="Write a detailed description..."
              />
            </AdminField>
            <AdminField
              label={t("admin.diyPosts.modal.tagsField")}
              hint="Phân tách bằng dấu phẩy"
              htmlFor="diy-edit-tags"
            >
              <input
                id="diy-edit-tags"
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="input w-full"
                placeholder="e.g. funny, pokemon, ghibli"
              />
            </AdminField>
            <AdminField label={`${t("admin.diyPosts.modal.priceField")} (VND)`} hint="0 = miễn phí" htmlFor="diy-edit-price">
              <input
                id="diy-edit-price"
                type="number"
                value={editForm.price || ""}
                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                className="input w-full font-mono"
                placeholder="0"
                min={0}
              />
            </AdminField>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
