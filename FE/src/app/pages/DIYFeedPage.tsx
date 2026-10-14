import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  Heart,
  ShoppingBag,
  Bookmark,
  PackageOpen,
  HeartHandshake,
  Sparkles,
  Clock,
  Flame,
  LayoutGrid,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/components/ui/avatar";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { useAuth } from "../../shared/hooks/useAuth";
import { useAddToCart } from "../../features/cart/useAddToCart";
import { toDIYCartPayload } from "../../features/diy/diyMaterials";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { diyService } from "../../features/diy/services/diy.service";
import type { DIYCreator, DIYPost } from "../../features/diy/types/diy.types";
import { formatPrice } from "../../lib/formatPrice";
import { ResponsiveImage } from "../../shared/components/ui/ResponsiveImage";
import { CreateDIYPostModal } from "../../features/diy/components/CreateDIYPostModal";
import { EmptyHoopIllustration } from "./shop/CartPage";
import "../../styles/craft.css";
import "../../styles/diy-feed.css";

type FeedFilter = "all" | "newest" | "purchased";

// Helper: the backend now populates `post.creatorId` with the creator object,
// so the card can read avatar/fullName directly (no ID→creator lookup needed).
// Falls back to undefined for legacy/mock string IDs.
function getPostCreator(post: DIYPost): DIYCreator | undefined {
  return post.creatorId && typeof post.creatorId === "object"
    ? post.creatorId
    : undefined;
}


