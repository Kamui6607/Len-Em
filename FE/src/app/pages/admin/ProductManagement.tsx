import { useState, useEffect, useCallback } from "react";
import {
  Edit3,
  RotateCcw,
  PackagePlus,
  Package,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
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
} from "../../../shared/components/admin/AdminDataGrid";
import { ProductDetailModal } from "./ProductDetailModal";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { productService, type Product } from "../../../shared/api/productService";
import {
  VariantEditor,
  type VariantData,
  validateVariants,
  hasVariantErrors,
} from "../../../shared/components/admin/VariantEditor";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";

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

/**
 * Bộ lọc trạng thái ở đầu bảng:
 * - "active": chỉ sản phẩm đang bán (isActive = true)
 * - "hidden": chỉ sản phẩm đã ẩn (isActive = false — do admin bỏ tick
 *   "Đang bán" khi cập nhật, hoặc do xoá mềm)
 * - "all": cả hai loại
 */
type ProductStatusFilter = "active" | "hidden" | "all";

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

// Giá được nhập MỘT LẦN ở cấp sản phẩm (VariantEditor render với hidePrice),
// nên khi validate KHÔNG được yêu cầu giá riêng cho từng variant — nếu không
// variant nào có price = 0 sẽ báo lỗi "fixVariantErrors" mà user không thấy
// field giá của variant ở đâu để sửa.
const VARIANT_PRICE_IS_SHARED = true;

const newVariantRow = (price: number): VariantData => ({
  color: "",
  hexCode: "#000000",
  price,
  stock: 0,
  image: "",
  imageFile: null,
});

const createEmptyForm = (): ProductFormData => ({
  ...emptyForm,
  variants: [newVariantRow(0)],
});

// ─── Hiển thị sản phẩm đã ẩn ─────────────────────────────
// Logic "gom hết sản phẩm kèm cả đã ẩn rồi lọc isActive = false" nằm trong
// `productService.getHidden` (BE không có tham số lọc isActive=false, chỉ có
// includeInactive=true trả về cả hai loại và chỉ áp dụng cho Admin).

// ─── Confirm Dialog ──────────────────────────────────────

// Ẩn sản phẩm dùng hộp xác nhận useAdminConfirm (xem handleHide / handleBulk).

// ─── Main Component ──────────────────────────────────────

