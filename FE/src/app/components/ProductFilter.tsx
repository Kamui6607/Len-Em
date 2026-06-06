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
    bg: "rgba(167,210,181,0.25)",
    color: "#3d8a5e",
  },
  intermediate: {
    label: "Intermediate",
    bg: "rgba(245,230,163,0.3)",
    color: "#a07c1a",
  },
  advanced: {
    label: "Advanced",
    bg: "rgba(232,153,122,0.25)",
    color: "#C1604E",
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
                bg: "rgba(196,181,224,0.2)",
                color: "#6B5EA8",
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
          border: 1.5px solid rgba(193,96,78,0.2);
          background: var(--surface, #FFF9F5);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: #2A1A14;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .pf-cat:hover {
          border-color: rgba(193,96,78,0.5);
          background: #F9EDE8;
          transform: translateY(-1px);
        }
        .pf-cat.active {
          background: #2A1A14;
          color: #FFF9F5;
          border-color: #2A1A14;
        }
        .dark .pf-cat {
          background: rgba(255,249,245,0.05);
          border-color: rgba(232,153,122,0.2);
          color: #C8A99A;
        }
        .dark .pf-cat:hover {
          background: rgba(232,153,122,0.1);
          border-color: rgba(232,153,122,0.4);
          color: #F0C4B0;
        }
        .dark .pf-cat.active {
          background: #F5EDE8;
          color: #2A1A14;
          border-color: #F5EDE8;
        }
        .pf-cat-emoji { font-size: 1rem; line-height: 1; }

        /* ── Filter stack card ── */
        .pf-filter-stack {
          border: 1.5px solid rgba(193,96,78,0.13);
          border-radius: 16px;
          overflow: hidden;
          background: var(--surface, #FFF9F5);
          margin-bottom: 14px;
          transition: background 0.3s, border-color 0.3s;
        }
        .dark .pf-filter-stack {
          background: rgba(26,17,14,0.9);
          border-color: rgba(232,153,122,0.13);
        }

        /* ── Each filter row ── */
        .pf-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(193,96,78,0.09);
          min-height: 46px;
        }
        .pf-filter-row:last-child { border-bottom: none; }
        .dark .pf-filter-row { border-bottom-color: rgba(232,153,122,0.09); }

        /* Row label */
        .pf-row-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8A6860;
          white-space: nowrap;
          min-width: 80px;
          flex-shrink: 0;
        }
        .dark .pf-row-label { color: #7A5E58; }

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
          outline-color: rgba(193,96,78,0.4);
        }
        .pf-color-dot.pf-color-dot-active {
          outline-color: #C1604E;
          border-color: white;
          transform: scale(1.12);
        }
        .dark .pf-color-dot.pf-color-dot-active { border-color: #1A110E; }

        /* ── Pills ── */
        .pf-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 12px;
          border-radius: 100px;
          border: 1.5px solid rgba(193,96,78,0.22);
          background: transparent;
          color: #7A6460;
          font-size: 0.8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
        }
        .pf-pill:hover {
          border-color: rgba(193,96,78,0.48);
          color: #C1604E;
          background: rgba(193,96,78,0.06);
        }
        .pf-pill.pf-pill-active {
          border-color: rgba(193,96,78,0.55);
          background: rgba(193,96,78,0.12);
          color: #C1604E;
          font-weight: 500;
        }
        .dark .pf-pill {
          border-color: rgba(232,153,122,0.2);
          color: #9A7870;
        }
        .dark .pf-pill:hover {
          border-color: rgba(232,153,122,0.44);
          color: #F0C4B0;
          background: rgba(232,153,122,0.08);
        }
        .dark .pf-pill.pf-pill-active {
          border-color: rgba(232,153,122,0.52);
          background: rgba(232,153,122,0.14);
          color: #F0C4B0;
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
          color: #8A6860;
          background: none;
          border: none;
          cursor: pointer;
          padding: 3px 8px;
          border-radius: 8px;
          transition: color 0.18s, background 0.18s;
        }
        .pf-clear-inline:hover { color: #C1604E; background: rgba(193,96,78,0.07); }
        .dark .pf-clear-inline { color: #7A5E58; }
        .dark .pf-clear-inline:hover { color: #F0C4B0; background: rgba(232,153,122,0.08); }

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
          border: 1.5px dashed rgba(193,96,78,0.35);
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          color: #8A6860;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pf-chips-clear:hover {
          color: #C1604E;
          border-color: rgba(193,96,78,0.5);
          background: rgba(193,96,78,0.06);
        }
        .dark .pf-chips-clear { border-color: rgba(232,153,122,0.25); color: #9A7870; }
        .dark .pf-chips-clear:hover { color: #F0C4B0; border-color: rgba(232,153,122,0.5); background: rgba(232,153,122,0.08); }

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
              color: "var(--muted, #7A6460)",
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
