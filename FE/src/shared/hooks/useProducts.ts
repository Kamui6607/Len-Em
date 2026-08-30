import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { useSearchParams } from "react-router";
import { useDebounce } from "./useDebounce";
import { useProductsQuery } from "./useProductsQuery";
import { getDynamicFilters, products as catalogProducts } from "../../app/data/products";
import type { Product } from "../../app/data/products";
import type { PaginatedResponse } from "../types/api.types";

export type SortOption = "popular" | "newest" | "oldest" | "price-asc" | "price-desc" | "rating";

export interface FilterState {
  search: string;
  category: string;
  color: string[];
  material: string[];
  weight: string[];
  difficulty: string[];
  sort: SortOption;
  minPrice: number;
  maxPrice: number;
  page: number;
}

type DynamicFilters = {
  categories: { value: string; label: string; count: number }[];
  colors: { name: string; hex: string; count: number }[];
  materials: { name: string; count: number }[];
  weights: { name: string; count: number }[];
  difficulties: { name: string; count: number }[];
};

export function useProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Track whether the search input was changed by the user (typing) vs. synced
  // from URL externally (e.g. Navigation search bar). This prevents the debounced
  // effect from overwriting a URL search param that was set externally.
  const isUserTyping = useRef(false);

  // ---- Parse URL params into filter state ----
  const filters: FilterState = useMemo(() => ({
    search: searchParams.get("search") || "",
    category: (searchParams.get("category") as FilterState["category"]) || "all",
    color: (searchParams.get("colors") || searchParams.get("color"))?.split(",").filter(Boolean) || [],
    material: searchParams.get("material")?.split(",").filter(Boolean) || [],
    weight: searchParams.get("weight")?.split(",").filter(Boolean) || [],
    difficulty: searchParams.get("difficulty")?.split(",").filter(Boolean) || [],
    sort: (searchParams.get("sort") as SortOption) || "popular",
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 0,
    page: Number(searchParams.get("page")) || 1,
  }), [searchParams]);

  // ── Search input: local state (fast typing) + debounced URL sync ──
  // The input updates instantly; the URL is only touched after the user
  // stops typing (400ms) to avoid history spam / full-page re-renders.
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync local input when URL changes externally (back/forward navigation)
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    // URL changed externally — not a user typing event
    isUserTyping.current = false;
  }, [searchParams]);

  // Push the settled search term to the URL (debounced) — 1 URL update per search
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // Only push to URL if the user actually typed in the local input.
    // If the URL was changed externally (e.g. Navigation search bar), don't
    // overwrite it with the stale debounced value.
    if (isUserTyping.current && debouncedSearch !== urlSearch) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (debouncedSearch) {
            next.set("search", debouncedSearch);
          } else {
            next.delete("search");
          }
          next.delete("page"); // reset pagination on search change
          return next;
        },
        { replace: true },
      );
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  // ---- Async data ----
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResponse<Product> | null>(null);

    

  // ---- Apply filters + pagination via the service ----
  // Use filters.search (the URL-synced, debounced value) to avoid double-debouncing
  // Fetch list qua TanStack Query → cache 5 phút, dedupe request, retry tự động
  const queryParams = useMemo(
    () => ({
      category: filters.category === "all" ? undefined : filters.category,
      search: filters.search || undefined,
      sort: filters.sort,
      page: filters.page,
      limit: 12,
      // Server-side filtering — pass colors and price range to backend
      colors: filters.color.length > 0 ? filters.color.join(",") : undefined,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined,
    }),
    [filters.category, filters.search, filters.sort, filters.page, filters.color, filters.minPrice, filters.maxPrice],
  );

    const { data: productsPage, isPending, isError } = useProductsQuery(queryParams);

    // Build filter options from the full catalog, not the current paginated
  // result. Selecting a category must not make other filter groups disappear.
  const dynamicFilters: DynamicFilters = useMemo(() => {
    const extracted = getDynamicFilters(catalogProducts);
        const categoryCounts = new Map<string, number>();

    catalogProducts.forEach((product) => {
      const value = product.category.trim().toLowerCase();
      if (!value) return;
      categoryCounts.set(value, (categoryCounts.get(value) ?? 0) + 1);
    });

        // Keep category values aligned with the backend enum. The frontend mock
    // uses `tools`, but the API separates it into hook, needle, and accessory.
    const backendCategories = ["yarn", "hook", "needle", "accessory", "kit"];
    const categoryLabels: Record<string, string> = {
      yarn: "Yarn",
      hook: "Hooks",
      needle: "Needles",
      accessory: "Accessories",
      kit: "DIY Kits",
    };

    return {
      categories: backendCategories
        .filter((value) => categoryCounts.has(value) || value !== "tools")
        .map((value) => ({
          value,
          label: categoryLabels[value] ?? value,
          count: categoryCounts.get(value) ?? 0,
        })),
      colors: extracted.colors,
      materials: extracted.materials,
      weights: extracted.weights,
      difficulties: extracted.difficulties,
    };
  }, []);

    const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    catalogProducts.forEach((product) => {
      product.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, []);

  // isLoading (giữ nguyên interface) = isPending: CHỈ skeleton ở lần tải đầu
  // (chưa có dữ liệu nào). Khi đổi filter/page, keepPreviousData giữ dữ liệu
  // cũ trên grid → không còn nháy skeleton toàn trang (mượt hơn hẳn).
  // Trước đây: state+effect sync isFetching gây lệch 1 frame + skeleton nháy
  // mỗi lần fetch.
  const isLoading = isPending;

  // Server-side filtering — the backend already applies color/price filters.
  // We only need to set the paginated result directly from the server response.
  useEffect(() => {
    if (!productsPage) return;
    setPaginatedResult(productsPage);
  }, [productsPage]);

  // Lỗi fetch → kết quả null như cũ (hiển thị empty state)
  useEffect(() => {
    if (isError) {
      console.warn("Failed to fetch products via TanStack Query");
      setPaginatedResult(null);
    }
  }, [isError]);

  // Derived data for backward compatibility
  const filteredProducts: Product[] = paginatedResult?.data ?? [];
  const totalCount = paginatedResult?.totalItems ?? 0;
  const resultCount = filteredProducts.length;
  const currentPage = paginatedResult?.page ?? 1;
  const totalPages = paginatedResult?.totalPages ?? 1;

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.category !== "all" ||
      filters.color.length > 0 ||
      filters.material.length > 0 ||
      filters.weight.length > 0 ||
      filters.difficulty.length > 0 ||
      filters.sort !== "popular" ||
      filters.minPrice > 0 ||
      filters.maxPrice > 0
    );
  }, [filters]);

  // ---- URL sync helpers ----
  // Uses functional setSearchParams so stale closures don't lose params.
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[] | number) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

                    if (Array.isArray(value)) {
            const paramKey = key === "color" ? "colors" : key;
            if (value.length > 0) {
              newParams.set(paramKey, value.join(","));
            } else {
              newParams.delete(paramKey);
              if (key === "color") newParams.delete("color");
            }
          } else if (value === "" || value === "all" || value === 0) {
            if (key === "category") {
              newParams.set(key, "all");
            } else {
              newParams.delete(key);
            }
          } else {
            newParams.set(key, String(value));
          }

          // Reset to page 1 on any filter change (except page change itself)
          if (key !== "page") {
            newParams.delete("page");
          }

          return newParams;
        },
        { replace: true },
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

    const updatePriceRange = useCallback(
    (maxPrice: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("minPrice");

          if (maxPrice > 0) next.set("maxPrice", String(maxPrice));
          else next.delete("maxPrice");

          next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleArrayFilter = useCallback(
    (key: "color" | "material" | "weight" | "difficulty", value: string) => {
      const current = filters[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateFilter(key, updated);
    },
    [filters, updateFilter]
  );

  const goToPage = useCallback(
    (page: number) => {
      updateFilter("page", page);
    },
    [updateFilter]
  );

  // ---- Active chips ----
  const activeChips = useMemo(() => {
    const chips: { label: string; type: string; value: string }[] = [];

    if (filters.search) {
      chips.push({ label: `"${filters.search}"`, type: "search", value: filters.search });
    }

    if (filters.category !== "all") {
      const categoryDef = dynamicFilters.categories.find((dc) => dc.value === filters.category);
      chips.push({ label: categoryDef?.label || filters.category, type: "category", value: filters.category });
    }

    filters.color.forEach((c) => {
      const colorDef = dynamicFilters.colors.find((dc) => dc.name === c);
      chips.push({ label: colorDef?.name || c, type: "color", value: c });
    });

    filters.material.forEach((m) => {
      chips.push({ label: m, type: "material", value: m });
    });

    filters.weight.forEach((w) => {
      chips.push({ label: w, type: "weight", value: w });
    });

    filters.difficulty.forEach((d) => {
      chips.push({ label: d.charAt(0).toUpperCase() + d.slice(1), type: "difficulty", value: d });
    });

    return chips;
  }, [filters, dynamicFilters]);

  const removeChip = useCallback(
    (type: string, value: string) => {
      switch (type) {
        case "search":
          isUserTyping.current = true;
          setSearchInput("");
          updateFilter("search", "");
          break;
        case "category":
          updateFilter("category", "all");
          break;
        case "color":
          toggleArrayFilter("color", value);
          break;
        case "material":
          toggleArrayFilter("material", value);
          break;
        case "weight":
          toggleArrayFilter("weight", value);
          break;
        case "difficulty":
          toggleArrayFilter("difficulty", value);
          break;
      }
    },
    [updateFilter, toggleArrayFilter]
  );

  return {
    filters,
    searchInput,
    setSearchInput,
    debouncedSearch,
    filteredProducts,
    dynamicFilters,
    allTags,
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
  };
}