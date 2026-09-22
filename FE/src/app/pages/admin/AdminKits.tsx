// ============================================================
// Admin Kits Management — route /admin/kits
// Full CRUD operations for kits (Admin/Staff)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Edit2,
  Eye,
  Package,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { kitService, type Kit, type KitProductInput } from "../../../shared/api/kitService";
import { productService } from "../../../shared/api/productService";
import { formatPrice } from "../../../lib/formatPrice";
import type { BackendProduct } from "../../../shared/types/product.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import {
  AdminSearchInput,
  AdminSearchMeta,
  AdminSearchToolbar,
} from "../../../shared/components/admin/AdminSearch";
import { cn } from "../../../shared/components/ui/utils";
import {
  AdminTableBodySkeleton,
  AdminPickerSkeleton,
  SkeletonBlock,
} from "../../../shared/components/skeletons/AdminSkeleton";

/**
 * Bộ lọc trạng thái kit (giống /admin/products):
 * - "active": chỉ kit đang bán
 * - "hidden": chỉ kit đã ẩn (isActive = false)
 * - "all": cả hai loại (FE gộp vì BE không trả cả hai trong 1 request)
 */
type KitStatusFilter = "active" | "hidden" | "all";

const KITS_PAGE_SIZE = 10;

/**
 * Cửa sổ tải khi đang search: BE /kits không có tham số `search`, nên FE tải
 * tối đa 100 kit rồi lọc + phân trang ở FE để search không bị giới hạn trong
 * 10 dòng của trang hiện tại.
 */
