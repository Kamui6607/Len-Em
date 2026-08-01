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
import { kitService, type Kit, type KitProductInput } from "../../../api/kitService";
import { productService } from "../../../api/productService";
import { formatPrice } from "../../../lib/formatPrice";
import type { BackendProduct } from "../../../shared/types/product.types";
import { useLanguage } from "../../../context/LanguageContext";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";

const LEVEL_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("admin.kits.title")}</h1>
            <p className="text-muted-foreground">
              {t("admin.kits.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            {t("admin.kits.createKit")}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder={t("admin.kits.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
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
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-16">
              <Package
                size={64}
                className="mx-auto mb-4 text-muted-foreground opacity-40"
              />
              <h3 className="text-xl font-semibold mb-2">{t("admin.kits.noKitsFound")}</h3>
              <p className="text-muted-foreground">
                {t("admin.kits.noKitsHint")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">{t("admin.kits.kit")}</th>
                    <th className="text-left px-6 py-4 font-semibold">{t("admin.kits.level")}</th>
                    <th className="text-left px-6 py-4 font-semibold">{t("admin.kits.price")}</th>
                    <th className="text-left px-6 py-4 font-semibold">{t("admin.kits.products")}</th>
                    <th className="text-left px-6 py-4 font-semibold">{t("admin.kits.status")}</th>
                    <th className="text-right px-6 py-4 font-semibold">{t("admin.kits.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKits.map((kit) => (
                    <tr
                      key={kit._id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={kit.thumbnail}
                            alt={kit.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://picsum.photos/seed/${kit._id}/100/100`;
                              }
                            }}
                          />
                          <div>
                            <div className="font-medium">{kit.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {kit.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium capitalize
                            ${
                              kit.level === "beginner"
                                ? "bg-green-100 text-green-700"
                                : kit.level === "intermediate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          `}
                        >
                          {kit.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatPrice(kit.price)}
                      </td>
                      <td className="px-6 py-4">
                        {(kit.products || []).length} {t("admin.kits.items")}
                      </td>
                      <td className="px-6 py-4">
                         <span
                           className={`
                             px-3 py-1 rounded-full text-xs font-medium
                             ${
                               kit.isActive
                                 ? "bg-green-100 text-green-700"
                                 : "bg-gray-100 text-gray-700"
                             }
                           `}
                         >
                           {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                           <Link
                             to={`/kits/${kit._id}`}
                             className="p-2 hover:bg-muted rounded-lg transition-colors"
                             title={t("admin.kits.view")}
                           >
                             <Eye size={18} />
                           </Link>
                           <button
                             onClick={() => setEditingKit(kit)}
                             className="p-2 hover:bg-muted rounded-lg transition-colors"
                             title={t("admin.kits.edit")}
                           >
                             <Edit2 size={18} />
                           </button>
                           <button
                             onClick={() => handleDelete(kit._id)}
                             className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                             title={t("admin.kits.delete")}
                           >
                             <Trash2 size={18} />
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
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("admin.kits.previousPage")}
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {t("admin.kits.pageInfo", { page: currentPage, totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("admin.kits.nextPage")}
            </button>
          </div>
        )}
      </div>

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
      productId: p.product._id,
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {kit ? t("admin.kits.editKit") : t("admin.kits.createKit")}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("admin.kits.kitName")} *
              </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("admin.kits.descriptionPlaceholder")}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("admin.kits.level")} *
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
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="beginner">{t("admin.kits.beginner")}</option>
                <option value="intermediate">{t("admin.kits.intermediate")}</option>
                <option value="advanced">{t("admin.kits.advanced")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("admin.kits.price")} *
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
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("admin.kits.thumbnail")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          {/* Products Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
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
                      className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
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
                          className="w-8 h-8 rounded-lg bg-background border border-border hover:border-primary flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">
                          {kitProduct.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(kitProduct.productId, kitProduct.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-background border border-border hover:border-primary flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(kitProduct.productId)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      >
                        <X size={16} />
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
                className="w-full px-4 py-2.5 border-2 border-dashed border-border hover:border-primary rounded-xl text-sm font-medium transition-colors"
              >
                {t("admin.kits.addProducts")}
              </button>

            {/* Product Selector Dropdown */}
            {showProductSelector && (
              <div className="mt-3 p-4 bg-muted rounded-xl space-y-3">
                  <input
                    type="text"
                    placeholder={t("admin.kits.searchProducts")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                    autoFocus
                  />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {loadingProducts ? (
                      <div className="text-center py-4 text-muted-foreground">
                        {t("admin.kits.loadingProducts")}
                      </div>
                  ) : products.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        {t("admin.kits.noProductsFound")}
                      </div>
                  ) : (
                    products.map((product) => {
                      const isAdded = formData.products.some(p => p.productId === product._id);
                      return (
                        <div
                          key={product._id}
                          className="flex items-center gap-3 p-3 bg-background rounded-lg hover:border-primary border border-transparent transition-colors"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isAdded
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm">
              {t("admin.kits.active")}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-border rounded-full hover:bg-muted transition-colors"
              >
                {t("admin.kits.cancelButton")}
              </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
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