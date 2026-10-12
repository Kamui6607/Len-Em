// ============================================================
// Lesson Page — route /learn/:courseId/lesson/:lessonId
// Video · tiến độ bài · chuyển bài trước/sau · cột phải gồm danh sách
// bài của khoá học (đã học / đang học / khoá) và nguyên liệu của bài.
// - Chỉ xem được khi: bài xem thử, đã đăng ký khoá học, hoặc Admin/Staff.
// - Thời gian xem YouTube chỉ được cộng khi video ĐANG PHÁT (trước đây
//   cộng mỗi giây kể cả khi dừng → để tab mở là tự "hoàn thành" bài).
// - Không tải được YouTube IFrame API → dùng iframe nhúng thường và cho
//   phép tự đánh dấu đã học.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Gift,
  Lock,
  Package,
  Play,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { courseService } from "../../shared/api/courseService";
import { lessonService } from "../../shared/api/lessonService";
import { kitService, type Kit } from "../../shared/api/kitService";
import { productService, type Product } from "../../shared/api/productService";
import { materialCombos } from "../../features/learn/data/learn.mock";
import { useLearnStore } from "../../features/learn/store/learn.store";
import { canWatchLesson } from "../../features/learn/utils/lessonAccess";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../shared/hooks/useAuth";
import { useCart } from "../../shared/contexts/CartContext";
import { cn } from "../../shared/components/ui/utils";
import { products } from "../data/products";
import { YarnBallIcon } from "../../features/shop/shopMeta";
import type {
  Course,
  CourseProgress,
  Lesson,
  MaterialCombo,
} from "../../features/learn/types/learn.types";
import "../../styles/craft.css";
import "../../styles/course.css";

/** Tỉ lệ đã xem tối thiểu để được tự đánh dấu "đã học xong". */
const MANUAL_COMPLETE_RATIO = 0.8;
/** Hết thời gian này mà YouTube IFrame API chưa sẵn sàng → dùng iframe thường. */
const YT_LOAD_TIMEOUT_MS = 8000;

/** Extract YouTube video ID from various YouTube URL formats. */
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Extract ID from various reference formats.
 * Handles: string ID, { comboId }, { kitId }, { productId }, { _id }, { id }, or populated objects.
 */
