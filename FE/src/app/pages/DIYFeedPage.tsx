import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Heart, ShoppingBag, Bookmark, PackageOpen, Hand } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { diyService } from "../../features/diy/services/diy.service";
import { kitService, type KitProduct } from "../../api/kitService";
import type { DIYPost } from "../../features/diy/types/diy.types";
import { formatPrice } from "../../lib/formatPrice";
import { ResponsiveImage } from "../../components/ui/ResponsiveImage";

type FeedFilter = "all" | "newest" | "purchased";

interface CreatorInfo {
  userId: string;
  fullName: string;
  avatar?: string;
}

export function DIYFeedPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addKitToCart } = useCart();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [posts, setPosts] = useState<DIYPost[]>([]);
  const searchQuery = searchParams.get("search") || "";
  const [creators, setCreators] = useState<Record<string, CreatorInfo>>({});
  const [loading, setLoading] = useState(false);
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await diyService.getAllPosts({ page: 1, limit: 20 });
      setPosts(data.data.posts);

      // Note: getUserById is admin-only, so we can't fetch creator info
      // for regular users. The UI falls back to a generic avatar/name.
      // If the backend later exposes a public endpoint for user profiles,
      // we can populate `creators` here.
      setCreators({});
    } catch (error) {
      console.error("DIYFeedPage - Error fetching posts:", error);
      toast.error("Failed to load posts, showing demo data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const buyCombo = async (post: DIYPost) => {
    try {
      const combos = post.linkedCombo ?? [];
      if (combos.length === 0) {
        toast.error("No combo available for this post");
        return;
      }

      // Fetch the first linked combo kit from the API
      const comboId = combos[0].comboId;
      const { data: kitResponse } = await kitService.getById(comboId);
      const kit = kitResponse.data.kit;

      addKitToCart({
        kitId: kit._id,
        name: kit.name,
        thumbnail: kit.thumbnail,
        price: kit.price,
      products: (kit.products || []).map((kitProduct: KitProduct) => {
          const product = kitProduct.productId;
          const firstVariant = product?.variants?.[0];
          return {
            productId: product._id,
            variantId: kitProduct.variantId,
            name: product.name,
            image: firstVariant?.image || product.image,
            price: firstVariant?.price || 0,
          };
        }),
      });
      toast.success("Added kit to cart");
    } catch {
      toast.error("Failed to load kit details");
    }
  };

  const savePost = (post: DIYPost) => {
    const wasSaved = isDIYPostSaved(post._id);
    toggleDIYPostSave(post._id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  const approvedPosts = useMemo(() => posts.filter((p) => p.status !== "pending"), [posts]);

  const filteredPosts = approvedPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  // Debug: log search state
  useEffect(() => {
    console.log("DIYFeedPage - searchQuery:", searchQuery, "filteredPosts:", filteredPosts.length);
  }, [searchQuery, filteredPosts]);

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (filter === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (filter === "purchased") {
      return (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0);
    }
    return 0;
  });

  const totalLikes = useMemo(
    () => approvedPosts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0),
    [approvedPosts]
  );
  const heroImages = useMemo(
    () => approvedPosts.slice(0, 3).map((p) => p.images[0]).filter(Boolean),
    [approvedPosts]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 h-[220px] animate-pulse rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background md:h-[260px]" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="aspect-[4/5] w-full animate-pulse bg-muted" />
                <div className="space-y-2.5 p-3 md:p-4">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge variant="secondary" className="mb-4">
                {t("nav.diy")}
              </Badge>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
                {t("diyFeed.headline")}
              </h1>
              <p className="max-w-xl text-muted-foreground md:text-lg">{t("diyFeed.subtitle")}</p>

              {approvedPosts.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-6">
                  <div>
                    <p className="text-2xl font-semibold leading-none">{approvedPosts.length}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("diyFeed.all")}</p>
                  </div>
                  <div className="h-9 w-px bg-border" />
                  <div>
                    <p className="text-2xl font-semibold leading-none">{totalLikes.toLocaleString()}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Heart className="size-3.5" /> {t("diyFeed.bought") ? "yêu thích" : "likes"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {heroImages.length > 0 && (
              <div className="relative hidden h-56 lg:block">
                {heroImages.map((src, i) => (
                  <motion.img
                    key={src + i}
                    src={src}
                    alt=""
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="absolute size-40 rounded-2xl border-4 border-background object-cover shadow-xl"
                    style={{
                      right: `${i * 44}px`,
                      top: `${i * 28}px`,
                      zIndex: 3 - i,
                      transform: `rotate(${(i - 1) * 4}deg)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FeedFilter)}>
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:w-fit">
              <TabsTrigger value="all">{t("diyFeed.all")}</TabsTrigger>
              <TabsTrigger value="newest">{t("diyFeed.newest")}</TabsTrigger>
              <TabsTrigger value="purchased">{t("diyFeed.mostPurchased")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Link
            to="/support-diy/new"
            className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white dark:text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/0 before:to-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
          >
            <Hand className="w-5 h-5" />
            <span>Hỗ trợ DIY</span>
          </Link>
          <div className="flex items-center gap-3 lg:max-w-sm lg:flex-1">
            <div className="w-full sm:w-auto" />
            <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
              {sortedPosts.length} kết quả
            </span>
          </div>
        </div>

        {/* Grid / empty state */}
        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <PackageOpen className="mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">Không tìm thấy công thức nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Thử một từ khóa khác hoặc xóa bộ lọc</p>
            {searchQuery && (
              <button
                type="button"
                className="empty-state-cta"
                onClick={() => {
                  const newUrl = location.pathname;
                  navigate(newUrl, { replace: true });
                }}
                style={{ marginTop: "16px" }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedPosts.map((post, index) => {
              const creator = creators[post.creatorId];
              const saved = isDIYPostSaved(post._id);
              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.045 }}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <ResponsiveImage
                      src={post.images[0]}
                      alt={post.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={() => requireAuth(() => savePost(post))}
                      aria-label={saved ? "Bỏ lưu" : "Lưu công thức"}
                      className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
                    >
                      <Bookmark className={saved ? "size-4 fill-primary text-primary" : "size-4"} />
                    </button>

                    {post.purchaseCount != null && post.purchaseCount > 0 && (
                      <Badge className="absolute left-2 top-2 z-10 bg-background/80 text-foreground backdrop-blur">
                        {post.purchaseCount.toLocaleString()} {t("diyFeed.bought")}
                      </Badge>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10 opacity-100 md:opacity-0 md:transition-opacity group-hover:md:opacity-100">
                      <Button asChild size="sm" variant="secondary">
                        <Link
                          to={`/diy/${post._id}`}
                          onClick={(e) => {
                            if (!isAuthenticated) {
                              e.preventDefault();
                              navigate("/auth/login");
                            }
                          }}
                        >
                          {t("diyFeed.viewMaterial")}
                        </Link>
                      </Button>
                      <Button size="sm" onClick={() => requireAuth(() => buyCombo(post))}>
                        <ShoppingBag className="size-4" /> {t("diyFeed.buyNow")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2.5 p-3 md:p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={creator?.avatar} alt={creator?.fullName} />
                        <AvatarFallback className="text-[10px]">
                          {creator?.fullName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {creator?.fullName || t("diyFeed.creator")}
                      </p>
                    </div>

                    <Link
                      to={`/diy/${post._id}`}
                      className="line-clamp-2 min-h-[2.5em] font-semibold leading-tight hover:text-primary"
                    >
                      {post.title}
                    </Link>

                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="font-semibold text-primary">
                        {post.price != null && post.price > 0 ? (
                          formatPrice(post.price)
                        ) : (
                          <span className="font-normal text-muted-foreground">{t("diyFeed.free")}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="size-3.5" />
                        {post.likeCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}