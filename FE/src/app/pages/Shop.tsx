import "../../styles/craft.css";
import "../../styles/shop.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal,
  X,
  Heart,
  Tag,
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
import { useCart } from "../../shared/contexts/CartContext";
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
const SORT_OPTIONS = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
];

// Small icon shown next to each filter section label — purely orientation,
// so the sidebar reads at a glance instead of as a wall of identical text.
const FILTER_ICONS: Record<string, React.ReactNode> = {
  category: <Tag size={13} />,
  color: <Palette size={13} />,
  price: <Wallet size={13} />,
  level: <Gauge size={13} />,
};

function FilterLabel({
  icon,
  children,
}: {
  icon: keyof typeof FILTER_ICONS;
  children: React.ReactNode;
}) {
  return (
    <span className="filter-group-label">
      {FILTER_ICONS[icon]}
      {children}
    </span>
  );
}

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

// ── Price range filter component (standalone to preserve input focus) ──
function PriceRangeFilter({
  maxPrice,
  onApply,
}: {
  maxPrice: number;
  onApply: (max: number) => void;
}) {
  const [maxInput, setMaxInput] = useState(maxPrice ? String(maxPrice) : "");

  // Keep the input in sync with URL back/forward navigation.
  useEffect(() => {
    setMaxInput(maxPrice ? String(maxPrice) : "");
  }, [maxPrice]);

  const apply = () => onApply(Math.max(0, Number(maxInput) || 0));

  return (
    <div className="filter-group">
      <FilterLabel icon="price">Giá tối đa</FilterLabel>
      <div className="price-field">
        <input
          className="price-input"
          type="number"
          min="0"
          placeholder="Ví dụ: 200000"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <span className="price-unit">đ</span>
      </div>
      <button type="button" onClick={apply} className="price-find-btn">
        Áp dụng
      </button>
    </div>
  );
}

