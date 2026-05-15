import { X, Package, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { cn } from "../components/ui/utils";

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
    if (filters.difficulty.length > 0) return "No products at the selected difficulty";
    return "No products match your filters";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --rose:     #F2A7B2;
          --blush:    #F9DDE2;
          --sage:     #A8C5B5;
          --sage-d:   #6FA08A;
          --lavender: #C4B5E0;
          --butter:   #F5E6A3;
          --cream:    #FDF8F2;
          --ink:      #2A2220;
          --muted:    #7A6E6B;
          --surface:  #FFFFFF;
          --bdr:      rgba(42,34,32,0.10);
        }
        .dark {
          --cream:   #17100E;
          --ink:     #F0E8E4;
          --muted:   #9A8480;
          --surface: #211714;
          --blush:   #3A2020;
          --bdr:     rgba(200,120,100,0.14);
        }

        .shop-root {
          min-height: 100vh;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
          transition: background 0.3s;
        }

        /* ── ambient decoration ── */
        .shop-blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0; filter: blur(90px);
        }
        .shop-mesh {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(242,167,178,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(242,167,178,0.05) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .shop-inner {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* ── header ── */
        .shop-label {
          font-size: 0.7rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--rose); margin-bottom: 6px;
          display: flex; align-items: center; gap: 6px;
        }
        .shop-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 900; color: var(--ink); line-height: 1.1;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 4px; transition: color 0.3s;
        }
        .shop-title-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          background: var(--ink); color: var(--cream);
          padding: 4px 12px; border-radius: 100px;
          transition: background 0.3s, color 0.3s;
        }
        .shop-desc {
          color: var(--muted); font-size: 0.93rem;
          font-weight: 300; line-height: 1.7;
          max-width: 520px; margin-bottom: 28px;
          transition: color 0.3s;
        }

        /* ── category tabs ── */
        .cat-tabs {
          display: flex; gap: 8px;
          overflow-x: auto; padding-bottom: 4px;
          margin-bottom: 20px;
          scrollbar-width: none;
        }
        .cat-tabs::-webkit-scrollbar { display: none; }
        .cat-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 100px;
          font-size: 0.87rem; font-weight: 500;
          white-space: nowrap; cursor: pointer;
          border: 1.5px solid transparent;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .cat-tab.active {
          background: var(--ink); color: var(--cream);
          border-color: var(--ink);
        }
        .cat-tab.inactive {
          background: var(--surface); color: var(--ink);
          border-color: var(--bdr);
        }
        .cat-tab.inactive:hover {
          border-color: var(--rose);
          background: var(--blush);
        }
        .cat-tab-count {
          font-size: 0.75rem; opacity: 0.55; font-weight: 400;
        }

        /* ── toolbar ── */
        .toolbar {
          display: flex; gap: 10px; align-items: center;
          margin-bottom: 14px; flex-wrap: wrap;
        }
        .search-pill {
          flex: 1; min-width: 200px;
          display: flex; align-items: center; gap: 10px;
          background: var(--surface);
          border: 1.5px solid var(--bdr);
          border-radius: 100px; padding: 10px 18px;
          transition: border-color 0.2s;
        }
        .search-pill:focus-within { border-color: var(--rose); }
        .search-pill input {
          border: none; background: transparent; outline: none;
          font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          color: var(--ink); width: 100%;
        }
        .search-pill input::placeholder { color: var(--muted); }
        .sort-pill {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface);
          border: 1.5px solid var(--bdr);
          border-radius: 100px; padding: 10px 18px;
          font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          color: var(--ink); cursor: pointer; white-space: nowrap;
          transition: border-color 0.2s;
        }
        .sort-pill:hover { border-color: var(--rose); }
        .sort-pill select {
          border: none; background: transparent; outline: none;
          font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          color: var(--ink); cursor: pointer;
          -webkit-appearance: none; padding-right: 2px;
        }

        /* ── filter chips row ── */
        .filter-strip {
          display: flex; align-items: center;
          flex-wrap: wrap; gap: 6px;
          margin-bottom: 16px; min-height: 32px;
        }
        .filter-group-label {
          font-size: 0.72rem; color: var(--muted);
          font-weight: 500; letter-spacing: 0.06em;
          text-transform: uppercase; margin-right: 2px;
          flex-shrink: 0;
        }
        .active-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--blush); color: #7A2233;
          font-size: 0.78rem; font-weight: 500;
          padding: 5px 8px 5px 12px; border-radius: 100px;
          transition: background 0.2s;
        }
        .dark .active-chip { background: #3A2020; color: var(--rose); }
        .active-chip:hover { background: #F5C6C6; }
        .chip-x {
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(122,34,51,0.15); color: #7A2233;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; cursor: pointer; flex-shrink: 0;
          transition: background 0.15s;
        }
        .chip-x:hover { background: rgba(122,34,51,0.28); }

        /* ── secondary filter pills (color / material) ── */
        .filter-panel {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-bottom: 16px;
        }
        .filter-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 100px;
          font-size: 0.82rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          background: var(--surface); color: var(--ink);
          border: 1.5px solid var(--bdr); cursor: pointer;
          transition: all 0.18s;
        }
        .filter-pill.on {
          background: #2A2220; color: var(--cream);
          border-color: #2A2220;
        }
        .filter-pill:not(.on):hover {
          border-color: var(--rose); background: var(--blush);
        }
        .filter-pill .swatch {
          width: 10px; height: 10px; border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0;
        }

        /* ── results bar ── */
        .results-bar {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .results-count {
          font-size: 0.82rem; color: var(--muted);
          display: flex; align-items: center; gap: 7px;
        }
        .results-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--sage-d); flex-shrink: 0;
        }
        .results-count strong { color: var(--ink); font-weight: 600; }
        .clear-all-btn {
          font-size: 0.78rem; color: var(--muted);
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; padding: 4px 0;
          text-decoration: underline; text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .clear-all-btn:hover { color: var(--ink); }

        /* ── product grid ── */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        /* ── loading ── */
        .shop-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 0; gap: 16px;
        }
        .shop-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2.5px solid var(--blush);
          border-top-color: var(--rose);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .shop-loading p {
          font-size: 0.88rem; color: var(--muted); font-weight: 300;
        }

        /* ── empty state ── */
        .empty-state {
          text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
        }
        .empty-icon {
          width: 80px; height: 80px; border-radius: 24px;
          background: linear-gradient(135deg, var(--blush), var(--lavender));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px; position: relative;
          transition: background 0.3s;
        }
        .empty-icon::after {
          content: '✦'; position: absolute; top: -6px; right: -6px;
          font-size: 13px; color: var(--rose);
          animation: twinkle 2.5s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem; font-weight: 700;
          color: var(--ink); margin-bottom: 8px;
          transition: color 0.3s;
        }
        .empty-desc {
          color: var(--muted); font-size: 0.88rem;
          font-weight: 300; line-height: 1.7;
          max-width: 340px; margin-bottom: 24px;
          transition: color 0.3s;
        }
        .empty-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ink); color: var(--cream);
          padding: 12px 28px; border-radius: 100px; border: none;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500;
          transition: transform 0.22s, box-shadow 0.22s, background 0.3s;
        }
        .empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(42,34,32,0.18);
        }

        /* ── pagination ── */
        .pagination {
          display: flex; align-items: center;
          justify-content: center; gap: 6px; margin-top: 52px;
        }
        .page-btn {
          min-width: 38px; height: 38px; border-radius: 12px;
          border: 1.5px solid var(--bdr);
          background: var(--surface); color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.87rem; font-weight: 500;
          cursor: pointer; padding: 0 12px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .page-btn:hover:not(:disabled) {
          border-color: var(--rose);
          transform: translateY(-1px);
        }
        .page-btn.active {
          background: var(--ink); color: var(--cream);
          border-color: var(--ink);
        }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        @media (max-width: 640px) {
          .shop-inner { padding: 24px 16px 60px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .shop-title { font-size: 1.6rem; }
          .toolbar { gap: 8px; }
        }
      `}</style>

      <div className="shop-root">
        <div className="shop-mesh" />
        <div className="shop-blob" style={{ width: 480, height: 480, background: "var(--blush)", opacity: 0.4, top: "-10%", right: "-8%" }} />
        <div className="shop-blob" style={{ width: 300, height: 300, background: "var(--lavender)", opacity: 0.2, bottom: "10%", left: "-6%" }} />
        <div className="shop-blob" style={{ width: 180, height: 180, background: "var(--sage)", opacity: 0.15, top: "40%", left: "42%" }} />

        <div className="shop-inner">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="shop-label">✦ CozyStitch Store</div>
            <div className="shop-title">
              <span style={{ fontSize: "1.4rem" }}>{meta.emoji}</span>
              {meta.label}
              <span className="shop-title-count">{resultCount} items</span>
            </div>
            <p className="shop-desc">{meta.desc}</p>
          </motion.div>

          {/* ── Category tabs ── */}
          <motion.div
            className="cat-tabs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {(["all", "yarn", "kit", "tools"] as const).map((cat) => {
              const m = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  className={cn("cat-tab", filters.category === cat ? "active" : "inactive")}
                  onClick={() => updateFilter("category", cat)}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              );
            })}
          </motion.div>

          {/* ── Toolbar: search + sort ── */}
          <motion.div
            className="toolbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="search-pill">
              <Search size={14} color="var(--muted)" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter("search", "")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  <X size={14} color="var(--muted)" />
                </button>
              )}
            </div>

            <div className="sort-pill">
              <ChevronDown size={14} color="var(--muted)" />
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* ── Color filter pills ── */}
          {filters.category === "yarn" && dynamicFilters.colors.length > 0 && (
            <motion.div
              className="filter-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.16 }}
            >
              {dynamicFilters.colors.map((c) => (
                <button
                  key={c.name}
                  className={cn("filter-pill", filters.color.includes(c.name) ? "on" : "")}
                  onClick={() => toggleArrayFilter("color", c.name)}
                >
                  <span className="swatch" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Material filter pills ── */}
          {filters.category === "yarn" && dynamicFilters.materials.length > 0 && (
            <motion.div
              className="filter-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              {dynamicFilters.materials.map((m) => (
                <button
                  key={m.name}
                  className={cn("filter-pill", filters.material.includes(m.name) ? "on" : "")}
                  onClick={() => toggleArrayFilter("material", m.name)}
                >
                  {m.name}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Difficulty pills (kits) ── */}
          {filters.category === "kit" && dynamicFilters.difficulties.length > 0 && (
            <motion.div
              className="filter-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              {dynamicFilters.difficulties.map((d) => (
                <button
                  key={d.name}
                  className={cn("filter-pill", filters.difficulty.includes(d.name) ? "on" : "")}
                  onClick={() => toggleArrayFilter("difficulty", d.name)}
                >
                  {d.name.charAt(0).toUpperCase() + d.name.slice(1)}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Active chips ── */}
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
                    key={chip.id}
                    className="active-chip"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                  >
                    {chip.label}
                    <span className="chip-x" onClick={() => removeChip(chip)}>×</span>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results bar ── */}
          <div className="results-bar">
            <div className="results-count">
              <span className="results-dot" />
              {!hasActiveFilters && resultCount === totalCount ? (
                <span>All <strong>{totalCount}</strong> products</span>
              ) : (
                <span><strong>{resultCount}</strong> of <strong>{totalCount}</strong> products</span>
              )}
            </div>
            {hasActiveFilters && (
              <button className="clear-all-btn" onClick={clearFilters}>
                Clear all ×
              </button>
            )}
          </div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="shop-loading">
              <div className="shop-spinner" />
              <p>Loading your cozy finds...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: (index % 8) * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={cn("page-btn", currentPage === page && "active")}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}

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
            /* ── Empty state ── */
            <motion.div
              className="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="empty-icon">
                <Package size={32} color="var(--muted)" />
              </div>
              <div className="empty-title">{getEmptyStateMessage()}</div>
              <p className="empty-desc">
                Try adjusting your search, removing some filters, or browsing a different category.
              </p>
              {hasActiveFilters && (
                <button className="empty-btn" onClick={clearFilters}>
                  <X size={14} />
                  Clear all filters
                </button>
              )}

              {/* ── Browse other categories ── */}
              {!hasActiveFilters && filters.category !== "all" && (
                <div style={{ marginTop: 32, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {(["all", "yarn", "kit", "tools"] as const)
                    .filter((c) => c !== filters.category)
                    .map((cat) => {
                      const m = CATEGORY_META[cat];
                      return (
                        <button
                          key={cat}
                          className="filter-pill"
                          onClick={() => updateFilter("category", cat)}
                          style={{ fontSize: "0.88rem", padding: "9px 20px" }}
                        >
                          <span>{m.emoji}</span>
                          {m.label}
                        </button>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}