export function DIYFeedPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addDIY } = useAddToCart();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [posts, setPosts] = useState<DIYPost[]>([]);
  const searchQuery = searchParams.get("search") || "";
  const [loading, setLoading] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Feed công khai chỉ hiển thị bài đã được admin duyệt (status = "Done").
      // Backend DIY chỉ có 2 trạng thái: "Pending" (chờ duyệt) và "Done" —
      // xem AdminDIYPosts (STATUS_OPTIONS, updatePostStatus). Truyền status cho
      // BE lọc phía server; filter client-side (case-insensitive) là lớp chặn
      // cuối đề phòng backend bỏ qua query param.
      const { data } = await diyService.getAllPosts({
        page: 1,
        limit: 20,
        status: "Done",
      });
      setPosts(
        data.data.posts.filter(
          (post) => (post.status || "").toLowerCase() === "done",
        ),
      );

      // Creator info is now populated by the backend on each post, so no
      // extra per-creator requests or client-side ID mapping are needed.
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

  // "Mua ngay" = bỏ chính bài DIY vào giỏ (title / ảnh / giá của bài) —
  // không phải combo hay nguyên liệu của bài.
  const buyDIY = (post: DIYPost) => addDIY(toDIYCartPayload(post));

  const savePost = (post: DIYPost) => {
    const wasSaved = isDIYPostSaved(post._id);
    toggleDIYPostSave(post._id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  const approvedPosts = useMemo(
    // Backend: "Pending" / "Done" / "Cancel" — chỉ bài đã duyệt mới công khai
    // (trước đây chỉ lọc "pending" nên bài bị từ chối vẫn lọt ra feed).
    () => posts.filter((p) => !["pending", "cancel"].includes((p.status || "").toLowerCase())),
    [posts],
  );

  const filteredPosts = approvedPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

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
    [approvedPosts],
  );
  // 3 bài đầu treo lên "dây phơi ảnh" trong hero
  const heroPosts = useMemo(
    () => approvedPosts.filter((p) => p.images[0]).slice(0, 3),
    [approvedPosts],
  );

  const filterOptions: { value: FeedFilter; label: string; icon: typeof Clock }[] = [
    { value: "all", label: t("diyFeed.all"), icon: LayoutGrid },
    { value: "newest", label: t("diyFeed.newest"), icon: Clock },
    { value: "purchased", label: t("diyFeed.mostPurchased"), icon: Flame },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="craft-skeleton mb-10 h-[280px] rounded-[32px] md:h-[340px]" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[22px] border border-border bg-card">
                <div className="craft-skeleton aspect-[4/5] w-full rounded-none" />
                <div className="space-y-2.5 p-4">
                  <div className="craft-skeleton h-3 w-2/3" />
                  <div className="craft-skeleton h-4 w-full" />
                  <div className="craft-skeleton h-3 w-1/3" />
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
        {/* ── Hero: góc sáng tạo + dây phơi ảnh ── */}
        <section className="craft-hero craft-rise mb-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="craft-eyebrow">Góc sáng tạo của cộng đồng</span>
              <h1 className="craft-title">{t("diyFeed.headline")}</h1>
              <div className="craft-stitch" aria-hidden />
              <p className="craft-subtitle">{t("diyFeed.subtitle")}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => requireAuth(() => setPostOpen(true))}
                  className="craft-btn"
                >
                  <Sparkles className="size-4" />
                  Đăng tác phẩm
                </button>
                <Link to="/support-diy/new" className="craft-btn-ghost">
                  <HeartHandshake className="size-4" />
                  Cần hỗ trợ DIY?
                </Link>
              </div>

              {approvedPosts.length > 0 && (
                <div className="craft-stats">
                  <div className="craft-stat">
                    <span className="craft-stat-icon">
                      <PackageOpen className="size-4" />
                    </span>
                    <div>
                      <p className="craft-stat-num">{approvedPosts.length}</p>
                      <p className="craft-stat-label">dự án</p>
                    </div>
                  </div>
                  <div className="craft-stat">
                    <span className="craft-stat-icon">
                      <Heart className="size-4" />
                    </span>
                    <div>
                      <p className="craft-stat-num">{totalLikes.toLocaleString()}</p>
                      <p className="craft-stat-label">lượt thích</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {heroPosts.length > 0 && (
              <div className="diy-clothesline" aria-hidden>
                <svg
                  className="diy-clothesline-thread"
                  viewBox="0 0 400 60"
                  preserveAspectRatio="none"
                >
                  <path d="M0 14 Q200 64 400 14" />
                </svg>
                {heroPosts.map((post, i) => (
                  <motion.figure
                    key={post._id}
                    className={`diy-polaroid diy-polaroid-${i}`}
                    initial={{ opacity: 0, y: -18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="diy-polaroid-pin" />
                    <img src={post.images[0]} alt="" loading="lazy" />
                    <figcaption>{post.title}</figcaption>
                  </motion.figure>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Thanh sắp xếp ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="craft-seg" role="tablist" aria-label="Sắp xếp">
            {filterOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`craft-seg-btn ${filter === value ? "is-active" : ""}`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="diy-result-count">
            {searchQuery ? (
              <>
                {sortedPosts.length} kết quả cho <strong>“{searchQuery}”</strong>
              </>
            ) : (
              <>{sortedPosts.length} dự án đang chờ bạn</>
            )}
          </p>
        </div>

        {postOpen && (
          <CreateDIYPostModal
            onClose={() => setPostOpen(false)}
            onSuccess={() => {
              setPostOpen(false);
              fetchPosts();
            }}
          />
        )}

        {/* ── Lưới tác phẩm / empty state ── */}
        {sortedPosts.length === 0 ? (
          <div className="craft-empty">
            <EmptyHoopIllustration size={160} />
            <p className="craft-empty-title">Chưa tìm thấy dự án nào</p>
            <p className="craft-empty-desc">
              {searchQuery
                ? "Thử một từ khoá khác, hoặc xem toàn bộ dự án của cộng đồng."
                : "Hãy là người đầu tiên chia sẻ tác phẩm handmade của bạn nhé."}
            </p>
            {searchQuery ? (
              <button
                type="button"
                className="craft-btn-ghost"
                onClick={() => navigate(location.pathname, { replace: true })}
              >
                Xoá tìm kiếm
              </button>
            ) : (
              <button
                type="button"
                className="craft-btn"
                onClick={() => requireAuth(() => setPostOpen(true))}
              >
                <Sparkles className="size-4" />
                Đăng tác phẩm
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {sortedPosts.map((post, index) => {
              const creator = getPostCreator(post);
              const saved = isDIYPostSaved(post._id);
              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index, 10) * 0.045 }}
                  className="diy-card group"
                >
                  <div className="diy-card-media">
                    <ResponsiveImage
                      src={post.images[0]}
                      alt={post.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={() => requireAuth(() => savePost(post))}
                      aria-label={saved ? "Bỏ lưu" : "Lưu công thức"}
                      aria-pressed={saved}
                      className={`diy-card-save ${saved ? "is-saved" : ""}`}
                    >
                      <Bookmark className="size-4" />
                    </button>

                    {post.purchaseCount != null && post.purchaseCount > 0 && (
                      <span className="diy-card-sold">
                        <Flame className="size-3" />
                        {post.purchaseCount.toLocaleString()} {t("diyFeed.bought")}
                      </span>
                    )}

                    <div className="diy-card-actions">
                      <Link
                        to={`/diy/${post._id}`}
                        className="diy-card-action is-light"
                        onClick={(e) => {
                          if (!isAuthenticated) {
                            e.preventDefault();
                            navigate("/auth/login");
                          }
                        }}
                      >
                        <Eye className="size-3.5" />
                        {t("diyFeed.viewMaterial")}
                      </Link>
                      <button
                        type="button"
                        className="diy-card-action is-primary"
                        onClick={() => requireAuth(() => buyDIY(post))}
                      >
                        <ShoppingBag className="size-3.5" />
                        {t("diyFeed.buyNow")}
                      </button>
                    </div>
                  </div>

                  <div className="diy-card-body">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 ring-2 ring-[var(--card)]">
                        <AvatarImage src={creator?.avatar} alt={creator?.fullName} />
                        <AvatarFallback className="text-[10px]">
                          {creator?.fullName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {creator?.fullName || t("diyFeed.creator")}
                      </p>
                    </div>

                    <Link to={`/diy/${post._id}`} className="diy-card-title">
                      {post.title}
                    </Link>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="craft-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="diy-card-foot">
                      {post.price != null && post.price > 0 ? (
                        <span className="diy-card-price">{formatPrice(post.price)}</span>
                      ) : (
                        <span className="diy-card-free">{t("diyFeed.free")}</span>
                      )}
                      <span className="diy-card-likes">
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