export function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
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

  const addLessonProductToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const variant = product.variants?.[0];
    if (!variant) return;
    addToCart({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      image: variant.images?.[0] || product.image,
      color: variant.color || "",
      hexCode: variant.hexCode || "#ccc",
      price: variant.price,
      stock: variant.stock,
    });
  };

  const addAllLessonProducts = () => {
    recommendedProducts.forEach((product) =>
      addLessonProductToCart(product.id),
    );
    toast.success("Đã thêm nguyên liệu của bài học vào giỏ");
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

  // Render functions (không phải component) để PriceRangeFilter không bị
  // remount mỗi lần Shop re-render — giữ nguyên focus khi đang gõ giá.
  const renderKitFilters = () => (
    <>
      <div className="filter-group">
        <FilterLabel icon="level">Trình độ</FilterLabel>
        <div className="filter-chip-group">
          <button
            className={`shop-chip ${kitLevel === "all" ? "is-active" : ""}`}
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
                className={`shop-chip ${kitLevel === level ? "is-active" : ""}`}
                onClick={() => setKitLevel(level)}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Maximum price cho combo — dùng chung component với filter của Products */}
      <PriceRangeFilter maxPrice={kitMaxPrice} onApply={setKitMaxPrice} />

      {!kitsLoading && (
        <div className="filter-summary">
          <Boxes size={13} />
          Hiển thị <strong>{filteredKits.length}</strong> / {kits.length} combo
        </div>
      )}
    </>
  );

  const renderProductFilters = () => (
    <>
      {/* Smart lesson filter */}
      {currentCourseId && currentCourseComboIds.length > 0 && (
        <div className="filter-group">
          <button
            className={`shop-chip ${lessonFilterActive ? "is-active" : ""}`}
            onClick={() => {
              setLessonFilterActive((active) => !active);
              updateFilter("category", "all");
            }}
          >
            <GraduationCap size={13} />
            Theo bài học đang học
          </button>
        </div>
      )}

      {/* Category */}
      <div className="filter-group">
        <FilterLabel icon="category">Danh mục</FilterLabel>
        <div className="filter-chip-group">
          {categoryOptions.map(({ value }) => {
            const cat = getCategoryMeta(value);
            const Icon = cat.Icon;
            return (
              <button
                key={value}
                className={`shop-chip ${filters.category === value ? "is-active" : ""}`}
                onClick={() => updateFilter("category", value)}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      {dynamicFilters.colors.length > 0 && (
        <div className="filter-group">
          <div className="filter-section-head">
            <FilterLabel icon="color">Màu len</FilterLabel>
            {dynamicFilters.colors.length > 8 && (
              <button
                type="button"
                className="filter-show-more"
                onClick={() => setShowAllColors((visible) => !visible)}
              >
                {showAllColors ? "Thu gọn" : `Xem tất cả (${dynamicFilters.colors.length})`}
              </button>
            )}
          </div>
          <div className="shop-swatch-grid">
            {(showAllColors ? dynamicFilters.colors : dynamicFilters.colors.slice(0, 8)).map(
              (c) => {
                const active = filters.color.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    className={`shop-swatch ${active ? "is-active" : ""}`}
                    onClick={() => toggleArrayFilter("color", c.name)}
                    title={c.name}
                    aria-pressed={active}
                  >
                    <span className="shop-swatch-dot" style={{ background: c.hex }} />
                    <span className="shop-swatch-name">{c.name}</span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Price range - standalone component with own state */}
      <PriceRangeFilter
        maxPrice={filters.maxPrice}
        onApply={(max) => updatePriceRange(max)}
      />

      {!isLoading && (
        <div className="filter-summary">
          <Boxes size={13} />
          Hiển thị <strong>{displayedProducts.length}</strong> / {totalCount} sản phẩm
        </div>
      )}
    </>
  );

  const activeFilterCount = viewMode === "products" ? activeChips.length : kitFilterCount;
  const canClear = viewMode === "products" ? hasActiveFilters : hasActiveKitFilters;
  const HeroIcon = meta.Icon;

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
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

          {viewMode === "products" && (
            <div className="shop-cat-rail">
              {categoryOptions.map(({ value, count }) => {
                const cat = getCategoryMeta(value);
                const Icon = cat.Icon;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`shop-cat-pill ${filters.category === value ? "is-active" : ""}`}
                    onClick={() => updateFilter("category", value)}
                  >
                    <span className="shop-cat-icon">
                      <Icon size={15} />
                    </span>
                    {cat.label}
                    {count > 0 && <span className="shop-cat-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          )}
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
          <aside className="filter-panel">
            <div className="filter-header">
              <span className="filter-title">Bộ lọc</span>
              <button
                type="button"
                onClick={viewMode === "products" ? clearFilters : clearKitFilters}
                disabled={!canClear}
                className="filter-clear"
              >
                <RotateCcw size={12} />
                Xoá lọc
              </button>
            </div>
            {viewMode === "products" ? renderProductFilters() : renderKitFilters()}
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
                      <button type="button" className="filter-strip-clear" onClick={clearFilters}>
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

      {/* ── Mobile filter drawer ── */}
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
              className="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="drawer-handle" />
              <div className="filter-header">
                <span className="filter-title">Bộ lọc</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={viewMode === "products" ? clearFilters : clearKitFilters}
                    disabled={!canClear}
                    className="filter-clear"
                  >
                    <RotateCcw size={12} />
                    Xoá lọc
                  </button>
                  <button
                    className="drawer-close"
                    onClick={() => setFilterOpen(false)}
                    aria-label="Đóng bộ lọc"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              {viewMode === "products" ? renderProductFilters() : renderKitFilters()}
              <button onClick={() => setFilterOpen(false)} className="craft-btn mt-4 w-full">
                {viewMode === "products"
                  ? `Xem ${resultCount} sản phẩm`
                  : `Xem ${filteredKits.length} combo`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

