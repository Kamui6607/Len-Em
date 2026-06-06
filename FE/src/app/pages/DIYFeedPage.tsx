import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Search, ShoppingBag, Star, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { diyPosts } from "../../features/diy/data/diy.mock";
import type { DIYPost } from "../../features/diy/types/diy.types";

interface DIYFeedPageProps {
  onAddToCart: (productId: string) => void;
}

type FeedFilter = "all" | "idols" | "newest" | "purchased";

export function DIYFeedPage({ onAddToCart }: DIYFeedPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [search, setSearch] = useState("");
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const posts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let next = diyPosts.filter((post) => {
      if (!normalizedSearch) return true;
      return post.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
    });

    if (filter === "idols") next = next.filter((post) => post.creator.isIdol);
    if (filter === "newest") {
      next = [...next].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    if (filter === "purchased") {
      next = [...next].sort((a, b) => (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0));
    }

    return next;
  }, [filter, search]);

  const buyCombo = (post: DIYPost) => {
    post.linkedCombo.items.forEach((item) => {
      for (let index = 0; index < item.quantity; index += 1) {
        onAddToCart(item.productId);
      }
    });
    toast.success(`${post.linkedCombo.name} added to cart`);
  };

  const savePost = (post: DIYPost) => {
    const wasSaved = isDIYPostSaved(post.id);
    toggleDIYPostSave(post.id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 md:p-10">
          <Badge variant="secondary" className="mb-4">DIY</Badge>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Fan-made crochet inspiration you can buy instantly.
          </h1>
          <p className="max-w-3xl text-muted-foreground md:text-lg">
            Browse creator and idol projects, save your favorites, then buy the exact material combo behind every look.
          </p>
        </section>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FeedFilter)}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:w-fit sm:grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="idols">From Idols</TabsTrigger>
              <TabsTrigger value="newest">Newest</TabsTrigger>
              <TabsTrigger value="purchased">Most Purchased</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tags: idol, bag, beginner..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.045 }}
              className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-xl"
            >
              <div className="relative overflow-hidden bg-muted">
                <img src={post.images[0]} alt={post.title} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/diy/${post.id}`} onClick={(e) => { if (!isAuthenticated) { e.preventDefault(); navigate("/auth/login"); } }}>View material combo</Link>
                  </Button>
                  <Button size="sm" onClick={() => requireAuth(() => buyCombo(post))}>
                    <ShoppingBag className="size-4" /> Buy now
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                    <AvatarFallback>{post.creator.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{post.creator.name}</p>
                    {post.creator.isIdol && <Badge className="mt-1 bg-yellow-100 text-yellow-800">⭐ Idol</Badge>}
                  </div>
                </div>

                <Link to={`/diy/${post.id}`} className="block font-semibold leading-tight hover:text-primary">
                  {post.title}
                </Link>

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
                    {isDIYPostSaved(post.id) ? <Bookmark className="size-4 fill-current" /> : <Bookmark className="size-4" />}
                    {(post.saveCount + (isDIYPostSaved(post.id) ? 1 : 0)).toLocaleString()}
                  </button>
                  <span className="flex items-center gap-1"><Star className="size-4" />{post.purchaseCount?.toLocaleString()}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
