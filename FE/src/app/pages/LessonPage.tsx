import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent } from "../../shared/components/ui/card";
import { Progress } from "../../shared/components/ui/progress";
import { courseService } from "../../shared/api/courseService";
import { lessonService } from "../../shared/api/lessonService";
import { kitService, type Kit } from "../../shared/api/kitService";
import { productService, type Product } from "../../shared/api/productService";
import { materialCombos } from "../../features/learn/data/learn.mock";
import { useLearnStore as useFeatureLearnStore } from "../../features/learn/store/learn.store";
import { useLearnStore } from "../../shared/store/learn.store";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../shared/hooks/useAuth";
import { useCart } from "../../shared/contexts/CartContext";
import { products } from "../data/products";
import type {
  Course,
  CourseProgress,
  Lesson,
  MaterialCombo,
} from "../../features/learn/types/learn.types";

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const matchStandard = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  if (matchStandard) {
    return `https://www.youtube.com/embed/${matchStandard[1]}?autoplay=0&rel=0`;
  }
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return url;
  }
  return null;
}

/**
 * Extract ID from various reference formats.
 * Handles: string ID, { comboId }, { kitId }, { productId }, { _id }, { id }, or populated objects.
 */
function extractId(ref: unknown): string | null {
  if (!ref) return null;

  // String ID
  if (typeof ref === "string") {
    return ref;
  }

  // Object reference
  if (typeof ref === "object") {
    const obj = ref as Record<string, unknown>;

    // Check for common ID field names
    const id = obj.comboId || obj.kitId || obj.productId || obj._id || obj.id;
    if (typeof id === "string" && id.length > 0) {
      return id;
    }

    // If object has _id or id but no specific field, it might be a populated object
    // Return the object's _id or id as the reference ID
    if (obj._id && typeof obj._id === "string") {
      return obj._id;
    }
    if (obj.id && typeof obj.id === "string") {
      return obj.id;
    }
  }

  return null;
}

interface MaterialItem {
  type: "product" | "kit";
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  kitData?: Kit;
  productData?: Product;
}

