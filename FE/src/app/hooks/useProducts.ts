import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { products } from "../data/products";
import { useDebounce } from "./useDebounce";
import { fetchProducts } from "../../features/shop/services/product.service";
import type { Product } from "../data/products";
import type { PaginatedResponse } from "../../shared/types/api.types";

export type SortOption = "newest" | "price-low" | "price-high" | "popular" | "rating";

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



function getCategoryLabel(category: string): string {
  return category;
}

function buildDynamicFiltersFromProducts(productList: Product[]): DynamicFilters {
  const categoryMap = new Map<string, number>();
  const colorMap = new Map<string, { hex: string; count: number }>();
  const materialMap = new Map<string, number>();
  const weightMap = new Map<string, number>();
  const difficultyMap = new Map<string, number>();

  productList.forEach((product) => {
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

    if (product.material) {
      materialMap.set(product.material, (materialMap.get(product.material) ?? 0) + 1);
    }
    if (product.weight) {
      weightMap.set(product.weight, (weightMap.get(product.weight) ?? 0) + 1);
    }
    if (product.difficulty) {
      difficultyMap.set(product.difficulty, (difficultyMap.get(product.difficulty) ?? 0) + 1);
    }
  });

  return {
    categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
      value,
      label: getCategoryLabel(value),
      count,
    })),
    colors: Array.from(colorMap.entries()).map(([name, value]) => ({
      name,
      hex: value.hex,
      count: value.count,
    })),
    materials: Array.from(materialMap.entries()).map(([name, count]) => ({ name, count })),
    weights: Array.from(weightMap.entries()).map(([name, count]) => ({ name, count })),
    difficulties: Array.from(difficultyMap.entries()).map(([name, count]) => ({ name, count })),
  };
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Dynamic filter options are fetched from GET /products with no category/color filters.
  // The "All" category is kept in the UI by Shop.tsx to show all products.
  const dynamicFilters = useMemo(
    () => buildDynamicFiltersFromProducts(allProducts),
    [allProducts]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, []);

  // ---- Load all products once for Category/Color filter options ----
  useEffect(() => {
    let cancelled = false;

    async function loadAllProductsForFilters() {
      try {
        const firstPage = await fetchProducts({ page: 1, limit: 100 });
        if (cancelled) return;

        if (firstPage.totalPages > 1) {
          const restPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
              fetchProducts({ page: index + 2, limit: 100 })
            )
          );
          if (cancelled) return;
          setAllProducts([
            ...firstPage.data,
            ...restPages.flatMap((pageResult) => pageResult.data),
          ]);
        } else {
          setAllProducts(firstPage.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to fetch all products for filters:", error);
          setAllProducts([]);
        }
      }
    }

    loadAllProductsForFilters();
    return () => { cancelled = true; };
  }, []);

  // ---- Apply filters + pagination via the service ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
            try {
        let result = await fetchProducts({
          category: filters.category === "all" ? undefined : filters.category,
          search: debouncedSearch || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: 12,
        });

        if (filters.color.length > 0) {
          const selectedColors = new Set(filters.color);
          result = {
            ...result,
            data: result.data.filter((product) =>
              product.variants?.some((variant) =>
                variant.color ? selectedColors.has(variant.color) : false
              )
            ),
          };
        }

        if (filters.material.length > 0) {
          const selectedMaterials = new Set(filters.material);
          result = {
            ...result,
            data: result.data.filter((product) =>
              product.material ? selectedMaterials.has(product.material) : false
            ),
          };
        }

        if (filters.weight.length > 0) {
          const selectedWeights = new Set(filters.weight);
          result = {
            ...result,
            data: result.data.filter((product) =>
              product.weight ? selectedWeights.has(product.weight) : false
            ),
          };
        }

        if (filters.difficulty.length > 0) {
          const selectedDifficulties = new Set(filters.difficulty);
          result = {
            ...result,
            data: result.data.filter((product) =>
              product.difficulty ? selectedDifficulties.has(product.difficulty) : false
            ),
          };
        }

        if (filters.minPrice > 0 || filters.maxPrice > 0) {
          result = {
            ...result,
            data: result.data.filter((product) => {
              const prices = product.variants?.map((variant) => variant.price) ?? [];
              const minProductPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const maxProductPrice = prices.length > 0 ? Math.max(...prices) : 0;
              return (
                (filters.minPrice <= 0 || maxProductPrice >= filters.minPrice) &&
                (filters.maxPrice <= 0 || minProductPrice <= filters.maxPrice)
              );
            }),
          };
        }

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
  const totalCount = paginatedResult?.totalItems ?? allProducts.length;
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