function extractId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    const obj = ref as Record<string, unknown>;
    const id = obj.comboId || obj.kitId || obj.productId || obj._id || obj.id;
    if (typeof id === "string" && id.length > 0) return id;
    if (obj._id && typeof obj._id === "string") return obj._id;
    if (obj.id && typeof obj.id === "string") return obj.id;
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

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LessonPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, addKitToCart } = useCart();
  const { courseId, lessonId } = useParams();
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<{ destroy: () => void } | null>(null);
  const ytPlayingRef = useRef(false);
  const completeInFlightRef = useRef<string | null>(null);

  const progress = useLearnStore((state) => (lessonId ? state.videoProgress[lessonId] : undefined));
  const markLessonComplete = useLearnStore((state) => state.markLessonComplete);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [ytFailed, setYtFailed] = useState(false);

  const isEnrolled = Boolean(courseId && (user?.enrolled ?? []).includes(courseId));

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
            if (typeof rawId === "string" && rawId.length > 0) lessonIdsToFetch.push(rawId);
            continue;
          }
          if (typeof item === "string" && item.length > 0) lessonIdsToFetch.push(item);
        }
        if (lessonIdsToFetch.length > 0) {
          const fetchedLessons = (
            await Promise.all(
              lessonIdsToFetch.map((id) =>
                lessonService
                  .getById(id)
                  .then((res) => res.data.data.lesson)
                  .catch(() => null),
              ),
            )
          ).filter((l): l is Lesson => l !== null);
          populatedLessons.push(...fetchedLessons);
        }
        const courseLessons = populatedLessons.sort((a, b) => a.order - b.order);
        setLessons(courseLessons);

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
        toast.error("Không tải được bài học");
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
    useLearnStore.getState().setCurrentLesson(courseId, lessonId);
    setYtFailed(false);
    ytPlayingRef.current = false;
  }, [courseId, lessonId]);

  // ── Server-side course progress ──
  // Fetch persisted progress on mount (instead of relying only on the offline
  // Zustand store) and sync completed lesson IDs back into the local store.
  useEffect(() => {
    if (!courseId || !isAuthenticated) {
      setCourseProgress(null);
      return;
    }
    let active = true;
    courseService
      .getProgress(courseId)
      .then((res) => {
        if (!active) return;
        const data = res.data.data;
        setCourseProgress(data);
        (data.completedLessons ?? []).forEach((id) => {
          useLearnStore.getState().markLessonComplete(courseId, id);
        });
      })
      .catch(() => {
        if (active) setCourseProgress(null);
      });
    return () => {
      active = false;
    };
  }, [courseId, isAuthenticated]);

  const canWatch = lesson ? canWatchLesson({ lesson, isEnrolled, role: user?.roleId }) : false;

  // ── Persist lesson completion to the server ──
  // Shared by every completion path (native onEnded, YouTube ENDED, the
  // "đánh dấu đã học" button). Only enrolled learners have server progress.
  const persistLessonComplete = useCallback(() => {
    if (!course || !lesson) return;
    if (completeInFlightRef.current === lesson._id) return;
    completeInFlightRef.current = lesson._id;

    // Optimistic local update (existing Zustand store).
    markLessonComplete(course._id, lesson._id);

    if (!isEnrolled) {
      completeInFlightRef.current = null;
      return;
    }
    void courseService
      .completeLesson(course._id, lesson._id)
      .then((res) => setCourseProgress(res.data.data))
      .catch(() => toast.error("Không lưu được tiến độ khoá học"))
      .finally(() => {
        if (completeInFlightRef.current === lesson._id) completeInFlightRef.current = null;
      });
  }, [course, lesson, markLessonComplete, isEnrolled]);

  const isYouTube = Boolean(
    lesson?.videoUrl && (lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be")),
  );
  const youTubeId = lesson?.videoUrl ? getYouTubeVideoId(lesson.videoUrl) : null;

  // ── YouTube IFrame API: biết khi nào ĐANG PHÁT và khi nào KẾT THÚC ──
  useEffect(() => {
    if (!canWatch || !isYouTube || !youTubeId || ytFailed) return;

    let disposed = false;
    const W = window as unknown as {
      YT?: {
        Player: { new (element: HTMLElement, options: object): { destroy: () => void } };
        PlayerState: { ENDED: number; PLAYING: number };
      };
      onYouTubeIframeAPIReady?: () => void;
    };

    const buildPlayer = () => {
      if (disposed || !W.YT?.Player || !ytContainerRef.current) return;
      window.clearTimeout(timeout);
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
          videoId: youTubeId,
          width: "100%",
          playerVars: { rel: 0 },
          events: {
            onStateChange: (event: { data: number }) => {
              ytPlayingRef.current = event.data === W.YT?.PlayerState.PLAYING;
              if (event.data === W.YT?.PlayerState.ENDED) persistLessonComplete();
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
        if (!disposed) setYtFailed(true);
      }
    };

    // API không tải được (mạng chặn, adblock…) → iframe thường
    const timeout = window.setTimeout(() => {
      if (!disposed && !W.YT?.Player) setYtFailed(true);
    }, YT_LOAD_TIMEOUT_MS);

    if (W.YT?.Player) {
      buildPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      W.onYouTubeIframeAPIReady = buildPlayer;
    }

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      ytPlayingRef.current = false;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          /* ignore */
        }
        ytPlayerRef.current = null;
      }
    };
  }, [canWatch, isYouTube, youTubeId, ytFailed, persistLessonComplete]);

  // Đếm thời gian xem YouTube — CHỈ khi đang phát
  useEffect(() => {
    if (!canWatch || !isYouTube || !lessonId || ytFailed) return;
    const timer = window.setInterval(() => {
      if (!ytPlayingRef.current) return;
      const next = (useLearnStore.getState().videoProgress[lessonId]?.watchedSeconds ?? 0) + 1;
      useLearnStore.getState().updateProgress(lessonId, next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [canWatch, isYouTube, lessonId, ytFailed]);

  // Fetch linked combos for the lesson
  useEffect(() => {
    setKits([]);
    if (!lesson?.linkedCombo || lesson.linkedCombo.length === 0) return;
    const fetchKits = async () => {
      const comboIds = lesson.linkedCombo!.map((ref) => extractId(ref)).filter((id): id is string => id !== null);
      if (comboIds.length === 0) return;
      const fetchedKits = (
        await Promise.all(
          comboIds.map((id) =>
            kitService
              .getById(id)
              .then((res) => res.data.data?.kit)
              .catch(() => null),
          ),
        )
      ).filter((k): k is Kit => k !== null && k !== undefined);

      if (fetchedKits.length > 0) {
        setKits(fetchedKits);
        return;
      }
      // If API returned no kits, try to find from mock data
      setKits(
        comboIds
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
          ),
      );
    };
    fetchKits();
  }, [lesson?.linkedCombo]);

  // Fetch linked products for the lesson
  useEffect(() => {
    setApiProducts([]);
    if (!lesson?.linkedProduct || lesson.linkedProduct.length === 0) return;
    const fetchProducts = async () => {
      const productIds = lesson.linkedProduct!.map((lp) => extractId(lp)).filter((id): id is string => id !== null);
      if (productIds.length === 0) return;
      const fetchedProducts = (
        await Promise.all(
          productIds.map((id) =>
            productService
              .getById(id)
              .then((res) => res.data.data?.product)
              .catch(() => null),
          ),
        )
      ).filter((p): p is Product => p !== null && p !== undefined);
      setApiProducts(fetchedProducts);
    };
    fetchProducts();
  }, [lesson?.linkedProduct]);

  // Build materials list from lesson.linkedProduct + lesson.linkedCombo
  const materials = useMemo<MaterialItem[]>(() => {
    const items: MaterialItem[] = [];
    for (const lp of lesson?.linkedProduct ?? []) {
      const productId = extractId(lp);
      if (!productId) continue;
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
      const product = products.find((p) => p.id === productId);
      if (!product) continue; // không hiện dòng "ID lạ" khi không tìm thấy sản phẩm
      items.push({
        type: "product",
        id: productId,
        name: product.name,
        price: product.variants?.[0]?.price ?? 0,
        thumbnail: product.image ?? "",
      });
    }
    for (const kit of kits) {
      items.push({ type: "kit", id: kit._id, name: kit.name, price: kit.price, thumbnail: kit.thumbnail, kitData: kit });
    }
    return items;
  }, [lesson?.linkedProduct, kits, apiProducts]);

  const completedSet = useMemo(() => new Set(courseProgress?.completedLessons ?? []), [courseProgress]);

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-wrap">
          <div className="craft-skeleton mb-6 h-4 w-64" />
          <div className="lp-grid">
            <div className="space-y-4">
              <div className="craft-skeleton aspect-video w-full rounded-[24px]" />
              <div className="craft-skeleton h-24 rounded-2xl" />
            </div>
            <div className="craft-skeleton h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course || !lesson) return <Navigate to="/learn" replace />;

  const lessonIndex = lessons.findIndex((item) => item._id === lessonId);
  const position = lessonIndex >= 0 ? lessonIndex + 1 : lesson.order;
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const nextOpen = nextLesson ? canWatchLesson({ lesson: nextLesson, isEnrolled, role: user?.roleId }) : false;

  const lessonDone = Boolean(progress?.completed) || completedSet.has(lesson._id);
  const watched = progress?.watchedSeconds ?? 0;
  const durationSec = Math.max(lesson.duration, 1) * 60;
  const watchedRatio = lessonDone ? 1 : Math.min(watched / durationSec, 1);
  const canManualComplete = !lessonDone && (watchedRatio >= MANUAL_COMPLETE_RATIO || ytFailed);
  const courseDoneCount = lessons.filter((l) => completedSet.has(l._id)).length;
  const coursePct = lessons.length ? Math.round((courseDoneCount / lessons.length) * 100) : 0;

  const addItemToCart = (item: MaterialItem, silent = false) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (item.type === "kit" && item.kitData) {
      addKitToCart({
        kitId: item.kitData._id,
        name: item.kitData.name,
        thumbnail: item.kitData.thumbnail,
        price: item.kitData.price,
        products: (item.kitData.products || []).map((kitProduct) => {
          const product = kitProduct.productId;
          const variant = product?.variants?.[0];
          return {
            productId: product._id,
            variantId: kitProduct.variantId,
            name: product.name,
            image: variant?.image || product.image,
            price: variant?.price || 0,
          };
        }),
      });
    } else if (item.type === "product" && item.productData) {
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
    } else {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        if (!silent) toast.error("Không tìm thấy sản phẩm");
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
    }
    if (!silent) toast.success(`Đã thêm "${item.name}" vào giỏ`);
  };

  const addAllToCart = () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    materials.forEach((item) => addItemToCart(item, true));
    toast.success("Đã thêm toàn bộ nguyên liệu của bài vào giỏ");
  };

  const lessonLink = (l: Lesson) => `/learn/${course._id}/lesson/${l._id}`;

  return (
    <div className="cd-page">
      <div className="cd-wrap">
        {/* ── Thanh trên ── */}
        <div className="lp-top">
          <Link to={`/learn/${course._id}`} className="lp-back">
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate">{course.title}</span>
          </Link>
          <span className="lp-position">
            Bài {position}/{lessons.length || "?"}
          </span>
        </div>

        <div className="lp-grid">
          <main className="min-w-0 space-y-6">
            {/* ── Video ── */}
            <div className="lp-player">
              {!canWatch ? (
                <div className="lp-locked">
                  <span className="lp-locked-icon">
                    <Lock className="h-6 w-6" />
                  </span>
                  <p className="lp-locked-title">Bài học này dành cho học viên của khoá</p>
                  <p className="lp-locked-desc">
                    {(course.price ?? 0) > 0
                      ? "Mua khoá học để xem toàn bộ bài giảng và lưu tiến độ."
                      : "Đăng ký khoá học (miễn phí) để xem bài này và lưu tiến độ."}
                  </p>
                  <Link to={`/learn/${course._id}`} className="craft-btn">
                    {(course.price ?? 0) > 0 ? `Mua khoá học · ${formatPrice(course.price ?? 0)}` : "Đăng ký học miễn phí"}
                  </Link>
                </div>
              ) : isYouTube && youTubeId && !ytFailed ? (
                <div ref={ytContainerRef} className="aspect-video w-full" />
              ) : isYouTube && youTubeId ? (
                <iframe
                  className="aspect-video w-full"
                  src={`https://www.youtube.com/embed/${youTubeId}?rel=0`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={lesson.videoUrl}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                  onTimeUpdate={(e) =>
                    lessonId && useLearnStore.getState().updateProgress(lessonId, Math.floor(e.currentTarget.currentTime))
                  }
                  onEnded={() => persistLessonComplete()}
                />
              )}
            </div>

            {/* ── Thông tin bài + tiến độ ── */}
            <section className="lp-info">
              <div className="min-w-0">
                <p className="lp-eyebrow">
                  Bài {position}
                  {lesson.isPreview && !isEnrolled && <span className="cd-lesson-preview ml-2">Xem thử</span>}
                </p>
                <h1 className="lp-title">{lesson.title}</h1>
                <p className="lp-meta">
                  <Clock className="h-4 w-4" /> {lesson.duration} phút
                  {materials.length > 0 && (
                    <>
                      {" "}
                      · <YarnBallIcon size={14} /> {materials.length} nguyên liệu
                    </>
                  )}
                </p>
              </div>

              {canWatch && (
                <div className={cn("lp-progress-card", lessonDone && "is-done")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {lessonDone ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--success-text)]">
                          <CheckCircle2 className="h-4 w-4" /> Đã học xong bài này
                        </span>
                      ) : ytFailed ? (
                        "Xem hết video rồi bấm đánh dấu đã học"
                      ) : (
                        <>Đã xem {formatClock(watched)} / {lesson.duration}:00</>
                      )}
                    </p>
                    {!lessonDone && (
                      <button
                        type="button"
                        className="craft-btn-ghost cd-small-btn"
                        disabled={!canManualComplete}
                        onClick={persistLessonComplete}
                        title={
                          canManualComplete
                            ? "Đánh dấu bài này là đã học"
                            : `Xem ít nhất ${Math.round(MANUAL_COMPLETE_RATIO * 100)}% video để đánh dấu`
                        }
                      >
                        <Check className="h-4 w-4" /> Đánh dấu đã học xong
                      </button>
                    )}
                  </div>
                  <div className="cd-progress mt-3">
                    <span style={{ width: `${Math.round(watchedRatio * 100)}%` }} />
                  </div>
                  {!isEnrolled && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bạn đang xem thử — đăng ký khoá học để lưu tiến độ trên mọi thiết bị.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ── Chuyển bài ── */}
            <nav className="lp-nav" aria-label="Chuyển bài">
              {previousLesson ? (
                <Link to={lessonLink(previousLesson)} className="lp-nav-card">
                  <span className="lp-nav-label">
                    <ArrowLeft className="h-4 w-4" /> Bài trước
                  </span>
                  <span className="lp-nav-title">{previousLesson.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {nextLesson ? (
                <Link
                  to={nextOpen ? lessonLink(nextLesson) : `/learn/${course._id}`}
                  className="lp-nav-card is-next"
                >
                  <span className="lp-nav-label">
                    {nextOpen ? "Bài tiếp theo" : "Đăng ký để học tiếp"} <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="lp-nav-title">
                    {!nextOpen && <Lock className="mr-1 inline h-3.5 w-3.5" />}
                    {nextLesson.title}
                  </span>
                </Link>
              ) : (
                <Link to={`/learn/${course._id}`} className="lp-nav-card is-next is-finish">
                  <span className="lp-nav-label">
                    <Award className="h-4 w-4" /> Bài cuối
                  </span>
                  <span className="lp-nav-title">
                    {courseProgress?.isCompleted ? "Bạn đã hoàn thành khoá học 🎉" : "Về trang khoá học"}
                  </span>
                </Link>
              )}
            </nav>
          </main>

          <aside className="lp-aside">
            {/* ── Danh sách bài ── */}
            <section className="lp-panel">
              <div className="lp-panel-head">
                <span className="craft-section-icon">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="lp-panel-title">Nội dung khoá học</h2>
                  <p className="lp-panel-sub">
                    {isEnrolled ? `Đã học ${courseDoneCount}/${lessons.length} bài · ${coursePct}%` : `${lessons.length} bài học`}
                  </p>
                </div>
              </div>
              {isEnrolled && (
                <div className="cd-progress mb-3">
                  <span style={{ width: `${coursePct}%` }} />
                </div>
              )}
              {courseProgress?.hasNewContent && (
                <p className="cd-notice mb-3">
                  <Gift className="h-4 w-4" /> Khoá học vừa có bài mới!
                </p>
              )}
              <ol className="lp-lessons">
                {lessons.map((l, index) => {
                  const current = l._id === lesson._id;
                  const done = completedSet.has(l._id) || (current && lessonDone);
                  const open = canWatchLesson({ lesson: l, isEnrolled, role: user?.roleId });
                  const content = (
                    <>
                      <span className={cn("cd-lesson-knot is-small", done && "is-done", current && "is-next")}>
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="lp-lesson-title">{l.title}</span>
                        <span className="lp-lesson-meta">{l.duration} phút</span>
                      </span>
                      {current ? (
                        <Play className="h-3.5 w-3.5 shrink-0 fill-current text-[var(--primary)]" />
                      ) : !open ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-subtle)]" />
                      ) : null}
                    </>
                  );
                  return (
                    <li key={l._id}>
                      {open && !current ? (
                        <Link to={lessonLink(l)} className="lp-lesson">
                          {content}
                        </Link>
                      ) : (
                        <div className={cn("lp-lesson", current && "is-current", !open && "is-locked")} aria-current={current ? "step" : undefined}>
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* ── Nguyên liệu ── */}
            <section className="lp-panel">
              <div className="lp-panel-head">
                <span className="craft-section-icon">
                  <YarnBallIcon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="lp-panel-title">Nguyên liệu trong bài</h2>
                  <p className="lp-panel-sub">Sản phẩm và combo dùng trong video</p>
                </div>
              </div>

              {materials.length === 0 ? (
                <p className="lp-empty">Bài này chưa gắn nguyên liệu.</p>
              ) : (
                <>
                  <ul className="cd-products">
                    {materials.map((item) => {
                      const to = item.type === "kit" ? `/kits/${item.id}` : `/shop/product/${item.id}`;
                      return (
                        <li key={`${item.type}-${item.id}`} className="cd-product">
                          <Link to={to} className="cd-product-thumb">
                            {item.thumbnail ? <img src={item.thumbnail} alt={item.name} /> : <Package className="h-5 w-5" />}
                          </Link>
                          <div className="min-w-0 flex-1">
                            {item.type === "kit" && <span className="cd-kit-tag is-inline">Combo</span>}
                            <Link to={to} className="cd-product-name">
                              {item.name}
                            </Link>
                            <span className="cd-product-price">{formatPrice(item.price)}</span>
                          </div>
                          <button
                            type="button"
                            className="cd-product-add"
                            onClick={() => addItemToCart(item)}
                            aria-label={`Thêm ${item.name} vào giỏ`}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {materials.length > 1 && (
                    <button type="button" className="craft-btn mt-4 w-full" onClick={addAllToCart}>
                      <ShoppingCart className="h-4 w-4" /> Thêm tất cả vào giỏ
                    </button>
                  )}
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
