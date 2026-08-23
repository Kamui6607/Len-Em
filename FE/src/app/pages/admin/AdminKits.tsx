// ============================================================
// Admin Kits Management — route /admin/kits
// Full CRUD operations for kits (Admin/Staff)
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Package,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { kitService, type Kit, type KitProductInput } from "../../../shared/api/kitService";
import { productService } from "../../../shared/api/productService";
import { formatPrice } from "../../../lib/formatPrice";
import type { BackendProduct } from "../../../shared/types/product.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";

const LEVEL_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Đồng bộ màu level với AdminCourses.tsx (badge-* dùng chung, có dark mode)
const LEVEL_BADGE_CLASS: Record<string, string> = {
  beginner: "badge-green",
  intermediate: "badge-orange",
  advanced: "badge-red",
};

export function AdminKits() {
  const { t } = useLanguage();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const { inputValue: searchQuery, debouncedValue: debouncedSearchQuery, setInputValue: setSearchQuery } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);

  const fetchKits = async (page: number) => {
    setLoading(true);
    try {
      const res = await kitService.getAll({
        page,
        limit: 20,
        level: levelFilter === "all" ? undefined : levelFilter,
      });
      setKits(res.data.data?.kits || []);
      setTotalPages(res.data.data?.totalPages || 1);
    } catch {
      toast.error(t("admin.kits.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits(currentPage);
  }, [currentPage, levelFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = async (kitId: string) => {
    if (!confirm(t("admin.kits.deleteConfirm"))) return;

    try {
      await kitService.delete(kitId);
      toast.success(t("admin.kits.deleteSuccess"));
      fetchKits(currentPage);
    } catch {
      toast.error(t("admin.kits.deleteError"));
    }
  };

  const filteredKits = kits.filter((kit) => {
    if (!debouncedSearchQuery) return true;
    return (
      kit.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      kit.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="admin-page-title mb-2">{t("admin.kits.title")}</h1>
          <p className="admin-page-subtitle text-muted-foreground">
            {t("admin.kits.subtitle")}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-create">
          <Plus size={18} />
          {t("admin.kits.createKit")}
        </button>
      </div>

      {/* Filters + Table */}
      <div
        className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Filters */}
        <div
          className="admin-toolbar p-6 border-b border-border"
          style={{ background: "var(--surface)" }}
        >
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="admin-search-wrap relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder={t("admin.kits.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full"
                style={{ paddingLeft: "3rem" }}
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input sm:w-56"
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Kits Table */}
        {loading ? (
          <div
            className="flex items-center justify-center py-16"
            style={{ background: "var(--card)" }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="admin-empty-state" style={{ background: "var(--card)" }}>
            <Package size={48} />
            <p>{t("admin.kits.noKitsFound")}</p>
            <p className="text-sm">{t("admin.kits.noKitsHint")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.kit")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.level")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.price")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.products")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.status")}</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[130px]">{t("admin.kits.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredKits.map((kit) => (
                  <tr key={kit._id} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={kit.thumbnail}
                          alt={kit.name}
                          className="size-11 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${kit._id}/100/100`;
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-sm max-w-[260px]">{kit.name}</span>
                          <span className="text-xs text-muted-foreground truncate block max-w-[260px]">{kit.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge capitalize ${LEVEL_BADGE_CLASS[kit.level] ?? "badge-gray"}`}>
                        {kit.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                      {formatPrice(kit.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {(kit.products || []).length} {t("admin.kits.items")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${kit.isActive ? "badge-green" : "badge-red"}`}>
                        {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/kits/${kit._id}`}
                          className="admin-action-btn view"
                          title={t("admin.kits.view")}
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => setEditingKit(kit)}
                          className="admin-action-btn edit"
                          title={t("admin.kits.edit")}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(kit._id)}
                          className="admin-action-btn delete"
                          title={t("admin.kits.delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
          >
            {t("admin.kits.previousPage")}
          </button>
          <span className="admin-pagination-info">
            {t("admin.kits.pageInfo", { page: currentPage, totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
          >
            {t("admin.kits.nextPage")}
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingKit) && (
          <KitFormModal
            kit={editingKit}
            onClose={() => {
              setShowCreateModal(false);
              setEditingKit(null);
            }}
            onSuccess={() => {
              fetchKits(currentPage);
              setShowCreateModal(false);
              setEditingKit(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Kit Form Modal Component
function KitFormModal({
  kit,
  onClose,
  onSuccess,
}: {
  kit: Kit | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    price: number;
    isActive: boolean;
    products: KitProductInput[];
  }>({
    name: kit?.name || "",
    description: kit?.description || "",
    level: kit?.level || "beginner",
    price: kit?.price || 0,
    isActive: kit?.isActive ?? true,
    products: kit?.products.map(p => ({
      productId: p.productId._id,
      variantId: p.variantId,
      quantity: p.quantity,
    })) || [],
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const { inputValue: productSearch, debouncedValue: debouncedProductSearch, setInputValue: setProductSearch } = useDebouncedSearch({ delay: 400, minChars: 0 });

  // Fetch products for selection
  const fetchProducts = async (search: string) => {
    setLoadingProducts(true);
    try {
      const res = await productService.getAll({ 
        search: search || undefined,
        limit: 20 
      });
      setProducts(res.data.data?.products as BackendProduct[] || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Auto-calculate price based on products
  useEffect(() => {
    if (products.length > 0 && formData.products.length > 0) {
      const total = formData.products.reduce((sum, kitProduct) => {
        const product = products.find(p => p._id === kitProduct.productId);
        const price = product?.variants[0]?.price || 0;
        return sum + (price * kitProduct.quantity);
      }, 0);
      setFormData(prev => ({ ...prev, price: total }));
    }
  }, [formData.products, products]);

  useEffect(() => {
    if (showProductSelector) {
      fetchProducts(debouncedProductSearch);
    }
  }, [showProductSelector, debouncedProductSearch]);

  const handleAddProduct = (product: BackendProduct) => {
    const exists = formData.products.find(p => p.productId === product._id);
    if (!exists) {
      setFormData({
        ...formData,
        products: [...formData.products, { productId: product._id, variantId: product.variants[0]?._idVariants || '', quantity: 1 }],
      });
      toast.success(`Added ${product.name} to kit`);
    } else {
      toast.error("Product already added to kit");
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter(p => p.productId !== productId),
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setFormData({
      ...formData,
      products: formData.products.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (kit) {
        await kitService.update(kit._id, { ...formData, products: formData.products }, thumbnail || undefined);
        toast.success("Kit updated successfully");
      } else {
        await kitService.create({ ...formData, products: formData.products }, thumbnail || undefined);
        toast.success("Kit created successfully");
      }
      onSuccess();
    } catch {
      toast.error(kit ? "Failed to update kit" : "Failed to create kit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-dialog-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="admin-dialog-content max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header relative">
          <h3 className="text-base font-semibold">
            {kit ? t("admin.kits.editKit") : t("admin.kits.createKit")}
          </h3>
          <button
            onClick={onClose}
            style={{ color: "var(--foreground-muted)" }}
            className="admin-action-btn absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-dialog-body space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                {t("admin.kits.kitName")} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("admin.kits.descriptionPlaceholder")}
                className="input w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  {t("admin.kits.level")} <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value as
                        | "beginner"
                        | "intermediate"
                        | "advanced",
                    })
                  }
                  className="input w-full"
                >
                  <option value="beginner">{t("admin.kits.beginner")}</option>
                  <option value="intermediate">{t("admin.kits.intermediate")}</option>
                  <option value="advanced">{t("admin.kits.advanced")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  {t("admin.kits.price")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: Number(e.target.value),
                    })
                  }
                  className="input w-full"
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                {t("admin.kits.thumbnail")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="input w-full"
              />
            </div>

            {/* Products Selection */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                {t("admin.kits.productsInKit")}
              </label>

              {/* Selected Products */}
              {formData.products.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.products.map((kitProduct) => {
                    const product = products.find(p => p._id === kitProduct.productId);
                    return (
                      <div
                        key={kitProduct.productId}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: "var(--muted)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {product?.name || kitProduct.productId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product?.variants[0]?.price ? formatPrice(product.variants[0].price) : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(kitProduct.productId, kitProduct.quantity - 1)}
                            className="admin-action-btn !w-8 !h-8"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-sm">
                            {kitProduct.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(kitProduct.productId, kitProduct.quantity + 1)}
                            className="admin-action-btn !w-8 !h-8"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(kitProduct.productId)}
                          className="admin-action-btn delete !w-8 !h-8"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Product Button */}
              <button
                type="button"
                onClick={() => setShowProductSelector(!showProductSelector)}
                className="w-full px-4 py-2.5 border-2 border-dashed rounded-xl text-sm font-medium transition-colors hover:border-primary"
                style={{ borderColor: "var(--border)" }}
              >
                {t("admin.kits.addProducts")}
              </button>

              {/* Product Selector Dropdown */}
              {showProductSelector && (
                <div className="mt-3 p-4 rounded-xl space-y-3" style={{ background: "var(--muted)" }}>
                  <input
                    type="text"
                    placeholder={t("admin.kits.searchProducts")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input w-full"
                    autoFocus
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingProducts ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        {t("admin.kits.loadingProducts")}
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        {t("admin.kits.noProductsFound")}
                      </div>
                    ) : (
                      products.map((product) => {
                        const isAdded = formData.products.some(p => p.productId === product._id);
                        return (
                          <div
                            key={product._id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-primary transition-colors"
                            style={{ background: "var(--card)" }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="size-10 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = "true";
                                  target.src = `https://picsum.photos/seed/${product._id}/100/100`;
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatPrice(product.variants[0]?.price || 0)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              disabled={isAdded}
                              className={isAdded ? "btn-secondary !py-1.5 !px-3 text-xs" : "btn-primary !py-1.5 !px-3 text-xs"}
                            >
                              {isAdded ? t("admin.kits.added") : t("admin.kits.add")}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-border"
              />
              <span className="text-sm font-medium">{t("admin.kits.active")}</span>
            </label>
          </div>

          <div className="admin-dialog-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-modal-cancel"
            >
              {t("admin.kits.cancelButton")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modal-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : kit ? (
                t("admin.kits.updateButton")
              ) : (
                t("admin.kits.createButton")
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}