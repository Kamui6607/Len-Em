import { useState } from "react";
import { useLearnStore } from "../../store/learn.store";
import { SearchBar } from "./shared/SearchBar";
import { SortDropdown } from "./shared/SortDropdown";
import { FilterDrawer, FilterToggleButton } from "./shared/FilterDrawer";
import { FilterChip } from "./shared/FilterChip";
import type { FilterState, SortOption } from "../hooks/useProducts";
import type { getDynamicFilters } from "../data/products";

interface ProductFilterProps {
  filters: FilterState;
  dynamicFilters: ReturnType<typeof getDynamicFilters>;
  activeChips: { label: string; type: string; value: string }[];
  hasActiveFilters: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: FilterState["category"]) => void;
  onSortChange: (sort: SortOption) => void;
  onToggleFilter: (
    key: "color" | "material" | "weight" | "difficulty",
    value: string,
  ) => void;
  onClearFilters: () => void;
  onRemoveChip: (type: string, value: string) => void;
  onLessonComboFilter?: (courseId: string) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Best Rating" },
];

const categories = [
  { id: "all" as const, label: "All", emoji: "🧶" },
  { id: "yarn" as const, label: "Yarn", emoji: "🧵" },
  { id: "tools" as const, label: "Tools", emoji: "🪡" },
  { id: "kit" as const, label: "DIY Kits", emoji: "🎁" },
];

const difficultyMeta: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  beginner: {
    label: "Beginner",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
  },
  intermediate: {
    label: "Intermediate",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
  },
  advanced: {
    label: "Advanced",
    bg: "var(--error-bg)",
    color: "var(--error-text)",
  },
};

