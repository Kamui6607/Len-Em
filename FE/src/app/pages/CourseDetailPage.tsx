import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { BookOpen, Clock, Play, Star, Users, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { courseService } from "../../api/courseService";
import { lessonService } from "../../api/lessonService";
import { kitService, type Kit } from "../../api/kitService";
import { productService, type Product } from "../../api/productService";
import { materialCombos } from "../../features/learn/data/learn.mock";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import type { Course, CourseLevel, Lesson } from "../../features/learn/types/learn.types";
import { cn } from "../components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const levelStyles: Record<CourseLevel, string> = {
  beginner: "border-green-200 bg-green-100 text-green-700",
  intermediate: "border-yellow-200 bg-yellow-100 text-yellow-800",
  advanced: "border-red-200 bg-red-100 text-red-700",
};

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

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, setUser } = useAuth();
  const { addKitToCart, addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Get enrolled courses from user profile
  const enrolledCourses = user?.enrolled || [];

  // Check if current course is enrolled
  const isEnrolled = courseId ? enrolledCourses.includes(courseId) : false;

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseRes = await courseService.getById(courseId);
        const courseData = courseRes.data.data.course;
        setCourse(courseData);

        // linkedLessons from API may be:
        // 1. Populated lesson objects (full data) — use directly
        // 2. String IDs — fetch individually
        const rawLessons = courseData.linkedLessons || [];
        const populatedLessons: Lesson[] = [];
        const lessonIdsToFetch: string[] = [];

        for (const item of rawLessons) {
          if (!item) continue;

          // Case 1: It's a populated lesson object (has title/videoUrl)
          if (typeof item === "object") {
            const obj = item as Record<string, unknown>;
            if (obj.title && typeof obj.title === "string") {
              populatedLessons.push(item as unknown as Lesson);
              continue;
            }
            // Try to extract _id from object
            const rawId = obj._id || obj.id;
            if (typeof rawId === "string" && rawId.length > 0) {
              lessonIdsToFetch.push(rawId);
            }
            continue;
          }

          // Case 2: It's a string ID
          if (typeof item === "string" && item.length > 0) {
            lessonIdsToFetch.push(item);
          }
        }

        // Fetch any remaining lesson IDs
        if (lessonIdsToFetch.length > 0) {
          const lessonPromises = lessonIdsToFetch.map((id) =>
            lessonService.getById(id).then((res) => res.data.data.lesson).catch(() => null)
          );
          const fetchedLessons = (await Promise.all(lessonPromises)).filter((l): l is Lesson => l !== null);
          populatedLessons.push(...fetchedLessons);
        }

        const courseLessons = populatedLessons.sort((a, b) => a.order - b.order);
        setLessons(courseLessons);

        // Fetch linked combos from API using kitService.getById for each comboId
        const comboRefs = courseData.linkedCombo || [];
        const comboIds: string[] = comboRefs.map((ref) => extractId(ref)).filter((id): id is string => id !== null);
        // Also check for kitId field in case API uses different naming
        const kitIdsFromRefs: string[] = comboRefs.map((ref) => {
          if (typeof ref === "object" && ref !== null) {
            const obj = ref as Record<string, unknown>;
            if (typeof obj.kitId === "string") return obj.kitId;
          }
          return null;
        }).filter((id): id is string => id !== null);
        // Merge comboIds and kitIds, removing duplicates
        const allComboIds = [...new Set([...comboIds, ...kitIdsFromRefs])];

        // Fetch each kit by ID
        if (allComboIds.length > 0) {
          try {
            const kitPromises = allComboIds.map((id) =>
              kitService.getById(id).then((res) => res.data.data?.kit).catch(() => null)
            );
            const fetchedKits = (await Promise.all(kitPromises)).filter((k): k is Kit => k !== null);
            setKits(fetchedKits);
          } catch {
            // Fallback to mock data
            const mockKits = materialCombos
              .filter((c) => allComboIds.includes(c.id))
              .map((c) => ({
                _id: c.id,
                name: c.name,
                description: c.description,
                thumbnail: c.thumbnail,
                level: c.level,
                price: c.price,
                productIds: c.productIds.map((pid) => ({
                  _id: pid,
                  name: pid,
                  description: "",
                  category: "",
                  image: "",
                  tags: [],
                  variants: [{ _id: "default", color: "", hexCode: "#ccc", price: 0, stock: 0, image: "" }],
                  isActive: true,
                  createdAt: "",
                  updatedAt: "",
                  __v: 0,
                })),
                isActive: true,
                createdAt: "",
                updatedAt: "",
                __v: 0,
              } as Kit));
            setKits(mockKits);
          }
        }

        // Fetch linked products from lessons' linkedProduct
        const productIdsFromLessons = new Set<string>();
        for (const lesson of courseLessons) {
          if (lesson.linkedProduct) {
            for (const lp of lesson.linkedProduct) {
              const extractedId = extractId(lp);
              if (extractedId) {
                productIdsFromLessons.add(extractedId);
              }
            }
          }
        }

        if (productIdsFromLessons.size > 0) {
          try {
            const productPromises = Array.from(productIdsFromLessons).map((id) =>
              productService.getById(id).then((res) => res.data.data?.product).catch(() => null)
            );
            const fetchedProducts = (await Promise.all(productPromises)).filter((p): p is Product => p !== null);
            setProducts(fetchedProducts);
          } catch {
            // Silently fail - products are optional
          }
        }
      } catch {
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      setScrolledToBottom(scrollHeight - scrollTop - clientHeight < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEnrollAndStart = useCallback(async (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
      return;
    }

    if (isEnrolled || !courseId) {
      // Already enrolled — just navigate to first lesson
      const fl = lessons[0];
      if (fl) {
        navigate(`/learn/${courseId}/lesson/${fl._id}`);
      }
      return;
    }

    event.preventDefault();
    try {
      setEnrolling(true);
      const res = await courseService.enroll(courseId);
      const { enrolledCount } = res.data.data;

      // Update course enrolledCount
      if (course) {
        setCourse({ ...course, enrolledCount });
      }

      // Update user's enrolled array in auth store
      if (user) {
        setUser({
          ...user,
          enrolled: [...enrolledCourses, courseId],
        });
      }

      toast.success("Enrolled successfully!");
      const fl = lessons[0];
      if (fl) {
        navigate(`/learn/${courseId}/lesson/${fl._id}`);
      }
    } catch (error) {
      // Check if already enrolled from error response
      const err = error as { response?: { data?: { message?: string } } };
      if (err?.response?.data?.message === "Already enrolled") {
        // Still navigate to course to sync with backend
        const fl = lessons[0];
        if (fl) {
          navigate(`/learn/${courseId}/lesson/${fl._id}`);
        }
      } else {
        toast.error("Failed to enroll");
      }
    } finally {
      setEnrolling(false);
    }
  }, [isAuthenticated, isEnrolled, courseId, navigate, lessons, course, user, enrolledCourses, setUser]);

  // Get unique products from lessons (for display)
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [products]);

  if (loading) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
      <style>{`
        .learn-start-btn {
          background: var(--accent-blush);
          color: var(--foreground);
          border: 2px solid var(--primary);
          box-shadow: 0 4px 16px var(--glow-pink);
        }
        .learn-start-btn:hover:not(:disabled) {
          background: var(--accent-pink);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(240,196,224,0.45);
        }
        .learn-start-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dark .learn-start-btn {
          background: var(--primary);
          color: var(--primary-foreground);
          border-color: var(--primary);
          box-shadow: 0 4px 16px rgba(155,111,214,0.3);
        }
        .dark .learn-start-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          box-shadow: 0 8px 24px rgba(155,111,214,0.45);
        }
      `}</style>
      <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <main className="space-y-8">
              <section className="overflow-hidden rounded-3xl border bg-card">
                <div className="relative aspect-[16/9] md:h-96 bg-muted/60" />
                <div className="space-y-6 p-6 md:p-8">
                  <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-5">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-16 w-full rounded-lg bg-muted/60 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="h-6 w-16 rounded-full bg-muted/60 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-12 w-36 rounded-full bg-muted/60 animate-pulse" />
                </div>
              </section>
              <section className="rounded-2xl border bg-card p-6">
                <div className="h-6 w-24 rounded bg-muted/60 animate-pulse mb-4" />
                {[1,2,3].map((i) => (
                  <div key={i} className="h-12 w-full rounded-lg bg-muted/60 animate-pulse mb-3" />
                ))}
              </section>
            </main>
            <aside className="space-y-6">
              <div className="h-6 w-40 rounded bg-muted/60 animate-pulse mb-4" />
              <div className="h-64 w-full rounded-2xl bg-muted/60 animate-pulse" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return <Navigate to="/learn" replace />;

  const firstLesson = lessons[0];

  const handleStartLearning = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  const handleAddKitToCart = (kit: Kit) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const kitProducts = kit.productIds.map((product) => {
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
      kitId: kit._id,
      name: kit.name,
      thumbnail: kit.thumbnail,
      price: kit.price,
      products: kitProducts,
    });
    toast.success(`Added "${kit.name}" to cart`);
  };

  const handleAddProductToCart = (product: Product) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const variant = product.variants[0];
    addToCart({
      productId: product._id,
      variantId: variant?._idVariants || "default",
      name: product.name,
      image: variant?.image || product.image,
      color: variant?.color || "",
      hexCode: variant?.hexCode || "#ccc",
      price: variant?.price || 0,
      stock: variant?.stock || 999,
    });
    toast.success(`Added "${product.name}" to cart`);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <main className="space-y-8">
            <section className="overflow-hidden rounded-3xl border bg-card">
              <div className="relative w-full bg-muted">
                <img src={course.thumbnail} alt={course.title} className="w-full object-fill" style={{ minHeight: "240px", maxHeight: "400px" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className={cn("mb-4 border", levelStyles[course.level])}>{levelLabels[course.level]}</Badge>
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">{course.title}</h1>
                </div>
              </div>
              <div className="space-y-6 p-6 md:p-8">
                <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-5">
                  <Stat icon={Users} label={`${course.enrolledCount.toLocaleString()} enrolled`} />
                  <Stat icon={Star} label={`${course.rating} rating`} className="text-yellow-500" />
                  <Stat icon={Clock} label={`${course.totalDuration} min`} />
                  <Stat icon={BookOpen} label={`${course.totalLessons} lessons`} />
                </div>

                <p className="text-muted-foreground md:text-lg">{course.description}</p>

                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="outline">#{tag}</Badge>
                  ))}
                </div>

                {firstLesson && (
                  <button
                    type="button"
                    disabled={enrolling}
                    onClick={(e) => handleEnrollAndStart(e)}
                    className="learn-start-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: "var(--accent-blush)",
                      color: "var(--foreground)",
                      border: "2px solid var(--primary)",
                      boxShadow: "0 4px 16px var(--glow-pink)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-pink)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(240,196,224,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--accent-blush)";
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow = "0 4px 16px var(--glow-pink)";
                    }}
                  >
                    <Play className="size-4" />
                    {enrolling ? "Enrolling..." : isEnrolled ? "Start" : "Bắt đầu học"}
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 mb-20 md:mb-0">
              <h2 className="mb-4 text-2xl font-semibold">Lessons</h2>
              <Accordion type="single" collapsible defaultValue={lessons[0]?._id}>
                {lessons.map((lesson) => (
                  <AccordionItem key={lesson._id} value={lesson._id}>
                    <AccordionTrigger>
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <span>{lesson.order}. {lesson.title}</span>
                        <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
                        <span>{lesson.linkedProduct?.length ?? 0} tagged material suggestions in this lesson.</span>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/learn/${course._id}/lesson/${lesson._id}`} onClick={handleStartLearning}>Watch lesson</Link>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {/* ── Suggested Material Combos (Kits) ── */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    letterSpacing: "-0.015em",
                    margin: 0,
                  }}
                >
                  Suggested material combo
                </h2>
                {kits.length > 0 && (
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: "0.85rem",
                      color: "var(--primary)",
                    }}
                  >
                    {kits.length} combo{kits.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {kits.length === 0 && (
                <p
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "0.9rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  No material combos linked to this course.
                </p>
              )}

              <div className="space-y-4">
                {kits.map((kit) => (
                  <div
                    key={kit._id}
                    style={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <Link to={`/kits/${kit._id}`} style={{ display: "block" }}>
                      <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", background: "var(--background)" }}>
                        <img
                          src={kit.thumbnail}
                          alt={kit.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: "var(--bg-overlay-90)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid var(--border)",
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--primary)",
                          }}
                        >
                          {kit.level}
                        </div>
                      </div>
                    </Link>

                    <div style={{ padding: "18px 20px 20px" }}>
                      <Link to={`/kits/${kit._id}`} style={{ textDecoration: "none" }}>
                        <h3
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.25,
                            margin: "0 0 6px",
                          }}
                        >
                          {kit.name}
                        </h3>
                      </Link>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.8rem",
                          color: "var(--foreground-muted)",
                          lineHeight: 1.5,
                          margin: "0 0 16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }}
                      >
                        {kit.description}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: "14px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--foreground-muted)",
                          }}
                        >
                          Total
                        </span>
                        <span
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--primary)",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {formatPrice(kit.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddKitToCart(kit)}
                        className="add-to-cart-btn"
                      >
                        <div className="btn-text">
                          <ShoppingCart className="size-4" />
                          Add to cart
                        </div>
                        <div className="btn-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Linked Products ── */}
            {uniqueProducts.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.15rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      letterSpacing: "-0.015em",
                      margin: 0,
                    }}
                  >
                    Suggested materials
                  </h2>
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: "0.85rem",
                      color: "var(--primary)",
                    }}
                  >
                    {uniqueProducts.length} item{uniqueProducts.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {uniqueProducts.map((product) => (
                    <div
                      key={product._id}
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        padding: "12px",
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <Link to={`/shop/product/${product._id}`} style={{ flexShrink: 0 }}>
                        <img
                          src={product.image || product.variants[0]?.image}
                          alt={product.name}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                            display: "block",
                          }}
                        />
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/shop/product/${product._id}`} style={{ textDecoration: "none" }}>
                          <h3
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              color: "var(--foreground)",
                              lineHeight: 1.2,
                              margin: "0 0 3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.name}
                          </h3>
                        </Link>
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.72rem",
                            color: "var(--foreground-muted)",
                            margin: "0 0 6px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {product.description}
                        </p>
                        <span
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: "var(--primary)",
                          }}
                        >
                          {formatPrice(product.variants[0]?.price || 0)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddProductToCart(product)}
                        className="add-to-cart-btn"
                        aria-label={`Add ${product.name} to cart`}
                        style={{
                          flexShrink: 0,
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                        }}
                      >
                        <div className="btn-text">
                          <ShoppingCart className="size-4" />
                        </div>
                        <div className="btn-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!scrolledToBottom && (
        <div className="fixed bottom-[56px] left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-lg px-4 py-3 md:hidden safe-area-bottom">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{course.totalLessons} lessons</p>
              <p className="text-lg font-bold text-primary">{course.level}</p>
            </div>
            {firstLesson && (
              <Link
                to={isEnrolled ? `/learn/${course._id}/lesson/${firstLesson._id}` : "#"}
                onClick={handleEnrollAndStart}
                className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-full font-semibold text-sm text-center"
              >
                {enrolling ? "Enrolling..." : isEnrolled ? "Start →" : "Bắt đầu học →"}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, className }: { icon: React.ElementType; label: string; className?: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className={cn("size-4", className)} /> {label}
    </span>
  );
}