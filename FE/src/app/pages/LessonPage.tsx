import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { courseService } from "../../api/courseService";
import { lessonService } from "../../api/lessonService";
import { kitService, type Kit } from "../../api/kitService";
import { productService, type Product } from "../../api/productService";
import { materialCombos } from "../../features/learn/data/learn.mock";
import { useLearnStore as useFeatureLearnStore } from "../../features/learn/store/learn.store";
import { useLearnStore } from "../../store/learn.store";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { products } from "../data/products";
import type { Course, Lesson, MaterialCombo } from "../../features/learn/types/learn.types";

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const matchStandard = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
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
  const { isAuthenticated } = useAuth();
  const { addToCart, addKitToCart } = useCart();
  const { courseId, lessonId } = useParams();
  const videoRef = useRef<HTMLIFrameElement | null>(null);
  const setFeatureCurrentLesson = useFeatureLearnStore((state) => state.setCurrentLesson);
  const updateProgress = useFeatureLearnStore((state) => state.updateProgress);
  const markFeatureLessonComplete = useFeatureLearnStore((state) => state.markLessonComplete);
  const progress = useFeatureLearnStore((state) => (lessonId ? state.progress[lessonId] : undefined));
  const setCurrentLesson = useLearnStore((state) => state.setCurrentLesson);
  const markLessonComplete = useLearnStore((state) => state.markLessonComplete);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            lessonService.getById(id).then((res) => res.data.data.lesson).catch(() => null)
          );
          const fetchedLessons = (await Promise.all(lessonPromises)).filter((l): l is Lesson => l !== null);
          populatedLessons.push(...fetchedLessons);
        }

        const courseLessons = populatedLessons.sort((a, b) => a.order - b.order);
        setLessons(courseLessons);

        // Find current lesson
        const foundLesson = courseLessons.find((l) => l._id === lessonId) ?? null;
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
    if (courseId && lessonId) {
      setFeatureCurrentLesson(lessonId);
      setCurrentLesson(courseId, lessonId);
    }
  }, [courseId, lessonId, setFeatureCurrentLesson, setCurrentLesson]);

  // Simulate watching progress for YouTube embeds
  useEffect(() => {
    if (!lesson || !lesson.videoUrl) return;
    const isYouTube = lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be");
    if (!isYouTube) return;

    watchIntervalRef.current = setInterval(() => {
      setWatchedSeconds((prev) => {
        const next = prev + 1;
        updateProgress(lessonId!, next);
        return next;
      });
    }, 1000);

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, [lesson?.videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch linked combos from API for the lesson (when lesson is set)
  useEffect(() => {
    if (!lesson?.linkedCombo || lesson.linkedCombo.length === 0) return;
    
    const fetchKits = async () => {
      const comboIds: string[] = lesson.linkedCombo!.map((ref) => extractId(ref)).filter((id): id is string => id !== null);

      if (comboIds.length > 0) {
        const kitPromises = comboIds.map((id) =>
          kitService.getById(id).then((res) => res.data.data?.kit).catch(() => null)
        );
        const fetchedKits = (await Promise.all(kitPromises)).filter((k): k is Kit => k !== null);
        
        // If API returned no kits, try to find from mock data
        if (fetchedKits.length === 0) {
          const mockKits = comboIds
            .map((id) => materialCombos.find((c) => c.id === id))
            .filter((c): c is MaterialCombo => c !== undefined)
            .map((c) => ({
              _id: c.id,
              name: c.name,
              description: c.description,
              thumbnail: c.thumbnail,
              level: c.level,
              price: c.price,
              productIds: c.productIds.map((pid) => {
                const product = products.find((p) => p.id === pid);
                return {
                  _id: pid,
                  name: product?.name ?? pid,
                  description: product?.description ?? "",
                  category: product?.category ?? "",
                  image: product?.image ?? "",
                  tags: product?.tags ?? [],
                  variants: product?.variants?.map((v) => ({
                    _id: v.id,
                    color: v.color,
                    hexCode: v.hexCode,
                    price: v.price,
                    stock: v.stock,
                    image: v.images?.[0] ?? "",
                  })) ?? [{ _id: "default", color: "", hexCode: "#ccc", price: 0, stock: 0, image: "" }],
                  isActive: true,
                  createdAt: product?.createdAt ?? "",
                  updatedAt: product?.createdAt ?? "",
                  __v: 0,
                };
              }),
              isActive: true,
              createdAt: "",
              updatedAt: "",
              __v: 0,
            } as Kit));
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
      const productIds: string[] = lesson.linkedProduct!.map((lp) => extractId(lp)).filter((id): id is string => id !== null);

      if (productIds.length > 0) {
        const productPromises = productIds.map((id) =>
          productService.getById(id).then((res) => res.data.data?.product).catch(() => null)
        );
        const fetchedProducts = (await Promise.all(productPromises)).filter((p): p is Product => p !== null);
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
  }, [lesson?.linkedProduct, lesson?.linkedCombo, kits, apiProducts]);

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
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const videoUrl = getYouTubeEmbedUrl(lesson.videoUrl);
  const isYouTube = lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be");

  const addProductToCart = (item: MaterialItem) => {
    if (item.type === "kit" && item.kitData) {
      if (!isAuthenticated) { navigate("/auth/login"); return; }
      const kitProducts = item.kitData.productIds.map((product) => {
        const variant = product.variants[0];
        return {
          productId: product._id,
          variantId: variant?._id || "",
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
        const kitProducts = item.kitData.productIds.map((product) => {
          const variant = product.variants[0];
          return {
            productId: product._id,
            variantId: variant?._id || "",
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
              <Link to={`/learn/${course._id}`}><ArrowLeft className="size-4" /> Back to course</Link>
            </Button>
            <Badge variant="secondary" className="mb-3">Lesson {lesson.order} of {lessons.length}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{lesson.title}</h1>
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
                <iframe
                  ref={videoRef}
                  src={videoUrl ?? ""}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef as unknown as React.RefObject<HTMLVideoElement>}
                  src={videoUrl ?? lesson.videoUrl}
                  controls
                  className="aspect-video w-full"
                  onEnded={() => {
                    markFeatureLessonComplete(lesson._id);
                    markLessonComplete(course._id, lesson._id);
                  }}
                />
              )}
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Progress</h2>
                    <p className="text-sm text-muted-foreground">
                      {progress?.completed ? "Completed" : `${Math.floor(progress?.watchedSeconds ?? watchedSeconds)} seconds watched`}
                    </p>
                  </div>
                  {progress?.completed && <CheckCircle2 className="size-6 text-green-600" />}
                </div>
                <Progress
                  value={
                    progress?.completed
                      ? 100
                      : Math.min(((progress?.watchedSeconds ?? watchedSeconds) / (lesson.duration * 60)) * 100, 100)
                  }
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-between gap-3">
              <Button asChild variant="outline" disabled={!previousLesson}>
                <Link to={previousLesson ? `/learn/${course._id}/lesson/${previousLesson._id}` : "#"}>
                  <ArrowLeft className="size-4" /> Previous lesson
                </Link>
              </Button>
              <Button asChild disabled={!nextLesson}>
                <Link to={nextLesson ? `/learn/${course._id}/lesson/${nextLesson._id}` : `/learn/${course._id}`}>
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "18px" }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {materials.map((item) => {
                const to = item.type === "kit" ? `/kits/${item.id}` : `/shop/product/${item.id}`;
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
                          color: item.type === "kit" ? "var(--primary)" : "var(--foreground-muted)",
                          background: item.type === "kit" ? "var(--accent-pink)" : "var(--surface)",
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