export function ProductManagement() {
  const { t } = useLanguage();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const isAdminOrStaff = isAdmin || hasRole("staff");

  // Search debounce 400ms (dùng chung hook) — trước đây gọi API ngay từng ký tự.
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearchTerm,
    setInputValue: setSearchTerm,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });
  // Lọc theo trạng thái: đang bán / đã ẩn / tất cả.
  // "Đã ẩn" = isActive = false. BE chỉ trả về sản phẩm đã ẩn khi gửi kèm
  // `includeInactive=true` VÀ request có token của Admin (xem product.controller.js
  // + middleware optionalAuthentication trong route GET /products).
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("active");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Read-only detail popup opened by the list's "view" action.
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<ProductFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  // Lỗi theo từng variant (index → field → message) để hiển thị inline
  // trong VariantEditor thay vì chỉ báo toast chung.
  const [variantErrors, setVariantErrors] = useState<Record<string, string>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<ProductStatusFilter, number>>>({});
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

  // ─── Fetch products ───────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      // Chỉ gọi API với giá trị ĐÃ debounce (400ms sau khi ngừng gõ).
      if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

      if (statusFilter === "hidden") {
        // Chỉ sản phẩm đã ẩn: BE không có tham số lọc `isActive=false`, chỉ có
        // includeInactive=true (trả cả 2 loại) nên phải gom hết rồi lọc ở FE
        // → hiện đủ mọi sản phẩm đã ẩn trong 1 trang, không cần phân trang.
        const hidden = await productService.getHidden({
          search: debouncedSearchTerm.trim() || undefined,
        });
        setProducts(hidden);
        setTotal(hidden.length);
        setTotalPages(1);
        return;
      }

      // "Tất cả" = đang bán + đã ẩn (BE phân trang trên cả 2 loại).
      if (statusFilter === "all") params.includeInactive = true;

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
  }, [page, debouncedSearchTerm, statusFilter, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Số lượng cho thẻ trạng thái: đang bán + tất cả (limit=1, chỉ đọc `total`); đã ẩn = hiệu số.
  const fetchCounts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [activeRes, allRes] = await Promise.all([
        productService.getAll({ page: 1, limit: 1 }),
        productService.getAll({ page: 1, limit: 1, includeInactive: true }),
      ]);
      const active = activeRes.data.data?.total ?? 0;
      const all = allRes.data.data?.total ?? 0;
      setCounts({ active, all, hidden: Math.max(0, all - active) });
    } catch {
      // thẻ vẫn lọc được, chỉ không có số
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Đổi trang / bộ lọc → bỏ chọn
  useEffect(() => {
    setSelected(new Set());
  }, [page, statusFilter, debouncedSearchTerm]);

  /**
   * Đổi search → về trang 1 NGAY khi gõ (không đợi debounce) để chỉ có 1 request
   * duy nhất với page=1 + từ khoá mới → tránh 2 request đua nhau ghi kết quả.
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  // ── Filter (client-side search within fetched data) ──
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  // ─── Modal handlers ───────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setVariantErrors([]);
    setShowModal(true);
  };

  const applyPriceToVariants = (price: number, variants: VariantData[]): VariantData[] => {
    return variants.map((v) => ({ ...v, price }));
  };

  const openEdit = async (product: Product) => {
    // List API (getAll) đôi khi không trả đủ description/variants —
    // fetch chi tiết bằng getById để điền đầy đủ khi mở modal edit.
    setEditingId(product._id);
    let full: Product = product;
    try {
      const res = await productService.getById(product._id);
      if (res.data.data?.product) full = res.data.data.product;
    } catch {
      // fallback: dùng dữ liệu từ list nếu fetch chi tiết lỗi
    }
    const firstPrice = full.variants[0]?.price ?? 0;
    setForm({
      name: full.name ?? "",
      description: full.description ?? "",
      category: full.category ?? "",
      image: full.image ?? "",
      tags: full.tags?.join(", ") ?? "",
      imageFile: null,
      price: firstPrice,
      variants: (full.variants ?? []).map((v) => ({
        color: v.color ?? "",
        hexCode: v.hexCode ?? "",
        price: v.price ?? 0,
        stock: v.stock ?? 0,
        image: v.image ?? "",
        imageFile: null,
      })),
      isActive: full.isActive,
    });
    setVariantErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(createEmptyForm());
    setVariantErrors([]);
  };

  // ─── Read-only detail popup ───────────────────────────

  const openDetail = async (product: Product) => {
    // Show the row data immediately, then replace it with the full detail
    // (the list API sometimes omits description/variants).
    setDetailProduct(product);
    setDetailLoading(true);
    try {
      const res = await productService.getById(product._id);
      if (res.data.data?.product) setDetailProduct(res.data.data.product);
    } catch {
      // keep the row data — the popup still shows name/category/price
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailProduct(null);
    setDetailLoading(false);
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
    // Giá được nhập ở cấp sản phẩm (variant không có field giá riêng),
    // nên phải kiểm tra giá ở đây — không thể để validateVariants báo lỗi
    // trên một field đang bị ẩn.
    if (VARIANT_PRICE_IS_SHARED && !(form.price > 0)) {
      toast.error(t("admin.products.priceRequired"));
      return false;
    }
    const vErrors = validateVariants(form.variants, {
      requirePrice: !VARIANT_PRICE_IS_SHARED,
    });
    setVariantErrors(vErrors);
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
        name: (form.name ?? "").trim(),
        description: (form.description ?? "").trim(),
        category: form.category,
        image: (form.image ?? "").trim() || undefined,
        imageFile: form.imageFile,
        tags: (form.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        variants: form.variants.map((v) => ({
          color: (v.color ?? "").trim(),
          hexCode: v.hexCode ?? "",
          // Variant không có field giá riêng → luôn gửi kèm giá sản phẩm
          // để BE không nhận price = 0.
          price: v.price > 0 ? v.price : form.price,
          stock: v.stock ?? 0,
          image: (v.image ?? "").trim() || undefined,
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
      fetchCounts();
    } catch {
      toast.error(t("admin.products.restoreError"));
    }
  };

  // Ẩn (xoá mềm) một sản phẩm — có hộp xác nhận.
  const handleHide = async (product: Product) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: product.name }),
      description: t("admin.products.hideConfirmDesc"),
      confirmLabel: t("admin.products.hide"),
      danger: true,
      icon: EyeOff,
    });
    if (!ok) return;
    try {
      await productService.delete(product._id);
      toast.success(t("admin.products.deleteSuccess"));
      fetchProducts();
      fetchCounts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      toast.error(
        axiosErr.response?.status === 403 ? t("admin.products.noPermission") : t("admin.products.deleteError"),
      );
    }
  };

  // ── Bulk hide / restore ──
  const handleBulk = async (mode: "hide" | "restore") => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (mode === "hide") {
      const ok = await confirm({
        title: t("admin.products.hideConfirmTitle", { count: ids.length }),
        description: t("admin.products.hideConfirmDesc"),
        confirmLabel: t("admin.products.hide"),
        danger: true,
        icon: EyeOff,
      });
      if (!ok) return;
    }
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => (mode === "hide" ? productService.delete(id) : productService.restore(id))),
    );
    setBulkBusy(false);
    const done = results.filter((r) => r.status === "fulfilled").length;
    const failed = ids.length - done;
    if (done) {
      toast.success(
        t(mode === "hide" ? "admin.products.bulkHidden" : "admin.products.bulkRestored", { count: done }),
      );
    }
    if (failed) toast.error(t("admin.products.bulkFailed", { count: failed }));
    setSelected(new Set());
    fetchProducts();
    fetchCounts();
  };

  // ── Compute min/max price helpers ──
  const priceRange = (variants: Product["variants"]) => {
    const prices = variants.map((v) => v.price);
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };
  };
  const stockOf = (product: Product) => product.variants.reduce((s, v) => s + (v.stock || 0), 0);

  const { sort, apply: applySort } = useAdminGridSort<Product>((p, field) => {
    if (field === "name") return p.name;
    if (field === "price") return priceRange(p.variants).min;
    if (field === "stock") return stockOf(p);
    return null;
  });
  const rows = applySort(filtered);

  const selectedRows = rows.filter((p) => selected.has(p._id));
  const hasFilters = Boolean(searchTerm) || statusFilter !== "active";

  const columns: AdminGridColumn<Product>[] = [
    {
      key: "name",
      header: t("admin.products.product"),
      width: "minmax(240px, 2fr)",
      minWidth: 240,
      sortable: true,
      card: "title",
      render: (product) => (
        <AdminCellStack
          media={product.image ? <img src={product.image} alt="" loading="lazy" /> : <Package />}
          primary={product.name}
          secondary={[
            product.category ? t(`admin.products.categories.${product.category}`) : "",
            product.tags?.slice(0, 2).join(", "),
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      ),
    },
    {
      key: "colors",
      header: t("admin.products.colors"),
      width: "100px",
      minWidth: 100,
      render: (product) => (
        <span className="adm-gswatches" title={product.variants.map((v) => v.color).filter(Boolean).join(", ")}>
          {product.variants.slice(0, 4).map((v, i) => (
            <span key={i} className="adm-gswatch" style={{ background: v.hexCode || "var(--muted)" }} />
          ))}
          {product.variants.length > 4 && <span className="adm-gswatch-more">+{product.variants.length - 4}</span>}
        </span>
      ),
    },
    {
      key: "price",
      header: t("admin.products.price"),
      width: "150px",
      minWidth: 140,
      align: "right",
      sortable: true,
      render: (product) => {
        const { min, max } = priceRange(product.variants);
        return (
          <>
            <AdminMoney value={min} />
            {max !== min && (
              <span className="adm-gsecondary">
                – <AdminMoney value={max} />
              </span>
            )}
          </>
        );
      },
    },
    {
      key: "stock",
      header: t("admin.products.variantStock"),
      width: "96px",
      minWidth: 96,
      align: "right",
      sortable: true,
      render: (product) => {
        const stock = stockOf(product);
        return (
          <>
            <span className={`adm-gnum ${stock < 10 ? "is-warn" : ""}`}>{stock}</span>
            {stock < 10 && <span className="adm-gsecondary">{t("admin.products.lowStock")}</span>}
          </>
        );
      },
    },
    {
      key: "status",
      header: t("admin.products.status"),
      width: "120px",
      minWidth: 116,
      align: "center",
      card: "aside",
      render: (product) => (
        <AdminPill tone={product.isActive ? "green" : "neutral"}>
          {product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
        </AdminPill>
      ),
    },
    {
      key: "actions",
      header: t("admin.products.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (product) => (
        <AdminRowActions>
          {product.isActive ? (
            <AdminActionButton icon={Edit3} label={t("admin.products.edit")} onClick={() => void openEdit(product)} />
          ) : (
            <AdminActionButton
              icon={RotateCcw}
              tone="green"
              label={t("admin.products.restore")}
              onClick={() => void handleRestore(product._id)}
            />
          )}
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.products.viewDetails"), icon: Eye, onSelect: () => void openDetail(product) },
              !product.isActive && { label: t("admin.products.edit"), icon: Edit3, onSelect: () => void openEdit(product) },
              product.isActive &&
                isAdminOrStaff && {
                  label: t("admin.products.hide"),
                  icon: EyeOff,
                  danger: true,
                  separated: true,
                  onSelect: () => void handleHide(product),
                },
            ]}
          />
        </AdminRowActions>
      ),
    },
  ];

  // ── Render ──
  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow={t("admin.products.eyebrow")}
        title={t("admin.products.title")}
        subtitle={t("admin.products.totalCount", { count: total })}
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                fetchProducts();
                fetchCounts();
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("admin.grid.refresh")}
            </button>
            {isAdminOrStaff && <CreateButton label={t("admin.products.create")} onClick={openCreate} />}
          </>
        }
      />

      {/* Trạng thái — kiêm bộ lọc (chỉ Admin thấy được sản phẩm đã ẩn) */}
      {isAdmin && (
        <AdminStatusTabs<ProductStatusFilter>
          ariaLabel={t("admin.products.status")}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          tabs={[
            { value: "active", label: t("admin.products.active"), icon: Package, tone: "green", count: counts.active },
            { value: "hidden", label: t("admin.products.inactive"), icon: EyeOff, tone: "neutral", count: counts.hidden },
            { value: "all", label: t("admin.products.all"), icon: Layers, count: counts.all },
          ]}
        />
      )}

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchTerm,
            onChange: handleSearchChange,
            placeholder: t("admin.products.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={
            hasFilters
              ? () => {
                  clearSearch();
                  setStatusFilter("active");
                  setPage(1);
                }
              : undefined
          }
          selectedCount={selectedRows.length}
          onClearSelection={() => setSelected(new Set())}
          bulkActions={
            <>
              {selectedRows.some((p) => p.isActive) && (
                <AdminActionButton
                  icon={EyeOff}
                  tone="rose"
                  fixedWidth={false}
                  busy={bulkBusy}
                  label={t("admin.products.hideSelected")}
                  onClick={() => void handleBulk("hide")}
                />
              )}
              {selectedRows.some((p) => !p.isActive) && (
                <AdminActionButton
                  icon={RotateCcw}
                  tone="green"
                  fixedWidth={false}
                  busy={bulkBusy}
                  label={t("admin.products.restoreSelected")}
                  onClick={() => void handleBulk("restore")}
                />
              )}
            </>
          }
          meta={
            debouncedSearchTerm ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {rows.length === 0
                  ? t("admin.search.noResults")
                  : t("admin.search.resultsCount", { count: rows.length })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<Product>
          ariaLabel={t("admin.products.title")}
          rows={rows}
          rowKey={(p) => p._id}
          columns={columns}
          loading={loading}
          sort={sort}
          selection={isAdminOrStaff ? { selected, onChange: setSelected } : undefined}
          onRowClick={(p) => void openDetail(p)}
          rowMuted={(p) => !p.isActive}
          empty={{
            icon: Package,
            title: hasFilters
              ? statusFilter === "hidden"
                ? t("admin.products.noHiddenProducts")
                : t("admin.grid.emptyFiltered")
              : t("admin.products.noProducts"),
            description: hasFilters ? t("admin.grid.emptyFilteredHint") : undefined,
          }}
        />

        <AdminGridFooter page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={setPage} disabled={loading} />
      </AdminPanel>

      {confirmDialog}

      {/* Modal */}
      {showModal && (
        <AdminModal
          variant={editingId ? "edit" : "create"}
          icon={editingId ? undefined : PackagePlus}
          title={editingId ? form.name || t("admin.products.editProduct") : t("admin.products.createProduct")}
          eyebrow={editingId ? t("admin.products.editProduct") : undefined}
          onClose={closeModal}
          footer={
            <>
              <button type="button" onClick={closeModal} disabled={saving} className="btn-modal-cancel">
                {t("admin.products.cancel")}
              </button>
              <button type="submit" form="product-form" disabled={saving} className="btn-modal-primary">
                {saving
                  ? t("admin.products.saving")
                  : editingId
                    ? t("admin.products.updateProduct")
                    : t("admin.products.createProduct")}
              </button>
            </>
          }
        >
            <form id="product-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="admin-dialog-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="adm-field-label">
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
                    <label className="adm-field-label">
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
                    <label className="adm-field-label">
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
                    <label className="adm-field-label">
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
                    <label className="adm-field-label">
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
                    <label className="adm-field-label">
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
                    onChange={(variants) => {
                      setForm({ ...form, variants });
                      // Tính lỗi ngay khi user sửa: thông báo inline tự mất
                      // khi field đã hợp lệ.
                      setVariantErrors(
                        validateVariants(variants, {
                          requirePrice: !VARIANT_PRICE_IS_SHARED,
                        }),
                      );
                    }}
                    errors={variantErrors}
                    hidePrice={VARIANT_PRICE_IS_SHARED}
                    defaultPrice={form.price}
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
            </form>
        </AdminModal>
      )}

      {/* Read-only detail popup — viewing a product no longer leaves the list */}
      {detailProduct && (
        <ProductDetailModal
          key={detailProduct._id}
          product={detailProduct}
          loading={detailLoading}
          onClose={closeDetail}
        />
      )}

    </div>
  );
}