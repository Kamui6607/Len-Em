// ============================================================
// Admin Kits Management — route /admin/kits
// Full CRUD operations for kits (Admin/Staff)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Edit2,
  Eye,
  Package,
  PackagePlus,
  Boxes,
  X,
  Loader2,
  ChevronDown,
  EyeOff,
  Layers,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { kitService, type Kit, type KitProductInput } from "../../../shared/api/kitService";
import { productService } from "../../../shared/api/productService";
import { formatPrice } from "../../../lib/formatPrice";
import type { BackendProduct } from "../../../shared/types/product.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
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
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";
import { AdminDetailItem, AdminDialogSection, AdminModal } from "../../../shared/components/admin/AdminModal";
import {
  AdminSearchInput,
  AdminSearchMeta,
} from "../../../shared/components/admin/AdminSearch";
import { cn } from "../../../shared/components/ui/utils";
import {
  AdminPickerSkeleton,
  SkeletonBlock,
} from "../../../shared/components/skeletons/AdminSkeleton";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";

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

// Đồng bộ màu level với AdminCourses.tsx
const LEVEL_TONE: Record<string, AdminTone> = {
  beginner: "green",
  intermediate: "amber",
  advanced: "rose",
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
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<{ active?: number; hidden?: number }>({});
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

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
      setTotal(res.data.data?.total ?? (res.data.data?.kits || []).length);
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

  // Số lượng cho thẻ trạng thái (limit=1, chỉ đọc `total`).
  const fetchCounts = useCallback(async () => {
    try {
      const [activeRes, hiddenRes] = await Promise.all([
        kitService.getAll({ page: 1, limit: 1 }),
        kitService.getAll({ page: 1, limit: 1, isActive: false }),
      ]);
      setCounts({ active: activeRes.data.data?.total ?? 0, hidden: hiddenRes.data.data?.total ?? 0 });
    } catch {
      // thẻ vẫn lọc được, chỉ không có số
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  /** Về trang 1 ngay khi gõ để chỉ có 1 request (tránh 2 request đua nhau). */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || levelFilter !== "all" || statusFilter !== "active";

  const handleDelete = async (kitId: string) => {
    // Hộp xác nhận nằm ở confirmDelete (useAdminConfirm).
    try {
      await kitService.delete(kitId);
      toast.success(t("admin.kits.deleteSuccess"));
      // Làm mới im lặng: danh sách không nháy skeleton sau khi xoá.
      fetchKits(currentPage, { silent: true });
      fetchCounts();
    } catch {
      toast.error(t("admin.kits.deleteError"));
    }
  };

  const confirmDelete = async (kit: Kit) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: kit.name }),
      description: t("admin.kits.deleteConfirm"),
      confirmLabel: t("admin.kits.delete"),
      danger: true,
      icon: Trash2,
    });
    if (ok) await handleDelete(kit._id);
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

  const displayTotal = fePagedSource ? matchedKits.length : total;

  const { sort, apply: applySort } = useAdminGridSort<Kit>((kit, field) => {
    if (field === "name") return kit.name;
    if (field === "price") return kit.price;
    if (field === "stock") return kit.stock ?? 0;
    if (field === "level") return ["beginner", "intermediate", "advanced"].indexOf(kit.level);
    return null;
  });
  const rows = applySort(visibleKits);

  const columns: AdminGridColumn<Kit>[] = [
    {
      key: "name",
      header: t("admin.kits.kit"),
      width: "minmax(240px, 2fr)",
      minWidth: 240,
      sortable: true,
      card: "title",
      render: (kit) => (
        <AdminCellStack
          media={
            <img
              src={kit.thumbnail}
              alt=""
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = "true";
                  target.src = `https://picsum.photos/seed/${kit._id}/100/100`;
                }
              }}
            />
          }
          primary={kit.name}
          secondary={`${(kit.products || []).length} ${t("admin.kits.items")}${kit.description ? ` · ${kit.description}` : ""}`}
        />
      ),
    },
    {
      key: "level",
      header: t("admin.kits.level"),
      width: "120px",
      minWidth: 116,
      align: "center",
      sortable: true,
      render: (kit) => (
        <AdminPill tone={LEVEL_TONE[kit.level] ?? "neutral"}>{t(`admin.kits.${kit.level}`)}</AdminPill>
      ),
    },
    {
      key: "stock",
      header: t("admin.kits.stock"),
      width: "96px",
      minWidth: 96,
      align: "right",
      sortable: true,
      render: (kit) => <span className={`adm-gnum ${(kit.stock ?? 0) < 5 ? "is-warn" : ""}`}>{kit.stock ?? 0}</span>,
    },
    {
      key: "price",
      header: t("admin.kits.priceShort"),
      width: "130px",
      minWidth: 130,
      align: "right",
      sortable: true,
      render: (kit) => <AdminMoney value={kit.price} />,
    },
    {
      key: "status",
      header: t("admin.kits.status"),
      width: "120px",
      minWidth: 116,
      align: "center",
      card: "aside",
      render: (kit) => (
        <AdminPill tone={kit.isActive ? "green" : "neutral"}>
          {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
        </AdminPill>
      ),
    },
    {
      key: "actions",
      header: t("admin.kits.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (kit) => (
        <AdminRowActions>
          <AdminActionButton icon={Edit2} label={t("admin.kits.edit")} onClick={() => setEditingKit(kit)} />
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.kits.view"), icon: Eye, onSelect: () => setDetailKit(kit) },
              kit.isActive && {
                label: t("admin.kits.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                onSelect: () => void confirmDelete(kit),
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
        eyebrow={t("admin.kits.eyebrow")}
        title={t("admin.kits.title")}
        subtitle={t("admin.kits.subtitle")}
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                fetchKits(currentPage, { silent: true });
                fetchCounts();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            <CreateButton label={t("admin.kits.createKit")} onClick={() => setShowCreateModal(true)} />
          </>
        }
      />

      {/* Trạng thái — kiêm bộ lọc. BE cho lấy kit đã ẩn qua ?isActive=false. */}
      <AdminStatusTabs<KitStatusFilter>
        ariaLabel={t("admin.kits.status")}
        value={statusFilter}
        onChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        tabs={[
          { value: "active", label: t("admin.kits.active"), icon: Boxes, tone: "green", count: counts.active },
          { value: "hidden", label: t("admin.kits.inactive"), icon: EyeOff, tone: "neutral", count: counts.hidden },
          {
            value: "all",
            label: t("admin.kits.all"),
            icon: Layers,
            count: counts.active === undefined || counts.hidden === undefined ? undefined : counts.active + counts.hidden,
          },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchQuery,
            onChange: handleSearchChange,
            placeholder: t("admin.kits.searchPlaceholder"),
            isSearching: searchIsWaiting || refreshing,
          }}
          filters={
            <AdminSelect
              value={levelFilter}
              options={LEVEL_OPTIONS.map((o) => ({
                value: o.value,
                label: o.value === "all" ? t("admin.kits.allLevelsLabel") : t(`admin.kits.${o.value}`),
              }))}
              onChange={(value) => {
                setLevelFilter(value);
                setCurrentPage(1);
              }}
            />
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
          meta={
            debouncedSearchQuery ? (
              <AdminSearchMeta searching={searchIsWaiting || refreshing}>
                {matchedKits.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: matchedKits.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<Kit>
          ariaLabel={t("admin.kits.title")}
          rows={rows}
          rowKey={(kit) => kit._id}
          columns={columns}
          loading={loading}
          refreshing={refreshing}
          sort={sort}
          onRowClick={(kit) => setDetailKit(kit)}
          rowMuted={(kit) => !kit.isActive}
          empty={{
            icon: Package,
            title: statusFilter === "hidden" ? t("admin.kits.noHiddenKits") : t("admin.kits.noKitsFound"),
            description: t("admin.kits.noKitsHint"),
          }}
        />

        <AdminGridFooter
          page={currentPage}
          totalPages={displayTotalPages}
          total={displayTotal}
          pageSize={KITS_PAGE_SIZE}
          onPageChange={setCurrentPage}
          disabled={refreshing}
        />
      </AdminPanel>

      {confirmDialog}

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
      variant={kit ? "edit" : "create"}
      icon={kit ? undefined : PackagePlus}
      eyebrow={kit ? t("admin.kits.editKit") : undefined}
      title={kit ? formData.name || kit.name : t("admin.kits.createKit")}
      onClose={onClose}
      // Đang lưu thì không cho đóng bằng click nền (tránh mất thao tác).
      closeOnBackdrop={!loading}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={loading} className="btn-modal-cancel">
            {t("admin.kits.cancelButton")}
          </button>
          <button type="submit" form="kit-form" disabled={loading} className="btn-modal-primary">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : kit ? (
              t("admin.kits.updateButton")
            ) : (
              t("admin.kits.createButton")
            )}
          </button>
        </>
      }
    >
      <form id="kit-form" onSubmit={handleSubmit}>
        <div className="admin-dialog-body">
          <div>
            <label className="adm-field-label">
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
            <label className="adm-field-label">
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
            <label className="adm-field-label">
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
            <label className="adm-field-label">
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
    <AdminModal
      variant="view"
      icon={Boxes}
      eyebrow="Bộ kit"
      title={kit.name}
      badges={
        <>
          <AdminPill tone={LEVEL_TONE[kit.level] ?? "neutral"}>{t(`admin.kits.${kit.level}`)}</AdminPill>
          <AdminPill tone={kit.isActive ? "green" : "neutral"}>
            {kit.isActive ? t("admin.kits.active") : t("admin.kits.inactive")}
          </AdminPill>
        </>
      }
      onClose={onClose}
      // Footer luôn hiển thị (kể cả lúc đang tải skeleton) để đóng được ngay
      footer={
        <button type="button" onClick={onClose} className="btn-modal-cancel">
          {t("admin.kits.cancelButton")}
        </button>
      }
    >
      {loading ? (
        // Skeleton bám đúng nội dung thật: ảnh + badge/mô tả → khối giá →
        // danh sách sản phẩm trong kit (tên, giá, × số lượng).
        <div className="admin-dialog-body" aria-busy="true">
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
        <div className="admin-dialog-body">
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
            <div className="flex-1 min-w-0 flex flex-col gap-2.5">
              {/* Price */}
              <AdminDetailItem label={t("admin.kits.totalPrice")}>
                <span className="text-xl font-bold text-primary">{formatPrice(kit.price)}</span>
              </AdminDetailItem>
              <p className="text-sm text-muted-foreground leading-relaxed">{kit.description}</p>
            </div>
          </div>

          {/* Products */}
          <div>
            <AdminDialogSection icon={Package} className="mb-3">
              {t("admin.kits.productsInKit")} ({(kit.products || []).length})
            </AdminDialogSection>
            <div className="adm-lines is-scroll">
              {(kit.products || []).map((p) => (
                <div key={p.productId._id} className="adm-line">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.productId.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(p.productId.variants[0]?.price || 0)}
                    </div>
                  </div>
                  <span className="adm-qty">× {p.quantity}</span>
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

    </AdminModal>
  );
}

