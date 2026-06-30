import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { learnCourses, getLessonsByCourse } from "../../features/learn/data/learn.mock";
import { useLearnStore as useFeatureLearnStore } from "../../features/learn/store/learn.store";
import { useLearnStore } from "../../store/learn.store";
import { formatPrice } from "../../lib/formatPrice";
import { useCart } from "../../context/CartContext";
import { products } from "../data/products";
import type { LinkedProduct } from "../../features/learn/types/learn.types";
import { cn } from "../components/ui/utils";

export function LessonPage() {
  const { addToCart } = useCart();
  const { courseId, lessonId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const setFeatureCurrentLesson = useFeatureLearnStore((state) => state.setCurrentLesson);
  const updateProgress = useFeatureLearnStore((state) => state.updateProgress);
  const markFeatureLessonComplete = useFeatureLearnStore((state) => state.markLessonComplete);
  const progress = useFeatureLearnStore((state) => (lessonId ? state.progress[lessonId] : undefined));
  const setCurrentLesson = useLearnStore((state) => state.setCurrentLesson);
  const markLessonComplete = useLearnStore((state) => state.markLessonComplete);

  const course = learnCourses.find((item) => item.id === courseId);
  const lessons = courseId ? getLessonsByCourse(courseId) : [];
  const lesson = lessons.find((item) => item.id === lessonId);
  const lessonIndex = lessons.findIndex((item) => item.id === lessonId);
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  useEffect(() => {
    if (courseId && lessonId) {
      setFeatureCurrentLesson(lessonId);
      setCurrentLesson(courseId, lessonId);
    }
  }, [courseId, lessonId, setFeatureCurrentLesson, setCurrentLesson]);

  const sortedProducts = useMemo(
    () => [...(lesson?.linkedProducts ?? [])].sort((a, b) => a.timestamp - b.timestamp),
    [lesson?.linkedProducts],
  );

  if (!course || !lesson) return <Navigate to="/learn" replace />;

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime ?? 0;
    updateProgress(lesson.id, currentTime);

    const activeProducts = sortedProducts.filter(
      (product) => currentTime >= product.timestamp,
    );
    const currentProduct = activeProducts[activeProducts.length - 1];

    setActiveProductId(currentProduct?.productId ?? null);
  };

  const addProductToCart = (linkedProduct: LinkedProduct) => {
    const product = products.find((p) => p.id === linkedProduct.productId);
    if (!product) {
      toast.error("Product not found");
      return;
    }
    const variant = product.variants?.[0];
    addToCart({
      productId: product.id,
      variantId: variant?.id || "default",
      name: product.name,
      image: product.image,
      color: variant?.color || "",
      hexCode: variant?.hexCode || "#ccc",
      price: variant?.price || 0,
      stock: variant?.stock || 999,
    });
    toast.success(`${product.name} added to cart`);
  };

  const addAllToCart = () => {
    sortedProducts.forEach((linkedProduct) => {
      const product = products.find((p) => p.id === linkedProduct.productId);
      if (!product) return;
      const variant = product.variants?.[0];
      addToCart({
        productId: product.id,
        variantId: variant?.id || "default",
        name: product.name,
        image: product.image,
        color: variant?.color || "",
        hexCode: variant?.hexCode || "#ccc",
        price: variant?.price || 0,
        stock: variant?.stock || 999,
      });
    });
    toast.success("All lesson materials added to cart");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-2 px-0">
              <Link to={`/learn/${course.id}`}><ArrowLeft className="size-4" /> Back to course</Link>
            </Button>
            <Badge variant="secondary" className="mb-3">Lesson {lesson.order} of {lessons.length}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{lesson.title}</h1>
            <p className="mt-2 text-muted-foreground">{course.title}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> {lesson.duration} min
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
          <main className="space-y-5">
            <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
              <video
                ref={videoRef}
                src={lesson.videoUrl}
                controls
                className="aspect-video w-full"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  markFeatureLessonComplete(lesson.id);
                  markLessonComplete(course.id, lesson.id);
                }}
              />
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Progress</h2>
                    <p className="text-sm text-muted-foreground">
                      {progress?.completed ? "Completed" : `${Math.floor(progress?.watchedSeconds ?? 0)} seconds watched`}
                    </p>
                  </div>
                  {progress?.completed && <CheckCircle2 className="size-6 text-green-600" />}
                </div>
                <Progress value={progress?.completed ? 100 : Math.min(((progress?.watchedSeconds ?? 0) / (lesson.duration * 60)) * 100, 100)} />
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-between gap-3">
              <Button asChild variant="outline" disabled={!previousLesson}>
                <Link to={previousLesson ? `/learn/${course.id}/lesson/${previousLesson.id}` : "#"}>
                  <ArrowLeft className="size-4" /> Previous lesson
                </Link>
              </Button>
              <Button asChild disabled={!nextLesson}>
                <Link to={nextLesson ? `/learn/${course.id}/lesson/${nextLesson.id}` : `/learn/${course.id}`}>
                  Next lesson <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </main>

          <aside className="rounded-2xl border bg-card p-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Materials in this lesson</h2>
                <p className="text-sm text-muted-foreground">Suggestions highlight when the video reaches their timestamp.</p>
              </div>
              <Badge variant="outline">{sortedProducts.length}</Badge>
            </div>

            <div className="space-y-3">
              {sortedProducts.map((product) => {
                const isActive = product.productId === activeProductId;
                return (
                  <div
                    key={`${product.productId}-${product.timestamp}`}
                    className={cn(
                      "flex gap-3 rounded-xl border p-3 transition-all",
                      isActive && "border-primary bg-primary/10 shadow-sm",
                    )}
                  >
                    <img src={product.thumbnail} alt={product.name} className="size-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "outline"}>{formatTimestamp(product.timestamp)}</Badge>
                        {isActive && <span className="text-xs font-medium text-primary">Now used</span>}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addProductToCart(product)}>
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button className="mt-5 w-full" onClick={addAllToCart}>
              <ShoppingCart className="size-4" /> Add all to cart
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}
