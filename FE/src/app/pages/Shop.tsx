import { Package, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

/* ── Category meta ── */
const CATEGORY_META: Record<
  string,
  { label: string; desc: string; emoji: string }
> = {
  all:   { label: "All",      desc: "Everything you need to start your cozy crochet journey",                    emoji: "🛍️" },
  yarn:  { label: "Yarn",     desc: "Premium yarns for every project — from chunky blankets to delicate lace",   emoji: "🧵" },
  kit:   { label: "DIY Kits", desc: "Curated kits with everything you need to create something beautiful",       emoji: "🎁" },
  tools: { label: "Tools",    desc: "Essential tools and accessories for every crafter",                         emoji: "🪡" },
};

const SORT_OPTIONS = [
  { value: "popular",    label: "Most popular"  },
  { value: "newest",     label: "Newest first"  },
  { value: "price-asc",  label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating",     label: "Top rated"     },
];

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
    if (filters.search) return `No products found for "${filters.search}"`;
    if (filters.color.length > 0)    return "No products in the selected color";
    if (filters.material.length > 0) return "No products with the selected material";
    if (filters.weight.length > 0)   return "No products in the selected weight";
    if (filters.difficulty.length > 0) return "No products at the selected difficulty";
    return "No products found";
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        /* ──── Top bar ──── */
        .shop-top {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          padding: 2.6rem 1.5rem 1.8rem;
          position: relative;
          overflow: hidden;
        }
  .shop-top::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .shop-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .shop-headline {
          font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.3rem;
          letter-spacing: -0.02em;
        }
        .shop-subhead {
          color: rgba(255,255,255,0.75);
          font-size: 0.95rem;
          font-weight: 400;
          margin-bottom: 1.2rem;
        }

        /* ──── Search bar ──── */
        .search-wrap {
          position: relative;
          max-width: 480px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.45);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 11px 14px 11px 42px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          outline: none;
          font-family: inherit;
          font-size: 0.9rem;
          color: #fff;
          transition: all 0.25s;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.45); }
        .search-input:focus {
          background: rgba(255,255,255,0.22);
          border-color: rgba(255,255,255,0.4);
        }

        /* ──── Body ──── */
        .shop-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 820px) {
          .shop-body {
            grid-template-columns: 1fr;
          }
        }

        /* ──── Sidebar filters ──── */
        .filter-panel {
          background: var(--card-bg, var(--card));
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 1.2rem;
          height: fit-content;
          position: sticky;
          top: 6rem;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.8rem;
        }
        .filter-title {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--foreground);
        }
        .filter-clear {
          font-size: 0.75rem;
          color: var(--primary);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .filter-group { margin-bottom: 1rem; }
        .filter-group-label {
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--muted-foreground);
          display: block;
          margin-bottom: 0.4rem;
        }
        .filter-chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .chip-filter {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 500;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          cursor: pointer;
          transition: all 0.2s;
        }
        .chip-filter:hover {
          border-color: var(--primary);
          background: var(--primary-foreground);
        }
        .chip-filter.active {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
        }

        /* ──── Price range ──── */
        .price-inputs {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .price-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--card);
          font-size: 0.8rem;
          color: var(--foreground);
          outline: none;
        }
        .price-input:focus { border-color: var(--primary); }
        .price-sep { color: var(--muted-foreground); font-size: 0.75rem; }

        /* ──── Sort dropdown ──── */
        .sort-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .sort-select {
          padding: 6px 28px 6px 12px;
          border-radius: 20px;
          font-size: 0.82rem;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          cursor: pointer;
          outline: none;
        }
        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        .results-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--muted-foreground);
        }
        .results-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        /* ──── Grid ──── */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }
        @media (min-width: 600px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 820px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ──── Active chips strip ──── */
        .filter-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 0.8rem;
          padding: 8px 0;
        }
        .active-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: var(--primary);
          color: var(--primary-foreground);
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 500;
        }
        .chip-x {
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
          line-height: 1;
          font-size: 1rem;
        }
        .chip-x:hover { opacity: 1; }

        /* ──── Pagination ──── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 2rem;
          padding-bottom: 2rem;
        }
        .page-btn {
          min-width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
          font-size: 0.85rem;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover { border-color: var(--primary); }
        .page-btn.active {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
        }
        .page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ──── Loader ──── */
        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 4rem 0;
        }
        .loading-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
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

      {/* ──── TOP BAR ──── */}
      <div className="shop-top">
        <div className="shop-container">
          <div className="shop-headline">
            {meta.emoji} {meta.label}
          </div>
          <div className="shop-subhead">
            {meta.desc}
          </div>

          {/* Search */}
          <div className="search-wrap">
            <Search size={17} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search products…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ──── BODY ──── */}
      <div className="shop-body">
        {/* ──── Sidebar ──── */}
        <aside className="filter-panel">
          <div className="filter-header">
            <span className="filter-title">Filters</span>
            {hasActiveFilters && (
              <button className="filter-clear" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          {/* Category */}
          <div className="filter-group">
            <span className="filter-group-label">Category</span>
            <div className="filter-chip-group">
              {Object.entries(CATEGORY_META).map(([key, cat]) => (
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
                        width: 10, height: 10,
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
        </aside>

        {/* ──── Main content ──── */}
        <div>
          {/* Sort bar */}
          <div className="sort-bar">
            <div className="results-count">
              <span className="results-dot" />
              {!hasActiveFilters && resultCount === totalCount ? (
                <span>All <strong>{totalCount}</strong> products</span>
              ) : (
                <span><strong>{resultCount}</strong> of {totalCount} products</span>
              )}
            </div>

            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Active chips */}
          <AnimatePresence>
            {activeChips.length > 0 && (
              <motion.div
                className="filter-strip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="filter-group-label">Active:</span>
                {activeChips.map((chip) => (
                  <motion.span
                    key={chip.value + chip.type}
                    className="active-chip"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                  >
                    {chip.label}
                    <span className="chip-x" onClick={() => removeChip(chip.type, chip.value)}>×</span>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products */}
          {isLoading ? (
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
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
            <div style={{
              textAlign: "center",
              padding: "4rem 1rem",
              color: "var(--muted-foreground)",
            }}>
              <Package size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p style={{ fontWeight: 500, marginBottom: 4 }}>{getEmptyStateMessage()}</p>
              <p style={{ fontSize: "0.85rem" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}