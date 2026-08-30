import { useEffect, useMemo, useState, memo } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  SlidersHorizontal,
  X,
  Heart,
  Tag,
  Palette,
  Layers3,
  Gauge,
  DollarSign,
  Sparkles,
  Boxes,
  Star,
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
import {
  ProductSkeleton,
} from "../../shared/components/skeletons/ProductSkeleton";

const CATEGORY_META: Record<
  string,
  { label: string; desc: string; emoji: string }
> = {
  all: {
    label: "All",
    desc: "Everything you need to start your cozy crochet journey",
    emoji: "🛍️",
  },
  yarn: { label: "Yarn", desc: "Premium yarns for every project", emoji: "🧵" },
  kit: {
    label: "DIY Kits",
    desc: "Curated kits with everything you need",
    emoji: "🎁",
  },
  tools: {
    label: "Tools",
    desc: "Essential tools for every crafter",
    emoji: "🪡",
  },
};

// Backend only supports: newest. Remove price-asc, price-desc, rating (cause 400)
const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest first" },
];

// Small icon shown next to each filter section label — purely orientation,
// so the sidebar reads at a glance instead of as a wall of identical text.
const FILTER_ICONS: Record<string, React.ReactNode> = {
  category: <Tag size={13} />,
  color: <Palette size={13} />,
  material: <Layers3 size={13} />,
  weight: <Gauge size={13} />,
  difficulty: <Sparkles size={13} />,
  price: <DollarSign size={13} />,
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

  return (
    <div className="filter-group">
      <FilterLabel icon="price">Maximum price</FilterLabel>
      <div className="price-inputs">
        <input
          className="price-input"
          type="number"
          min="0"
          placeholder="Price up to"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={() => onApply(Math.max(0, Number(maxInput) || 0))}
        className="price-find-btn"
      >
        Find
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
  const [viewMode, setViewMode] = useState<"products" | "combo">("products");
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitLevel, setKitLevel] = useState<string>("all");
  const [kitMinPrice, setKitMinPrice] = useState<number>(0);
  const [kitMaxPrice, setKitMaxPrice] = useState<number>(0);

  // Kit level options for combo filter
  const KIT_LEVEL_OPTIONS = [
    { value: "all", label: "All Levels", emoji: "🎁" },
    { value: "beginner", label: "Beginner", emoji: "🌱" },
    { value: "intermediate", label: "Intermediate", emoji: "🌿" },
    { value: "advanced", label: "Advanced", emoji: "🌳" },
  ];

  // Check if kit level filter is active
  const hasActiveKitLevel = kitLevel !== "all";
  const hasActiveKitFilters = hasActiveKitLevel || kitMinPrice > 0 || kitMaxPrice > 0;

  // Show combos within the selected price range (Min/Max).
  const filteredKits = useMemo(() => {
    return kits.filter((kit) => {
      if (kitMinPrice > 0 && kit.price < kitMinPrice) return false;
      if (kitMaxPrice > 0 && kit.price > kitMaxPrice) return false;
      return true;
    });
  }, [kits, kitMinPrice, kitMaxPrice]);

  const clearKitFilters = () => {
    setKitLevel("all");
    setKitMinPrice(0);
    setKitMaxPrice(0);
  };

  // Fetch kits when switching to combo view
  useEffect(() => {
    if (viewMode === "combo") {
      setKitsLoading(true);
      kitService
        .getAll({
          page: 1,
          limit: 50,
          level: kitLevel === "all" ? undefined : kitLevel,
        })
        .then((res) => setKits(res.data.data?.kits ?? []))
        .catch(() => toast.error("Failed to load kits"))
        .finally(() => setKitsLoading(false));
    }
  }, [viewMode, kitLevel]);

  const [recommendationsDismissed, setRecommendationsDismissed] = useState(
    () => localStorage.getItem("lenem_shop_learn_banner_dismissed") === "true",
  );
  const [lessonFilterActive, setLessonFilterActive] = useState(false);
  const selectedCategory = dynamicFilters.categories.find(
    (category) => category.value === filters.category,
  );
  const meta =
    filters.category === "all"
      ? CATEGORY_META.all
      : {
          label: selectedCategory?.label ?? filters.category,
          desc: `Products in ${selectedCategory?.label ?? filters.category}`,
          emoji: CATEGORY_META[filters.category]?.emoji ?? "🛍️",
        };
  const categoryOptions = useMemo(
    () => [
      ["all", CATEGORY_META.all] as const,
      ...dynamicFilters.categories
        .filter((category) => category.value !== "kit")
        .map(
          (category) =>
            [
              category.value,
              {
                label: category.label,
                desc: category.label,
                emoji: CATEGORY_META[category.value]?.emoji ?? "🛍️",
              },
            ] as const,
        ),
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
    toast.success("Lesson materials added to cart");
  };

  const dismissRecommendations = () => {
    localStorage.setItem("lenem_shop_learn_banner_dismissed", "true");
    setRecommendationsDismissed(true);
  };

  const getEmptyStateMessage = () => {
    if (filters.search) return `No products found for "${filters.search}"`;
    if (filters.color.length > 0) return "No products in the selected color";
    if (filters.material.length > 0)
      return "No products with the selected material";
    if (filters.weight.length > 0) return "No products in the selected weight";
    if (filters.difficulty.length > 0)
      return "No products at the selected difficulty";
    return "No products found";
  };

  // Clear search function
  const clearSearch = () => {
    updateFilter("search", "");
  };

  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages],
  );

  // Kit filter content for combo view
  const KitFilterContent = ({
    showHeader = true,
  }: {
    showHeader?: boolean;
  }) => (
    <>
      {showHeader && (
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          {hasActiveKitFilters && (
            <motion.button
              type="button"
              onClick={clearKitFilters}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-2"
              style={{
                borderColor: "var(--clear-btn-border)",
                background: "var(--clear-btn-bg)",
                color: "var(--clear-btn-text)",
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 4px 12px var(--clear-btn-glow)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Clear all
            </motion.button>
          )}
        </div>
      )}

      {/* Level filter for kits */}
      <div className="filter-group">
        <FilterLabel icon="level">Level</FilterLabel>
        <div className="filter-chip-group">
          {KIT_LEVEL_OPTIONS.map((level) => (
            <button
              key={level.value}
              className={`chip-filter ${kitLevel === level.value ? "active" : ""}`}
              onClick={() => setKitLevel(level.value)}
            >
              {level.emoji} {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range for kits */}
      <div className="filter-group">
        <FilterLabel icon="price">Price range</FilterLabel>
        <div className="price-inputs">
          <input
            className="price-input"
            type="number"
            placeholder="Min"
            value={kitMinPrice || ""}
            onChange={(e) => setKitMinPrice(Number(e.target.value))}
          />
          <span className="price-sep">–</span>
          <input
            className="price-input"
            type="number"
            placeholder="Max"
            value={kitMaxPrice || ""}
            onChange={(e) => setKitMaxPrice(Number(e.target.value))}
          />
        </div>
      </div>

      {!kitsLoading && (
        <div className="filter-summary">
          <Boxes size={13} />
          Showing <strong>{filteredKits.length}</strong> of {kits.length} combos
        </div>
      )}
    </>
  );

  const FilterContent = memo(
    ({ showHeader = true }: { showHeader?: boolean }) => {
      return (
        <>
          {showHeader && (
            <div className="filter-header">
              <span className="filter-title">Filters</span>
              {hasActiveFilters && (
                <motion.button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border-2"
                  style={{
                    borderColor: "var(--clear-btn-border)",
                    background: "var(--clear-btn-bg)",
                    color: "var(--clear-btn-text)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 12px var(--clear-btn-glow)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear all
                </motion.button>
              )}
            </div>
          )}

          {/* Smart lesson filter */}
          {currentCourseId && currentCourseComboIds.length > 0 && (
            <div className="filter-group">
              <button
                className={`chip-filter ${lessonFilterActive ? "active" : ""}`}
                onClick={() => {
                  setLessonFilterActive((active) => !active);
                  updateFilter("category", "all");
                }}
              >
                📚 Based on your current lesson
              </button>
            </div>
          )}

          {/* Category */}
          <div className="filter-group">
            <FilterLabel icon="category">Category</FilterLabel>
            <div className="filter-chip-group">
              {categoryOptions.map(([key, cat]) => (
                <button
                  key={key}
                  className={`chip-filter ${filters.category === key ? "active" : ""}`}
                  onClick={() => updateFilter("category", key)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {dynamicFilters.colors.length > 0 && (
            <div className="filter-group">
              <div className="filter-section-head">
                <FilterLabel icon="color">Color</FilterLabel>
                {dynamicFilters.colors.length > 6 && (
                  <button
                    type="button"
                    className="filter-show-more"
                    onClick={() => setShowAllColors((visible) => !visible)}
                  >
                    {showAllColors
                      ? "Show less"
                      : `Show all (${dynamicFilters.colors.length})`}
                  </button>
                )}
              </div>
              <div className="filter-chip-group">
                {(showAllColors
                  ? dynamicFilters.colors
                  : dynamicFilters.colors.slice(0, 6)
                ).map((c) => (
                  <button
                    key={c.name}
                    className={`chip-filter ${filters.color.includes(c.name) ? "active" : ""}`}
                    onClick={() => toggleArrayFilter("color", c.name)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: c.hex,
                        border: "1px solid rgba(0,0,0,0.12)",
                        flexShrink: 0,
                      }}
                    />
                    {c.name}
                  </button>
                ))}
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
              Showing <strong>{displayedProducts.length}</strong> of{" "}
              {totalCount} products
            </div>
          )}
        </>
      );
    },
  );

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-8">
      <style>{`
        /* ── View mode toggle buttons ── */
        .shop-mode-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 2px solid var(--primary);
          transition: all 0.2s ease;
          background: var(--card);
          color: var(--foreground);
        }
        .shop-mode-btn:hover {
          background: var(--accent-blush) !important;
          color: var(--foreground) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--glow-primary);
        }
        .shop-mode-btn.shop-mode-active {
          background: var(--accent-blush);
          color: var(--foreground);
          box-shadow: 0 2px 8px var(--glow-primary);
        }
        .dark .shop-mode-btn {
          border-color: var(--primary);
          color: var(--primary);
        }
        .dark .shop-mode-btn:hover {
          background: var(--primary) !important;
          color: var(--primary-foreground) !important;
          box-shadow: 0 4px 12px var(--glow-primary);
        }
        .dark .shop-mode-btn.shop-mode-active {
          background: var(--primary);
          color: var(--primary-foreground);
          box-shadow: 0 2px 8px var(--glow-primary);
        }
        .mode-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(0,0,0,0.08);
          font-size: 0.7rem;
          font-weight: 700;
        }
        .dark .mode-count { background: rgba(255,255,255,0.14); }
        .shop-mode-active .mode-count { background: rgba(0,0,0,0.12); }
        .dark .shop-mode-active .mode-count { background: rgba(255,255,255,0.22); }

        /* ── Top bar ── */
        .shop-top {
          background: linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%);
          padding: 1.5rem 1rem 1.1rem;
          position: relative; overflow: hidden;
        }
        .shop-top::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .shop-top::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .shop-container { max-width: 1440px; margin: 0 auto; position: relative; z-index: 1; }

        .shop-headline-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .shop-headline {
          font-size: clamp(1.4rem, 5vw, 2rem);
          font-weight: 700; color: #fff; margin-bottom: 0.25rem; letter-spacing: -0.02em;
        }
        .shop-subhead {
          color: rgba(255,255,255,0.75); font-size: 0.875rem; margin-bottom: 0.7rem;
        }
        .shop-stat-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; margin-bottom: 0.7rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.28);
          color: #fff; font-size: 0.8rem; font-weight: 600;
          white-space: nowrap;
        }
        @media (max-width: 640px) { .shop-stat-chip { display: none; } }

        /* ── Search ── */
        .search-wrap { position: relative; max-width: 480px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: rgba(255,255,255,0.45); pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 10px 12px 10px 40px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          border: 1.5px solid rgba(255,255,255,0.32);
          border-radius: 100px; outline: none; font-family: inherit;
          font-size: 0.9rem; color: #fff; transition: all 0.25s;
          -webkit-appearance: none;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.65); }
        .search-input:focus { background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.55); }

        /* ── Quick category nav (fills the top-bar, doubles as breadcrumb) ── */
        .quick-nav {
          display: flex; gap: 6px; margin-top: 10px;
          overflow-x: auto; padding-bottom: 2px;
          scrollbar-width: none;
        }
        .quick-nav::-webkit-scrollbar { display: none; }
        .quick-nav-pill {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 600;
          border: 1.5px solid rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer; white-space: nowrap;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .quick-nav-pill:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
        .quick-nav-pill.active { background: #fff; color: var(--primary); border-color: #fff; }

        /* ── Body layout ── */
                        .shop-body {
                                  max-width: 1440px; margin: 0 auto; padding: 0.75rem;
                                            display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 4fr); gap: 0.75rem;
                                }
        @media (max-width: 768px) {
                  .shop-body { grid-template-columns: 1fr; padding: 0.65rem; }
                }

        /* ── Sidebar (desktop) ── */
        .filter-panel {
          background: var(--card-bg, var(--card));
                    border-radius: 14px; border: 1px solid var(--border);
          padding: 0.8rem; height: fit-content;
          position: sticky; top: 6rem;
          max-height: calc(100vh - 7rem);
          overflow-y: auto;
        }
        .dark .filter-panel { background: var(--surface) !important; border-color: var(--chip-border) !important; }
        .dark .filter-panel .filter-group-label { color: var(--foreground-muted) !important; }
        .dark .filter-panel .filter-title { color: var(--foreground) !important; }
        .dark .filter-panel .filter-clear { color: var(--primary) !important; }
        @media (max-width: 768px) {
          .filter-panel { display: none; }
        }

        /* ── Mobile filter drawer ── */
        .filter-fab {
          display: none;
          align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 100px;
          font-size: 0.82rem; font-weight: 500;
          border: 1px solid var(--border);
          background: var(--card); color: var(--foreground);
          cursor: pointer; white-space: nowrap;
        }
        @media (max-width: 768px) {
          .filter-fab { display: inline-flex; }
        }

        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          z-index: 200; backdrop-filter: blur(2px);
        }
        .drawer {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--card-bg, var(--card));
          border-radius: 20px 20px 0 0;
          padding: 0 1rem 1rem;
                    max-height: 82dvh; overflow-y: auto;
          z-index: 201;
          /* safe area for iPhone home indicator */
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
        .dark .drawer { background: var(--surface) !important; }
        .drawer-handle {
          width: 36px; height: 4px; border-radius: 2px;
          background: var(--border); margin: 12px auto 16px;
        }
        .drawer-close {
          position: absolute; top: 12px; right: 14px;
          background: none; border: none; cursor: pointer;
          color: var(--foreground-muted); padding: 4px;
        }

        /* ── Filter internals ── */
        .filter-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.55rem;
                  }
                  .filter-title { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--foreground); font-family: var(--font-heading); }
        .filter-clear { font-size: 0.78rem; color: var(--primary); background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; font-weight: 500; }
        .filter-group {
          padding-bottom: 0.65rem; margin-bottom: 0.65rem;
          border-bottom: 1px dashed var(--border-subtle);
        }
        .filter-group:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .filter-group-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.86rem; font-weight: 600; color: var(--foreground-secondary);
          margin-bottom: 0.35rem; letter-spacing: 0.02em;
        }
                .filter-group-label svg { color: var(--primary); opacity: 0.8; flex-shrink: 0; }
        .filter-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 0.35rem; }
                .filter-section-head .filter-group-label { margin-bottom: 0; }
        .filter-show-more { border: 0; background: transparent; color: var(--primary); font-size: 0.72rem; font-weight: 600; cursor: pointer; padding: 2px 0; white-space: nowrap; }
        .filter-show-more:hover { color: var(--primary-hover); text-decoration: underline; }
        .filter-chip-group { display: flex; flex-wrap: wrap; gap: 5px; }
        .chip-filter {
          display: inline-flex; align-items: center; gap: 5px;
                              padding: 5px 10px; border-radius: 18px;
          font-size: 0.78rem; font-weight: 500;
          border: 1px solid var(--border); background: var(--card);
          color: var(--foreground); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .chip-filter:hover, .chip-filter:active { border-color: var(--primary); background: var(--accent-blush); color: var(--foreground); }
        .dark .chip-filter { background: var(--surface); color: var(--foreground); border-color: var(--chip-border); }
        .dark .chip-filter:hover, .dark .chip-filter:active { border-color: var(--primary); background: var(--primary); color: var(--primary-foreground); }
        .chip-filter.active { background: var(--accent-blush); color: var(--foreground); border-color: var(--primary); }
        .dark .chip-filter.active { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }

        /* Live "showing X of Y" note anchored under the filters, so a short
           filter list never ends in dead whitespace. */
        .filter-summary {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.76rem; color: var(--foreground-muted);
          padding-top: 0.45rem; margin-top: 0;
          border-top: 1px solid var(--border-subtle);
        }
        .filter-summary svg { color: var(--primary); opacity: 0.7; flex-shrink: 0; }
        .filter-summary strong { color: var(--foreground); }

        /* Add to cart button - same style as enroll */
        .add-cart-btn {
          background: var(--accent-blush);
          color: var(--foreground);
          border: 2px solid var(--primary);
          transition: all 0.2s ease;
        }
        .add-cart-btn:hover {
          background: var(--accent-pink);
          color: var(--foreground);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--glow-primary);
        }
        .dark .add-cart-btn {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
        }
        .dark .add-cart-btn:hover {
          background: var(--primary-hover);
          box-shadow: 0 4px 12px var(--glow-primary);
        }

        /* ── Price range ── */
        .price-inputs { display: flex; gap: 6px; align-items: center; }
        .price-input {
          width: 100%; padding: 8px 9px;
          border: 1px solid var(--border); border-radius: 8px;
          background: var(--card); font-size: 0.82rem; color: var(--foreground);
          outline: none; -webkit-appearance: none;
        }
        .price-input:focus { border-color: var(--primary); }
        .price-sep { color: var(--foreground-muted); font-size: 0.75rem; }
        .price-find-btn {
          margin-top: 8px; width: 100%; padding: 8px;
          border-radius: 10px; border: none;
          background: var(--primary); color: var(--primary-foreground);
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
        }
        .price-find-btn:hover { background: var(--primary-hover); transform: translateY(-1px); }

        /* ── Sort / results bar ── */
        .sort-bar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;
        }
        .sort-bar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .sort-select {
          padding: 7px 28px 7px 12px; border-radius: 20px;
          font-size: 0.82rem; border: 1px solid var(--border);
          background: var(--card); color: var(--foreground);
          -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
          cursor: pointer; outline: none;
        }
        .results-count {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.83rem; color: var(--foreground-muted);
        }
        .results-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary); }

        /* ── Active chips strip ── */
        .filter-strip {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 0.75rem; padding: 4px 0; align-items: center;
        }
        .active-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; background: var(--primary); color: var(--primary-foreground);
          border-radius: 20px; font-size: 0.76rem; font-weight: 500;
        }
        .chip-x {
          cursor: pointer; opacity: 0.7; transition: opacity 0.2s;
          line-height: 1; font-size: 1rem;
          -webkit-tap-highlight-color: transparent;
        }
        .chip-x:hover { opacity: 1; }

        .lesson-banner {
                    margin-bottom: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 18px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-card)), var(--color-bg-card));
                    padding: 0.8rem;
          box-shadow: var(--shadow-card);
        }
        .lesson-banner-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem; }
        .lesson-banner-title { font-weight: 700; color: var(--color-text); }
        .lesson-banner-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 0.75rem; }
        @media (min-width: 768px) { .lesson-banner-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
                .product-grid,
                .combo-grid {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  gap: 0.7rem;
                  align-items: start;
                }
                @media (min-width: 480px) {
          .product-grid,
          .combo-grid { gap: 0.8rem; }
        }
        @media (min-width: 768px) {
          .product-grid,
          .combo-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1100px) {
          .product-grid,
          .combo-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }

        /* ── Pagination ── */
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; margin-top: 1.1rem; padding-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .page-btn {
          min-width: 44px; min-height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; font-size: 0.85rem;
          border: 1px solid var(--border); background: var(--card);
          color: var(--foreground); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .page-btn:hover { border-color: var(--primary); }
        .page-btn.active { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .page-dots {
          min-width: 24px; text-align: center;
          color: var(--foreground-muted); font-size: 0.85rem;
          user-select: none;
        }

        /* ── Empty state ── */
        .empty-state-cta {
          margin-top: 16px; padding: 9px 22px; border-radius: 999px;
          border: none; background: var(--primary); color: var(--primary-foreground);
          font-weight: 600; font-size: 0.85rem; cursor: pointer;
          transition: all 0.2s ease;
        }
        .empty-state-cta:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px var(--glow-primary); }

        /* ── Loader ── */
        .loading-dots {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 4rem 0;
        }
        .loading-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--primary);
          animation: dotPulse 0.8s ease-in-out infinite alternate;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.15s; }
        .loading-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dotPulse {
          from { opacity: 0.25; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1.2); }
        }

        /* ── Kit / combo cards ── */
        .kit-card-meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.03em;
          text-transform: uppercase; color: var(--primary);
        }

        /* ── Lesson banner & drawer CTA hover effects ── */
        .lesson-add-btn {
          transition: all 0.2s ease;
        }
        .lesson-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--glow-primary);
        }
        .drawer-cta-btn {
          width: 100%; padding: 13px;
          background: var(--primary); color: var(--primary-foreground);
          border: none; border-radius: 12px;
          font-size: 0.95rem; font-weight: 600; cursor: pointer;
          margin-top: 0.5rem; touch-action: manipulation;
          transition: all 0.2s ease;
        }
        .drawer-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--glow-primary);
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="shop-top">
        <div className="shop-container">
          <div className="shop-headline-row">
            <div>
              <div className="shop-headline">
                {meta.emoji} {meta.label}
              </div>
              <div className="shop-subhead">{meta.desc}</div>
            </div>
            <div className="shop-stat-chip">
              <Sparkles size={14} />
              <strong>{totalCount}</strong>&nbsp;items in the shop
            </div>
          </div>
          {viewMode === "products" && (
            <div className="quick-nav">
              {categoryOptions.map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  className={`quick-nav-pill ${filters.category === key ? "active" : ""}`}
                  onClick={() => updateFilter("category", key)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="shop-body">
        {/* Desktop sidebar - show different filters based on viewMode */}
        <aside className="filter-panel">
          {viewMode === "products" ? <FilterContent /> : <KitFilterContent />}
        </aside>

        {/* Main content */}
        <div>
          {currentLesson &&
            recommendedProducts.length > 0 &&
            !recommendationsDismissed && (
              <section className="lesson-banner">
                <div className="lesson-banner-head">
                  <div>
                    <p className="lesson-banner-title">
                      🧶 Currently learning: {currentLesson.title} — Here are
                      the materials you need:
                    </p>
                  </div>
                  <button
                    className="drawer-close"
                    style={{ position: "static" }}
                    onClick={dismissRecommendations}
                    aria-label="Dismiss lesson recommendations"
                  >
                    <X size={18} />
                  </button>
                </div>
                <button
                  onClick={() => requireAuth(addAllLessonProducts)}
                  className="chip-filter active lesson-add-btn"
                  style={{ marginBottom: "0.75rem" }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>
                    Add to cart
                  </span>
                </button>
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
              </section>
            )}

          {/* View mode toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setViewMode("products")}
              className={`px-4 py-2 rounded-full text-sm font-medium shop-mode-btn ${
                viewMode === "products" ? "shop-mode-active" : ""
              }`}
            >
              🛍️ Products
              <span className="mode-count">{totalCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("combo")}
              className={`px-4 py-2 rounded-full text-sm font-medium shop-mode-btn ${
                viewMode === "combo" ? "shop-mode-active" : ""
              }`}
            >
              🎁 Combo
              {kits.length > 0 && (
                <span className="mode-count">{kits.length}</span>
              )}
            </button>
          </div>

          {/* Products content — only show if viewMode === "products" */}
          {viewMode === "products" && (
            <div>
              <div className="sort-bar">
                <div className="sort-bar-left">
                  <button
                    className="filter-fab"
                    onClick={() => setFilterOpen(true)}
                  >
                    <SlidersHorizontal size={14} />
                    Filters
                    {hasActiveFilters && (
                      <span
                        style={{
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}
                      >
                        {activeChips.length}
                      </span>
                    )}
                  </button>
                  <div className="results-count">
                    <span className="results-dot" />
                    {!hasActiveFilters && resultCount === totalCount ? (
                      <span>
                        All <strong>{totalCount}</strong> products
                      </span>
                    ) : (
                      <span>
                        <strong>{displayedProducts.length}</strong> of{" "}
                        {totalCount}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  className="sort-select"
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <AnimatePresence>
                {activeChips.length > 0 && (
                  <motion.div
                    className="filter-strip"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <span className="filter-group-label">Active:</span>
                    {activeChips.map((chip) => (
                      <motion.span
                        key={chip.value + chip.type}
                        className="active-chip"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.18 }}
                      >
                        {chip.label}
                        <span
                          className="chip-x"
                          onClick={() => removeChip(chip.type, chip.value)}
                        >
                          ×
                        </span>
                      </motion.span>
                    ))}
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
                    <div className="pagination">
                      <button
                        className="page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        ‹
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
                          >
                            {page}
                          </button>
                        ),
                      )}
                      <button
                        className="page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 1rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  <Package
                    size={44}
                    style={{ margin: "0 auto 1rem", opacity: 0.3 }}
                  />
                  <p style={{ fontWeight: 500, marginBottom: 4 }}>
                    {getEmptyStateMessage()}
                  </p>
                  <p style={{ fontSize: "0.83rem" }}>
                    Try adjusting your filters
                  </p>
                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="empty-state-cta"
                        onClick={clearFilters}
                        style={{ marginRight: "8px" }}
                      >
                        Clear filters
                      </button>
                    )}
                    {filters.search && (
                      <button
                        type="button"
                        className="empty-state-cta"
                        onClick={clearSearch}
                        style={{
                          background: "var(--accent-blush)",
                          color: "var(--foreground)",
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Combo (Kits) content — only show if viewMode === "combo" */}
          {viewMode === "combo" && (
            <>
              <div className="sort-bar">
                <div className="sort-bar-left">
                  <button
                    className="filter-fab"
                    onClick={() => setFilterOpen(true)}
                  >
                    <SlidersHorizontal size={14} />
                    Filters
                    {hasActiveKitFilters && (
                      <span
                        style={{
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}
                      >
                        {
                          [
                            hasActiveKitLevel,
                            kitMinPrice > 0 || kitMaxPrice > 0,
                          ].filter(Boolean).length
                        }
                      </span>
                    )}
                  </button>
                  <div className="results-count">
                    <span className="results-dot" />
                    <span>
                      <strong>{filteredKits.length}</strong> combos available
                    </span>
                  </div>
                </div>
              </div>
              {kitsLoading ? (
                <div className="combo-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredKits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package size={44} className="mx-auto mb-3 opacity-40" />
                  <p>No kits found</p>
                  {hasActiveKitFilters && (
                    <button
                      type="button"
                      className="empty-state-cta"
                      onClick={clearKitFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="combo-grid animate-fade-in-soft">
                  {filteredKits.map((kit) => {
                    const isFavorite = isFavoriteKit(kit._id);

                    return (
                      <Link
                        key={kit._id}
                        to={`/kits/${kit._id}`}
                        className="block bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`${t("shop.kitDetail")} ${kit.name}`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                          <ResponsiveImage
                            src={kit.thumbnail}
                            alt={kit.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://picsum.photos/seed/${kit._id}/400/300`;
                              }
                            }}
                          />
                          {/* Favorite button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavoriteKit(kit._id);
                              toast.success(
                                isFavorite
                                  ? t("shop.removedFromFavorites")
                                  : "Added to favorites",
                              );
                            }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                            style={{
                              background: "var(--card-glass)",
                              backdropFilter: "blur(14px) saturate(160%)",
                              WebkitBackdropFilter: "blur(14px) saturate(160%)",
                              border: "1px solid var(--border-subtle)",
                              boxShadow: "var(--shadow-md)",
                              touchAction: "manipulation",
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            <Heart
                              className={cn(
                                "w-4 h-4 transition-colors",
                                isFavorite
                                  ? "fill-destructive text-destructive"
                                  : "text-muted-foreground hover:text-destructive",
                              )}
                            />
                          </button>
                          <span
                            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{
                              background: "var(--card-glass)",
                              backdropFilter: "blur(14px) saturate(160%)",
                              WebkitBackdropFilter: "blur(14px) saturate(160%)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--primary)",
                            }}
                          >
                            {kit.level}
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="kit-card-meta">
                            <Boxes size={12} />
                            {(kit.products || []).length} products included
                          </div>
                          <h3 className="font-semibold group-hover:text-primary">
                            {kit.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {kit.description}
                          </p>
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
                                {kit.averageRating.toFixed(1)} (
                                {kit.totalRatings})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(kit.price)}
                            </span>
                            <span className="text-xs font-medium text-primary">
                              {t("shop.viewDetails")} →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
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
              <button
                className="drawer-close"
                onClick={() => setFilterOpen(false)}
              >
                <X size={20} />
              </button>
              {viewMode === "products" ? (
                <FilterContent />
              ) : (
                <KitFilterContent />
              )}
              <button
                onClick={() => setFilterOpen(false)}
                className="drawer-cta-btn"
              >
                {viewMode === "products"
                  ? `Show ${resultCount} results`
                  : `Show ${filteredKits.length} results`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
