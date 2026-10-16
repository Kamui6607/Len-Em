// ============================================================
// Course Detail — route /learn/:courseId
// Hero (bìa + thông tin) · Nội dung khoá học (danh sách bài, đánh dấu
// bài đã học / xem thử / khoá) · Nguyên liệu gợi ý · "vé" đăng ký bên
// phải (desktop) hoặc thanh nổi cạnh nút FAB (mobile).
// Nút chính đi theo trạng thái: đăng nhập → đăng ký miễn phí / mua
// khoá học (hiện mã QR SePay ngay tại trang) → bắt đầu / học tiếp bài
// đang dở → xem lại khi đã xong.
// ============================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Gift,
  GraduationCap,
  Leaf,
  Lock,
  PackageSearch,
  Play,
  ShoppingCart,
  Sprout,
  Star,
  TreeDeciduous,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { courseService } from "../../shared/api/courseService";
import { lessonService } from "../../shared/api/lessonService";
import { kitService, type Kit } from "../../shared/api/kitService";
import { productService, type Product } from "../../shared/api/productService";
import { orderService } from "../../features/orders/services/order.service";
import type { CreateOrderRequest } from "../../features/orders/types/order.types";
import {
  SepayQrModal,
  createSepayQr,
  useSepayPayment,
  type SepayQrInfo,
} from "../../features/orders/components/SepayQrModal";
import { materialCombos } from "../../features/learn/data/learn.mock";
import {
  COURSE_LEVEL_LABELS,
  canWatchLesson,
  getResumeLesson,
} from "../../features/learn/utils/lessonAccess";
import { useAuth } from "../../shared/hooks/useAuth";
import type {
  Course,
  CourseLevel,
  CourseProgress,
  Lesson,
} from "../../features/learn/types/learn.types";
import { cn } from "../../shared/components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";
import { YarnBallIcon } from "../../features/shop/shopMeta";
import "../../styles/craft.css";
import "../../styles/course.css";
import { useAddToCart } from "../../features/cart/useAddToCart";

const LEVEL_ICON: Record<CourseLevel, LucideIcon> = {
  beginner: Sprout,
  mid: Leaf,
  pro: TreeDeciduous,
};

/**
 * Extract ID from various reference formats.
 * Handles: string ID, { comboId }, { kitId }, { productId }, { _id }, { id }, or populated objects.
 */
