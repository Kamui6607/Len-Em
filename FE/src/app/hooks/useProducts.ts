import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { useDebounce } from "./useDebounce";
import { useProductsQuery } from "./useProductsQuery";
import { fetchProductFacets } from "../../features/shop/services/product.service";
import type { ProductFacets } from "../../features/shop/services/product.service";
import type { Product } from "../data/products";
import type { PaginatedResponse } from "../../shared/types/api.types";

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
    color: searchParams.get("color")?.split(",").filter(Boolean) || [],
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
  const [isLoading, setIsLoading] = useState(false);
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResponse<Product> | null>(null);

  // Dynamic filter options are fetched from GET /products/facets (server-side).
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilters>({
    categories: [],
    colors: [],
    materials: [],
    weights: [],
    difficulties: [],
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    // Tags come from the facets response if available, otherwise empty
    return Array.from(tagSet);
  }, []);

  // ---- Load facets (categories, colors, price range) from server ----
  // Call GET /products/facets once when the Shop page loads.
  // Cache the result in sessionStorage so we don't re-fetch on every visit.
  // Also cache failures so we don't hammer a broken endpoint repeatedly.
  useEffect(() => {
    let cancelled = false;

    async function loadFacets() {
      // Check sessionStorage cache first (5 min TTL for success, 1 min for failure)
      const cacheKey = "yarn_shop_product_facets";
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as {
            data?: ProductFacets;
            error?: boolean;
            timestamp: number;
          };
          const ttl = cached.error ? 60 * 1000 : 5 * 60 * 1000; // failures expire faster
          if (Date.now() - cached.timestamp < ttl) {
            if (!cancelled && cached.data) {
              setDynamicFilters({
                categories: cached.data.categories ?? [],
                colors: cached.data.colors ?? [],
                materials: [],
                weights: [],
                difficulties: [],
              });
            }
            return; // either use cached data or skip retry (failed recently)
          }
        }
      } catch {
        // Ignore cache read errors
      }

      try {
        const facets: ProductFacets = await fetchProductFacets();
        if (cancelled) return;

        // Cache the successful result
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: facets, timestamp: Date.now() }));
        } catch {
          // Ignore cache write errors
        }

        setDynamicFilters({
          categories: facets.categories ?? [],
          colors: facets.colors ?? [],
          materials: [],
          weights: [],
          difficulties: [],
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to fetch product facets, falling back to client-side:", error);
          // Cache the failure to avoid hammering the broken endpoint
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ error: true, timestamp: Date.now() }));
          } catch {
            // Ignore cache write errors
          }
          // Keep dynamicFilters empty — the fallback effect below will
          // derive categories/colors from the fetched products.
        }
      }
    }

    loadFacets();
    return () => { cancelled = true; };
  }, []);

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

  const { data: productsPage, isFetching, isError } = useProductsQuery(queryParams);

  // ---- Fallback: derive filter options from fetched products ----
  // If the facets endpoint fails (e.g. 500), still show category/color
  // filters derived from the products returned by the list query so the
  // Shop page remains usable.
  useEffect(() => {
    if (!productsPage || productsPage.data.length === 0) return;

    setDynamicFilters((prev) => {
      // Only fill in if facets are empty (i.e., facets endpoint failed)
      if (prev.categories.length > 0 || prev.colors.length > 0) return prev;

      const categoryMap = new Map<string, number>();
      const colorMap = new Map<string, { hex: string; count: number }>();

      productsPage.data.forEach((product) => {
        categoryMap.set(product.category, (categoryMap.get(product.category) ?? 0) + 1);

        const productColors = new Set<string>();
        product.variants?.forEach((variant) => {
          if (!variant.color) return;
          productColors.add(variant.color);
          if (!colorMap.has(variant.color)) {
            colorMap.set(variant.color, { hex: variant.hexCode || "#ccc", count: 0 });
          }
        });
        productColors.forEach((color) => {
          const current = colorMap.get(color);
          if (current) current.count += 1;
        });
      });

      return {
        categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
          value,
          label: value,
          count,
        })),
        colors: Array.from(colorMap.entries()).map(([name, value]) => ({
          name,
          hex: value.hex,
          count: value.count,
        })),
        materials: [],
        weights: [],
        difficulties: [],
      };
    });
  }, [productsPage]);

  // isLoading giữ nguyên interface: bật skeleton khi đang fetch (kể cả khi đổi filter)
  useEffect(() => {
    setIsLoading(isFetching);
  }, [isFetching]);

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
            if (value.length > 0) {
              newParams.set(key, value.join(","));
            } else {
              newParams.delete(key);
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
    clearFilters,
    toggleArrayFilter,
    removeChip,
    goToPage,
  };
}