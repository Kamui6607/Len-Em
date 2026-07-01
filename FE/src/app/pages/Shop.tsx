import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Package, Search, SlidersHorizontal, X, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { products } from "../data/products";
import {
  getLessonsByCourse,
  materialCombos,
} from "../../features/learn/data/learn.mock";
import { useLearnStore } from "../../store/learn.store";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { formatPrice } from "../../lib/formatPrice";
import { kitService, type Kit } from "../../api/kitService";
import { cn } from "../components/ui/utils";

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

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
];

export function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isFavoriteKit, toggleFavoriteKit } = useFavorites();

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
    clearFilters,
    toggleArrayFilter,
    removeChip,
    goToPage,
  } = useProducts();

  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"products" | "combo">("products");
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);

  // Fetch kits when switching to combo view
  useEffect(() => {
    if (viewMode === "combo") {
      setKitsLoading(true);
      kitService
        .getAll({ page: 1, limit: 50 })
        .then((res) => setKits(res.data.data?.kits ?? []))
        .catch(() => toast.error("Failed to load kits"))
        .finally(() => setKitsLoading(false));
    }
  }, [viewMode]);
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
      ...dynamicFilters.categories.map(
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
          lesson.linkedProducts.some((linkedProduct) =>
            combo.productIds.includes(linkedProduct.productId),
          ),
        ),
      )
      .map((combo) => combo.id);
  }, [currentCourseId, currentLessons]);
  const recommendedProducts = useMemo(() => {
    if (!currentLesson) return [];
    const lessonProductIds = currentLesson.linkedProducts.map(
      (product) => product.productId,
    );
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

  const FilterContent = ({ showHeader = true }: { showHeader?: boolean }) => (
    <>
      {showHeader && (
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          {hasActiveFilters && (
            <button className="filter-clear" onClick={clearFilters}>
              Clear all
            </button>
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
        <span className="filter-group-label">Category</span>
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
          <span className="filter-group-label">Color</span>
          <div className="filter-chip-group">
            {dynamicFilters.colors.map((c) => (
              <button
                key={c.name}
                className={`chip-filter ${filters.color.includes(c.name) ? "active" : ""}`}
                onClick={() => toggleArrayFilter("color", c.name)}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.hex,
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material */}
      {dynamicFilters.materials.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">Material</span>
          <div className="filter-chip-group">
            {dynamicFilters.materials.map((m) => (
              <button
                key={m.name}
                className={`chip-filter ${filters.material.includes(m.name) ? "active" : ""}`}
                onClick={() => toggleArrayFilter("material", m.name)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weight */}
      {dynamicFilters.weights.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">Weight</span>
          <div className="filter-chip-group">
            {dynamicFilters.weights.map((w) => (
              <button
                key={w.name}
                className={`chip-filter ${filters.weight.includes(w.name) ? "active" : ""}`}
                onClick={() => toggleArrayFilter("weight", w.name)}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      {dynamicFilters.difficulties.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">Difficulty</span>
          <div className="filter-chip-group">
            {dynamicFilters.difficulties.map((d) => (
              <button
                key={d.name}
                className={`chip-filter ${filters.difficulty.includes(d.name) ? "active" : ""}`}
                onClick={() => toggleArrayFilter("difficulty", d.name)}
              >
                {d.name.charAt(0).toUpperCase() + d.name.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className="filter-group">
        <span className="filter-group-label">Price range</span>
        <div className="price-inputs">
          <input
            className="price-input"
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) => updateFilter("minPrice", Number(e.target.value))}
          />
          <span className="price-sep">–</span>
          <input
            className="price-input"
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) => updateFilter("maxPrice", Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        /* ── Top bar ── */
        .shop-top {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          padding: 2rem 1rem 1.5rem;
          position: relative; overflow: hidden;
        }
        .shop-top::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .shop-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }

        .shop-headline {
          font-size: clamp(1.4rem, 5vw, 2rem);
          font-weight: 700; color: #fff; margin-bottom: 0.25rem; letter-spacing: -0.02em;
        }
        .shop-subhead {
          color: rgba(255,255,255,0.75); font-size: 0.875rem; margin-bottom: 1rem;
        }

        /* ── Search ── */
        .search-wrap { position: relative; max-width: 480px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: rgba(255,255,255,0.45); pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 10px 12px 10px 40px;
          background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 100px; outline: none; font-family: inherit;
          font-size: 0.9rem; color: #fff; transition: all 0.25s;
          -webkit-appearance: none;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.45); }
        .search-input:focus { background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.4); }

        /* ── Body layout ── */
        .shop-body {
          max-width: 1200px; margin: 0 auto; padding: 1rem;
          display: grid; grid-template-columns: 220px 1fr; gap: 1.25rem;
        }
        @media (max-width: 768px) {
          .shop-body { grid-template-columns: 1fr; }
        }

        /* ── Sidebar (desktop) ── */
        .filter-panel {
          background: var(--card-bg, var(--card));
          border-radius: 14px; border: 1px solid var(--border);
          padding: 1rem; height: fit-content;
          position: sticky; top: 5rem;
        }
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
          padding: 0 1rem 2rem;
          max-height: 85dvh; overflow-y: auto;
          z-index: 201;
          /* safe area for iPhone home indicator */
          padding-bottom: calc(2rem + env(safe-area-inset-bottom));
        }
        .drawer-handle {
          width: 36px; height: 4px; border-radius: 2px;
          background: var(--border); margin: 12px auto 16px;
        }
        .drawer-close {
          position: absolute; top: 12px; right: 14px;
          background: none; border: none; cursor: pointer;
          color: var(--muted-foreground); padding: 4px;
        }

        /* ── Filter internals ── */
        .filter-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .filter-title { font-weight: 600; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--foreground); }
        .filter-clear { font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; }
        .filter-group { margin-bottom: 0.9rem; }
        .filter-group-label { font-size: 0.76rem; font-weight: 500; color: var(--muted-foreground); display: block; margin-bottom: 0.35rem; }
        .filter-chip-group { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip-filter {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 20px;
          font-size: 0.76rem; font-weight: 500;
          border: 1px solid var(--border); background: var(--card);
          color: var(--foreground); cursor: pointer; transition: all 0.2s;
          /* prevent tap highlight on iOS */
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .chip-filter:hover, .chip-filter:active { border-color: var(--primary); background: var(--primary-foreground); }
        .chip-filter.active { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }

        /* ── Price range ── */
        .price-inputs { display: flex; gap: 6px; align-items: center; }
        .price-input {
          width: 100%; padding: 7px 8px;
          border: 1px solid var(--border); border-radius: 8px;
          background: var(--card); font-size: 0.82rem; color: var(--foreground);
          outline: none; -webkit-appearance: none;
        }
        .price-input:focus { border-color: var(--primary); }
        .price-sep { color: var(--muted-foreground); font-size: 0.75rem; }

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
          font-size: 0.83rem; color: var(--muted-foreground);
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
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
          border-radius: 18px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-card)), var(--color-bg-card));
          padding: 1rem;
          box-shadow: 0 12px 32px rgba(44,36,32,0.08);
        }
        .lesson-banner-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem; }
        .lesson-banner-title { font-weight: 700; color: var(--color-text); }
        .lesson-banner-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 0.75rem; }
        @media (min-width: 768px) { .lesson-banner-grid { grid-template-columns: repeat(4, 1fr); } }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .product-grid { gap: 1rem; }
        }
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 960px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── Pagination ── */
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; margin-top: 1.5rem; padding-bottom: 2rem;
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
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="shop-top">
        <div className="shop-container">
          <div className="shop-headline">
            {meta.emoji} {meta.label}
          </div>
          <div className="shop-subhead">{meta.desc}</div>
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search products…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="shop-body">
        {/* Desktop sidebar */}
        <aside className="filter-panel">
          <FilterContent />
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
                  className="chip-filter active"
                  style={{ marginBottom: "0.75rem", transition: "all 0.2s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(196,94,62,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  Add to cart
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === "products"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              🛍️ Products
            </button>
            <button
              type="button"
              onClick={() => setViewMode("combo")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === "combo"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              🎁 Combo
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
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              ) : displayedProducts.length > 0 ? (
                <>
                  <div className="product-grid">
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
                          currentLesson?.linkedProducts.some(
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
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                          onClick={() => goToPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
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
                    color: "var(--muted-foreground)",
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
                </div>
              )}
            </div>
          )}

          {/* Combo (Kits) content — only show if viewMode === "combo" */}
          {viewMode === "combo" && (
            <>
              {kitsLoading ? (
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              ) : kits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package size={44} className="mx-auto mb-3 opacity-40" />
                  <p>No kits found</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {kits.length} combos available
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kits.map((kit) => {
                      const isFavorite = isFavoriteKit(kit._id);
                      
                      return (
                        <Link
                          key={kit._id}
                          to={`/kits/${kit._id}`}
                          className="block bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          aria-label={`Xem chi tiết combo ${kit.name}`}
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                            <img
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
                                    ? "Đã xoá khỏi danh sách yêu thích"
                                    : "Đã thêm vào danh sách yêu thích"
                                );
                              }}
                              className="absolute top-3 right-3 w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-sm"
                              style={{
                                background: "var(--card)",
                                opacity: 0.9,
                                touchAction: "manipulation",
                                WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              <Heart
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  isFavorite
                                    ? "fill-destructive text-destructive"
                                    : "text-muted-foreground hover:text-destructive"
                                )}
                              />
                            </button>
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="font-semibold group-hover:text-primary">
                              {kit.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {kit.description}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(kit.price)}
                              </span>
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                                {kit.level}
                              </span>
                            </div>
                            <div className="pt-1 flex items-center justify-between gap-3">
                              <p className="text-xs text-muted-foreground">
                                {kit.productIds.length} products included
                              </p>
                              <span className="text-xs font-medium text-primary">
                                Xem chi tiết →
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
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
              <FilterContent />
              <button
                onClick={() => setFilterOpen(false)}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "0.5rem",
                  touchAction: "manipulation",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(196,94,62,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                Show {resultCount} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