export function LessonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToCart, addKitToCart } = useCart();
  const { courseId, lessonId } = useParams();
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<{ destroy: () => void } | null>(null);
  const completeInFlightRef = useRef<string | null>(null);

  const markFeatureLessonComplete = useFeatureLearnStore(
    (state) => state.markLessonComplete,
  );
  const progress = useFeatureLearnStore((state) =>
    lessonId ? state.progress[lessonId] : undefined,
  );
  const markLessonComplete = useLearnStore((state) => state.markLessonComplete);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get search query from URL
  const searchQuery = searchParams.get("search") || "";

  // Debug: log search state
  useEffect(() => {
    console.log("LessonPage - searchQuery:", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseRes = await courseService.getById(courseId);
        const courseData = courseRes.data.data.course;
        setCourse(courseData);

        // linkedLessons from API may be populated objects or string IDs
        const rawLessons = courseData.linkedLessons || [];
        const populatedLessons: Lesson[] = [];
        const lessonIdsToFetch: string[] = [];

        for (const item of rawLessons) {
          if (!item) continue;
          if (typeof item === "object") {
            const obj = item as Record<string, unknown>;
            if (obj.title && typeof obj.title === "string") {
              populatedLessons.push(item as unknown as Lesson);
              continue;
            }
            const rawId = obj._id || obj.id;
            if (typeof rawId === "string" && rawId.length > 0) {
              lessonIdsToFetch.push(rawId);
            }
            continue;
          }
          if (typeof item === "string" && item.length > 0) {
            lessonIdsToFetch.push(item);
          }
        }

        if (lessonIdsToFetch.length > 0) {
          const lessonPromises = lessonIdsToFetch.map((id) =>
            lessonService
              .getById(id)
              .then((res) => res.data.data.lesson)
              .catch(() => null),
          );
          const fetchedLessons = (await Promise.all(lessonPromises)).filter(
            (l): l is Lesson => l !== null,
          );
          populatedLessons.push(...fetchedLessons);
        }

        const courseLessons = populatedLessons.sort(
          (a, b) => a.order - b.order,
        );
        setLessons(courseLessons);

        // Find current lesson
        const foundLesson =
          courseLessons.find((l) => l._id === lessonId) ?? null;
        setLesson(foundLesson);

        if (!foundLesson) {
          try {
            const lessonRes = await lessonService.getById(lessonId);
            setLesson(lessonRes.data.data.lesson);
          } catch {
            // Fallback
          }
        }
      } catch {
        toast.error("Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!courseId || !lessonId) return;

    // Read actions from the stores without subscribing this effect to action
    // references, which prevents render/update loops when the store changes.
    useFeatureLearnStore.getState().setCurrentLesson(lessonId);
    useLearnStore.getState().setCurrentLesson(courseId, lessonId);
  }, [courseId, lessonId]);

  // ── Server-side course progress ──────────────────────────────────────
  // Fetch the user's persisted progress on mount (instead of relying only on
  // the offline Zustand store) so completion survives device changes/logins.
  // Completed lesson IDs are also synced back into the local stores so the
  // lesson UI reflects the server truth immediately.
  useEffect(() => {
    if (!courseId) return;
    let active = true;
    courseService
      .getProgress(courseId)
      .then((res) => {
        if (!active) return;
        const data = res.data.data;
        setCourseProgress(data);
        (data.completedLessons ?? []).forEach((id) => {
          useFeatureLearnStore.getState().markLessonComplete(id);
          useLearnStore.getState().markLessonComplete(courseId, id);
        });
      })
      .catch(() => {
        if (active) setCourseProgress(null);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  // ── Persist lesson completion to the server ──────────────────────────
  // Shared by all completion paths (native <video> onEnded, YouTube API
  // ENDED state and the watch-simulation fallback) so progress is always
  // recorded server-side (survives device changes / logins).
  const persistLessonComplete = useCallback(() => {
    if (!course || !lesson) return;
    // One in-flight request per lesson — ignore duplicates (e.g. the YouTube
    // ENDED event and the watch-simulation fallback firing together).
    if (completeInFlightRef.current === lesson._id) return;
    completeInFlightRef.current = lesson._id;

    // Optimistic local update (existing Zustand stores).
    markFeatureLessonComplete(lesson._id);
    markLessonComplete(course._id, lesson._id);

    void courseService
      .completeLesson(course._id, lesson._id)
      .then((res) => setCourseProgress(res.data.data))
      .catch(() => toast.error("Failed to save course progress"))
      .finally(() => {
        if (completeInFlightRef.current === lesson._id) {
          completeInFlightRef.current = null;
        }
      });
  }, [course, lesson, markFeatureLessonComplete, markLessonComplete]);

  // ── YouTube embed: real "video ended" detection ──────────────────────
  // Native <video> elements fire `onEnded`, but YouTube uses an <iframe>
  // which can't. We drive the player through the YouTube IFrame API and
  // mark the lesson complete when the actual ENDED state fires.
  useEffect(() => {
    if (!lesson?.videoUrl || !lessonId) return;
    const isYouTube =
      lesson.videoUrl.includes("youtube") ||
      lesson.videoUrl.includes("youtu.be");
    if (!isYouTube) return;
    const videoId = getYouTubeVideoId(lesson.videoUrl);
    if (!videoId) return;

    let disposed = false;
    // `window.YT` types aren't included in the project — access via a cast.
    const W = window as unknown as {
      YT?: {
        Player: { new (element: HTMLElement, options: object): { destroy: () => void } };
        PlayerState: { ENDED: number };
      };
      onYouTubeIframeAPIReady?: () => void;
    };

    const buildPlayer = () => {
      if (disposed || !W.YT?.Player || !ytContainerRef.current) return;
      try {
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.destroy();
          } catch {
            /* ignore */
          }
          ytPlayerRef.current = null;
        }
        const player = new W.YT.Player(ytContainerRef.current, {
          videoId,
          width: "100%",
          playerVars: { rel: 0 },
          events: {
            onStateChange: (event: { data: number }) => {
              if (event.data === W.YT?.PlayerState.ENDED) {
                persistLessonComplete();
              }
            },
          },
        });
        if (disposed) {
          try {
            player.destroy();
          } catch {
            /* ignore */
          }
        } else {
          ytPlayerRef.current = player;
        }
      } catch {
        // If the player can't be built, the watch-time fallback below still
        // completes the lesson after the simulated duration elapses.
      }
    };

    if (W.YT?.Player) {
      buildPlayer();
    } else {
      // Load the IFrame API once; onYouTubeIframeAPIReady → buildPlayer().
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      W.onYouTubeIframeAPIReady = buildPlayer;
    }

    return () => {
      disposed = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          /* ignore */
        }
        ytPlayerRef.current = null;
      }
    };
  }, [lesson?.videoUrl, lessonId, persistLessonComplete]);

  // Simulate watching progress for YouTube embeds
  useEffect(() => {
    if (!lesson?.videoUrl || !lessonId) return;
    const isYouTube =
      lesson.videoUrl.includes("youtube") ||
      lesson.videoUrl.includes("youtu.be");
    if (!isYouTube) return;

    // NOTE: never call store actions inside a React setState updater — the
    // updater runs during the render phase, so a store .set() there triggers
    // "Cannot update a component while rendering a different component"
    // (Zustand notifies subscribers synchronously). Both the local state
    // and the store are updated from the interval callback instead.
    watchIntervalRef.current = setInterval(() => {
      const next =
        (useFeatureLearnStore.getState().progress[lessonId]?.watchedSeconds ??
          0) + 1;
      useFeatureLearnStore.getState().updateProgress(lessonId, next);
      setWatchedSeconds(next);

      // Fallback completion: if the user has watched the full lesson duration
      // (covers cases where the YouTube API can't load and no ENDED event
      // fires), persist it so course progress is always recorded.
      if (next >= Math.max(lesson.duration, 1) * 60) {
        persistLessonComplete();
      }
    }, 1000);

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
    };
  }, [lesson?.videoUrl, lesson?.duration, lessonId, persistLessonComplete]);

  // Fetch linked combos from API for the lesson (when lesson is set)
  useEffect(() => {
    if (!lesson?.linkedCombo || lesson.linkedCombo.length === 0) return;

    const fetchKits = async () => {
      const comboIds: string[] = lesson
        .linkedCombo!.map((ref) => extractId(ref))
        .filter((id): id is string => id !== null);

      if (comboIds.length > 0) {
        const kitPromises = comboIds.map((id) =>
          kitService
            .getById(id)
            .then((res) => res.data.data?.kit)
            .catch(() => null),
        );
        const fetchedKits = (await Promise.all(kitPromises)).filter(
          (k): k is Kit => k !== null,
        );

        // If API returned no kits, try to find from mock data
        if (fetchedKits.length === 0) {
          const mockKits = comboIds
            .map((id) => materialCombos.find((c) => c.id === id))
            .filter((c): c is MaterialCombo => c !== undefined)
            .map(
              (c) =>
                ({
                  _id: c.id,
                  name: c.name,
                  description: c.description,
                  thumbnail: c.thumbnail,
                  level: c.level,
                  price: c.price,
                  products: c.productIds.map((pid) => {
                    const product = products.find((p) => p.id === pid);
                    const firstVariant = product?.variants?.[0];
                    return {
                      productId: {
                        _id: pid,
                        name: product?.name ?? pid,
                        description: product?.description ?? "",
                        category: product?.category ?? "",
                        image: product?.image ?? "",
                        tags: product?.tags ?? [],
                        variants:
                          product?.variants?.map((v) => ({
                            _id: v.id,
                            color: v.color,
                            hexCode: v.hexCode,
                            price: v.price,
                            stock: v.stock,
                            image: v.images?.[0] ?? "",
                          })) ?? [],
                        isActive: true,
                        createdAt: product?.createdAt ?? "",
                        updatedAt: product?.createdAt ?? "",
                        __v: 0,
                      },
                      variantId: firstVariant?.id ?? "default",
                      quantity: 1,
                    };
                  }),
                  stock: 0,
                  isActive: true,
                  averageRating: 0,
                  totalRatings: 0,
                  ratings: [],
                  createdAt: "",
                  updatedAt: "",
                  __v: 0,
                }) as Kit,
            );
          setKits(mockKits);
        } else {
          setKits(fetchedKits);
        }
      }
    };
    fetchKits();
  }, [lesson?.linkedCombo]);

  // Fetch linked products from API for the lesson
  useEffect(() => {
    if (!lesson?.linkedProduct || lesson.linkedProduct.length === 0) return;

    const fetchProducts = async () => {
      const productIds: string[] = lesson
        .linkedProduct!.map((lp) => extractId(lp))
        .filter((id): id is string => id !== null);

      if (productIds.length > 0) {
        const productPromises = productIds.map((id) =>
          productService
            .getById(id)
            .then((res) => res.data.data?.product)
            .catch(() => null),
        );
        const fetchedProducts = (await Promise.all(productPromises)).filter(
          (p): p is Product => p !== null,
        );
        setApiProducts(fetchedProducts);
      }
    };
    fetchProducts();
  }, [lesson?.linkedProduct]);

  // Build materials list from lesson.linkedProduct + lesson.linkedCombo
  const materials = useMemo<MaterialItem[]>(() => {
    const items: MaterialItem[] = [];

    // Add linked products - prefer API products, fallback to mock
    if (lesson?.linkedProduct && lesson.linkedProduct.length > 0) {
      for (const lp of lesson.linkedProduct) {
        const productId = extractId(lp);
        if (!productId) continue;

        // Try to find from API products first
        const apiProduct = apiProducts.find((p) => p._id === productId);
        if (apiProduct) {
          items.push({
            type: "product",
            id: apiProduct._id,
            name: apiProduct.name,
            price: apiProduct.variants[0]?.price ?? 0,
            thumbnail: apiProduct.image || apiProduct.variants[0]?.image || "",
            productData: apiProduct,
          });
          continue;
        }

        // Fallback to mock data
        const product = products.find((p) => p.id === productId);
        items.push({
          type: "product",
          id: productId,
          name: product?.name ?? productId,
          price: product?.variants?.[0]?.price ?? 0,
          thumbnail: product?.image ?? "",
        });
      }
    }

    // Add linked combos (kits)
    if (kits && kits.length > 0) {
      for (const kit of kits) {
        items.push({
          type: "kit",
          id: kit._id,
          name: kit.name,
          price: kit.price,
          thumbnail: kit.thumbnail,
          kitData: kit,
        });
      }
    }

    return items;
  }, [lesson?.linkedProduct, kits, apiProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 overflow-hidden rounded-2xl border bg-black shadow-sm">
            <div className="aspect-video w-full bg-muted/50 flex items-center justify-center text-muted-foreground/40 text-sm">
              Loading lesson...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !lesson) return <Navigate to="/learn" replace />;

  const lessonIndex = lessons.findIndex((item) => item._id === lessonId);
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex >= 0 && lessonIndex < lessons.length - 1
      ? lessons[lessonIndex + 1]
      : null;

  const videoUrl = getYouTubeEmbedUrl(lesson.videoUrl);
  const isYouTube =
    lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be");

  const addProductToCart = (item: MaterialItem) => {
    if (item.type === "kit" && item.kitData) {
      if (!isAuthenticated) {
        navigate("/auth/login");
        return;
      }
      const kitProducts = (item.kitData.products || []).map((kitProduct) => {
        const product = kitProduct.productId;
        const variant = product?.variants?.[0];
        return {
          productId: product._id,
          variantId: kitProduct.variantId,
          name: product.name,
          image: variant?.image || product.image,
          price: variant?.price || 0,
        };
      });
      addKitToCart({
        kitId: item.kitData._id,
        name: item.kitData.name,
        thumbnail: item.kitData.thumbnail,
        price: item.kitData.price,
        products: kitProducts,
      });
      toast.success(`Added "${item.kitData.name}" to cart`);
      return;
    }

    // For products, use API product data if available, otherwise mock
    if (item.type === "product" && item.productData) {
      const variant = item.productData.variants[0];
      addToCart({
        productId: item.productData._id,
        variantId: variant?._idVariants || "default",
        name: item.productData.name,
        image: variant?.image || item.productData.image,
        color: variant?.color || "",
        hexCode: variant?.hexCode || "#ccc",
        price: variant?.price || 0,
        stock: variant?.stock || 999,
      });
      toast.success(`${item.productData.name} added to cart`);
      return;
    }

    const product = products.find((p) => p.id === item.id);
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
    materials.forEach((item) => {
      if (item.type === "kit" && item.kitData) {
        const kitProducts = (item.kitData.products || []).map((kitProduct) => {
          const product = kitProduct.productId;
          const variant = product?.variants?.[0];
          return {
            productId: product._id,
            variantId: kitProduct.variantId,
            name: product.name,
            image: variant?.image || product.image,
            price: variant?.price || 0,
          };
        });
        addKitToCart({
          kitId: item.kitData._id,
          name: item.kitData.name,
          thumbnail: item.kitData.thumbnail,
          price: item.kitData.price,
          products: kitProducts,
        });
        return;
      }

      // For products, use API product data if available
      if (item.type === "product" && item.productData) {
        const variant = item.productData.variants[0];
        addToCart({
          productId: item.productData._id,
          variantId: variant?._idVariants || "default",
          name: item.productData.name,
          image: variant?.image || item.productData.image,
          color: variant?.color || "",
          hexCode: variant?.hexCode || "#ccc",
          price: variant?.price || 0,
          stock: variant?.stock || 999,
        });
        return;
      }

      const product = products.find((p) => p.id === item.id);
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
    <div className="min-h-screen bg-background px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-2 px-0">
              <Link to={`/learn/${course._id}`}>
                <ArrowLeft className="size-4" /> Back to course
              </Link>
            </Button>
            <Badge variant="secondary" className="mb-3">
              Lesson {lesson.order} of {lessons.length}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{course.title}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> {lesson.duration} min
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <main className="space-y-5">
            <div className="w-full overflow-hidden rounded-2xl border bg-black shadow-sm">
              {isYouTube ? (
                <div
                  ref={ytContainerRef}
                  className="aspect-video w-full"
                />
              ) : (
                <video
                  ref={videoElementRef}
                  src={videoUrl ?? lesson.videoUrl}
                  controls
                  className="aspect-video w-full"
                  onEnded={() => persistLessonComplete()}
                />
              )}
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Progress</h2>
                    <p className="text-sm text-muted-foreground">
                      {progress?.completed
                        ? "Completed"
                        : `${Math.floor(progress?.watchedSeconds ?? watchedSeconds)} seconds watched`}
                    </p>
                  </div>
                  {progress?.completed && (
                    <CheckCircle2 className="size-6 text-[var(--success-text)]" />
                  )}
                </div>
                <Progress
                  value={
                    progress?.completed
                      ? 100
                      : Math.min(
                          ((progress?.watchedSeconds ?? watchedSeconds) /
                            (lesson.duration * 60)) *
                            100,
                          100,
                        )
                  }
                />
              </CardContent>
            </Card>

            {courseProgress && (
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">Course progress</h2>
                      <p className="text-sm text-muted-foreground">
                        {courseProgress.completedLessons.length}/
                        {lessons.length} lessons completed
                      </p>
                    </div>
                    {courseProgress.isCompleted && (
                      <Badge variant="success">
                        <Award className="size-3.5" /> Certificate
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={
                      (courseProgress.completedLessons.length /
                        Math.max(1, lessons.length)) *
                      100
                    }
                  />
                  {courseProgress.isCompleted && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-[var(--success-text)]" />
                      Course completed — claim your certificate anytime.
                    </p>
                  )}
                  {courseProgress.hasNewContent && (
                    <div
                      className="rounded-lg border p-3 text-sm"
                      style={{
                        borderColor: "var(--warning-border)",
                        background: "var(--warning-bg)",
                        color: "var(--warning-text)",
                      }}
                    >
                      🎁 This course just got a new lesson — jump back in to
                      see what's new!
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap justify-between gap-3">
              <Button asChild variant="outline" disabled={!previousLesson}>
                <Link
                  to={
                    previousLesson
                      ? `/learn/${course._id}/lesson/${previousLesson._id}`
                      : "#"
                  }
                >
                  <ArrowLeft className="size-4" /> Previous lesson
                </Link>
              </Button>
              <Button asChild disabled={!nextLesson}>
                <Link
                  to={
                    nextLesson
                      ? `/learn/${course._id}/lesson/${nextLesson._id}`
                      : `/learn/${course._id}`
                  }
                >
                  Next lesson <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </main>

          <aside
            style={{
              borderRadius: "20px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-card)",
              padding: "22px",
            }}
            className="lg:sticky lg:top-24 lg:h-fit"
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    letterSpacing: "-0.015em",
                    margin: "0 0 4px",
                  }}
                >
                  Materials in this lesson
                </h2>
                <p
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "0.85rem",
                    color: "var(--foreground-muted)",
                    margin: 0,
                  }}
                >
                  Products and combos tagged in this lesson.
                </p>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  minWidth: "26px",
                  height: "26px",
                  padding: "0 8px",
                  borderRadius: "999px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--foreground-muted)",
                }}
              >
                {materials.length}
              </span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {materials.map((item) => {
                const to =
                  item.type === "kit"
                    ? `/kits/${item.id}`
                    : `/shop/product/${item.id}`;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      padding: "12px",
                      borderRadius: "16px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    <Link to={to} style={{ flexShrink: 0 }}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "12px",
                            background: "var(--accent-pink)",
                            border: "1px solid var(--border)",
                          }}
                        />
                      )}
                    </Link>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 8px",
                          marginBottom: "4px",
                          borderRadius: "999px",
                          border: "1px solid var(--border)",
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color:
                            item.type === "kit"
                              ? "var(--primary)"
                              : "var(--foreground-muted)",
                          background:
                            item.type === "kit"
                              ? "var(--accent-pink)"
                              : "var(--surface)",
                        }}
                      >
                        {item.type === "kit" ? "Combo" : "Product"}
                      </span>
                      <Link to={to} style={{ textDecoration: "none" }}>
                        <h3
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            lineHeight: 1.3,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                            overflow: "hidden",
                          }}
                        >
                          {item.name}
                        </h3>
                      </Link>
                      <p
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                          margin: "4px 0 0",
                        }}
                      >
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => addProductToCart(item)}
                      style={{
                        flexShrink: 0,
                        padding: "7px 14px",
                        borderRadius: "999px",
                        border: "1.5px solid var(--primary)",
                        background: "var(--background)",
                        color: "var(--primary)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                );
              })}
              {materials.length === 0 && (
                <p
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    fontFamily: "'Caveat', cursive",
                    fontSize: "0.9rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  No materials tagged in this lesson yet.
                </p>
              )}
            </div>

            {materials.length > 0 && (
              <button
                onClick={addAllToCart}
                style={{
                  width: "100%",
                  marginTop: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "13px",
                  borderRadius: "999px",
                  border: "none",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(107,63,160,0.28)",
                }}
              >
                <ShoppingCart className="size-4" /> Add all to cart
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
