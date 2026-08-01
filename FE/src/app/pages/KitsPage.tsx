// ============================================================
// Kits Page — route /kits
// Displays all available kits with filtering and pagination
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Package, Heart, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { kitService, type Kit } from "../../api/kitService";
import { useFavorites } from "../context/FavoritesContext";
import { formatPrice } from "../../lib/formatPrice";
import { cn } from "../components/ui/utils";
import { ResponsiveImage } from "../../components/ui/ResponsiveImage";

const LEVEL_OPTIONS = [
  { value: "all", label: "All Levels", emoji: "🎁" },
  { value: "beginner", label: "Beginner", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", emoji: "🌿" },
  { value: "advanced", label: "Advanced", emoji: "🌳" },
];

export function KitsPage() {
  const [searchParams] = useSearchParams();
  const { isFavoriteKit, toggleFavoriteKit } = useFavorites();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [level, setLevel] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Get search query from URL params
  const searchQuery = searchParams.get("search") || "";

  // Client-side search filter
  const searchedKits = useMemo(() => {
    if (!searchQuery.trim()) return kits;
    const q = searchQuery.toLowerCase().trim();
    return kits.filter(
      (kit) =>
        kit.name.toLowerCase().includes(q) ||
        kit.description.toLowerCase().includes(q)
    );
  }, [kits, searchQuery]);

  const fetchKits = async (page: number, levelFilter: string) => {
    setLoading(true);
    try {
      const res = await kitService.getAll({
        page,
        limit: 12,
        level: levelFilter === "all" ? undefined : levelFilter,
      });
      setKits(res.data.data?.kits || []);
      setTotalPages(res.data.data?.totalPages || 1);
    } catch {
      toast.error("Failed to load kits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits(currentPage, level);
  }, [currentPage, level]);

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    setCurrentPage(1);
  };

  const handleToggleFavorite = (kitId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteKit(kitId);
    const isFavorite = isFavoriteKit(kitId);
    toast.success(
      isFavorite
        ? "Đã xoá khỏi danh sách yêu thích"
        : "Đã thêm vào danh sách yêu thích"
    );
  };

  const getPaginationRange = (): (number | "dots")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const range: (number | "dots")[] = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) range.push("dots");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("dots");
    range.push(totalPages);
    return range;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            🧶 DIY Kits & Combos
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Curated kits with everything you need to start your crafting journey.
            Perfect for beginners and experienced crafters alike.
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto" />
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {!loading && `${searchedKits.length} kits available`}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-primary transition-colors"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Difficulty Level</h3>
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLevelChange(option.value)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl transition-all",
                        level === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <span className="mr-2">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filters Drawer */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-background w-full rounded-t-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Difficulty Level</h4>
                  <div className="space-y-2">
                    {LEVEL_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleLevelChange(option.value);
                          setShowFilters(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl transition-all",
                          level === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        <span className="mr-2">{option.emoji}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Main Content */}
          <div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchedKits.length === 0 ? (
              <div className="text-center py-16">
                <Package
                  size={64}
                  className="mx-auto mb-4 text-muted-foreground opacity-40"
                />
                <h3 className="text-xl font-semibold mb-2">No kits found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchedKits.map((kit) => {
                    const isFavorite = isFavoriteKit(kit._id);

                    return (
                      <Link
                        key={kit._id}
                        to={`/kits/${kit._id}`}
                        className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                          <ResponsiveImage
                            src={kit.thumbnail}
                            alt={kit.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://picsum.photos/seed/${kit._id}/400/300`;
                              }
                            }}
                          />
                          <button
                            onClick={(e) =>
                              handleToggleFavorite(kit._id, e)
                            }
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Heart
                              className={cn(
                                "w-4 h-4",
                                isFavorite
                                  ? "fill-destructive text-destructive"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>
                          <span
                            className={cn(
                              "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize",
                              kit.level === "beginner"
                                ? "bg-green-100 text-green-700"
                                : kit.level === "intermediate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {kit.level}
                          </span>
                        </div>
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package size={14} />
                            {(kit.products || []).length} products included
                          </div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {kit.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {kit.description}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(kit.price)}
                            </span>
                            <span className="text-sm text-primary font-medium">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    {getPaginationRange().map((page, i) =>
                      page === "dots" ? (
                        <span key={`dots-${i}`} className="px-2">
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "min-w-[44px] h-11 rounded-lg font-medium transition-colors",
                            currentPage === page
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border hover:border-primary"
                          )}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}