import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  Gift,
  GraduationCap,
  Leaf,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  TreeDeciduous,
  Users,
  Play,
  PlayCircle,
  Gauge,
  RotateCcw,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/components/ui/avatar";
import { Checkbox } from "../../shared/components/ui/checkbox";
import { Label } from "../../shared/components/ui/label";
import { courseService } from "../../shared/api/courseService";
import { videoService, type Video } from "../../shared/api/videoService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../shared/components/ui/dialog";
import { getYouTubeVideoId } from "../../features/learn/utils/youtube";
import { getCourseRating } from "../../features/learn/utils/courseRating";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { useAuth } from "../../shared/hooks/useAuth";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import type { Course, CourseLevel } from "../../features/learn/types/learn.types";
import { cn } from "../../shared/components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";
import { ProductSkeleton } from "../../shared/components/skeletons/ProductSkeleton";
import { EmptyHoopIllustration } from "./shop/CartPage";
import "../../styles/craft.css";
import "../../styles/learn.css";

const levelStyles: Record<CourseLevel, string> = {
  beginner: "is-beginner",
  mid: "is-mid",
  pro: "is-pro",
};

// Trình độ như một cái cây lớn dần: mầm → lá → cây
const LEVEL_ICON: Record<CourseLevel, LucideIcon> = {
  beginner: Sprout,
  mid: Leaf,
  pro: TreeDeciduous,
};

/** Số video miễn phí (community) lấy về cho trang Learn. */
const FREE_VIDEO_LIMIT = 12;

