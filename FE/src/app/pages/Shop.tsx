import "../../styles/craft.css";
import "../../styles/shop.css";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal,
  X,
  Heart,
  Palette,
  Gauge,
  Wallet,
  Boxes,
  Star,
  Gift,
  RotateCcw,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Truck,
  ShoppingBag,
  ChevronDown,
  Check,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../../shared/components/ProductCard";
import { ResponsiveImage } from "../../shared/components/ui/ResponsiveImage";
import { useProducts } from "../../shared/hooks/useProducts";
import { products } from "../data/products";
import {
  getLessonsByCourse,
  materialCombos,
} from "../../features/learn/data/learn.mock";
import { useLearnStore } from "../../features/learn/store/learn.store";
import { useAuth } from "../../shared/hooks/useAuth";
import { useAddToCart } from "../../features/cart/useAddToCart";
import { firstAvailableVariant, toCartPayload } from "../../features/cart/VariantPickerDialog";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { formatPrice } from "../../lib/formatPrice";
import { kitService, type Kit } from "../../shared/api/kitService";
import { cn } from "../../shared/components/ui/utils";
import { ProductSkeleton } from "../../shared/components/skeletons/ProductSkeleton";
import {
  getCategoryMeta,
  SHOP_LEVELS,
  YarnBallIcon,
  type ShopLevel,
} from "../../features/shop/shopMeta";
import { EmptyHoopIllustration } from "./shop/CartPage";

// Backend only supports: newest. Remove price-asc, price-desc, rating (cause 400)
/** Colors shown before "+N màu khác". */
const COLOR_PREVIEW = 10;

const SORT_OPTIONS = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
];

// Builds a compact page list with ellipses so pagination never sprawls
// across the screen once a catalog has more than a handful of pages.
function getPaginationRange(
  current: number,
  total: number,
): (number | "dots")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "dots")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) range.push("dots");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("dots");
  range.push(total);
  return range;
}

