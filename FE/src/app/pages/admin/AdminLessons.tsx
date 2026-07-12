import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Edit, Plus, Search, Trash2, Video, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { lessonService } from "../../../api/lessonService";
import type { Lesson } from "../../../features/learn/types/learn.types";

type SortField = "title" | "order" | "duration" | "products" | "preview";
type SortDirection = "asc" | "desc";

export function AdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lessonService.getAll();
      setLessons(res.data.data.lessons);
    } catch {
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await lessonService.delete(deleteId);
      toast.success("Lesson deleted successfully");
      setLessons((prev) => prev.filter((l) => l._id !== deleteId));
    } catch {
      toast.error("Failed to delete lesson");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (lesson: Lesson) => {
      switch (sortField) {
        case "title": return lesson.title;
        case "order": return lesson.order;
        case "duration": return lesson.duration;
        case "products": return lesson.linkedProduct?.length ?? 0;
        case "preview": return lesson.isPreview ? "yes" : "no";
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

  function SortableHeader({ label, field, align = "left" }: { label: string; field: SortField; align?: "left" | "right" }) {
    const active = sortField === field;
    return (
      <th className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {label}
          <span className="flex flex-col items-center justify-center -space-y-[3px]">
            <ChevronUp className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
          </span>
        </button>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Lesson Management</h1>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">Lesson Management</h1>
          <p className="text-muted-foreground">Manage all standalone lessons</p>
        </div>
        <Link to="/admin/lessons/new" className="btn-create">
          <Plus size={18} />
          +create
        </Link>
      </div>

      {/* Table */}
      <div className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--border)" }}>
        {/* Filters */}
        <div className="p-6 border-b border-border" style={{ background: "var(--surface)" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-12 input"
              style={{ paddingLeft: "3rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead className="bg-muted">
              <tr>
                <SortableHeader label="Lesson" field="title" />
                <SortableHeader label="Order" field="order" align="right" />
                <SortableHeader label="Duration" field="duration" align="right" />
                <SortableHeader label="Products" field="products" align="right" />
                <SortableHeader label="Preview" field="preview" />
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLessons.length > 0 ? (
                sortedLessons.map((lesson) => (
                  <tr key={lesson._id} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
                          <Video className="size-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-sm max-w-[400px]">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground">{lesson.videoUrl?.slice(0, 50)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{lesson.order}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{lesson.duration} min</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{lesson.linkedProduct?.length ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${lesson.isPreview ? "badge-green" : "badge-red"}`}>
                        {lesson.isPreview ? "Preview" : "Locked"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm" className="admin-action-btn view">
                          <Link to={`/admin/lessons/${lesson._id}`}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="admin-action-btn delete" onClick={() => setDeleteId(lesson._id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="admin-dialog-content">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="btn-destructive">
                                {deleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No lessons found
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