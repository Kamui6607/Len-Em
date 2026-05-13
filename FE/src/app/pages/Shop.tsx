import { X, Package } from "lucide-react";
import { motion } from "motion/react";
import { ProductCard } from "../components/ProductCard";
import { ProductFilter } from "../components/ProductFilter";
import { useProducts } from "../hooks/useProducts";
import { cn } from "../components/ui/utils";

/* ── Category meta ── */
const CATEGORY_META: Record<
  string,
  { label: string; desc: string; emoji: string; color: string }
> = {
  all: {
    label: "Shop All",
    desc: "Everything you need to start your cozy crochet journey",
    emoji: "🛍️",
    color: "var(--rose)",
  },
  yarn: {
    label: "Yarn",
    desc: "Premium yarns for every project — from chunky blankets to delicate lace",
    emoji: "🧵",
    color: "var(--lavender)",
  },
  kit: {
    label: "DIY Kits",
    desc: "Curated kits with everything you need to create something beautiful",
    emoji: "🎁",
    color: "var(--sage-d)",
  },
  tools: {
    label: "Tools",
    desc: "Essential tools and accessories for every crafter",
    emoji: "🪡",
    color: "var(--butter-d)",
  },
};

export function Shop() {
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

  const meta = CATEGORY_META[filters.category] ?? CATEGORY_META.all;

  const getEmptyStateMessage = () => {
    if (filters.search) return `No products found matching "${filters.search}"`;
    if (filters.color.length > 0)
      return `No ${filters.category !== "all" ? filters.category : ""} products in the selected color`;
    if (filters.material.length > 0)
      return `No ${filters.category !== "all" ? filters.category : ""} products with the selected material`;
    if (filters.difficulty.length > 0)
      return `No ${filters.category !== "all" ? filters.category : ""} products at the selected difficulty`;
    return "No products match your filters";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        /* ── CSS Variables: Light ── */
        :root {
          --rose:      #F2A7B2;
          --blush:     #F9DDE2;
          --sage:      #A8C5B5;
          --sage-d:    #6FA08A;
          --lavender:  #C4B5E0;
          --lavender-d:#8B76C4;
          --butter:    #F5E6A3;
          --butter-d:  #C4A84A;
          --cream:     #FDF8F2;
          --ink:       #2A2220;
          --muted:     #7A6E6B;
          --card-bg:   #FFFFFF;
          --surface:   #FFFFFF;
          --border:    rgba(242,167,178,0.15);
          --blob-blush-op: 0.4;
          --blob-lav-op:   0.2;
          --blob-sage-op:  0.15;
        }

        /* ── CSS Variables: Dark ── */
        .dark {
          --cream:     #17100E;
          --ink:       #F0E8E4;
          --muted:     #9A8480;
          --card-bg:   #211714;
          --surface:   #1E1410;
          --blush:     #3A2020;
          --lavender:  #2A2238;
          --border:    rgba(200,120,100,0.14);
          --blob-blush-op: 0.18;
          --blob-lav-op:   0.12;
          --blob-sage-op:  0.08;
        }

        .shop-root {
          min-height: 100vh;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
          transition: background 0.3s ease;
        }

        /* ── Ambient blobs ── */
        .shop-blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(90px);
          transition: opacity 0.4s ease;
        }

        /* ── Mesh grid ── */
        .shop-mesh {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(242,167,178,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,167,178,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .dark .shop-mesh {
          background-image:
            linear-gradient(rgba(200,120,100,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,120,100,0.04) 1px, transparent 1px);
        }

        .shop-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* ── Page header ── */
        .shop-header {
          margin-bottom: 36px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .shop-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--rose);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shop-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: color 0.3s;
        }

        .shop-title-accent {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .shop-desc {
          color: var(--muted);
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.7;
          max-width: 520px;
          transition: color 0.3s;
        }

        /* ── Results bar ── */
        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px 16px;
          background: var(--surface);
          border-radius: 14px;
          border: 1.5px solid var(--border);
          transition: background 0.3s, border-color 0.3s;
        }

        .results-count {
          font-size: 0.82rem;
          color: var(--muted);
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.3s;
        }
        .results-count strong { color: var(--ink); font-weight: 600; transition: color 0.3s; }

        .results-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--rose);
          display: inline-block;
          flex-shrink: 0;
        }

        .clear-btn-mobile {
          font-size: 0.78rem;
          color: var(--muted);
          background: none; border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          padding: 4px 10px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .clear-btn-mobile:hover { color: #e05e6f; background: rgba(242,167,178,0.1); }
        .dark .clear-btn-mobile:hover { color: #F2A7B2; background: rgba(242,167,178,0.08); }

        /* ── Loading ── */
        .shop-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 0; gap: 16px;
        }
        .shop-loading-spinner {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2.5px solid var(--blush);
          border-top-color: var(--rose);
          animation: shopSpin 0.8s linear infinite;
          transition: border-color 0.3s;
        }
        @keyframes shopSpin { to { transform: rotate(360deg); } }
        .shop-loading p { font-size: 0.88rem; color: var(--muted); font-weight: 300; }

        /* ── Product grid ── */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        /* ── Empty state ── */
        .empty-state {
          text-align: center;
          padding: 80px 24px;
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
        }

        .empty-icon-wrap {
          width: 88px; height: 88px;
          border-radius: 28px;
          background: linear-gradient(135deg, var(--blush), var(--lavender));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          position: relative;
          transition: background 0.3s;
        }
        .empty-icon-wrap::after {
          content: '✦';
          position: absolute; top: -6px; right: -6px;
          font-size: 14px;
          color: var(--rose);
          animation: emptyTwinkle 2.5s ease-in-out infinite;
        }
        @keyframes emptyTwinkle {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }

        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem; font-weight: 700;
          color: var(--ink);
          margin-bottom: 8px;
          transition: color 0.3s;
        }
        .empty-desc {
          color: var(--muted);
          font-size: 0.88rem; font-weight: 300; line-height: 1.7;
          max-width: 360px; margin-bottom: 24px;
          transition: color 0.3s;
        }

        .empty-clear-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ink);
          color: var(--cream);
          padding: 12px 28px;
          border-radius: 100px; border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500;
          transition: transform 0.25s, box-shadow 0.25s, background 0.3s, color 0.3s;
        }
        .empty-clear-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(42,34,32,0.2);
        }
        .dark .empty-clear-btn:hover { box-shadow: 0 10px 28px rgba(0,0,0,0.4); }

        /* ── Category suggestions ── */
        .category-suggestions {
          margin-top: 32px;
          background: var(--surface);
          border: 1.5px solid rgba(196,181,224,0.2);
          border-radius: 24px;
          padding: 24px;
          transition: background 0.3s, border-color 0.3s;
        }
        .dark .category-suggestions { border-color: rgba(140,110,180,0.14); }

        .category-suggestions h4 {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; font-weight: 700;
          color: var(--ink);
          margin-bottom: 14px;
          transition: color 0.3s;
        }
        .category-chips { display: flex; flex-wrap: wrap; gap: 10px; }

        .cat-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          border-radius: 100px;
          font-size: 0.85rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--ink);
          border: 1.5px solid var(--border);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .cat-chip:hover {
          background: var(--surface);
          border-color: var(--rose);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(242,167,178,0.2);
        }
        .dark .cat-chip:hover { box-shadow: 0 8px 20px rgba(242,167,178,0.1); }

        /* ── Pagination ── */
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 56px;
        }
        .page-btn {
          min-width: 40px; height: 40px;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500;
          cursor: pointer; padding: 0 14px;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .page-btn:hover:not(:disabled) {
          border-color: var(--rose);
          background: var(--blush);
          transform: translateY(-1px);
        }
        .page-btn.active {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .page-sep {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--border);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .shop-inner { padding: 28px 16px 60px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .shop-title { font-size: 1.7rem; }
        }
      `}</style>

      <div className="shop-root">
        <div className="shop-mesh" />
        <div
          className="shop-blob"
          style={{
            width: 500,
            height: 500,
            background: "var(--blush)",
            opacity: "var(--blob-blush-op)",
            top: "-10%",
            right: "-8%",
          }}
        />
        <div
          className="shop-blob"
          style={{
            width: 320,
            height: 320,
            background: "var(--lavender)",
            opacity: "var(--blob-lav-op)",
            bottom: "10%",
            left: "-6%",
          }}
        />
        <div
          className="shop-blob"
          style={{
            width: 200,
            height: 200,
            background: "var(--sage)",
            opacity: "var(--blob-sage-op)",
            top: "40%",
            left: "40%",
          }}
        />

        <div className="shop-inner">
          {/* ── Header ── */}
          <motion.div
            className="shop-header"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="shop-label">
              <span>✦</span>
              <span>CozyStitch Store</span>
            </div>
            <div className="shop-title">
              <span
                className="shop-title-accent"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 30%, white), color-mix(in srgb, ${meta.color} 60%, white))`,
                }}
              >
                {meta.emoji}
              </span>
              {meta.label}
            </div>
            <p className="shop-desc">{meta.desc}</p>
          </motion.div>

          {/* ── Filter ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductFilter
              filters={filters}
              dynamicFilters={dynamicFilters}
              activeChips={activeChips}
              hasActiveFilters={hasActiveFilters}
              searchValue={filters.search}
              onSearchChange={(value) => updateFilter("search", value)}
              onCategoryChange={(category) =>
                updateFilter("category", category)
              }
              onSortChange={(sort) => updateFilter("sort", sort)}
              onToggleFilter={toggleArrayFilter}
              onClearFilters={clearFilters}
              onRemoveChip={removeChip}
            />
          </motion.div>

          {/* ── Results bar ── */}
          <motion.div
            className="results-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <div className="results-count">
              <span className="results-dot" />
              {!hasActiveFilters && resultCount === totalCount ? (
                <span>
                  All <strong>{totalCount}</strong> products
                </span>
              ) : (
                <span>
                  <strong>{resultCount}</strong> of{" "}
                  <strong>{totalCount}</strong> products
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                className="clear-btn-mobile md:hidden"
                onClick={clearFilters}
              >
                Clear filters ×
              </button>
            )}
          </motion.div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="shop-loading">
              <div className="shop-loading-spinner" />
              <p>Loading your cozy finds...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: (index % 8) * 0.055,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    ← Prev
                  </button>
                  <div className="page-sep" />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={cn(
                          "page-btn",
                          currentPage === page && "active",
                        )}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <div className="page-sep" />
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Package size={36} color="var(--muted)" />
              </div>
              <div className="empty-title">{getEmptyStateMessage()}</div>
              <p className="empty-desc">
                Try adjusting your search, removing some filters, or browsing a
                different category.
              </p>
              {hasActiveFilters && (
                <button className="empty-clear-btn" onClick={clearFilters}>
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* ── Category suggestions ── */}
          {!isLoading &&
            filteredProducts.length === 0 &&
            !hasActiveFilters &&
            filters.category !== "all" && (
              <motion.div
                className="category-suggestions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h4>✦ Try browsing</h4>
                <div className="category-chips">
                  {(["all", "yarn", "tools", "kit"] as const)
                    .filter((c) => c !== filters.category)
                    .map((cat) => {
                      const m = CATEGORY_META[cat];
                      return (
                        <button
                          key={cat}
                          className="cat-chip"
                          onClick={() => updateFilter("category", cat)}
                        >
                          <span>{m.emoji}</span>
                          {m.label}
                        </button>
                      );
                    })}
                </div>
              </motion.div>
            )}
        </div>
      </div>
    </>
  );
}