function extractId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    const obj = ref as Record<string, unknown>;
    // linkedProduct.productId đã được BE populate thành object sản phẩm
    if (obj.productId && typeof obj.productId === "object") return extractId(obj.productId);
    const id = obj.comboId || obj.kitId || obj.productId || obj._id || obj.id;
    if (typeof id === "string" && id.length > 0) return id;
    if (obj._id && typeof obj._id === "string") return obj._id;
    if (obj.id && typeof obj.id === "string") return obj.id;
  }
  return null;
}

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setUser } = useAuth();
  const { addKit, addProduct } = useAddToCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [buying, setBuying] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [sepayQr, setSepayQr] = useState<SepayQrInfo | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );

  // Get enrolled / purchased courses from user profile
  const enrolledCourses = useMemo(() => user?.enrolled || [], [user]);
  const purchasedCourses = useMemo(() => user?.purchasedCourses || [], [user]);

  const isEnrolled = courseId ? enrolledCourses.includes(courseId) : false;
  const isPurchased = courseId ? purchasedCourses.includes(courseId) : false;
  // Free course when price is missing or 0
  const isFree = course ? (course.price ?? 0) === 0 : true;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fetch the user's server-side course progress so the detail page shows
  // real completion state (and the certificate when the course is finished).
  useEffect(() => {
    if (!courseId || !isAuthenticated || !isEnrolled) {
      setCourseProgress(null);
      return;
    }
    let active = true;
    courseService
      .getProgress(courseId)
      .then((res) => {
        if (active) setCourseProgress(res.data.data);
      })
      .catch(() => {
        if (active) setCourseProgress(null);
      });
    return () => {
      active = false;
    };
  }, [courseId, isAuthenticated, isEnrolled]);

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseRes = await courseService.getById(courseId);
        const courseData = courseRes.data.data.course;
        setCourse(courseData);

        // linkedLessons from API may be populated lesson objects or string IDs.
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

        // Linked combos (kits)
        const comboRefs = courseData.linkedCombo || [];
        const comboIds = comboRefs.map((ref) => extractId(ref)).filter((id): id is string => id !== null);
        const kitIdsFromRefs = comboRefs
          .map((ref) => {
            if (typeof ref === "object" && ref !== null) {
              const obj = ref as Record<string, unknown>;
              if (typeof obj.kitId === "string") return obj.kitId;
            }
            return null;
          })
          .filter((id): id is string => id !== null);
        const allComboIds = [...new Set([...comboIds, ...kitIdsFromRefs])];
        if (allComboIds.length > 0) {
          try {
            const fetchedKits = (
              await Promise.all(
                allComboIds.map((id) =>
                  kitService
                    .getById(id)
                    .then((res) => res.data.data?.kit)
                    .catch(() => null),
                ),
              )
            ).filter((k): k is Kit => k !== null && k !== undefined);
            setKits(fetchedKits);
          } catch {
            // Fallback to mock data
            setKits(
              materialCombos
                .filter((c) => allComboIds.includes(c.id))
                .map((c) => ({
                  _id: c.id,
                  name: c.name,
                  description: c.description,
                  thumbnail: c.thumbnail,
                  level: c.level,
                  price: c.price,
                  products: [],
                  stock: 0,
                  isActive: true,
                  averageRating: 0,
                  totalRatings: 0,
                  ratings: [],
                  createdAt: "",
                  updatedAt: "",
                  __v: 0,
                })) as unknown as Kit[],
            );
          }
        }

        // Linked products from the lessons
        const productIdsFromLessons = new Set<string>();
        for (const lesson of courseLessons) {
          for (const lp of lesson.linkedProduct ?? []) {
            const extractedId = extractId(lp);
            if (extractedId) productIdsFromLessons.add(extractedId);
          }
        }
        if (productIdsFromLessons.size > 0) {
          const fetchedProducts = (
            await Promise.all(
              Array.from(productIdsFromLessons).map((id) =>
                productService
                  .getById(id)
                  .then((res) => res.data.data?.product)
                  .catch(() => null),
              ),
            )
          ).filter((p): p is Product => p !== null && p !== undefined);
          setProducts(fetchedProducts);
        }
      } catch {
        toast.error("Không tải được khoá học");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  // Bài nên học tiếp — bài đầu tiên chưa hoàn thành (xong hết thì bài 1)
  const resumeLesson = useMemo(() => getResumeLesson(lessons, courseProgress), [lessons, courseProgress]);
  const completedSet = useMemo(() => new Set(courseProgress?.completedLessons ?? []), [courseProgress]);
  const completedCount = lessons.filter((lesson) => completedSet.has(lesson._id)).length;
  const allDone = lessons.length > 0 && completedCount === lessons.length;

  const goToLesson = useCallback(
    (lesson: Lesson | undefined) => {
      if (lesson && courseId) navigate(`/learn/${courseId}/lesson/${lesson._id}`);
    },
    [courseId, navigate],
  );

  const goToLogin = useCallback(() => {
    navigate("/auth/login", { state: { from: location } });
  }, [location, navigate]);

  // SePay: khi webhook xác nhận đã thanh toán → sang trang cảm ơn
  const { checking: sepayChecking, checkNow: checkSepayNow } = useSepayPayment(sepayQr, (orderId) =>
    navigate(`/order/success?orderId=${orderId}`),
  );

  /** Mua khoá học — tạo đơn số (không qua giỏ) rồi hiện mã QR SePay ngay tại trang. */
  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated || !course || !courseId) {
      goToLogin();
      return;
    }
    setBuying(true);
    try {
      const price = course.price ?? 0;
      const payload: CreateOrderRequest = {
        items: [
          {
            course: courseId,
            itemType: "Course",
            name: course.title,
            image: course.thumbnail,
            price,
            quantity: 1,
          },
        ],
        // Digital course — no physical delivery, shipping fee is 0. The address
        // is still required by the order schema, so we seed it from the profile.
        shippingAddress: {
          fullName: user?.fullName || "Course Purchase",
          phone: user?.phone || "",
          address: user?.address || "Digital course — no shipping required",
          provinceName: "",
          districtName: "",
          wardName: "",
        },
        // Khoá học bắt buộc trả trước — BE từ chối đơn COD có khoá học.
        paymentMethod: "SEPAY",
        itemsPrice: price,
        shippingFee: 0,
        totalPrice: price,
      };
      const response = await orderService.createOrder(payload);
      const orderId = response.data.order?._id;
      if (!orderId) throw new Error("Missing order id");
      // Trước đây chuyển thẳng sang /order/success mà KHÔNG có mã QR —
      // khách không có cách nào thanh toán. Giờ hiện QR như ở Checkout.
      setSepayQr(await createSepayQr(orderId));
      toast.success("Đã tạo đơn! Quét mã QR để thanh toán khoá học.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Không tạo được đơn hàng. Vui lòng thử lại.");
    } finally {
      setBuying(false);
    }
  }, [isAuthenticated, course, courseId, goToLogin, user?.fullName, user?.phone, user?.address]);

  /** Đăng ký (miễn phí hoặc đã mua) rồi vào bài học. */
  const handleEnroll = useCallback(async () => {
    if (!courseId) return;
    try {
      setEnrolling(true);
      const res = await courseService.enroll(courseId);
      const { enrolledCount } = res.data.data;
      setCourse((prev) => (prev ? { ...prev, enrolledCount } : prev));
      if (user) setUser({ ...user, enrolled: [...enrolledCourses, courseId] });
      toast.success("Đăng ký thành công — bắt đầu học thôi!");
      goToLesson(lessons[0]);
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.data?.message === "Already enrolled") {
        goToLesson(resumeLesson);
      } else if (err?.response?.status === 403) {
        toast.error("Đây là khoá học trả phí. Vui lòng mua khoá học trước.");
      } else {
        toast.error("Không đăng ký được khoá học");
      }
    } finally {
      setEnrolling(false);
    }
  }, [courseId, enrolledCourses, goToLesson, lessons, resumeLesson, setUser, user]);

  // ── Nút chính theo trạng thái ──
  const primary = (() => {
    if (lessons.length === 0) {
      return { label: "Sắp ra mắt", hint: "Khoá học đang được chuẩn bị bài giảng.", disabled: true, run: () => undefined };
    }
    if (!isAuthenticated) {
      return { label: "Đăng nhập để bắt đầu", hint: "Đăng nhập để đăng ký và lưu tiến độ.", run: goToLogin };
    }
    if (isEnrolled) {
      if (allDone) return { label: "Xem lại khoá học", hint: "Bạn đã hoàn thành khoá học 🎉", run: () => goToLesson(lessons[0]) };
      if (completedCount > 0 && resumeLesson) {
        return { label: `Học tiếp · Bài ${resumeLesson.order}`, hint: resumeLesson.title, run: () => goToLesson(resumeLesson) };
      }
      return { label: "Bắt đầu học", hint: "Bạn đã đăng ký khoá học này.", run: () => goToLesson(lessons[0]) };
    }
    if (!isFree && !isPurchased) {
      return {
        label: buying ? "Đang tạo đơn…" : `Mua khoá học · ${formatPrice(course?.price ?? 0)}`,
        hint: "Thanh toán chuyển khoản VietQR, học ngay sau khi xác nhận.",
        disabled: buying,
        run: () => void handleBuyNow(),
      };
    }
    return {
      label: enrolling ? "Đang đăng ký…" : isPurchased ? "Bắt đầu học" : "Đăng ký học miễn phí",
      hint: isPurchased ? "Bạn đã mua khoá học này." : "Miễn phí — học trọn bộ bài giảng.",
      disabled: enrolling,
      run: () => void handleEnroll(),
    };
  })();

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
      <div className="cd-page">
        <div className="cd-wrap">
          <div className="craft-skeleton mb-6 h-4 w-56" />
          <div className="craft-skeleton h-[360px] rounded-[32px]" />
          <div className="cd-grid mt-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="craft-skeleton h-16 rounded-2xl" />
              ))}
            </div>
            <div className="craft-skeleton h-72 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) return <Navigate to="/learn" replace />;

  const LevelIcon = LEVEL_ICON[course.level] ?? Sprout;
  const rating = Number(course.rating ?? 0);
  const progressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const role = user?.roleId;

  const handleLockedLesson = () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    toast.info(
      !isFree && !isPurchased
        ? "Mua khoá học để mở khoá bài này."
        : "Đăng ký khoá học (miễn phí) để xem bài này.",
    );
  };

  const handleAddKitToCart = (kit: Kit) => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    addKit({
      kitId: kit._id,
      name: kit.name,
      thumbnail: kit.thumbnail,
      price: kit.price,
      products: (kit.products || []).map((kitProduct) => {
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
  };

  const handleAddProductToCart = (product: Product) => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    const variant = product.variants[0];
    addProduct({
      productId: product._id,
      variantId: variant?._idVariants || "default",
      name: product.name,
      image: variant?.image || product.image,
      color: variant?.color || "",
      hexCode: variant?.hexCode || "#ccc",
      price: variant?.price || 0,
      stock: variant?.stock || 999,
    });
  };

  const ctaButton = (extraClass?: string) => (
    <button
      type="button"
      className={cn("craft-btn cd-cta", extraClass)}
      onClick={primary.run}
      disabled={primary.disabled}
    >
      {isEnrolled ? <Play className="h-4 w-4 fill-current" /> : !isFree && !isPurchased ? <ShoppingCart className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
      {primary.label}
    </button>
  );

  return (
    <div className="cd-page">
      <div className="cd-wrap">
        {/* ── Breadcrumb ── */}
        <nav className="cd-crumbs" aria-label="Breadcrumb">
          <Link to="/learn">Học</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span aria-current="page">{course.title}</span>
        </nav>

        {/* ── Hero ── */}
        <section className="craft-hero craft-rise cd-hero">
          <div className="cd-hero-info">
            <span className={cn("cd-level", `is-${course.level}`)}>
              <LevelIcon className="h-3.5 w-3.5" />
              {COURSE_LEVEL_LABELS[course.level] ?? course.level}
            </span>
            <h1 className="craft-title cd-title">{course.title}</h1>
            <div className="craft-stitch" aria-hidden />
            {course.description && <p className="craft-subtitle">{course.description}</p>}

            <div className="cd-stats">
              <span>
                <BookOpen className="h-4 w-4" />
                {lessons.length || course.totalLessons} bài học
              </span>
              <span>
                <Clock className="h-4 w-4" />
                {course.totalDuration} phút
              </span>
              <span>
                <Users className="h-4 w-4" />
                {course.enrolledCount.toLocaleString("vi-VN")} học viên
              </span>
              {rating > 0 && (
                <span>
                  <Star className="h-4 w-4 fill-[var(--rating-star)] text-[var(--rating-star)]" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {course.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span key={tag} className="craft-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="cd-cover"
            onClick={primary.run}
            disabled={primary.disabled}
            aria-label={primary.label}
          >
            <img src={course.thumbnail} alt="" />
            <span className="cd-cover-play">
              {isEnrolled || isFree || isPurchased ? <Play className="h-6 w-6 fill-current" /> : <Lock className="h-6 w-6" />}
            </span>
            {!isFree && <span className="cd-cover-price">{formatPrice(course.price ?? 0)}</span>}
          </button>
        </section>

        <div className="cd-grid">
          <main className="min-w-0 space-y-12">
            {/* ── Nội dung khoá học ── */}
            <section>
              <div className="craft-section-head">
                <span className="craft-section-icon">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="craft-section-title">Nội dung khoá học</h2>
                  <p className="craft-section-sub">
                    {lessons.length} bài · {course.totalDuration} phút
                    {isEnrolled && lessons.length > 0 && ` · đã học ${completedCount}/${lessons.length}`}
                  </p>
                </div>
                <span className="craft-section-thread" aria-hidden />
              </div>

              {courseProgress?.hasNewContent && (
                <p className="cd-notice">
                  <Gift className="h-4 w-4" /> Khoá học vừa có bài mới — vào học để xem nhé!
                </p>
              )}

              {lessons.length === 0 ? (
                <div className="craft-empty">
                  <p className="craft-empty-title">Bài giảng đang được chuẩn bị</p>
                  <p className="craft-empty-desc">Quay lại sau ít hôm nữa nhé.</p>
                </div>
              ) : (
                <ol className="cd-lessons">
                  {lessons.map((lesson, index) => {
                    const done = completedSet.has(lesson._id);
                    const isNext = isEnrolled && !allDone && resumeLesson?._id === lesson._id;
                    const open = canWatchLesson({ lesson, isEnrolled, role });
                    const materialCount = (lesson.linkedProduct?.length ?? 0) + (lesson.linkedCombo?.length ?? 0);
                    const body = (
                      <>
                        <span className={cn("cd-lesson-knot", done && "is-done", isNext && "is-next")}>
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="cd-lesson-title">{lesson.title}</span>
                          <span className="cd-lesson-meta">
                            <Clock className="h-3 w-3" /> {lesson.duration} phút
                            {materialCount > 0 && <> · {materialCount} nguyên liệu gợi ý</>}
                            {isNext && <span className="cd-lesson-next"> · học tiếp</span>}
                          </span>
                        </span>
                        {lesson.isPreview && !isEnrolled && (
                          <span className="cd-lesson-preview">
                            <Eye className="h-3 w-3" /> Xem thử
                          </span>
                        )}
                        <span className="cd-lesson-action">
                          {open ? <Play className="h-4 w-4 fill-current" /> : <Lock className="h-4 w-4" />}
                        </span>
                      </>
                    );
                    return (
                      <li key={lesson._id}>
                        {open ? (
                          <Link
                            to={`/learn/${course._id}/lesson/${lesson._id}`}
                            className={cn("cd-lesson", isNext && "is-next")}
                            onClick={(e) => {
                              if (!isAuthenticated) {
                                e.preventDefault();
                                goToLogin();
                              }
                            }}
                          >
                            {body}
                          </Link>
                        ) : (
                          <button type="button" className="cd-lesson is-locked" onClick={handleLockedLesson}>
                            {body}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* ── Nguyên liệu ── */}
            <section>
              <div className="craft-section-head">
                <span className="craft-section-icon">
                  <YarnBallIcon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="craft-section-title">Nguyên liệu cho khoá học</h2>
                  <p className="craft-section-sub">Combo và sản phẩm được dùng trong các bài</p>
                </div>
                <span className="craft-section-thread" aria-hidden />
              </div>

              {kits.length === 0 && uniqueProducts.length === 0 ? (
                <div className="craft-empty">
                  <PackageSearch size={36} className="text-[var(--foreground-subtle)]" />
                  <p className="craft-empty-title">Chưa gắn nguyên liệu</p>
                  <p className="craft-empty-desc">Bạn có thể tự chọn len và dụng cụ trong cửa hàng.</p>
                  <Link to="/shop" className="craft-btn-ghost">
                    <ShoppingCart className="h-4 w-4" /> Vào cửa hàng
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {kits.length > 0 && (
                    <div className="cd-kits">
                      {kits.map((kit) => (
                        <article key={kit._id} className="cd-kit">
                          <Link to={`/kits/${kit._id}`} className="cd-kit-media">
                            <img
                              src={kit.thumbnail || kit.products?.[0]?.productId?.image}
                              alt={kit.name}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = "true";
                                  target.src = `https://picsum.photos/seed/${kit._id}/800/450`;
                                }
                              }}
                            />
                            <span className="cd-kit-tag">
                              <Gift className="h-3 w-3" /> Combo
                            </span>
                          </Link>
                          <div className="cd-kit-body">
                            <Link to={`/kits/${kit._id}`} className="cd-kit-name">
                              {kit.name}
                            </Link>
                            {kit.description && <p className="cd-kit-desc">{kit.description}</p>}
                            <div className="cd-kit-foot">
                              <span className="cd-kit-price">{formatPrice(kit.price)}</span>
                              <button type="button" className="craft-btn-ghost cd-small-btn" onClick={() => handleAddKitToCart(kit)}>
                                <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {uniqueProducts.length > 0 && (
                    <ul className="cd-products">
                      {uniqueProducts.map((product) => (
                        <li key={product._id} className="cd-product">
                          <Link to={`/shop/product/${product._id}`} className="cd-product-thumb">
                            <img src={product.image || product.variants[0]?.image} alt={product.name} />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link to={`/shop/product/${product._id}`} className="cd-product-name">
                              {product.name}
                            </Link>
                            <span className="cd-product-price">{formatPrice(product.variants[0]?.price || 0)}</span>
                          </div>
                          <button
                            type="button"
                            className="cd-product-add"
                            onClick={() => handleAddProductToCart(product)}
                            aria-label={`Thêm ${product.name} vào giỏ`}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </main>

          {/* ── Vé đăng ký (desktop) ── */}
          <aside className="cd-aside">
            <div className="cd-ticket">
              <p className="cd-ticket-eyebrow">{isEnrolled ? "Tiến độ của bạn" : isFree ? "Khoá học miễn phí" : "Khoá học Premium"}</p>
              {isEnrolled ? (
                <>
                  <p className="cd-ticket-big">{progressPct}%</p>
                  <div className="cd-progress" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="cd-ticket-note">
                    Đã học {completedCount}/{lessons.length} bài
                  </p>
                </>
              ) : (
                <p className="cd-ticket-big">{isFree ? "Miễn phí" : formatPrice(course.price ?? 0)}</p>
              )}

              {ctaButton("w-full")}
              <p className="cd-ticket-hint">{primary.hint}</p>

              {courseProgress?.isCompleted && (
                <p className="cd-cert">
                  <Award className="h-4 w-4" /> Đã hoàn thành — chứng nhận của bạn đã sẵn sàng.
                </p>
              )}

              <ul className="cd-includes">
                <li>
                  <BookOpen className="h-4 w-4" /> {lessons.length} bài học video · {course.totalDuration} phút
                </li>
                <li>
                  <YarnBallIcon size={16} /> Nguyên liệu gợi ý theo từng bài
                </li>
                <li>
                  <Award className="h-4 w-4" /> Chứng nhận khi hoàn thành
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile: thanh nổi cạnh FAB ── */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            key="cd-float"
            className="cd-float"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="cd-float-label">
              {isEnrolled ? `${progressPct}%` : isFree ? "Miễn phí" : formatPrice(course.price ?? 0)}
            </span>
            {ctaButton("cd-float-btn")}
          </motion.div>
        )}
      </AnimatePresence>

      {sepayQr && (
        <SepayQrModal
          title="Thanh toán khoá học"
          info={sepayQr}
          checking={sepayChecking}
          onCheck={checkSepayNow}
          onClose={() => setSepayQr(null)}
        />
      )}
    </div>
  );
}
