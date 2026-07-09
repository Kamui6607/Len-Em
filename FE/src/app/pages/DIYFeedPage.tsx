import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Search, ShoppingBag, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { diyService } from "../../features/diy/services/diy.service";
import type { DIYPost } from "../../features/diy/types/diy.types";
import { formatPrice } from "../../lib/formatPrice";
import { userService } from "../../features/users/services/user.service";

type FeedFilter = "all" | "newest" | "purchased";

interface CreatorInfo {
  userId: string;
  fullName: string;
  avatar?: string;
}

export function DIYFeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<DIYPost[]>([]);
  const [creators, setCreators] = useState<Record<string, CreatorInfo>>({});
  const [loading, setLoading] = useState(false);
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await diyService.getAllPosts({ page: 1, limit: 20 });
      setPosts(data.data.posts);
      
      // Fetch creator info for each post
      const creatorIds = [...new Set(data.data.posts.map(p => p.creatorId))];
      const creatorMap: Record<string, CreatorInfo> = {};
      
      for (const creatorId of creatorIds) {
        try {
          const { data: userData } = await userService.getUserById(creatorId);
          creatorMap[creatorId] = {
            userId: userData.data.result.userId,
            fullName: userData.data.result.fullName,
            avatar: typeof userData.data.result.avatar === 'object' 
              ? userData.data.result.avatar?.url 
              : userData.data.result.avatar,
          };
        } catch {
          // Keep default if fetch fails
        }
      }
      setCreators(creatorMap);
    } catch {
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

  const buyCombo = (post: DIYPost) => {
    const itemPrice = (post.price ?? 0) / (post.linkedProduct?.length || 1);
    post.linkedProduct?.forEach((item) => {
      addToCart({
        productId: item.productId,
        variantId: "default",
        name: item.productId,
        image: post.images[0],
        color: "",
        hexCode: "#ccc",
        price: itemPrice,
        stock: 999,
      });
    });
    toast.success("Materials added to cart");
  };

  const savePost = (post: DIYPost) => {
    const wasSaved = isDIYPostSaved(post._id);
    toggleDIYPostSave(post._id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  // Filter: only show approved posts + search filter
  const filteredPosts = posts.filter((post) => {
    if (post.status !== "approved") return false;
    if (!search.trim()) return true;
    return post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 md:p-10">
          <Badge variant="secondary" className="mb-4">DIY</Badge>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Fan-made crochet inspiration you can buy instantly.
          </h1>
          <p className="max-w-3xl text-muted-foreground md:text-lg">
            Browse creator projects, save your favorites, then buy the exact material combo behind every look.
          </p>
        </section>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FeedFilter)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:w-fit sm:grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="newest">Newest</TabsTrigger>
              <TabsTrigger value="purchased">Most Purchased</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tags: bag, beginner..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
          {sortedPosts.map((post, index) => {
            const creator = creators[post.creatorId];
            return (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.045 }}
                className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative overflow-hidden bg-muted">
                  <img src={post.images[0]} alt={post.title} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 p-3 opacity-100 md:opacity-0 md:transition-opacity group-hover:md:opacity-100">
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/diy/${post._id}`} onClick={(e) => { if (!isAuthenticated) { e.preventDefault(); navigate("/auth/login"); } }}>View material combo</Link>
                    </Button>
                    <Button size="sm" onClick={() => requireAuth(() => buyCombo(post))}>
                      <ShoppingBag className="size-4" /> Buy now
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={creator?.avatar} alt={creator?.fullName} />
                      <AvatarFallback>{creator?.fullName?.charAt(0) || "C"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{creator?.fullName || "Creator"}</p>
                    </div>
                  </div>

                  <Link to={`/diy/${post._id}`} className="block font-semibold leading-tight hover:text-primary">
                    {post.title}
                  </Link>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-semibold">
                      {post.price != null && post.price > 0
                        ? formatPrice(post.price)
                        : <span className="text-muted-foreground">Free</span>}
                    </span>
                    {post.purchaseCount != null && post.purchaseCount > 0 && (
                      <span className="text-xs text-muted-foreground">{post.purchaseCount.toLocaleString()} bought</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px]">#{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="size-4" />{post.likeCount.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => savePost(post)}
                      className="flex items-center gap-1 transition-colors hover:text-primary"
                    >
                      {isDIYPostSaved(post._id) ? <Bookmark className="size-4 fill-current" /> : <Bookmark className="size-4" />}
                      {post.saveCount?.toLocaleString() ?? 0}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}