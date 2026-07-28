import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  X,
  RotateCcw,
  Package,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { HoldToDeleteButton } from "../../components/admin/HoldToDeleteButton";
import { useNavigate } from "react-router";
import { formatPrice } from "../../../lib/formatPrice";
import { productService, type Product } from "../../../api/productService";
import {
  VariantEditor,
  type VariantData,
  validateVariants,
  hasVariantErrors,
} from "../../components/admin/VariantEditor";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { AdminSelect } from "../../components/admin/AdminSelect";

// ─── Types ───────────────────────────────────────────────

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  image: string;
  imageFile: File | null;
  tags: string;
  price: number;
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
  price: 0,
  variants: [{ color: "", hexCode: "#000000", price: 0, stock: 0, image: "" }],
  isActive: true,
};

const CATEGORY_OPTIONS = ["yarn", "hook", "needle", "accessory", "kit"];

// ─── Confirm Dialog ──────────────────────────────────────

// Removed — replaced by HoldToDeleteButton

// ─── Main Component ──────────────────────────────────────

export function ProductManagement() {
  const { t } = useLanguage();
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
      const apiData = response.data;
      setProducts(apiData?.products ?? []);
      setTotal(apiData?.total ?? 0);
      setTotalPages(apiData?.totalPages ?? 1);
    } catch {
      toast.error(t("admin.products.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, showInactive, t]);

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

  const applyPriceToVariants = (price: number, variants: VariantData[]): VariantData[] => {
    return variants.map((v) => ({ ...v, price }));
  };

  const openEdit = (product: Product) => {
    const firstPrice = product.variants[0]?.price ?? 0;
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
      tags: product.tags?.join(", ") ?? "",
      imageFile: null,
      price: firstPrice,
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
      toast.error(t("admin.products.nameRequired"));
      return false;
    }
    if (!form.category) {
      toast.error(t("admin.products.categoryRequired"));
      return false;
    }
    if (!editingId && !form.imageFile) {
      toast.error(t("admin.products.imageRequired"));
      return false;
    }
    if (form.variants.length === 0) {
      toast.error(t("admin.products.variantRequired"));
      return false;
    }
    const vErrors = validateVariants(form.variants);
    if (hasVariantErrors(vErrors)) {
      toast.error(t("admin.products.fixVariantErrors"));
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
        const { variants, imageFile: _imageFile, ...updatePayload } = payload;
        void _imageFile;
        await productService.update(editingId, {
          ...updatePayload,
          variants: variants.map((variant) => {
            const { imageFile, ...rest } = variant;
            void imageFile;
            return rest;
          }),
        });
        toast.success(t("admin.products.updateSuccess"));
      } else {
        await productService.create(payload);
        toast.success(t("admin.products.createSuccess"));
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
            t("admin.products.invalidInput"),
        );
      } else if (axiosErr.response?.status === 403) {
        toast.error(t("admin.products.noPermission"));
      } else {
        toast.error(axiosErr.message || t("admin.products.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete / Restore ─────────────────────────────────

  const handleRestore = async (id: string) => {
    try {
      await productService.restore(id);
      toast.success(t("admin.products.restoreSuccess"));
      fetchProducts();
    } catch {
      toast.error(t("admin.products.restoreError"));
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
          <h1 className="mb-2">{t("admin.products.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.products.totalCount", { count: total })}
          </p>
        </div>
        {isAdminOrStaff && (
          <button
            onClick={openCreate}
            className="btn-create"
          >
            <Plus size={18} />
            {t("admin.products.create")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Table Header */}
        <div className="p-6 border-b border-border" style={{ background: "var(--surface)" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("admin.products.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
              style={{ paddingLeft: "3rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
            />
          </div>
          <div className="mt-3">
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
              {t("admin.products.showInactive")}
            </label>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            {t("admin.products.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>{t("admin.products.noProducts")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-[300px]">
                    {t("admin.products.product")}
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    {t("admin.products.price")}
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    {t("admin.products.totalStock")}
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                    {t("admin.products.status")}
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[120px]">
                    {t("admin.products.actions")}
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
                      className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
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
                      <td className="px-6 py-4 text-right text-sm font-semibold text-primary">
                        {min === max
                          ? formatPrice(min)
                          : `${formatPrice(min)} – ${formatPrice(max)}`}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span
                          className={
                            totalStock < 10
                              ? "text-accent-red font-semibold"
                              : "text-secondary"
                          }
                        >
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`badge ${
                            product.isActive ? "badge-green" : "badge-red"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/admin/products/${product._id}`)
                            }
                            className="admin-action-btn view"
                            title={t("admin.products.viewDetails")}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="admin-action-btn edit"
                            title={t("admin.products.edit")}
                          >
                            <Edit3 size={16} />
                          </button>
                          {product.isActive ? (
                            <HoldToDeleteButton
                              onDelete={async () => {
                                try {
                                  await productService.delete(product._id);
                                  toast.success(t("admin.products.deleteSuccess"));
                                  fetchProducts();
                                } catch (err: unknown) {
                                  const axiosErr = err as { response?: { status?: number } };
                                  if (axiosErr.response?.status === 403) {
                                    toast.error(t("admin.products.noPermission"));
                                  } else {
                                    toast.error(t("admin.products.deleteError"));
                                  }
                                }
                              }}
                              title={t("admin.products.holdToDelete")}
                            />
                          ) : (
                            <button
                              onClick={() => handleRestore(product._id)}
                              className="admin-action-btn edit"
                              title={t("admin.products.restore")}
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
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("admin.products.previous")}
          </button>
          <span className="text-sm">
            {t("admin.products.page", { page, total: totalPages })}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("admin.products.next")}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-dialog-overlay" onClick={closeModal}>
          <div
            className="admin-dialog-content max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <h3 className="text-base font-semibold">
                {editingId ? t("admin.products.editProduct") : t("admin.products.createProduct")}
              </h3>
              <button
                onClick={closeModal}
                style={{ color: "var(--foreground-muted)" }}
                className="admin-action-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="admin-dialog-body space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.name")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input w-full"
                      placeholder={t("admin.products.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.category")} *
                    </label>
                    <AdminSelect
                      value={form.category}
                      options={CATEGORY_OPTIONS.map((category) => ({
                        value: category,
                        label: t(`admin.products.categories.${category}`),
                      }))}
                      onChange={(value) => setForm({ ...form, category: value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.price")} *
                    </label>
                    <input
                      type="number"
                      required
                      value={form.price || ""}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setForm({
                          ...form,
                          price,
                          variants: applyPriceToVariants(price, form.variants),
                        });
                      }}
                      className="input w-full"
                      placeholder={t("admin.products.pricePlaceholder")}
                      min={0}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.description")}
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={3}
                      className="input w-full resize-none"
                      placeholder={t("admin.products.descriptionPlaceholder")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.mainImage")} {!editingId && <span className="text-destructive">*</span>}
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
                      className="input w-full"
                    />
                    {form.imageFile ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {form.imageFile.name}
                      </p>
                    ) : form.image ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {t("admin.products.currentImage")}: {form.image}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.tags")}
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="input w-full"
                      placeholder={t("admin.products.tagsPlaceholder")}
                    />
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                      {t("admin.products.colorsStock")} *
                    </label>
                  </div>
                  <VariantEditor
                    variants={form.variants}
                    onChange={(variants) => setForm({ ...form, variants })}
                    hidePrice
                  />
                </div>

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
                    <span className="text-sm font-medium">{t("admin.products.active")}</span>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.products.inactiveDescription")}
                    </p>
                  </div>
                </label>
              </div>
              <div className="admin-dialog-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn-modal-cancel"
                >
                  {t("admin.products.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-modal-primary"
                >
                  {saving ? t("admin.products.saving") : editingId ? t("admin.products.updateProduct") : t("admin.products.createProduct")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}