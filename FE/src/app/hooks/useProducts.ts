import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { products, getDynamicFilters } from "../data/products";
import { useDebounce } from "./useDebounce";
import { fetchProducts } from "../../features/shop/services/product.service";
import type { Product } from "../data/products";
import type { PaginatedResponse } from "../../shared/types/api.types";

export type SortOption = "newest" | "price-low" | "price-high" | "popular" | "rating";

export interface FilterState {
  search: string;
  category: "all" | "yarn" | "tools" | "kit";
  color: string[];
  material: string[];
  weight: string[];
  difficulty: string[];
  sort: SortOption;
  minPrice: number;
  maxPrice: number;
  page: number;
}

export function useProducts() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const debouncedSearch = useDebounce(filters.search, 400);

  // ---- Async data (future: API call) ----
  const [isLoading, setIsLoading] = useState(false);
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResponse<Product> | null>(null);

  // Dynamic filter options (computed synchronously from local data)
  const dynamicFilters = useMemo(() => getDynamicFilters(products), []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, []);

  // ---- Apply filters + pagination via the service ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchProducts({
          category: filters.category === "all" ? undefined : filters.category,
          search: debouncedSearch || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: 12,
        });
        if (!cancelled) {
          setPaginatedResult(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to fetch products:", error);
          setPaginatedResult(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [debouncedSearch, filters.category, filters.color, filters.material, filters.weight, filters.difficulty, filters.sort, filters.page, filters.minPrice, filters.maxPrice]);

  // Derived data for backward compatibility
  const filteredProducts: Product[] = paginatedResult?.data ?? [];
  const totalCount = products.length;
  const resultCount = filteredProducts.length;
  const currentPage = paginatedResult?.page ?? 1;
  const totalPages = paginatedResult?.totalPages ?? 1;

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
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
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[] | number) => {
      const newParams = new URLSearchParams(searchParams);

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

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
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
          updateFilter("search", "");
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