export function ProductFilter({
  filters,
  dynamicFilters,
  activeChips,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onToggleFilter,
  onClearFilters,
  onRemoveChip,
  onLessonComboFilter,
}: ProductFilterProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const currentCourseId = useLearnStore((state) => state.currentCourseId);

  const isYarnCategory = filters.category === "yarn";
  const isKitCategory = filters.category === "kit";

  const hasAnyFilter =
    (isYarnCategory &&
      (dynamicFilters.colors.length > 0 ||
        dynamicFilters.materials.length > 0 ||
        dynamicFilters.weights.length > 0)) ||
    (isKitCategory && dynamicFilters.difficulties.length > 0);

  /* ── Inline filter panel ── */
  const filterPanel = hasAnyFilter || currentCourseId ? (
    <div className="pf-filter-stack">
      {currentCourseId && onLessonComboFilter && (
        <div className="pf-filter-row">
          <button
            className="pf-pill pf-pill-active"
            onClick={() => onLessonComboFilter(currentCourseId)}
          >
            📚 Based on your current lesson
          </button>
        </div>
      )}
      {/* Color row */}
      {isYarnCategory && dynamicFilters.colors.length > 0 && (
        <div className="pf-filter-row">
          <span className="pf-row-label">Color</span>
          <div className="pf-row-items">
            {dynamicFilters.colors.map((c) => {
              const isSelected = filters.color.includes(c.name);
              return (
                <button
                  key={c.name}
                  title={c.name}
                  aria-label={c.name}
                  onClick={() => onToggleFilter("color", c.name)}
                  className={`pf-color-dot${isSelected ? " pf-color-dot-active" : ""}`}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Material row */}
      {isYarnCategory && dynamicFilters.materials.length > 0 && (
        <div className="pf-filter-row">
          <span className="pf-row-label">Material</span>
          <div className="pf-row-items">
            {dynamicFilters.materials.map((m) => {
              const isSelected = filters.material.includes(m.name);
              return (
                <button
                  key={m.name}
                  onClick={() => onToggleFilter("material", m.name)}
                  className={`pf-pill${isSelected ? " pf-pill-active" : ""}`}
                >
                  {m.name}
                  <span className="pf-pill-count">({m.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Yarn Weight row */}
      {isYarnCategory && dynamicFilters.weights.length > 0 && (
        <div className="pf-filter-row">
          <span className="pf-row-label">Yarn Weight</span>
          <div className="pf-row-items">
            {dynamicFilters.weights.map((w) => {
              const isSelected = filters.weight.includes(w.name);
              return (
                <button
                  key={w.name}
                  onClick={() => onToggleFilter("weight", w.name)}
                  className={`pf-pill${isSelected ? " pf-pill-active" : ""}`}
                >
                  {w.name}
                  <span className="pf-pill-count">({w.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty row */}
      {isKitCategory && dynamicFilters.difficulties.length > 0 && (
        <div className="pf-filter-row">
          <span className="pf-row-label">Difficulty</span>
          <div className="pf-row-items">
            {dynamicFilters.difficulties.map((d) => {
              const meta = difficultyMeta[d.name] ?? {
                label: d.name,
                bg: "var(--primary-soft)",
                color: "var(--primary)",
              };
              const isSelected = filters.difficulty.includes(d.name);
              return (
                <button
                  key={d.name}
                  onClick={() => onToggleFilter("difficulty", d.name)}
                  className={`pf-pill${isSelected ? " pf-pill-active" : ""}`}
                  style={{
                    borderColor: isSelected
                      ? meta.color + "70"
                      : meta.color + "30",
                    background: isSelected ? meta.bg : "transparent",
                    color: meta.color,
                  }}
                >
                  {meta.label}
                  <span className="pf-pill-count">({d.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear row */}
      {hasActiveFilters && (
        <div className="pf-filter-row pf-clear-row">
          <button className="pf-clear-inline" onClick={onClearFilters}>
            Clear filters ×
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Search + sort ── */
        .pf-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .pf-search-wrap { flex: 1; min-width: 0; }

        /* ── Category tabs ── */
        .pf-cats {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          margin-bottom: 10px;
          scrollbar-width: none;
        }
        .pf-cats::-webkit-scrollbar { display: none; }

        .pf-cat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1.5px solid var(--color-warm-border);
          background: var(--color-warm-bg);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: var(--color-warm-text);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .pf-cat:hover {
          border-color: var(--color-warm-border-hover);
          background: var(--color-warm-surface);
          transform: translateY(-1px);
        }
        .pf-cat.active {
          background: var(--color-warm-text);
          color: var(--color-warm-bg);
          border-color: var(--color-warm-text);
        }
        .dark .pf-cat {
          background: var(--color-warm-bg);
          border-color: var(--color-warm-border);
          color: var(--color-warm-text-secondary);
        }
        .dark .pf-cat:hover {
          background: var(--color-warm-surface);
          border-color: var(--color-warm-border-hover);
          color: var(--color-warm-highlight);
        }
        .dark .pf-cat.active {
          background: var(--color-warm-highlight);
          color: var(--color-warm-bg);
          border-color: var(--color-warm-highlight);
        }
        .pf-cat-emoji { font-size: 1rem; line-height: 1; }

        /* ── Filter stack card ── */
        .pf-filter-stack {
          border: 1.5px solid var(--color-warm-border);
          border-radius: 16px;
          overflow: hidden;
          background: var(--color-warm-bg);
          margin-bottom: 14px;
          transition: background 0.3s, border-color 0.3s;
        }
        .dark .pf-filter-stack {
          background: var(--color-warm-bg);
          border-color: var(--color-warm-border);
        }

        /* ── Each filter row ── */
        .pf-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--color-warm-border);
          min-height: 46px;
        }
        .pf-filter-row:last-child { border-bottom: none; }
        .dark .pf-filter-row { border-bottom-color: var(--color-warm-border); }

        /* Row label */
        .pf-row-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-warm-muted);
          white-space: nowrap;
          min-width: 80px;
          flex-shrink: 0;
        }
        .dark .pf-row-label { color: var(--color-warm-muted); }

        /* Items wrap */
        .pf-row-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        /* ── Color dots ── */
        .pf-color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          outline: 2.5px solid transparent;
          outline-offset: 2px;
          cursor: pointer;
          transition: transform 0.18s, outline-color 0.18s;
          flex-shrink: 0;
          padding: 0;
        }
        .pf-color-dot:hover {
          transform: scale(1.18);
          outline-color: var(--color-warm-border-hover);
        }
        .pf-color-dot.pf-color-dot-active {
          outline-color: var(--color-warm-accent);
          border-color: white;
          transform: scale(1.12);
        }
        .dark .pf-color-dot.pf-color-dot-active { border-color: var(--color-warm-bg); }

        /* ── Pills ── */
        .pf-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 12px;
          border-radius: 100px;
          border: 1.5px solid var(--color-warm-border);
          background: transparent;
          color: var(--color-warm-muted);
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
        }
        .pf-pill:hover {
          border-color: var(--color-warm-border-hover);
          color: var(--color-warm-accent);
          background: var(--color-warm-surface);
        }
        .pf-pill.pf-pill-active {
          border-color: var(--color-warm-border-active);
          background: var(--color-warm-surface);
          color: var(--color-warm-accent);
          font-weight: 500;
        }
        .dark .pf-pill {
          border-color: var(--color-warm-border);
          color: var(--color-warm-muted);
        }
        .dark .pf-pill:hover {
          border-color: var(--color-warm-border-hover);
          color: var(--color-warm-highlight);
          background: var(--color-warm-surface);
        }
        .dark .pf-pill.pf-pill-active {
          border-color: var(--color-warm-border-active);
          background: var(--color-warm-surface);
          color: var(--color-warm-highlight);
        }
        .pf-pill-count {
          opacity: 0.45;
          font-size: 0.7rem;
        }

        /* ── Clear inline ── */
        .pf-clear-row { justify-content: flex-end; padding: 6px 16px; min-height: unset; }
        .pf-clear-inline {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.76rem;
          color: var(--color-warm-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 3px 8px;
          border-radius: 8px;
          transition: color 0.18s, background 0.18s;
        }
        .pf-clear-inline:hover { color: var(--color-warm-accent); background: var(--color-warm-surface); }
        .dark .pf-clear-inline { color: var(--color-warm-muted); }
        .dark .pf-clear-inline:hover { color: var(--color-warm-highlight); background: var(--color-warm-surface); }

        /* ── Active chips bar ── */
        .pf-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .pf-chips-clear {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 100px;
          border: 1.5px dashed var(--color-warm-border);
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          color: var(--color-warm-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .pf-chips-clear:hover {
          color: var(--color-warm-accent);
          border-color: var(--color-warm-border-hover);
          background: var(--color-warm-surface);
        }
        .dark .pf-chips-clear { border-color: var(--color-warm-border); color: var(--color-warm-muted); }
        .dark .pf-chips-clear:hover { color: var(--color-warm-highlight); border-color: var(--color-warm-border-hover); background: var(--color-warm-surface); }

        @media (max-width: 640px) {
          .pf-row-label { min-width: 64px; font-size: 0.66rem; }
          .pf-filter-row { padding: 8px 12px; gap: 8px; }
        }
      `}</style>

      {/* ── Search + Sort ── */}
      <div className="pf-top">
        <div className="pf-search-wrap">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search yarn, kits, patterns..."
          />
        </div>
        <SortDropdown
          options={sortOptions}
          value={filters.sort}
          onChange={(v) => onSortChange(v as SortOption)}
          className="hidden md:flex"
        />
        <FilterToggleButton
          onClick={() => setMobileFiltersOpen(true)}
          activeFilterCount={activeChips.length}
        />
      </div>

      {/* ── Category tabs ── */}
      <div className="pf-cats">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`pf-cat${filters.category === cat.id ? " active" : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span className="pf-cat-emoji">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Inline filter rows ── */}
      {filterPanel}

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="pf-chips">
          {activeChips.map((chip, i) => (
            <FilterChip
              key={`${chip.type}-${chip.value}-${i}`}
              label={chip.label}
              colorSwatch={
                chip.type === "color"
                  ? dynamicFilters.colors.find((c) => c.name === chip.value)
                      ?.hex
                  : undefined
              }
              onRemove={() => onRemoveChip(chip.type, chip.value)}
            />
          ))}
          <button className="pf-chips-clear" onClick={onClearFilters}>
            Clear all ×
          </button>
        </div>
      )}

      {/* ── Product grid slot ── */}
      <div id="product-grid-container" />

      {/* ── Mobile drawer ── */}
      <FilterDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        activeFilterCount={activeChips.length}
        hasActiveFilters={hasActiveFilters}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--foreground-muted)",
              marginBottom: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sort by
          </div>
          <SortDropdown
            options={sortOptions}
            value={filters.sort}
            onChange={(v) => onSortChange(v as SortOption)}
          />
        </div>
        {filterPanel}
      </FilterDrawer>
    </>
  );
}
