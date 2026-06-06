import { Link, Navigate, useNavigate, useParams } from "react-router";
import { BookOpen, Bookmark, Heart, ShoppingCart } from "lucide-react";
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
import { diyPosts } from "../../features/diy/data/diy.mock";

interface DIYDetailPageProps {
  onAddToCart: (productId: string) => void;
}

export function DIYDetailPage({ onAddToCart }: DIYDetailPageProps) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const post = diyPosts.find((item) => item.id === postId);
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();

  if (!post) return <Navigate to="/diy" replace />;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const buyCombo = () => {
    post.linkedCombo.items.forEach((item) => {
      for (let index = 0; index < item.quantity; index += 1) {
        onAddToCart(item.productId);
      }
    });
    toast.success(`${post.linkedCombo.name} added to cart`);
  };

  const handleViewMaterialCombo = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  const savePost = () => {
    const wasSaved = isDIYPostSaved(post.id);
    toggleDIYPostSave(post.id);
    toast.success(wasSaved ? "DIY post removed from saved" : "DIY post saved");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <Carousel className="overflow-hidden rounded-3xl border bg-card">
            <CarouselContent>
              {post.images.map((image) => (
                <CarouselItem key={image}>
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
                    <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                    <AvatarFallback>{post.creator.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{post.creator.name}</p>
                      {post.creator.isIdol && <Badge className="bg-yellow-100 text-yellow-800">⭐ Idol</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Posted {new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={savePost}>
                  <Bookmark className={isDIYPostSaved(post.id) ? "size-4 fill-current" : "size-4"} />
                  {isDIYPostSaved(post.id) ? "Saved" : "Save"}
                </Button>
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
                <span className="flex items-center gap-1"><Heart className="size-4" />{post.likeCount.toLocaleString()} likes</span>
                <span className="flex items-center gap-1"><Bookmark className="size-4" />{post.saveCount.toLocaleString()} saves</span>
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
          <p className="mt-1 text-sm text-muted-foreground">{post.linkedCombo.name}</p>

          <div className="mt-5 space-y-4">
            {post.linkedCombo.items.map((item) => (
              <div key={item.productId} className="flex gap-3 rounded-xl border p-3">
                <img src={item.thumbnail} alt={item.name} className="size-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="mb-5 flex items-center justify-between text-lg font-semibold">
            <span>Total combo price</span>
            <span>${post.linkedCombo.totalPrice.toFixed(2)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={() => requireAuth(buyCombo)}>
            <ShoppingCart className="size-4" /> Buy this combo
          </Button>
        </aside>
      </div>
    </div>
  );
}
