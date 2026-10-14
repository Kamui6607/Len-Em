import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supportDIYService } from "../../../features/supportDIY/services/supportDIY.service";
import type { SupportDIYPost } from "../../../features/supportDIY/types/supportDIY.types";
import {
  CheckCircle,
  Clock,
  Eye,
  Edit3,
  XCircle,
  Image as ImageIcon,
  Layers,
  LifeBuoy,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ReportButton } from "../../../shared/components/ReportButton";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
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


export function AdminSupportDIYPosts() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<SupportDIYPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

  const [selectedPost, setSelectedPost] = useState<SupportDIYPost | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Tìm kiếm: debounce 400ms (ô gõ phản hồi ngay, lọc khi ngừng gõ).
  const {
    inputValue: searchInput,
    debouncedValue: debouncedSearch,
    setInputValue: setSearchInput,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const isSearching = debouncedSearch.trim().length > 0;

  // Edit modal state
  const [editModal, setEditModal] = useState<SupportDIYPost | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    tags: "",
    price: 0,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Khi đang search: tải một cửa sổ rộng (100 yêu cầu) rồi LỌC + PHÂN TRANG
      // ở FE → tìm được toàn danh sách (BE /support-diy chưa hỗ trợ `search`).
      const { data } = await supportDIYService.getAllPosts({
        page: isSearching ? 1 : page,
        limit: isSearching ? 100 : 10,
        status: filterStatus || undefined,
      });
      setPosts(data.data.posts);
      setTotal(data.data.total ?? data.data.posts.length);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error(t("admin.supportDIY.loadError"));
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
    const keys = ["", "Pending", "Done", "Cancel"];
    const results = await Promise.allSettled(
      keys.map((status) => supportDIYService.getAllPosts({ page: 1, limit: 1, status: status || undefined })),
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

  const openEditModal = (post: SupportDIYPost) => {
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
      await supportDIYService.updatePost(editModal._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        price: editForm.price,
      });
      toast.success(t("admin.supportDIY.updateSuccess"));
      setEditModal(null);
      fetchPosts();
    } catch {
      toast.error(t("admin.supportDIY.updateError"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmPost = async (id: string) => {
    setStatusUpdating(true);
    try {
      await supportDIYService.updatePostStatus(id, { status: "Done" });
      toast.success(t("admin.supportDIY.confirmSuccess"));
      setSelectedPost(null);
      fetchPosts();
      fetchCounts();
    } catch {
      toast.error(t("admin.supportDIY.confirmError"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancelPost = async (id: string) => {
    setStatusUpdating(true);
    try {
      await supportDIYService.updatePostStatus(id, { status: "Cancel" });
      toast.success(t("admin.supportDIY.cancelSuccess"));
      fetchCounts();
      setSelectedPost(null);
      fetchPosts();
    } catch {
      toast.error(t("admin.supportDIY.cancelError"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (post: SupportDIYPost) => {
    try {
      await supportDIYService.deletePost(post._id);
      toast.success(t("admin.supportDIY.deleteSuccess"));
      fetchCounts();
      fetchPosts();
    } catch {
      toast.error(t("admin.supportDIY.deleteError"));
    }
  };

  // Lọc theo search (title / id / tags) trên cửa sổ đã tải, phân trang ở FE khi đang search.
  const searchNeedle = debouncedSearch.trim().toLowerCase();
  const matchedPosts = searchNeedle
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchNeedle) ||
          post._id.toLowerCase().includes(searchNeedle) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(searchNeedle)),
      )
    : posts;
  const visiblePosts = isSearching ? matchedPosts.slice((page - 1) * 10, page * 10) : matchedPosts;
  const displayTotalPages = isSearching ? Math.max(1, Math.ceil(matchedPosts.length / 10)) : totalPages;
  const displayTotal = isSearching ? matchedPosts.length : total;

  const statusKey = (post: SupportDIYPost) => post.status || "Pending";
  const isPending = (post: SupportDIYPost) => statusKey(post) === "Pending";
  const statusPill = (post: SupportDIYPost) => {
    const key = statusKey(post);
    return (
      <AdminPill tone={key === "Done" ? "green" : key === "Cancel" ? "rose" : "amber"}>
        {t(`admin.supportDIY.status${key}`)}
      </AdminPill>
    );
  };

  const { sort, apply: applySort } = useAdminGridSort<SupportDIYPost>((post, field) => {
    if (field === "title") return post.title;
    if (field === "price") return post.price ?? 0;
    if (field === "date") return new Date(post.createdAt).getTime();
    if (field === "status") return statusKey(post);
    return null;
  });
  const rows = applySort(visiblePosts);
  const selectedRows = rows.filter((p) => selected.has(p._id));
  const pendingSelected = selectedRows.filter(isPending);

  const handleBulkStatus = async (status: "Done" | "Cancel") => {
    if (pendingSelected.length === 0) return;
    if (status === "Cancel") {
      const ok = await confirm({
        title: t("admin.supportDIY.bulkCancelTitle", { count: pendingSelected.length }),
        description: t("admin.supportDIY.bulkCancelDesc"),
        confirmLabel: t("admin.supportDIY.cancelRequest"),
        danger: true,
        icon: XCircle,
      });
      if (!ok) return;
    }
    setStatusUpdating(true);
    const results = await Promise.allSettled(
      pendingSelected.map((p) => supportDIYService.updatePostStatus(p._id, { status })),
    );
    setStatusUpdating(false);
    const done = results.filter((r) => r.status === "fulfilled").length;
    if (done) {
      toast.success(t(status === "Done" ? "admin.supportDIY.bulkDone" : "admin.supportDIY.bulkCancelled", { count: done }));
    }
    if (pendingSelected.length - done) {
      toast.error(t("admin.supportDIY.bulkFailed", { count: pendingSelected.length - done }));
    }
    setSelected(new Set());
    fetchPosts();
    fetchCounts();
  };

  const confirmDelete = async (post: SupportDIYPost) => {
    const ok = await confirm({
      title: t("admin.supportDIY.deleteConfirm"),
      description: t("admin.supportDIY.deleteWarning", { title: post.title }),
      confirmLabel: t("admin.supportDIY.delete"),
      danger: true,
      icon: Trash2,
    });
    if (ok) await handleDelete(post);
  };

  const columns: AdminGridColumn<SupportDIYPost>[] = [
    {
      key: "title",
      header: t("admin.supportDIY.request"),
      width: "minmax(220px, 2.2fr)",
      minWidth: 220,
      sortable: true,
      card: "title",
      render: (post) => (
        <AdminCellStack
          media={post.images?.[0] ? <img src={post.images[0]} alt="" loading="lazy" /> : <LifeBuoy />}
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
      key: "description",
      header: t("admin.supportDIY.description"),
      width: "minmax(130px, 1.4fr)",
      minWidth: 130,
      card: "hidden",
      render: (post) => <span className="adm-gclamp">{post.description || "—"}</span>,
    },
    {
      key: "price",
      header: t("admin.supportDIY.price"),
      width: "120px",
      minWidth: 112,
      align: "right",
      sortable: true,
      render: (post) =>
        post.price && post.price > 0 ? (
          <AdminMoney value={post.price} />
        ) : (
          <span className="adm-gprimary">{t("admin.grid.free")}</span>
        ),
    },
    {
      key: "date",
      header: t("admin.supportDIY.created"),
      width: "100px",
      minWidth: 100,
      sortable: true,
      render: (post) => <AdminDateCell value={post.createdAt} />,
    },
    {
      key: "status",
      header: t("admin.supportDIY.status"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: statusPill,
    },
    {
      key: "actions",
      header: t("admin.supportDIY.actions"),
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
              label={t("admin.supportDIY.markDone")}
              busy={statusUpdating}
              onClick={() => void handleConfirmPost(post._id)}
            />
          ) : (
            <AdminActionButton icon={Edit3} label={t("admin.supportDIY.edit")} onClick={() => openEditModal(post)} />
          )}
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.supportDIY.view"), icon: Eye, onSelect: () => setSelectedPost(post) },
              isPending(post) && { label: t("admin.supportDIY.edit"), icon: Edit3, onSelect: () => openEditModal(post) },
              isPending(post) && {
                label: t("admin.supportDIY.cancelRequest"),
                icon: XCircle,
                onSelect: () => void handleCancelPost(post._id),
              },
              {
                label: t("admin.supportDIY.delete"),
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
        eyebrow={t("admin.supportDIY.eyebrow")}
        title={t("admin.supportDIY.title")}
        subtitle={t("admin.supportDIY.subtitle")}
        actions={
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
        }
      />

      <AdminStatusTabs<string>
        ariaLabel={t("admin.supportDIY.status")}
        value={filterStatus}
        onChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        tabs={[
          { value: "", label: t("admin.supportDIY.allStatus"), icon: Layers, count: counts.all },
          { value: "Pending", label: t("admin.supportDIY.statusPending"), icon: Clock, tone: "amber", count: counts.Pending },
          { value: "Done", label: t("admin.supportDIY.statusDone"), icon: CheckCircle, tone: "green", count: counts.Done },
          { value: "Cancel", label: t("admin.supportDIY.statusCancel"), icon: XCircle, tone: "rose", count: counts.Cancel },
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
            placeholder: t("admin.supportDIY.searchPlaceholder"),
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
            <>
              <AdminActionButton
                icon={CheckCircle}
                tone="green"
                fixedWidth={false}
                busy={statusUpdating}
                disabled={pendingSelected.length === 0}
                label={t("admin.supportDIY.markDone")}
                onClick={() => void handleBulkStatus("Done")}
              />
              <AdminActionButton
                icon={XCircle}
                tone="rose"
                fixedWidth={false}
                busy={statusUpdating}
                disabled={pendingSelected.length === 0}
                label={t("admin.supportDIY.cancelRequest")}
                onClick={() => void handleBulkStatus("Cancel")}
              />
            </>
          }
          bulkNote={
            pendingSelected.length !== selectedRows.length
              ? t("admin.supportDIY.onlyPending", { count: pendingSelected.length })
              : undefined
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

        <AdminDataGrid<SupportDIYPost>
          ariaLabel={t("admin.supportDIY.title")}
          rows={rows}
          rowKey={(p) => p._id}
          columns={columns}
          loading={loading && posts.length === 0}
          refreshing={loading && posts.length > 0}
          sort={sort}
          selection={{ selected, onChange: setSelected }}
          onRowClick={(p) => setSelectedPost(p)}
          rowAccent={(p) => (isPending(p) ? "amber" : null)}
          rowMuted={(p) => statusKey(p) === "Cancel"}
          empty={{ icon: LifeBuoy, title: t("admin.supportDIY.noRequestsFound") }}
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
          size="md"
          icon={LifeBuoy}
          eyebrow="Yêu cầu hỗ trợ DIY"
          title={selectedPost.title}
          subtitle={<>Request <span className="font-mono">#{selectedPost._id.slice(-8)}</span> · {formatCreatedAt(selectedPost.createdAt)}</>}
          badges={statusPill(selectedPost)}
          headerActions={
            <ReportButton targetType="support_diy" targetId={selectedPost._id} targetTitle={selectedPost.title} />
          }
          onClose={() => setSelectedPost(null)}
          footer={
            selectedPost.status === "Pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCancelPost(selectedPost._id)}
                  disabled={statusUpdating}
                  className="btn-modal-destructive"
                >
                  <XCircle className="w-4 h-4" /> {t("admin.supportDIY.cancelRequest")}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmPost(selectedPost._id)}
                  disabled={statusUpdating}
                  className="btn-modal-primary"
                >
                  <CheckCircle className="w-4 h-4" /> {t("admin.supportDIY.markDone")}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setSelectedPost(null)} className="btn-modal-cancel">
                {t("admin.grid.close")}
              </button>
            )
          }
        >
          <div className="admin-dialog-body">
            <AdminDetailItem label="Description">
              {selectedPost.description ? (
                <p className="whitespace-pre-wrap leading-relaxed font-normal">{selectedPost.description}</p>
              ) : null}
            </AdminDetailItem>
            {selectedPost.price != null && selectedPost.price > 0 && (
              <AdminDetailItem label="Price">
                <span className="text-base font-semibold text-primary">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedPost.price)}
                </span>
              </AdminDetailItem>
            )}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <>
                <AdminDialogSection icon={ImageIcon}>Images ({selectedPost.images.length})</AdminDialogSection>
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
          size="md"
          eyebrow="Edit Support DIY Request"
          title={editForm.title || editModal.title}
          subtitle={<>Request <span className="font-mono">#{editModal._id.slice(-8)}</span></>}
          onClose={() => setEditModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                disabled={savingEdit}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button type="submit" form="support-diy-edit-form" disabled={savingEdit} className="btn-modal-primary">
                {savingEdit ? "Saving…" : "Update Request"}
              </button>
            </>
          }
        >
          <form
            id="support-diy-edit-form"
            className="admin-dialog-body admin-dialog-grid"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
          >
            <AdminField label="Title" required span htmlFor="sdiy-title">
              <input
                id="sdiy-title"
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="input w-full"
                placeholder="Request title"
              />
            </AdminField>
            <AdminField label="Description" span htmlFor="sdiy-desc">
              <textarea
                id="sdiy-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="input w-full resize-none py-3"
                placeholder="Request description"
              />
            </AdminField>
            <AdminField label="Tags" hint="Comma separated" htmlFor="sdiy-tags">
              <input
                id="sdiy-tags"
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="input w-full"
                placeholder="e.g. support, help, crochet"
              />
            </AdminField>
            <AdminField label="Price (VND)" hint="0 = free" htmlFor="sdiy-price">
              <input
                id="sdiy-price"
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
