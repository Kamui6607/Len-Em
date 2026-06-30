import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  RotateCcw,
  Package,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { formatPrice } from "../../../lib/formatPrice";
import { productService, type Product } from "../../../api/productService";
import {
  VariantEditor,
  type VariantData,
  validateVariants,
  hasVariantErrors,
} from "../../components/admin/VariantEditor";
import { ColorSwatchList } from "../../components/ui/ColorSwatch";
import { useAuth } from "../../../hooks/useAuth";
import { AdminSelect } from "../../components/admin/AdminSelect";

// ─── Types ───────────────────────────────────────────────

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  image: string;
  imageFile: File | null;
  tags: string;
  variants: VariantData[];
  isActive: boolean;
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  category: "yarn",
  image: "",
  imageFile: null,
  tags: "",
  variants: [{ color: "", hexCode: "#000000", price: 0, stock: 0, image: "" }],
  isActive: true,
};

const CATEGORY_OPTIONS = ["yarn", "hook", "needle", "accessory", "kit"];

// ─── Confirm Dialog ──────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function ProductManagement() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdminOrStaff = hasRole("admin") || hasRole("staff");

  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // ─── Fetch products ───────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (showInactive) params.includeInactive = true;

      const { data: response } = await productService.getAll(params);
      const data = response.data;
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, showInactive]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Filter (client-side search within fetched data) ──
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── Modal handlers ───────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
      tags: product.tags?.join(", ") ?? "",
      imageFile: null,
      variants: (product.variants ?? []).map((v) => ({
        color: v.color,
        hexCode: v.hexCode,
        price: v.price,
        stock: v.stock,
        image: v.image ?? "",
        imageFile: null,
      })),
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  // ─── Validate ─────────────────────────────────────────

  const validate = (): boolean => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!form.category) {
      toast.error("Category is required");
      return false;
    }
    if (!editingId && !form.imageFile) {
      toast.error("Main product image is required");
      return false;
    }
    if (form.variants.length === 0) {
      toast.error("At least one variant is required");
      return false;
    }
    const vErrors = validateVariants(form.variants);
    if (hasVariantErrors(vErrors)) {
      toast.error("Please fix variant errors");
      return false;
    }
    return true;
  };

  // ─── Save (Create / Update) ───────────────────────────

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        image: form.image.trim() || undefined,
        imageFile: form.imageFile,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        variants: form.variants.map((v) => ({
          color: v.color.trim(),
          hexCode: v.hexCode,
          price: v.price,
          stock: v.stock,
          image: v.image.trim() || undefined,
          imageFile: v.imageFile ?? null,
        })),
        isActive: form.isActive,
      };

      if (editingId) {
        const { imageFile: _imageFile, variants, ...updatePayload } = payload;
        await productService.update(editingId, {
          ...updatePayload,
          variants: variants.map(
            ({ imageFile: _variantImageFile, ...variant }) => variant,
          ),
        });
        toast.success("Product updated successfully");
      } else {
        await productService.create(payload);
        toast.success("Product created successfully");
      }
      closeModal();
      fetchProducts();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      if (axiosErr.response?.status === 400) {
        toast.error(
          axiosErr.response.data?.message ||
            "Invalid input. Please check your data.",
        );
      } else if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission.");
      } else {
        toast.error(axiosErr.message || "Failed to save product");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete / Restore ─────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productService.delete(deleteTarget._id);
      toast.success("Product deleted");
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission.");
      } else {
        toast.error("Failed to delete product");
      }
      setDeleteTarget(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await productService.restore(id);
      toast.success("Product restored");
      fetchProducts();
    } catch {
      toast.error("Failed to restore product");
    }
  };

  // ── Compute min/max price helpers ──
  const priceRange = (variants: Product["variants"]) => {
    const prices = variants.map((v) => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">Product Management</h1>
          <p className="text-muted-foreground">{total} products total</p>
        </div>
        {isAdminOrStaff && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all active:scale-[0.97]"
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setPage(1);
            }}
            className="rounded border-border"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-[300px]">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Colors
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    Price range
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    Total stock
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const { min, max } = priceRange(product.variants);
                  const totalStock = product.variants.reduce(
                    (s, v) => s + v.stock,
                    0,
                  );
                  return (
                    <tr
                      key={product._id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-medium block truncate">
                              {product.name}
                            </span>
                            {product.tags && product.tags.length > 0 && (
                              <span className="text-xs text-muted-foreground truncate block mt-0.5">
                                {product.tags.slice(0, 3).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-sm bg-muted px-2.5 py-1 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ColorSwatchList
                          variants={product.variants}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-primary">
                        {min === max
                          ? formatPrice(min)
                          : `${formatPrice(min)} – ${formatPrice(max)}`}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span
                          className={
                            totalStock < 10
                              ? "text-destructive font-semibold"
                              : "text-secondary"
                          }
                        >
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {product.isActive ? "Đang bán" : "Đã ẩn"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/admin/products/${product._id}`)
                            }
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          {product.isActive ? (
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(product._id)}
                              className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors text-muted-foreground hover:text-emerald-600"
                              title="Restore"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ─── Create / Edit Modal ───────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto z-10">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold">
                {editingId ? "Edit Product" : "Create Product"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Product name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Product description"
                />
              </div>

              {/* Category + Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Category *
                  </label>
                  <AdminSelect
                    value={form.category}
                    options={CATEGORY_OPTIONS.map((category) => ({
                      value: category,
                      label: category,
                    }))}
                    onChange={(value) => setForm({ ...form, category: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Main image{" "}
                    {!editingId && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        imageFile: e.target.files?.[0] ?? null,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.imageFile ? (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {form.imageFile.name}
                    </p>
                  ) : form.image ? (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Current: {form.image}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="acrylic, bền, tươi sáng"
                />
              </div>

              {/* Variants */}
              <VariantEditor
                variants={form.variants}
                onChange={(variants) => setForm({ ...form, variants })}
              />

              {/* isActive toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="rounded border-border"
                />
                <div>
                  <span className="text-sm font-medium">Active</span>
                  <p className="text-xs text-muted-foreground">
                    Inactive products are hidden from the public shop
                  </p>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.97]"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