const SEARCH_WINDOW = 100;

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
  // Kit của chế độ "Tất cả" (đang bán + đã ẩn): BE không trả cả hai loại trong
  // 1 request nên FE gộp rồi tự phân trang. null = đang dùng dữ liệu của BE.
  const [allKits, setAllKits] = useState<Kit[] | null>(null);
  const [loading, setLoading] = useState(true);
  // Làm mới NGẦM (đổi filter/trang, sau create/update/delete): bảng giữ nguyên
  // dữ liệu cũ, chỉ mờ nhẹ trong lúc chờ → không còn cảnh bảng biến mất rồi
  // hiện lại (trước đây mỗi lần refresh đều bật `loading` → thay cả bảng bằng
  // skeleton, nhìn như "một trang khác bị chèn vào rồi mất đi").
  const [refreshing, setRefreshing] = useState(false);
  // Đã tải xong lần đầu chưa — chỉ lần đầu mới dùng skeleton.
  const hasLoadedOnce = useRef(false);
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<KitStatusFilter>("active");
  const { inputValue: searchQuery, debouncedValue: debouncedSearchQuery, setInputValue: setSearchQuery, isWaiting: searchIsWaiting, clear: clearSearch } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [detailKit, setDetailKit] = useState<Kit | null>(null);

  const fetchKits = useCallback(async (page: number, options?: { silent?: boolean }) => {
    // Skeleton CHỈ ở lần tải đầu tiên; mọi lần tải sau đều giữ data cũ trên
    // bảng (xem `refreshing`) → giao diện không nhảy.
    const useSkeleton = !options?.silent && !hasLoadedOnce.current;
    if (useSkeleton) setLoading(true);
    else setRefreshing(true);

    try {
      const level = levelFilter === "all" ? undefined : levelFilter;
      // Đang search: BE không hỗ trợ tham số `search` cho /kits nên tải 1 cửa sổ
      // rộng (100 kit) rồi lọc + phân trang ở FE → search được TOÀN BỘ danh sách
      // thay vì chỉ 10 dòng của trang hiện tại.
      const isSearching = debouncedSearchQuery.trim().length > 0;
      const limit = isSearching ? SEARCH_WINDOW : KITS_PAGE_SIZE;
      const targetPage = isSearching ? 1 : page;

      if (statusFilter === "all") {
        // Gọi cả kit đang bán + đã ẩn rồi gộp, phân trang ở FE (getAllStatuses)
        const merged = await kitService.getAllStatuses({ level });
        setAllKits(merged);
        setKits([]);
        setTotalPages(Math.max(1, Math.ceil(merged.length / KITS_PAGE_SIZE)));
        return;
      }

      const res = await kitService.getAll({
        page: targetPage,
        limit,
        level,
        // "đã ẩn" -> isActive=false; "đang bán" -> không truyền (BE mặc định true)
        isActive: statusFilter === "hidden" ? false : undefined,
      });
      setAllKits(null);
      setKits(res.data.data?.kits || []);
      setTotalPages(res.data.data?.totalPages || 1);
    } catch {
      toast.error(t("admin.kits.loadError"));
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery, levelFilter, statusFilter, t]);

  useEffect(() => {
    fetchKits(currentPage);
  }, [fetchKits, currentPage]);

  /** Về trang 1 ngay khi gõ để chỉ có 1 request (tránh 2 request đua nhau). */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || levelFilter !== "all" || statusFilter !== "active";

  const handleDelete = async (kitId: string) => {
    // Confirmation now lives in <ConfirmDeleteButton /> (click → dialog).
    try {
      await kitService.delete(kitId);
      toast.success(t("admin.kits.deleteSuccess"));
      // Làm mới im lặng: danh sách không nháy skeleton sau khi xoá.
      fetchKits(currentPage, { silent: true });
    } catch {
      toast.error(t("admin.kits.deleteError"));
    }
  };

  // Bộ lọc search dùng chung cho 2 chế độ tải sẵn dữ liệu (chế độ "Tất cả" và
  // chế độ "đang search") — cả hai đều phân trang ở FE.
  const searchNeedle = debouncedSearchQuery.trim().toLowerCase();
  const matchesSearch = (kit: Kit) =>
    !searchNeedle ||
    kit.name.toLowerCase().includes(searchNeedle) ||
    kit.description.toLowerCase().includes(searchNeedle);

  const fePagedSource = allKits ?? (searchNeedle ? kits : null);
  const matchedKits = fePagedSource ? fePagedSource.filter(matchesSearch) : kits;

  // Chế độ "Tất cả"/đang search: cắt trang ở FE; chế độ thường: BE đã trả 1 trang.
  const visibleKits = fePagedSource
    ? matchedKits.slice((currentPage - 1) * KITS_PAGE_SIZE, currentPage * KITS_PAGE_SIZE)
    : matchedKits;
  const displayTotalPages = fePagedSource
    ? Math.max(1, Math.ceil(matchedKits.length / KITS_PAGE_SIZE))
    : totalPages;

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
        <CreateButton
          label={t("admin.kits.createKit")}
          onClick={() => setShowCreateModal(true)}
        />
      </div>

      {/* Filters + Table */}
      <div
        className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Filters — search dùng chung component (debounce 400ms) */}
        <AdminSearchToolbar
          search={{
            value: searchQuery,
            onChange: handleSearchChange,
            placeholder: t("admin.kits.searchPlaceholder"),
            isSearching: searchIsWaiting || refreshing,
          }}
          filters={
            <>
              <div className="relative w-full sm:w-44">
                <select
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input w-full appearance-none bg-none"
                  style={{ paddingRight: "2.5rem" }}
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            {/* Lọc trạng thái — giống /admin/products. BE cho phép lấy kit đã ẩn
                qua ?isActive=false (không đòi quyền Admin như products). */}
            <AdminSelect
              className="w-full sm:w-44"
              value={statusFilter}
              options={[
                {
                  value: "active",
                  label: t("admin.kits.active"),
                  dotClassName: "bg-emerald-500",
                },
                {
                  value: "hidden",
                  label: t("admin.kits.inactive"),
                  dotClassName: "bg-rose-500",
                },
                {
                  value: "all",
                  label: t("admin.kits.all"),
                  dotClassName: "bg-slate-400",
                },
              ]}
              onChange={(value) => {
                setStatusFilter(value as KitStatusFilter);
                setCurrentPage(1);
              }}
            />
            </>
          }
          onReset={
            hasActiveFilters
              ? () => {
                  clearSearch();
                  setLevelFilter("all");
                  setStatusFilter("active");
                  setCurrentPage(1);
                }
              : undefined
          }
          resetLabel={t("admin.clearFilters")}
          meta={
            searchQuery || debouncedSearchQuery ? (
              <AdminSearchMeta searching={searchIsWaiting || refreshing}>
                {matchedKits.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: matchedKits.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        {/* Kits Table */}
        {loading ? (
          // Skeleton bám đúng 6 cột thật: kit (ảnh + tên), level, giá,
          // số sản phẩm, trạng thái và cột thao tác view/edit/delete.
          <AdminTableBodySkeleton
            columns={[
              "media",
              { type: "badge", align: "center" },
              { type: "money", align: "center" },
              { type: "number", align: "center" },
              { type: "badge", align: "center" },
              { type: "actions", align: "center", className: "w-[130px]" },
            ]}
            rows={6}
          />
        ) : visibleKits.length === 0 ? (
          <div className="admin-empty-state" style={{ background: "var(--card)" }}>
            <Package size={48} />
            <p>
              {statusFilter === "hidden"
                ? t("admin.kits.noHiddenKits")
                : t("admin.kits.noKitsFound")}
            </p>
            <p className="text-sm">{t("admin.kits.noKitsHint")}</p>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-x-auto transition-opacity duration-200",
              // Làm mới ngầm: chỉ mờ nhẹ để biết đang tải, KHÔNG thay bằng skeleton.
              refreshing && "opacity-60",
            )}
            style={{ background: "var(--card)" }}
            aria-busy={refreshing}
          >
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.kits.kit")}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground" style={{ textAlign: "center" }}>{t("admin.kits.level")}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground" style={{ textAlign: "center" }}>{t("admin.kits.price")}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground" style={{ textAlign: "center" }}>{t("admin.kits.products")}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground" style={{ textAlign: "center" }}>{t("admin.kits.status")}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground w-[130px]" style={{ textAlign: "center" }}>{t("admin.kits.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleKits.map((kit) => (
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
                    <td className="px-6 py-4 text-center">
                      <span className={`badge capitalize ${LEVEL_BADGE_CLASS[kit.level] ?? "badge-gray"}`}>
                        {kit.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "var(--primary)" }}>
                      {formatPrice(kit.price)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {(kit.products || []).length} {t("admin.kits.items")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge ${kit.isActive ? "badge-green" : "badge-red"}`}>
                        {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setDetailKit(kit)}
                          className="admin-action-btn view"
                          title={t("admin.kits.view")}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingKit(kit)}
                          className="admin-action-btn edit"
                          title={t("admin.kits.edit")}
                        >
                          <Edit2 size={16} />
                        </button>
                        <ConfirmDeleteButton
                          onDelete={() => handleDelete(kit._id)}
                          itemName={kit.name}
                          disabled={!kit.isActive}
                          disabledTitle={t("admin.kits.deleteInactiveHint")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        page={currentPage}
        totalPages={displayTotalPages}
        onPageChange={setCurrentPage}
        pageSize={KITS_PAGE_SIZE}
      />

      {/* Create/Edit Modal */}
      {(showCreateModal || editingKit) && (
        <KitFormModal
          kit={editingKit}
          onClose={() => {
            setShowCreateModal(false);
            setEditingKit(null);
          }}
          onSuccess={() => {
            // Refresh im lặng: modal đóng ngay, bảng phía sau giữ nguyên dữ liệu
            // cũ rồi cập nhật tại chỗ (không nháy skeleton toàn bảng).
            fetchKits(currentPage, { silent: true });
            setShowCreateModal(false);
            setEditingKit(null);
          }}
        />
      )}

      {/* Detail Modal — read: fetch chi tiết mới nhất + skeleton trong lúc chờ */}
      {detailKit && (
        <KitDetailModal
          key={detailKit._id}
          kitId={detailKit._id}
          initialKit={detailKit}
          onClose={() => setDetailKit(null)}
        />
      )}
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

  // Auto-calculate price based on selected products (giá luôn tự cộng)
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
    // Portal + CSS-only animation (xem AdminModal): modal không còn nằm trong
    // cây trang nên mở/đóng không làm nhảy layout hay cuộn nền phía sau.
    <AdminModal
      title={kit ? t("admin.kits.editKit") : t("admin.kits.createKit")}
      onClose={onClose}
      className="max-w-2xl w-full"
      // Đang lưu thì không cho đóng bằng click nền (tránh mất thao tác).
      closeOnBackdrop={!loading}
    >
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

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
              {t("admin.kits.level")} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
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
                className="input w-full appearance-none bg-none pr-10"
              >
                <option value="beginner">{t("admin.kits.beginner")}</option>
                <option value="intermediate">{t("admin.kits.intermediate")}</option>
                <option value="advanced">{t("admin.kits.advanced")}</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          {/* Giá tự động cộng — hiển thị read-only, không nhập tay */}
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: "var(--muted)" }}
          >
            <div>
              <span className="text-xs text-muted-foreground">
                {t("admin.kits.totalPrice")}
              </span>
              <div
                className="text-2xl font-bold mt-0.5"
                style={{ color: "var(--primary)" }}
              >
                {formatPrice(formData.price)}
              </div>
            </div>
            <Package className="size-7 text-muted-foreground/50" />
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
                {/* Cùng ô search chuẩn admin (debounce 400ms + nút xoá + spinner) */}
                <AdminSearchInput
                  value={productSearch}
                  onChange={setProductSearch}
                  placeholder={t("admin.kits.searchProducts")}
                  isSearching={loadingProducts || (productSearch !== debouncedProductSearch)}
                  size="sm"
                  autoFocus
                />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {loadingProducts ? (
                    // Danh sách sản phẩm trong kit đang tải — skeleton đúng
                    // hình dạng row thật (thumbnail + tên + giá).
                    <AdminPickerSkeleton rows={4} withThumb />
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
    </AdminModal>
  );
}

// Kit Detail Modal Component — popup xem chi tiết (read) cho /admin/kits
// Luôn fetch lại `GET /kits/:id` khi mở để có danh sách sản phẩm/giá mới nhất,
// hiển thị skeleton đúng layout trong lúc chờ; nếu API lỗi thì dùng dữ liệu
// từ row đang hiển thị (admin vẫn xem được, không bị trắng popup).
function KitDetailModal({
  kitId,
  initialKit,
  onClose,
}: {
  kitId: string;
  initialKit: Kit;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [kit, setKit] = useState<Kit>(initialKit);
  const [loading, setLoading] = useState(true);
  // Ảnh thumbnail: hiện skeleton cho tới khi ảnh tải xong → không có khung
  // trắng rồi ảnh "bụp" vào (một trong các thứ gây cảm giác giật khi mở read).
  const [imageReady, setImageReady] = useState(false);
  // Dữ liệu từ row, dùng làm fallback — ref để effect không phụ thuộc identity
  // của object (refetch vô ích khi bảng làm mới ngầm phía sau).
  const fallbackRef = useRef(initialKit);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    kitService
      .getById(kitId)
      .then((res) => {
        if (cancelled) return;
        const fetched = res.data.data?.kit;
        // BE trả products[].productId đã populate (cần object để đọc tên/giá).
        // Nếu vì lý do nào đó không populate thì giữ dữ liệu từ row cho an toàn.
        const isPopulated =
          !!fetched &&
          (fetched.products ?? []).every(
            (p) => typeof p.productId === "object" && p.productId !== null,
          );
        setKit(isPopulated ? (fetched as Kit) : fallbackRef.current);
      })
      .catch(() => {
        if (!cancelled) setKit(fallbackRef.current);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kitId]);

  return (
    <AdminModal title={kit.name} onClose={onClose} className="max-w-2xl w-full">
      {loading ? (
        // Skeleton bám đúng nội dung thật: ảnh + badge/mô tả → khối giá →
        // danh sách sản phẩm trong kit (tên, giá, × số lượng).
        <div className="admin-dialog-body space-y-5" aria-busy="true">
          <div className="flex flex-col sm:flex-row gap-4">
            <SkeletonBlock className="w-full sm:w-40 aspect-square shrink-0 rounded-xl" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-16 rounded-full" />
              </div>
              <SkeletonBlock className="h-3.5 w-full" />
              <SkeletonBlock className="h-3.5 w-4/5" />
            </div>
          </div>

          <SkeletonBlock className="h-[74px] rounded-xl" />

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-44" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--muted)" }}
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <SkeletonBlock className="h-3.5 w-40 max-w-full" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
                <SkeletonBlock className="h-3.5 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-dialog-body space-y-5">
          {/* Thumbnail */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-40 aspect-square shrink-0 overflow-hidden rounded-xl bg-muted">
              {!imageReady && <SkeletonBlock className="absolute inset-0 rounded-xl" />}
              <img
                src={kit.thumbnail}
                alt={kit.name}
                onLoad={() => setImageReady(true)}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-300",
                  imageReady ? "opacity-100" : "opacity-0",
                )}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = `https://picsum.photos/seed/${kit._id}/200/200`;
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge capitalize ${LEVEL_BADGE_CLASS[kit.level] ?? "badge-gray"}`}>
                  {kit.level}
                </span>
                <span className={`badge ${kit.isActive ? "badge-green" : "badge-red"}`}>
                  {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {kit.description}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--muted)" }}>
            <span className="text-sm text-muted-foreground">
              {t("admin.kits.totalPrice")}
            </span>
            <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {formatPrice(kit.price)}
            </span>
          </div>

          {/* Products */}
          <div>
            <p className="text-sm font-medium mb-2">
              {t("admin.kits.productsInKit")} ({(kit.products || []).length})
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(kit.products || []).map((p) => (
                <div
                  key={p.productId._id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--muted)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.productId.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(p.productId.variants[0]?.price || 0)}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">
                    × {p.quantity}
                  </span>
                </div>
              ))}
              {(kit.products || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("admin.kits.noProductsFound")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer luôn hiển thị (kể cả lúc đang tải skeleton) để đóng được ngay */}
      <div className="admin-dialog-footer">
        <button type="button" onClick={onClose} className="btn-modal-cancel">
          {t("admin.kits.cancelButton")}
        </button>
      </div>
    </AdminModal>
  );
}

