import { Link, Navigate, useNavigate, useParams } from "react-router";
import { BookOpen, Bookmark, Heart, ShoppingCart, Edit, Trash2 } from "lucide-react";
import { ReportButton } from "../components/ReportButton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { Separator } from "../components/ui/separator";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { diyService } from "../../features/diy/services/diy.service";
import type { DIYPost } from "../../features/diy/types/diy.types";
import { formatPrice } from "../../lib/formatPrice";
import { useState, useEffect } from "react";

export function DIYDetailPage() {
  const { addToCart } = useCart();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole } = useAuth();
  const [post, setPost] = useState<DIYPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  useEffect(() => {
    if (!postId) return;
    async function loadPost() {
      try {
        const { data } = await diyService.getPostById(postId!);
        setPost(data.data);
      } catch {
        toast.error("Failed to load DIY post");
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) return <Navigate to="/diy" replace />;

  const isCreator = user?.id === post.creatorId;
  const isAdminOrStaff = hasRole(["admin", "staff"]);
  const canEdit = (isCreator || isAdminOrStaff) && post.status === "pending";

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const buyCombo = () => {
    // Add the combo price to cart (using the post's price)
    const comboPrice = post.price ?? 0;
    // Add as a single combo item
    addToCart({
      productId: post._id,
      variantId: "combo",
      name: post.title,
      image: post.images[0],
      color: "",
      hexCode: "#ccc",
      price: comboPrice,
      stock: 999,
    });
    toast.success("Combo added to cart");
  };

  const savePost = () => {
    const wasSaved = isDIYPostSaved(post._id);
    toggleDIYPostSave(post._id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  const handleEdit = () => {
    // Navigate to edit page or open modal
    navigate(`/diy/${postId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await diyService.deletePost(post._id);
      toast.success("Post deleted");
      navigate("/diy");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <Carousel className="overflow-hidden rounded-3xl border bg-card">
            <CarouselContent>
              {post.images.map((image, idx) => (
                <CarouselItem key={idx}>
                  <img src={image} alt={post.title} className="aspect-[4/5] w-full object-cover md:aspect-video" />
                </CarouselItem>
              ))}
            </CarouselContent>
            {post.images.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="" alt="Creator" />
                    <AvatarFallback>CR</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Creator</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Posted {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDelete}>
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                  <ReportButton targetType="diy_post" targetId={post._id} targetTitle={post.title} />
                  <Button variant="outline" onClick={savePost}>
                    <Bookmark className={isDIYPostSaved(post._id) ? "size-4 fill-current" : "size-4"} />
                    {isDIYPostSaved(post._id) ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>
                <p className="mt-3 text-muted-foreground md:text-lg">{post.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>

              <div className="flex gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="size-4" />
                  {post.likeCount.toLocaleString()} likes
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="size-4" />
                  {post.purchaseCount?.toLocaleString() ?? 0} purchases
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold">Related lessons</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="h-auto justify-start p-4">
                  <Link to="/learn/cozy-scarf-basics">Beginner scarf foundations</Link>
                </Button>
                <Button asChild variant="outline" className="h-auto justify-start p-4">
                  <Link to="/learn/pastel-bucket-hat">Pastel shaping workshop</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold">Materials used</h2>
          <p className="mt-1 text-sm text-muted-foreground">DIY Materials</p>

          <div className="mt-5 space-y-4">
            {post.linkedProduct?.map((item, idx) => (
              <div key={idx} className="flex gap-3 rounded-xl border p-3">
                <div className="size-16 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Product</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium">Product #{item.productId.slice(-6)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Qty 1</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="mb-5 flex items-center justify-between text-lg font-semibold">
            <span>Total combo price</span>
            <span>{formatPrice(post.price ?? 0)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={() => requireAuth(buyCombo)}>
            <ShoppingCart className="size-4" /> Buy this combo
          </Button>
        </aside>
      </div>
    </div>
  );
}