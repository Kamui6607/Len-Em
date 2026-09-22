import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supportDIYService } from "../../../features/supportDIY/services/supportDIY.service";
import type { SupportDIYPost } from "../../../features/supportDIY/types/supportDIY.types";
import {
  CheckCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  Check,
  Edit3,
  X,
  XCircle,
} from "lucide-react";
import { ReportButton } from "../../../shared/components/ReportButton";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import {
  AdminSearchMeta,
  AdminSearchToolbar,
} from "../../../shared/components/admin/AdminSearch";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import {
  AdminListSkeleton,
  AdminTableBodySkeleton,
} from "../../../shared/components/skeletons/AdminSkeleton";
import { useLanguage } from "../../../shared/contexts/LanguageContext";

const STATUS_OPTIONS = ["", "Pending", "Done", "Cancel"];

type SortField = "id" | "title" | "status" | "date";
type SortDirection = "asc" | "desc";

export function AdminSupportDIYPosts() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<SupportDIYPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [selectedPost, setSelectedPost] = useState<SupportDIYPost | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Tìm kiếm: gõ phản hồi ngay, gọi API sau 400ms ngừng gõ.
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
      toast.success("Post confirmed");
      setSelectedPost(null);
      fetchPosts();
    } catch {
      toast.error("Failed to confirm post");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancelPost = async (id: string) => {
    setStatusUpdating(true);
    try {
      await supportDIYService.updatePostStatus(id, { status: "Cancel" });
      toast.success("Post cancelled");
      setSelectedPost(null);
      fetchPosts();
    } catch {
      toast.error("Failed to cancel post");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (post: SupportDIYPost) => {
    try {
      await supportDIYService.deletePost(post._id);
      toast.success("Post deleted");
      fetchPosts();
    } catch {
      toast.error("Failed to delete post");
    }
  };

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
    align?: "left" | "right" | "center";
  }) {
    const active = sortField === field;
    return (
      <th
        className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
        style={{ textAlign: align }}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : align === "center" ? "justify-center w-full" : ""}`}
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

  const sortedPosts = [...posts].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (post: SupportDIYPost) => {
      switch (sortField) {
        case "id":
          return post._id;
        case "title":
          return post.title;
        case "status":
          return post.status;
        case "date":
          return new Date(post.createdAt).getTime();
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const displayStatus = (post: SupportDIYPost) => post.status || "Pending";

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Done":
        return "badge-green";
      case "Cancel":
        return "badge-red";
      default:
        return "badge-orange";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">Support DIY Management</h1>
          <p className="text-muted-foreground">
            Manage all Support DIY requests from users
          </p>
        </div>
      </div>

      <div
        className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="p-6 border-b border-border"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="input pl-4 pr-10 py-2 flex items-center justify-between min-w-[200px]"
                style={{ paddingRight: "2.5rem" }}
              >
                <span className="text-sm">
                  {filterStatus === "" ? "All Status" : filterStatus}
                </span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div
                    className="absolute top-full mt-2 z-50 w-full min-w-[200px] rounded-lg border shadow-lg overflow-hidden"
                    style={{
                      background: "var(--dropdown-bg)",
                      borderColor: "var(--border)",
                      boxShadow: "var(--shadow-float)",
                    }}
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStatus("");
                          setPage(1);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-secondary)] transition-colors flex items-center justify-between"
                        style={{ color: "var(--foreground)" }}
                      >
                        <span>All Status</span>
                        {filterStatus === "" && (
                          <Check
                            className="w-4 h-4"
                            style={{ color: "var(--primary)" }}
                          />
                        )}
                      </button>
                      {STATUS_OPTIONS.filter(Boolean).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setFilterStatus(s);
                            setPage(1);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-secondary)] transition-colors flex items-center justify-between"
                          style={{ color: "var(--foreground)" }}
                        >
                          <span>{s}</span>
                          {filterStatus === s && (
                            <Check
                              className="w-4 h-4"
                              style={{ color: "var(--primary)" }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          // Skeleton đồng bộ với layout thật: bảng trên desktop (id, tiêu đề,
          // trạng thái, ngày, 4 nút thao tác) + list card trên mobile.
          <>
            <AdminTableBodySkeleton
              className="hidden md:block"
              columns={[
                "mono",
                "text",
                { type: "badge", align: "center" },
                { type: "text", align: "center" },
                { type: "actionsWide", align: "center", className: "w-[240px]" },
              ]}
              rows={5}
            />
            <AdminListSkeleton className="md:hidden p-4" rows={4} itemClassName="h-24 rounded-xl" />
          </>
        ) : posts.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            style={{ background: "var(--card)" }}
          >
            No Support DIY requests found.
          </div>
        ) : (
          <>
            <div
              className="hidden md:block overflow-x-auto"
              style={{ background: "var(--card)" }}
            >
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <SortableHeader label="ID" field="id" />
                    <SortableHeader label="Title" field="title" />
                    <SortableHeader label="Status" field="status" align="center" />
                    <SortableHeader label="Date" field="date" align="center" />
                    <th
                      className="text-center px-6 py-4 text-sm font-medium text-muted-foreground w-[240px]"
                      style={{ textAlign: "center" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPosts.map((post) => (
                    <tr
                      key={post._id}
                      className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        {post._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-sm">
                        {post.title}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`badge ${getStatusBadgeClass(post.status)}`}
                        >
                          {displayStatus(post)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                        {(() => {
                          try {
                            return new Date(post.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              },
                            );
                          } catch {
                            return "—";
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {post.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleConfirmPost(post._id)}
                                disabled={statusUpdating}
                                className="admin-action-btn edit"
                                title="Approve (Done)"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelPost(post._id)}
                                disabled={statusUpdating}
                                className="admin-action-btn delete"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(post)}
                            className="admin-action-btn edit"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="admin-action-btn view"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ConfirmDeleteButton
                            onDelete={() => handleDelete(post)}
                            itemName={post.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="md:hidden space-y-3 p-4"
              style={{ background: "var(--card)" }}
            >
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="p-4 rounded-xl border border-border bg-surface"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm truncate">
                      {post.title}
                    </span>
                    <span
                      className={`badge ml-2 whitespace-nowrap ${getStatusBadgeClass(post.status)}`}
                    >
                      {displayStatus(post)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    #{post._id.slice(-8)} •{" "}
                    {(() => {
                      try {
                        return new Date(post.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "2-digit", year: "numeric" },
                        );
                      } catch {
                        return "—";
                      }
                    })()}
                  </p>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="text-primary hover:underline text-xs"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={10}
              className="mt-4 p-4"
            />
          </>
        )}
      </div>

      {/* View Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="admin-dialog-content max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedPost.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request #{selectedPost._id.slice(-8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${getStatusBadgeClass(selectedPost.status)}`}
                  >
                    {displayStatus(selectedPost)}
                  </span>
                  <ReportButton
                    targetType="support_diy"
                    targetId={selectedPost._id}
                    targetTitle={selectedPost.title}
                  />
                </div>
              </div>
            </div>
            <div className="admin-dialog-body space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{selectedPost.description}</p>
              </div>
              {selectedPost.price != null && selectedPost.price > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Price
                  </p>
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedPost.price)}
                  </p>
                </div>
              )}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Images
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </p>
                <p className="text-sm">
                  {(() => {
                    try {
                      return new Date(
                        selectedPost.createdAt,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return "—";
                    }
                  })()}
                </p>
              </div>
              {selectedPost.status === "Pending" && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleConfirmPost(selectedPost._id)}
                    disabled={statusUpdating}
                    className="btn-primary"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" /> Confirm
                    (Done)
                  </button>
                  <button
                    onClick={() => handleCancelPost(selectedPost._id)}
                    disabled={statusUpdating}
                    className="btn-modal-destructive"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" /> Cancel Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditModal(null)}
        >
          <div
            className="admin-dialog-content max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <h3 className="text-base font-semibold">
                Edit Support DIY Request
              </h3>
              <button
                onClick={() => setEditModal(null)}
                style={{ color: "var(--foreground-muted)" }}
                className="admin-action-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="admin-dialog-body space-y-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="input w-full"
                    placeholder="Request title"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Request description"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    className="input w-full"
                    placeholder="e.g. support, help, crochet"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    Price
                  </label>
                  <input
                    type="number"
                    value={editForm.price || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="input w-full"
                    placeholder="0 for free"
                    min={0}
                  />
                </div>
              </div>
              <div className="admin-dialog-footer">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  disabled={savingEdit}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-modal-primary"
                >
                  {savingEdit ? "Saving…" : "Update Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