// Quick "max price" presets, matched to the live catalog (items run ~250k–375k
// today). Revisit when the price range changes — a preset that always returns
// nothing is worse than none.
const PRICE_PRESETS = [300_000, 400_000, 500_000, 1_000_000];
const shortPrice = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}tr` : `${n / 1000}k`);

/** One collapsible block of the filter panel (icon · title · active badge · chevron). */
function FilterSection({
  icon: Icon,
  title,
  badge = 0,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <section className="flt-sec">
      <button
        type="button"
        className="flt-sec-btn"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flt-sec-icon">
          <Icon size={15} />
        </span>
        <span className="flt-sec-title">{title}</span>
        {badge > 0 && <span className="flt-sec-badge">{badge}</span>}
        <ChevronDown size={16} className="flt-sec-chev" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flt-sec-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Max price: presets + a custom amount (standalone so typing keeps focus) ──
function PriceFilter({
  maxPrice,
  onApply,
}: {
  maxPrice: number;
  onApply: (max: number) => void;
}) {
  const isPreset = PRICE_PRESETS.includes(maxPrice);
  const [draft, setDraft] = useState(maxPrice && !isPreset ? String(maxPrice) : "");

  // Keep the field in sync with URL back/forward navigation.
  useEffect(() => {
    setDraft(maxPrice && !PRICE_PRESETS.includes(maxPrice) ? String(maxPrice) : "");
  }, [maxPrice]);

  const digits = draft.replace(/\D/g, "");
  const amount = Number(digits) || 0;
  const apply = () => onApply(amount);

  return (
    <>
      <div className="flt-chips" role="group" aria-label="Mức giá tối đa">
        <button type="button" className="flt-chip" aria-pressed={maxPrice === 0} onClick={() => onApply(0)}>
          Bất kỳ
        </button>
        {PRICE_PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className="flt-chip"
            aria-pressed={maxPrice === value}
            onClick={() => onApply(value)}
          >
            Dưới {shortPrice(value)}
          </button>
        ))}
      </div>
      <div className="flt-price">
        <input
          className="flt-price-input"
          inputMode="numeric"
          placeholder="Hoặc nhập giá tối đa"
          aria-label="Giá tối đa (đồng)"
          value={digits ? Number(digits).toLocaleString("vi-VN") : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <button
          type="button"
          className="flt-price-go"
          onClick={apply}
          disabled={!amount || amount === maxPrice}
          aria-label="Áp dụng giá"
        >
          <ArrowRight size={15} />
        </button>
      </div>
      <p className="flt-price-hint">Đơn vị: đồng · nhấn Enter để áp dụng</p>
    </>
  );
}

export function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addProducts } = useAddToCart();
  const { isFavoriteKit, toggleFavoriteKit } = useFavorites();
  const { t } = useLanguage();

  const {
    filters,
    filteredProducts,
    dynamicFilters,
    hasActiveFilters,
    activeChips,
    isLoading,
    resultCount,
    totalCount,
    currentPage,
    totalPages,
    updateFilter,
    updatePriceRange,
    clearFilters,
    toggleArrayFilter,
    removeChip,
    goToPage,
  } = useProducts();

  const [filterOpen, setFilterOpen] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  // Chế độ xem nằm trên URL (?view=combo) để link từ nơi khác (vd. breadcrumb
  // "Combo" ở /kits/:id) mở thẳng tab Combo, và nút Back của trình duyệt giữ đúng tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode: "products" | "combo" =
    searchParams.get("view") === "combo" ? "combo" : "products";
  const setViewMode = (mode: "products" | "combo") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "combo") next.set("view", "combo");
        else next.delete("view");
        return next;
      },
      { replace: true },
    );
  };
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitLevel, setKitLevel] = useState<string>("all");
  // Chỉ giữ Maximum price (đồng bộ với filter của Products) — bỏ Min cho gọn.
  const [kitMaxPrice, setKitMaxPrice] = useState<number>(0);

  // Check if kit level filter is active
  const hasActiveKitLevel = kitLevel !== "all";
  const hasActiveKitFilters = hasActiveKitLevel || kitMaxPrice > 0;
  const kitFilterCount = [hasActiveKitLevel, kitMaxPrice > 0].filter(Boolean).length;

  // Lọc combo hoàn toàn phía client theo Level + Maximum price — chip level
  // lọc ngay trên thẻ, không phụ thuộc BE có nhận tham số `level` hay không.
  const filteredKits = useMemo(() => {
    return kits.filter((kit) => {
      if (kitLevel !== "all" && kit.level !== kitLevel) return false;
      if (kitMaxPrice > 0 && kit.price > kitMaxPrice) return false;
      return true;
    });
  }, [kits, kitLevel, kitMaxPrice]);

  const clearKitFilters = () => {
    setKitLevel("all");
    setKitMaxPrice(0);
  };

  // Fetch toàn bộ combo một lần khi vào tab — Level/price lọc phía client cho
  // phản hồi tức thì và đồng bộ với UI filter Maximum price của Products.
  useEffect(() => {
    if (viewMode !== "combo") return;
    setKitsLoading(true);
    kitService
      .getAll({ page: 1, limit: 50 })
      .then((res) => setKits(res.data.data?.kits ?? []))
      .catch(() => toast.error("Không tải được danh sách combo"))
      .finally(() => setKitsLoading(false));
  }, [viewMode]);

  const [recommendationsDismissed, setRecommendationsDismissed] = useState(() => {
    try {
      return localStorage.getItem("lenem_shop_learn_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const [lessonFilterActive, setLessonFilterActive] = useState(false);
  const selectedCategory = dynamicFilters.categories.find(
    (category) => category.value === filters.category,
  );
  const meta =
    viewMode === "combo"
      ? getCategoryMeta("kit")
      : getCategoryMeta(filters.category, selectedCategory?.label);
  const categoryOptions = useMemo(
    () => [
      { value: "all", count: 0 },
      ...dynamicFilters.categories
        .filter((category) => category.value !== "kit")
        .map((category) => ({ value: category.value, count: category.count })),
    ],
    [dynamicFilters.categories],
  );
  const currentCourseId = useLearnStore((state) => state.currentCourseId);
  const currentLessonId = useLearnStore((state) => state.currentLessonId);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const currentLessons = useMemo(
    () => (currentCourseId ? getLessonsByCourse(currentCourseId) : []),
    [currentCourseId],
  );
  const currentLesson =
    currentLessons.find((lesson) => lesson.id === currentLessonId) ?? null;
  const currentCourseComboIds = useMemo(() => {
    if (!currentCourseId) return [];
    return materialCombos
      .filter((combo) =>
        currentLessons.some((lesson) =>
          lesson.linkedProducts?.some((linkedProduct) =>
            combo.productIds.includes(linkedProduct.productId),
          ),
        ),
      )
      .map((combo) => combo.id);
  }, [currentCourseId, currentLessons]);
  const recommendedProducts = useMemo(() => {
    if (!currentLesson) return [];
    const lessonProductIds =
      currentLesson.linkedProducts?.map((product) => product.productId) ?? [];
    return products
      .filter((product) => lessonProductIds.includes(product.id))
      .slice(0, 4);
  }, [currentLesson]);
  const displayedProducts =
    lessonFilterActive && currentCourseComboIds.length > 0
      ? filteredProducts.filter((product) =>
          product.linkedComboIds?.some((comboId) =>
            currentCourseComboIds.includes(comboId),
          ),
        )
      : filteredProducts;

  const addAllLessonProducts = () => {
    addProducts(
      // Bulk add can't ask per product: take the first in-stock variant —
      // the color can be changed afterwards right in the cart.
      recommendedProducts.flatMap((product) => {
        const variant = firstAvailableVariant(product.variants);
        return variant ? [toCartPayload(product, variant)] : [];
      }),
      "Đã thêm nguyên liệu của bài học vào giỏ",
    );
  };

  const dismissRecommendations = () => {
    try {
      localStorage.setItem("lenem_shop_learn_banner_dismissed", "true");
    } catch {
      // Storage bị chặn — vẫn ẩn banner trong phiên này.
    }
    setRecommendationsDismissed(true);
  };

  const getEmptyStateMessage = () => {
    if (filters.search) return `Không tìm thấy sản phẩm cho “${filters.search}”`;
    if (filters.color.length > 0) return "Chưa có sản phẩm nào với màu đã chọn";
    if (filters.material.length > 0) return "Chưa có sản phẩm nào với chất liệu đã chọn";
    if (filters.weight.length > 0) return "Chưa có sản phẩm nào với độ dày đã chọn";
    if (filters.difficulty.length > 0) return "Chưa có sản phẩm nào ở trình độ đã chọn";
    return "Chưa có sản phẩm nào";
  };

  // Clear search function
  const clearSearch = () => {
    updateFilter("search", "");
  };

  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages],
  );

  // Render functions (không phải component) để PriceFilter không bị
  // remount mỗi lần Shop re-render — giữ nguyên focus khi đang gõ giá.
  const renderKitFilters = () => (
    <>
      <FilterSection icon={Gauge} title="Trình độ" badge={hasActiveKitLevel ? 1 : 0}>
        <div className="flt-chips" role="group" aria-label="Trình độ">
          <button
            type="button"
            className="flt-chip"
            aria-pressed={kitLevel === "all"}
            onClick={() => setKitLevel("all")}
          >
            <Gift size={13} />
            Tất cả
          </button>
          {(Object.keys(SHOP_LEVELS) as ShopLevel[]).map((level) => {
            const { label, Icon } = SHOP_LEVELS[level];
            return (
              <button
                key={level}
                type="button"
                className="flt-chip"
                aria-pressed={kitLevel === level}
                onClick={() => setKitLevel(level)}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection icon={Wallet} title="Giá tối đa" badge={kitMaxPrice > 0 ? 1 : 0}>
        <PriceFilter maxPrice={kitMaxPrice} onApply={setKitMaxPrice} />
      </FilterSection>
    </>
  );

  const renderProductFilters = () => (
    <>
      {/* Smart lesson filter */}
      {currentCourseId && currentCourseComboIds.length > 0 && (
        <button
          type="button"
          role="switch"
          aria-checked={lessonFilterActive}
          className="flt-lesson"
          onClick={() => {
            setLessonFilterActive((active) => !active);
            updateFilter("category", "all");
          }}
        >
          <span className="flt-sec-icon">
            <GraduationCap size={15} />
          </span>
          <span className="min-w-0">
            <span className="flt-lesson-title block">Theo bài học đang học</span>
            <span className="flt-lesson-sub block">Chỉ hiện nguyên liệu khoá học cần</span>
          </span>
          <span className="flt-switch" aria-hidden="true" />
        </button>
      )}

      {/* Category — trước đây là dải pill .shop-cat-rail ở hero */}
      <FilterSection icon={LayoutGrid} title="Danh mục" badge={filters.category !== "all" ? 1 : 0}>
        <div className="flt-cats" role="group" aria-label="Danh mục">
          {categoryOptions.map(({ value, count }) => {
            const cat = getCategoryMeta(value);
            const Icon = cat.Icon;
            const active = filters.category === value;
            return (
              <button
                key={value}
                type="button"
                className="flt-cat"
                aria-pressed={active}
                onClick={() => updateFilter("category", value)}
              >
                <span className="flt-cat-icon">
                  <Icon size={16} />
                </span>
                <span className="flt-cat-label">{cat.label}</span>
                {count > 0 && <span className="flt-cat-count">{count}</span>}
                {active && (
                  <span className="flt-cat-check" aria-hidden="true">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Color */}
      {dynamicFilters.colors.length > 0 && (
        <FilterSection icon={Palette} title="Màu len" badge={filters.color.length}>
          <div className="flt-swatches">
            {(showAllColors ? dynamicFilters.colors : dynamicFilters.colors.slice(0, COLOR_PREVIEW)).map(
              (c) => {
                const active = filters.color.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    className="flt-swatch"
                    onClick={() => toggleArrayFilter("color", c.name)}
                    title={c.name}
                    aria-pressed={active}
                  >
                    <span className="flt-swatch-ball" style={{ background: c.hex }}>
                      {active && <Check size={15} strokeWidth={3} className="flt-swatch-check" />}
                    </span>
                    <span className="flt-swatch-name">{c.name}</span>
                  </button>
                );
              },
            )}
          </div>
          {dynamicFilters.colors.length > COLOR_PREVIEW && (
            <button
              type="button"
              className="flt-more"
              onClick={() => setShowAllColors((visible) => !visible)}
            >
              {showAllColors
                ? "Thu gọn"
                : `+${dynamicFilters.colors.length - COLOR_PREVIEW} màu khác`}
              <ChevronDown size={14} className={showAllColors ? "rotate-180" : ""} />
            </button>
          )}
        </FilterSection>
      )}

      {/* Max price */}
      <FilterSection icon={Wallet} title="Giá tối đa" badge={filters.maxPrice > 0 ? 1 : 0}>
        <PriceFilter maxPrice={filters.maxPrice} onApply={(max) => updatePriceRange(max)} />
      </FilterSection>
    </>
  );

  const clearAllFilters = () => {
    if (viewMode === "products") {
      clearFilters();
      setLessonFilterActive(false);
    } else {
      clearKitFilters();
    }
  };

  const activeFilterCount =
    viewMode === "products"
      ? activeChips.length + (lessonFilterActive ? 1 : 0)
      : kitFilterCount;
  const canClear =
    viewMode === "products" ? hasActiveFilters || lessonFilterActive : hasActiveKitFilters;
  // How many items match the current filters across ALL pages. `totalCount`
  // is the server total for the active query (resultCount is only the current
  // page); lesson mode narrows the loaded page client-side, so count that.
  const shownCount =
    viewMode === "products"
      ? lessonFilterActive
        ? displayedProducts.length
        : totalCount
      : filteredKits.length;
  const resultsLoading = viewMode === "products" ? isLoading : kitsLoading;
  const unitLabel = viewMode === "products" ? "sản phẩm" : "combo";

  const renderFilterHead = (onClose?: () => void) => (
    <div className="flt-head">
      <span className="flt-head-icon">
        <SlidersHorizontal size={17} />
      </span>
      <div className="min-w-0">
        <p className="flt-title">Bộ lọc</p>
        <p className="flt-sub">
          {activeFilterCount > 0 ? `đang chọn ${activeFilterCount}` : ""}
        </p>
      </div>
      <button type="button" onClick={clearAllFilters} disabled={!canClear} className="flt-clear">
        <RotateCcw size={12} />
        Xoá lọc
      </button>
      {onClose && (
        <button className="drawer-close" onClick={onClose} aria-label="Đóng bộ lọc">
          <X size={18} />
        </button>
      )}
    </div>
  );

  const HeroIcon = meta.Icon;

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-12">
      <div className="shop-wrap">
        {/* ── Hero: tiệm len ── */}
        <section className="craft-hero craft-rise shop-hero">
          <div className="shop-hero-row">
            <div className="min-w-0">
              <span className="craft-eyebrow">Tiệm len nhỏ của Len&amp;em</span>
              <h1 className="craft-title shop-hero-title">
                <span className="shop-hero-icon">
                  <HeroIcon size={26} />
                </span>
                {meta.label === "Tất cả" ? (
                  <>
                    Mọi thứ cho <em>dự án len</em> tiếp theo
                  </>
                ) : (
                  meta.label
                )}
              </h1>
              <div className="craft-stitch" aria-hidden />
              <p className="craft-subtitle">{meta.desc}</p>
            </div>

            <div className="shop-hero-stats">
              <div className="craft-stat">
                <span className="craft-stat-icon">
                  <YarnBallIcon size={16} />
                </span>
                <div>
                  <p className="craft-stat-num">{totalCount}</p>
                  <p className="craft-stat-label">sản phẩm</p>
                </div>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-icon">
                  <Truck size={16} />
                </span>
                <div>
                  <p className="craft-stat-num">GHN</p>
                  <p className="craft-stat-label">giao toàn quốc</p>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ── Chế độ xem + sắp xếp ── */}
        <div className="shop-toolbar">
          <div className="craft-seg" role="tablist" aria-label="Chế độ xem">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "products"}
              onClick={() => setViewMode("products")}
              className={`craft-seg-btn ${viewMode === "products" ? "is-active" : ""}`}
            >
              <ShoppingBag size={14} />
              Sản phẩm
              <span className="shop-seg-count">{totalCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "combo"}
              onClick={() => setViewMode("combo")}
              className={`craft-seg-btn ${viewMode === "combo" ? "is-active" : ""}`}
            >
              <Gift size={14} />
              Combo
              {kits.length > 0 && <span className="shop-seg-count">{kits.length}</span>}
            </button>
          </div>

          <div className="shop-toolbar-right">
            <button className="filter-fab" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={14} />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="filter-fab-count">{activeFilterCount}</span>
              )}
            </button>
            <p className="results-count">
              {viewMode === "products" ? (
                !hasActiveFilters && resultCount === totalCount ? (
                  <>
                    Tất cả <strong>{totalCount}</strong> sản phẩm
                  </>
                ) : (
                  <>
                    <strong>{displayedProducts.length}</strong> / {totalCount} sản phẩm
                  </>
                )
              ) : (
                <>
                  <strong>{filteredKits.length}</strong> combo sẵn sàng
                </>
              )}
            </p>
            {viewMode === "products" && (
              <select
                className="sort-select"
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                aria-label="Sắp xếp"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="shop-body">
          {/* Desktop sidebar - show different filters based on viewMode */}
          <aside className="flt-panel" aria-label="Bộ lọc">
            {renderFilterHead()}
            <div className="flt-body">
              {viewMode === "products" ? renderProductFilters() : renderKitFilters()}
            </div>
            <div className="flt-foot" aria-live="polite">
              <Boxes size={14} />
              {resultsLoading ? (
                <span>Đang tìm…</span>
              ) : (
                <span>
                  Tìm thấy <strong>{shownCount}</strong> {unitLabel}
                </span>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0">
            {currentLesson &&
              recommendedProducts.length > 0 &&
              !recommendationsDismissed && (
                <section className="lesson-banner">
                  <div className="lesson-banner-head">
                    <span className="craft-section-icon">
                      <GraduationCap size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="lesson-banner-eyebrow">Bạn đang học</p>
                      <p className="lesson-banner-title">{currentLesson.title}</p>
                      <p className="lesson-banner-sub">Đây là nguyên liệu bài học cần:</p>
                    </div>
                    <button
                      className="lesson-banner-close"
                      onClick={dismissRecommendations}
                      aria-label="Ẩn gợi ý theo bài học"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="lesson-banner-grid">
                    {recommendedProducts.map((product) => (
                      <ProductCard
                        key={`lesson-${product.id}`}
                        product={product}
                        relatedCourseId={currentCourseId ?? undefined}
                        relatedLessonId={currentLessonId ?? undefined}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => requireAuth(addAllLessonProducts)}
                    className="craft-btn mt-4"
                  >
                    <ShoppingBag size={15} />
                    Thêm tất cả vào giỏ
                  </button>
                </section>
              )}

            {/* Products content */}
            {viewMode === "products" && (
              <div>
                <AnimatePresence>
                  {activeChips.length > 0 && (
                    <motion.div
                      className="filter-strip"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <span className="filter-strip-label">Đang lọc:</span>
                      {activeChips.map((chip) => (
                        <motion.button
                          type="button"
                          key={chip.value + chip.type}
                          className="active-chip"
                          onClick={() => removeChip(chip.type, chip.value)}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.18 }}
                        >
                          {chip.type === "category"
                            ? getCategoryMeta(chip.value, chip.label).label
                            : chip.label}
                          <X size={12} />
                        </motion.button>
                      ))}
                      <button type="button" className="filter-strip-clear" onClick={clearAllFilters}>
                        Xoá tất cả
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoading ? (
                  <div className="product-grid" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                ) : displayedProducts.length > 0 ? (
                  <>
                    <div className="product-grid animate-fade-in-soft">
                      {displayedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          highlightColors={filters.color}
                          relatedCourseId={
                            currentCourseId &&
                            product.linkedComboIds?.some((comboId) =>
                              currentCourseComboIds.includes(comboId),
                            )
                              ? currentCourseId
                              : undefined
                          }
                          relatedLessonId={
                            currentLessonId &&
                            currentLesson?.linkedProducts?.some(
                              (linkedProduct) =>
                                linkedProduct.productId === product.id,
                            )
                              ? currentLessonId
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <nav className="pagination" aria-label="Phân trang">
                        <button
                          className="page-btn"
                          disabled={currentPage <= 1}
                          onClick={() => goToPage(currentPage - 1)}
                          aria-label="Trang trước"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {paginationRange.map((page, i) =>
                          page === "dots" ? (
                            <span key={`dots-${i}`} className="page-dots">
                              …
                            </span>
                          ) : (
                            <button
                              key={page}
                              className={`page-btn ${currentPage === page ? "active" : ""}`}
                              onClick={() => goToPage(page)}
                              aria-current={currentPage === page ? "page" : undefined}
                            >
                              {page}
                            </button>
                          ),
                        )}
                        <button
                          className="page-btn"
                          disabled={currentPage >= totalPages}
                          onClick={() => goToPage(currentPage + 1)}
                          aria-label="Trang sau"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </nav>
                    )}
                  </>
                ) : (
                  <div className="craft-empty">
                    <EmptyHoopIllustration size={150} />
                    <p className="craft-empty-title">{getEmptyStateMessage()}</p>
                    <p className="craft-empty-desc">
                      Thử bỏ bớt bộ lọc hoặc tìm một từ khoá khác nhé.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {hasActiveFilters && (
                        <button type="button" className="craft-btn" onClick={clearFilters}>
                          <RotateCcw size={15} />
                          Xoá bộ lọc
                        </button>
                      )}
                      {filters.search && (
                        <button type="button" className="craft-btn-ghost" onClick={clearSearch}>
                          Xoá tìm kiếm
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Combo (Kits) content */}
            {viewMode === "combo" &&
              (kitsLoading ? (
                <div className="combo-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredKits.length === 0 ? (
                <div className="craft-empty">
                  <EmptyHoopIllustration size={150} />
                  <p className="craft-empty-title">Chưa có combo phù hợp</p>
                  <p className="craft-empty-desc">
                    Thử chọn trình độ khác hoặc nới rộng mức giá.
                  </p>
                  {hasActiveKitFilters && (
                    <button type="button" className="craft-btn" onClick={clearKitFilters}>
                      <RotateCcw size={15} />
                      Xoá bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <div className="combo-grid animate-fade-in-soft">
                  {filteredKits.map((kit) => {
                    const isFavorite = isFavoriteKit(kit._id);
                    const level = SHOP_LEVELS[kit.level as ShopLevel];
                    const LevelIcon = level?.Icon;

                    return (
                      <Link
                        key={kit._id}
                        to={`/kits/${kit._id}`}
                        className="kit-card"
                        aria-label={`${t("shop.kitDetail")} ${kit.name}`}
                      >
                        <div className="kit-card-media">
                          <ResponsiveImage
                            src={kit.thumbnail}
                            alt={kit.name}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://picsum.photos/seed/${kit._id}/400/300`;
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavoriteKit(kit._id);
                              toast.success(
                                isFavorite
                                  ? t("shop.removedFromFavorites")
                                  : "Đã thêm vào yêu thích",
                              );
                            }}
                            className={cn("pc-fav", isFavorite && "is-active")}
                            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                            aria-pressed={isFavorite}
                          >
                            <Heart size={15} />
                          </button>
                          {level && LevelIcon && (
                            <span className={`kit-level ${level.tone}`}>
                              <LevelIcon size={12} />
                              {level.label}
                            </span>
                          )}
                          {/* Mác "trong hộp có" — số món trong combo */}
                          <span className="kit-tag">
                            <Boxes size={12} />
                            {(kit.products || []).length} món
                          </span>
                        </div>
                        <div className="kit-card-body">
                          <h3 className="kit-card-title">{kit.name}</h3>
                          <p className="kit-card-desc">{kit.description}</p>
                          {kit.totalRatings > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3.5 h-3.5",
                                      i < Math.floor(kit.averageRating)
                                        ? "fill-[var(--rating-star)] text-[var(--rating-star)]"
                                        : i < kit.averageRating
                                          ? "fill-[var(--rating-star-half)] text-[var(--rating-star)]"
                                          : "fill-muted-foreground/20 text-muted-foreground/30",
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {kit.averageRating.toFixed(1)} ({kit.totalRatings})
                              </span>
                            </div>
                          )}
                          <div className="kit-card-foot">
                            <span className="kit-card-price">{formatPrice(kit.price)}</span>
                            <span className="kit-card-cta">
                              {t("shop.viewDetails")}
                              <ArrowRight size={14} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Mobile filter sheet — portaled so it sits above the floating
          assistant button, which lives outside the page's stacking layer ── */}
      {createPortal(
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              className="flt-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Bộ lọc"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <div className="drawer-handle" />
              {renderFilterHead(() => setFilterOpen(false))}
              <div className="flt-body">
                {viewMode === "products" ? renderProductFilters() : renderKitFilters()}
              </div>
              <div className="flt-sheet-actions">
                <button onClick={() => setFilterOpen(false)} className="craft-btn">
                  {resultsLoading ? "Đang tìm…" : `Xem ${shownCount} ${unitLabel}`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  );
}