function formatVideoDuration(totalSeconds?: number): string | null {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const s = Math.round(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function uploaderInfo(video: Video): { name: string; avatar?: string } {
  const uploader = video.uploader;
  if (!uploader || typeof uploader === "string") return { name: "Len Em" };
  return {
    name: uploader.fullName || uploader.username || "Len Em",
    avatar: resolveAvatarUrl(uploader.avatar),
  };
}

type ActiveFilterChip = { type: "level" | "tag"; value: string; label: string };

export function LearnPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, setUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  // CourseId đang gửi đánh giá sao — disable sao của card đó trong lúc chờ.
  const [ratingCourseId, setRatingCourseId] = useState<string | null>(null);
  // Điểm người dùng vừa chấm trong phiên này (BE không trả lại điểm riêng của từng người).
  const [myCourseScores, setMyCourseScores] = useState<Record<string, number>>({});
  const [selectedLevels, setSelectedLevels] = useState<CourseLevel[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Video miễn phí = video "community" tạo ở /admin/videos. GET /videos yêu cầu
  // đăng nhập → khách, lỗi API hoặc không có video thì ẩn hẳn mục này.
  const [freeVideos, setFreeVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [ratingVideo, setRatingVideo] = useState(false);
  
  // Get search query from URL
  const searchQuery = searchParams.get("search") || "";

  const levelLabels: Record<CourseLevel, string> = {
    beginner: t("beginner"),
    mid: t("intermediate"),
    pro: t("advanced"),
  };

  // Get enrolled courses from user profile
  const enrolledCourses = user?.enrolled || [];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await courseService.getAll({ limit: 50 });
        setCourses(res.data.data.courses);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFreeVideos([]);
      return;
    }
    let cancelled = false;
    videoService
      .getAll({ type: "community", limit: FREE_VIDEO_LIMIT, sort: "newest" })
      .then((res) => {
        if (!cancelled) setFreeVideos(res.data.data?.videos ?? []);
      })
      .catch(() => {
        if (!cancelled) setFreeVideos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const currentUserId = user?.userId || user?.id || "";

  /** Điểm người đang xem đã chấm cho video (0 = chưa chấm). */
  const myVideoScore = (video: Video) =>
    video.ratings?.find((r) => (r.user ?? r.userId) === currentUserId)?.score ?? 0;

  /**
   * Rate video — POST /videos/{id}/rate { score: 1–5 }; chấm lại sẽ ghi đè.
   * BE trả averageRating + totalRatings mới → cập nhật cả card lẫn popup.
   */
  const handleRateVideo = async (video: Video, score: number) => {
    setRatingVideo(true);
    try {
      const res = await videoService.rate(video._id, score);
      const result = res.data.data;
      const others = (video.ratings ?? []).filter((r) => (r.user ?? r.userId) !== currentUserId);
      const updated: Video = {
        ...video,
        averageRating: result?.averageRating ?? video.averageRating,
        ratings: [...others, { user: currentUserId, score }],
      };
      setFreeVideos((prev) => prev.map((v) => (v._id === video._id ? updated : v)));
      setPlayingVideo((prev) => (prev?._id === video._id ? updated : prev));
      toast.success(t("learnPage.rateSuccess"));
    } catch {
      // Lỗi API đã được axios interceptor toast sẵn.
    } finally {
      setRatingVideo(false);
    }
  };

  const openVideo = (video: Video) => {
    setPlayingVideo(video);
    // GET /videos/{id} tăng lượt xem ở BE — không cần chờ kết quả.
    videoService.getById(video._id).catch(() => {});
  };

  const tags = useMemo(
    () => Array.from(new Set(courses.flatMap((course) => course.tags))).sort(),
    [courses],
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesLevel =
          selectedLevels.length === 0 || selectedLevels.includes(course.level);
        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => course.tags.includes(tag));

        // Search filter
        const matchesSearch =
          !searchQuery.trim() ||
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        return matchesLevel && matchesTags && matchesSearch;
      }),
    [courses, selectedLevels, selectedTags, searchQuery],
  );

  // Tách danh sách theo giá — miễn phí (không có price) vs Premium (price > 0).
  const freeCourses = useMemo(
    () => filteredCourses.filter((course) => (course.price ?? 0) === 0),
    [filteredCourses],
  );
  const premiumCourses = useMemo(
    () => filteredCourses.filter((course) => (course.price ?? 0) > 0),
    [filteredCourses],
  );

  const toggleValue = <T extends string>(
    value: T,
    values: T[],
    setter: (next: T[]) => void,
  ) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const toggleLevel = (level: CourseLevel) =>
    toggleValue(level, selectedLevels, setSelectedLevels);
  const toggleTag = (tag: string) => toggleValue(tag, selectedTags, setSelectedTags);

  const resetFilters = () => {
    setSelectedLevels([]);
    setSelectedTags([]);
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedTags.length > 0;

  // Drives the removable chip strip above the course grid — a single place
  // to see and undo every active filter without reopening the panel.
  const activeChips: ActiveFilterChip[] = [
    ...selectedLevels.map((level) => ({ type: "level" as const, value: level, label: levelLabels[level] })),
    ...selectedTags.map((tag) => ({ type: "tag" as const, value: tag, label: tag })),
  ];

  const removeChip = (chip: ActiveFilterChip) => {
    if (chip.type === "level") toggleLevel(chip.value as CourseLevel);
    else toggleTag(chip.value);
  };

  // Handle enroll click
  const handleEnroll = useCallback(async (courseId: string) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    // Check if already enrolled
    if (enrolledCourses.includes(courseId)) {
      navigate(`/learn/${courseId}`);
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      const res = await courseService.enroll(courseId);
      const { enrolledCount, userEnrolled } = res.data.data;

      // Update course enrolledCount
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId ? { ...c, enrolledCount } : c
        )
      );

      // Update user's enrolled array in auth store
      if (user && userEnrolled) {
        setUser({
          ...user,
          enrolled: [...enrolledCourses, courseId],
        });
      }

      // If enrolled successfully, navigate to course
      if (userEnrolled) {
        navigate(`/learn/${courseId}`);
      }
    } catch (error) {
      // Check if already enrolled from error response
      const err = error as { response?: { data?: { message?: string } } };
      if (err?.response?.data?.message === "Already enrolled") {
        // Still navigate to course to sync with backend
        navigate(`/learn/${courseId}`);
      } else {
        toast.error("Failed to enroll");
      }
    } finally {
      setEnrollingCourseId(null);
    }
  }, [isAuthenticated, enrolledCourses, navigate, user, setUser]);

  /**
   * Rate (sao) khóa học — POST /courses/{id}/rate { rating: 1–5 }.
   * Chưa đăng nhập → về /auth/login. Response trả course đã tính lại
   * averageRating + totalRatings → cập nhật thẳng vào card.
   */
  const handleRate = useCallback(
    async (courseId: string, score: number) => {
      if (!isAuthenticated) {
        navigate("/auth/login");
        return;
      }
      setRatingCourseId(courseId);
      try {
        const res = await courseService.rate(courseId, score);
        const updated = res.data.data?.course;
        if (updated) {
          setCourses((prev) =>
            prev.map((course) =>
              course._id === courseId
                ? {
                    ...course,
                    averageRating: updated.averageRating,
                    totalRatings: updated.totalRatings,
                  }
                : course,
            ),
          );
        }
        setMyCourseScores((prev) => ({ ...prev, [courseId]: score }));
        toast.success(t("learnPage.rateSuccess"));
      } catch {
        // Lỗi API (401/400/404...) đã được axios interceptor toast sẵn.
      } finally {
        setRatingCourseId(null);
      }
    },
    [isAuthenticated, navigate, t],
  );

  // Card renderer dùng chung cho 2 khu vực: Khóa học Miễn phí & Khóa học Premium.
  const renderCourseCard = (course: Course, index: number) => {
    const isEnrolled = enrolledCourses.includes(course._id);
    const isEnrolling = enrollingCourseId === course._id;
    const isPremium = (course.price ?? 0) > 0;
    const LevelIcon = LEVEL_ICON[course.level];
    const ratingPending = ratingCourseId === course._id;

    return (
      <article
        key={course._id}
        className="learn-card craft-rise"
        style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      >
        <div className="learn-card-media">
          <img src={course.thumbnail} alt={course.title} loading="lazy" />
          <span className={cn("learn-level", levelStyles[course.level])}>
            <LevelIcon className="size-3" />
            {levelLabels[course.level]}
          </span>
          <span className={cn("learn-price-tag", !isPremium && "is-free")}>
            {isPremium ? formatPrice(course.price ?? 0) : t("learnPage.free")}
          </span>
        </div>

        <div className="learn-card-body">
          <h3 className="learn-card-title">{course.title}</h3>

          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="craft-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="learn-card-meta">
            <span>
              <BookOpen className="size-3.5" />
              {course.totalLessons} {t("learnPage.lessons")}
            </span>
            <span>
              <Clock className="size-3.5" />
              {course.totalDuration} {t("learnPage.min")}
            </span>
            <span>
              <Users className="size-3.5" />
              {course.enrolledCount.toLocaleString()}
            </span>
          </div>

          {/* Rate (sao) — hiển thị điểm trung bình + cho phép đánh giá 1–5 */}
          <div className="learn-rating" title={t("learnPage.rateHint")}>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (myCourseScores[course._id] ?? Math.round(getCourseRating(course)));
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingPending}
                    aria-label={`${star}/5`}
                    onClick={() => void handleRate(course._id, star)}
                    className={`transition-transform ${
                      ratingPending ? "cursor-wait opacity-60" : "hover:scale-125"
                    }`}
                  >
                    <Star
                      className={`size-4 ${
                        filled
                          ? "fill-[var(--rating-star)] text-[var(--rating-star)]"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="learn-rating-score">
              {getCourseRating(course).toFixed(1)}
              {(course.totalRatings ?? 0) > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({course.totalRatings})
                </span>
              )}
            </span>
          </div>

          <div className="learn-card-cta">
            {isPremium && !isEnrolled ? (
              // Khóa Premium chưa mua → vào trang chi tiết để xem & mua (Buy Now)
              <button
                type="button"
                className="craft-btn-ghost w-full"
                onClick={() => navigate(`/learn/${course._id}`)}
              >
                {t("learnPage.viewDetail")}
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                className={cn(isEnrolled ? "craft-btn-ghost" : "craft-btn", "w-full")}
                disabled={isEnrolling}
                onClick={() => handleEnroll(course._id)}
              >
                {isEnrolled ? <PlayCircle className="size-4" /> : <GraduationCap className="size-4" />}
                {isEnrolling
                  ? t("learnPage.enrolling")
                  : isEnrolled
                    ? t("learnPage.enrolled")
                    : t("learnPage.startLearning")}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderFilterPanel = (idPrefix: string) => (
    <>
      <FilterGroup title={t("learnPage.level")} icon={<Gauge size={14} />}>
        {(Object.keys(levelLabels) as CourseLevel[]).map((level) => (
          <FilterCheckbox
            key={level}
            id={`${idPrefix}level-${level}`}
            label={levelLabels[level]}
            checked={selectedLevels.includes(level)}
            onCheckedChange={() => toggleLevel(level)}
          />
        ))}
      </FilterGroup>

      <div className="learn-filter-divider" />

      <FilterGroup title={t("learnPage.tags")} icon={<Tag size={14} />}>
        {tags.map((tag) => (
          <FilterCheckbox
            key={tag}
            id={`${idPrefix}tag-${tag}`}
            label={tag}
            checked={selectedTags.includes(tag)}
            onCheckedChange={() => toggleTag(tag)}
          />
        ))}
      </FilterGroup>
    </>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-12">
      <div className="mx-auto max-w-7xl">
        {/* ── Hero: lớp học len ── */}
        <section className="craft-hero craft-rise mb-10">
          <div className="learn-hero-row">
            <div className="min-w-0">
              <span className="craft-eyebrow">Lớp học đan móc</span>
              <h1 className="craft-title">{t("learnPage.headline")}</h1>
              <div className="craft-stitch" aria-hidden />
              <p className="craft-subtitle">{t("learnPage.subtitle")}</p>

              {/* Quick level pills — jump straight to a level without opening the filter panel */}
              <div className="learn-level-row">
                {(Object.keys(levelLabels) as CourseLevel[]).map((level) => {
                  const Icon = LEVEL_ICON[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={selectedLevels.includes(level)}
                      className={cn(
                        "learn-level-pill",
                        `is-${level}`,
                        selectedLevels.includes(level) && "is-active",
                      )}
                      onClick={() => toggleLevel(level)}
                    >
                      <Icon className="size-4" />
                      {levelLabels[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="learn-hero-stats">
              <div className="craft-stat">
                <span className="craft-stat-icon">
                  <BookOpen className="size-4" />
                </span>
                <div>
                  <p className="craft-stat-num">{courses.length}</p>
                  <p className="craft-stat-label">{t("learnPage.courses")}</p>
                </div>
              </div>
              {freeVideos.length > 0 && (
                <div className="craft-stat">
                  <span className="craft-stat-icon">
                    <PlayCircle className="size-4" />
                  </span>
                  <div>
                    <p className="craft-stat-num">{freeVideos.length}</p>
                    <p className="craft-stat-label">{t("learnPage.freeVideos")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[272px_1fr]">
          {/* Mobile filter button */}
          <div className="flex lg:hidden">
            <button onClick={() => setFilterDrawerOpen(true)} className="craft-btn-ghost">
              <SlidersHorizontal className="size-4" />
              {t("learnPage.filters")}
              {activeChips.length > 0 && (
                <span className="learn-filter-count">{activeChips.length}</span>
              )}
            </button>
          </div>

          <aside className="learn-filter-panel hidden lg:block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="learn-filter-title">{t("learnPage.filters")}</h2>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="learn-filter-reset"
              >
                <RotateCcw className="size-3.5" />
                {t("learnPage.reset")}
              </button>
            </div>

            {renderFilterPanel("")}

            {!loading && (
              <div className="learn-filter-summary">
                <SlidersHorizontal size={13} />
                {t("learnPage.show")} <strong>{filteredCourses.length}</strong> / {courses.length}{" "}
                {t("learnPage.courses")}
              </div>
            )}
          </aside>

          <main className="min-w-0 space-y-14">
            <AnimatePresence>
              {activeChips.length > 0 && (
                <motion.div
                  className="filter-active-strip"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="filter-active-label">{t("learnPage.filters")}:</span>
                  {activeChips.map((chip) => (
                    <motion.button
                      type="button"
                      key={`${chip.type}-${chip.value}`}
                      className="filter-active-chip"
                      onClick={() => removeChip(chip)}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                    >
                      {chip.label}
                      <X className="size-3" />
                    </motion.button>
                  ))}
                  <button type="button" className="filter-active-clear" onClick={resetFilters}>
                    {t("learnPage.resetAll")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="craft-empty">
                <EmptyHoopIllustration size={150} />
                <p className="craft-empty-title">{t("learnPage.noCourses")}</p>
                <p className="craft-empty-desc">
                  Thử chọn trình độ hoặc thẻ khác — luôn có một lớp học vừa sức với bạn.
                </p>
                {hasActiveFilters && (
                  <button type="button" className="craft-btn" onClick={resetFilters}>
                    <RotateCcw className="size-4" />
                    {t("learnPage.resetAll")}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── Miễn phí (không có price) ── */}
                {freeCourses.length > 0 && (
                  <section>
                    <SectionHead
                      icon={<Gift className="size-5" />}
                      title={t("learnPage.freeCourses")}
                      sub={`${freeCourses.length} ${t("learnPage.courses")}`}
                    />
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {freeCourses.map(renderCourseCard)}
                    </div>
                  </section>
                )}

                {/* ── Premium (có price) ── */}
                {premiumCourses.length > 0 && (
                  <section>
                    <SectionHead
                      icon={<Sparkles className="size-5" />}
                      title={t("learnPage.premiumCourses")}
                      sub={`${premiumCourses.length} ${t("learnPage.courses")}`}
                    />
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {premiumCourses.map(renderCourseCard)}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ── Free Videos (từ /admin/videos, type community) ── */}
            {freeVideos.length > 0 && (
              <section>
                <SectionHead
                  icon={<PlayCircle className="size-5" />}
                  title={t("learnPage.freeVideos")}
                  sub={`${freeVideos.length} ${t("learnPage.shortTutorials")}`}
                />

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {freeVideos.map((video) => {
                    const youTubeId = getYouTubeVideoId(video.url);
                    const thumbnail =
                      video.thumbnail?.url ||
                      (youTubeId ? `https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg` : null);
                    const duration = formatVideoDuration(video.duration);
                    const category =
                      video.category && typeof video.category === "object" ? video.category.name : null;
                    const creator = uploaderInfo(video);
                    return (
                      <div
                        key={video._id}
                        className="learn-video group"
                        role="button"
                        tabIndex={0}
                        onClick={() => openVideo(video)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openVideo(video);
                          }
                        }}
                      >
                        <div className="learn-video-media">
                          {thumbnail ? (
                            <img src={thumbnail} alt={video.title} loading="lazy" />
                          ) : (
                            // Video upload lên Cloudinary không có thumbnail → dùng khung hình đầu.
                            <video src={video.url} preload="metadata" muted playsInline />
                          )}
                          <span className="learn-video-play">
                            <Play className="size-4 fill-current" />
                          </span>
                          {category && (
                            <span className="learn-level is-beginner">
                              <Tag className="size-3" />
                              {category}
                            </span>
                          )}
                          {duration && (
                            <span className="learn-video-duration">
                              <Clock className="size-3" />
                              {duration}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="learn-video-title">{video.title}</h4>
                          {video.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {video.description}
                            </p>
                          )}
                          <div className="learn-video-foot">
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={creator.avatar} alt={creator.name} />
                                <AvatarFallback className="text-[10px]">
                                  {creator.name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-xs text-muted-foreground">
                                {creator.name}
                              </span>
                            </div>
                            <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="size-3 fill-[var(--rating-star)] text-[var(--rating-star)]" />
                                {Number(video.averageRating ?? 0).toFixed(1)}
                                {(video.ratings?.length ?? 0) > 0 && ` (${video.ratings!.length})`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="size-3" />
                                {(video.viewCount ?? 0).toLocaleString()}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ── Free video player ── */}
      <Dialog open={playingVideo !== null} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="sm:max-w-3xl">
          {playingVideo && (
            <>
              <DialogTitle>{playingVideo.title}</DialogTitle>
              <DialogDescription className={playingVideo.description ? undefined : "sr-only"}>
                {playingVideo.description || playingVideo.title}
              </DialogDescription>
              {getYouTubeVideoId(playingVideo.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(playingVideo.url)}?rel=0&autoplay=1`}
                  title={playingVideo.title}
                  className="aspect-video w-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={playingVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="aspect-video w-full rounded-xl bg-black"
                />
              )}
              {/* Rate (sao) — điểm trung bình + cho phép chấm 1–5, tô theo điểm của mình */}
              <div className="learn-rating" title={t("learnPage.rateVideoHint")}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const mine = myVideoScore(playingVideo);
                      const filled = star <= (mine || Math.round(playingVideo.averageRating ?? 0));
                      return (
                        <button
                          key={star}
                          type="button"
                          disabled={ratingVideo}
                          aria-label={`${star}/5`}
                          onClick={() => void handleRateVideo(playingVideo, star)}
                          className={`transition-transform ${
                            ratingVideo ? "cursor-wait opacity-60" : "hover:scale-125"
                          }`}
                        >
                          <Star
                            className={`size-5 ${
                              filled
                                ? "fill-[var(--rating-star)] text-[var(--rating-star)]"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {myVideoScore(playingVideo) > 0
                      ? t("learnPage.yourRating", { score: myVideoScore(playingVideo) })
                      : t("learnPage.rateVideoHint")}
                  </span>
                </div>
                <span className="learn-rating-score">
                  {Number(playingVideo.averageRating ?? 0).toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({playingVideo.ratings?.length ?? 0})
                  </span>
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Mobile filter drawer ── */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterDrawerOpen(false)}
            />
            <motion.div
              className="learn-drawer fixed bottom-0 left-0 right-0 z-50 max-h-[80dvh] overflow-y-auto p-5 lg:hidden safe-area-bottom"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="learn-filter-title">{t("learnPage.filters")}</h2>
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="learn-filter-reset"
                >
                  <RotateCcw className="size-3.5" />
                  {t("learnPage.resetAll")}
                </button>
              </div>

              {renderFilterPanel("mobile-")}

              <button
                type="button"
                className="craft-btn mt-6 w-full"
                onClick={() => setFilterDrawerOpen(false)}
              >
                {`${t("learnPage.show")} ${filteredCourses.length} ${t("learnPage.courses")}`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="craft-section-head">
      <span className="craft-section-icon">{icon}</span>
      <div className="min-w-0">
        <h2 className="craft-section-title">{title}</h2>
        <p className="craft-section-sub">{sub}</p>
      </div>
      <span className="craft-section-thread" aria-hidden />
    </div>
  );
}

function FilterGroup({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="learn-filter-group-title">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="learn-filter-option">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm capitalize">{label}</Label>
    </div>
  );
}
