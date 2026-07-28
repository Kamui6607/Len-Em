import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { diyService } from "../../../features/diy/services/diy.service";
import type { DIYPost } from "../../../features/diy/types/diy.types";
import {
  CheckCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  Check,
  Plus,
  Edit3,
  X,
} from "lucide-react";
import { ReportButton } from "../../components/ReportButton";
import { HoldToDeleteButton } from "../../components/admin/HoldToDeleteButton";

const STATUS_OPTIONS = ["", "Pending", "Done"];

type SortField = "id" | "title" | "status" | "date";
type SortDirection = "asc" | "desc";

export function AdminDIYPosts() {
  const [posts, setPosts] = useState<DIYPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [selectedPost, setSelectedPost] = useState<DIYPost | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<DIYPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", tags: "", price: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await diyService.getAllPosts({
        page,
        limit: 10,
        status: filterStatus || undefined,
      });
      setPosts(data.data.posts);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error("Failed to load DIY posts");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
      toast.success("Post updated successfully");
      setEditModal(null);
      fetchPosts();
    } catch {
      toast.error("Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmPost = async (id: string) => {
    setStatusUpdating(true);
    try {
      await diyService.updatePostStatus(id, { status: "Done" });
      toast.success("Post confirmed");
      setSelectedPost(null);
      fetchPosts();
    } catch {
      toast.error("Failed to confirm post");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (post: DIYPost) => {
    try {
      await diyService.deletePost(post._id);
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

  const sortedPosts = [...posts].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (post: DIYPost) => {
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

  const displayStatus = (post: DIYPost) => {
    const st = (post.status || "Pending").toLowerCase();
    return st === "done" ? "Done" : "Pending";
  };

  const isPending = (post: DIYPost) => {
    const st = (post.status || "Pending").toLowerCase();
    return st !== "done";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">DIY Posts Management</h1>
          <p className="text-muted-foreground">
            Manage all DIY posts from creators
          </p>
        </div>
        <Link to="/admin/diy-posts/new" className="btn-create">
          <Plus size={18} />
          create
        </Link>
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
          <div className="space-y-3 p-6" style={{ background: "var(--card)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            style={{ background: "var(--card)" }}
          >
            No DIY posts found.
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
                    <SortableHeader label="Status" field="status" />
                    <SortableHeader label="Date" field="date" />
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[200px]">
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
                      <td className="px-6 py-4">
                        <span
                          className={`badge ${isPending(post) ? "badge-orange" : "badge-green"}`}
                        >
                          {displayStatus(post)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {(() => { try { return new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch { return "—"; } })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending(post) && (
                            <button
                              onClick={() => handleConfirmPost(post._id)}
                              disabled={statusUpdating}
                              className="admin-action-btn edit"
                              title="Confirm"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
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
                          <HoldToDeleteButton
                            onDelete={() => handleDelete(post)}
                            title="Hold 2s to delete"
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
                      className={`badge ml-2 whitespace-nowrap ${isPending(post) ? "badge-orange" : "badge-green"}`}
                    >
                      {displayStatus(post)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    #{post._id.slice(-8)} •{" "}
                    {(() => { try { return new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch { return "—"; } })()}
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
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4 p-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary"
                >
                  Prev
                </button>
                <span className="text-sm text-muted-foreground self-center">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
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
                    Post #{selectedPost._id.slice(-8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${isPending(selectedPost) ? "badge-orange" : "badge-green"}`}
                  >
                    {displayStatus(selectedPost)}
                  </span>
                  <ReportButton
                    targetType="diy_post"
                    targetId={selectedPost._id}
                    targetTitle={selectedPost.title}
                  />
                </div>
              </div>
            </div>
            <div className="admin-dialog-body">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{selectedPost.description}</p>
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {(() => { try { return new Date(selectedPost.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } })()}
                </p>
              </div>
              {isPending(selectedPost) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleConfirmPost(selectedPost._id)}
                    disabled={statusUpdating}
                    className="btn-primary"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" /> Confirm
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
              <h3 className="text-base font-semibold">Edit DIY Post</h3>
              <button
                onClick={() => setEditModal(null)}
                style={{ color: "var(--foreground-muted)" }}
                className="admin-action-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div className="admin-dialog-body space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input w-full" placeholder="Post title" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input w-full resize-none" placeholder="Post description" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Tags (comma separated)</label>
                  <input type="text" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="input w-full" placeholder="e.g. funny, pokemon, ghibli" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Price</label>
                  <input type="number" value={editForm.price || ""} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="input w-full" placeholder="0 for free" min={0} />
                </div>
              </div>
              <div className="admin-dialog-footer">
                <button type="button" onClick={() => setEditModal(null)} disabled={savingEdit} className="btn-modal-cancel">Cancel</button>
                <button type="submit" disabled={savingEdit} className="btn-modal-primary">{savingEdit ? "Saving…" : "Update Post"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}