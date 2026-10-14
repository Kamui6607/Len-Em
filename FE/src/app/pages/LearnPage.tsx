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
import { freeVideos } from "../../features/learn/data/learn.mock";
import { courseService } from "../../shared/api/courseService";
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
  const [selectedLevels, setSelectedLevels] = useState<CourseLevel[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
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
   * Chưa đăng nhập → về /auth/login. Sau khi rate thành công thì GET lại
   * course để hiển thị điểm trung bình mới nhất (BE tính lại average).
   */
  const handleRate = useCallback(
    async (courseId: string, score: number) => {
      if (!isAuthenticated) {
        navigate("/auth/login");
        return;
      }
      setRatingCourseId(courseId);
      try {
        await courseService.rate(courseId, score);
        try {
          const res = await courseService.getById(courseId);
          const updated = res.data.data?.course;
          if (updated) {
            setCourses((prev) =>
              prev.map((course) =>
                course._id === courseId ? { ...course, rating: updated.rating } : course,
              ),
            );
          }
        } catch {
          // Không lấy lại được điểm mới — hiển thị điểm đã có, không báo lỗi.
        }
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
                const filled = star <= Math.round(course.rating ?? 0);
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
              {Number(course.rating ?? 0).toFixed(1)}
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
              <div className="craft-stat">
                <span className="craft-stat-icon">
                  <PlayCircle className="size-4" />
                </span>
                <div>
                  <p className="craft-stat-num">{freeVideos.length}</p>
                  <p className="craft-stat-label">{t("learnPage.freeVideos")}</p>
                </div>
              </div>
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

            {/* ── Free Videos ── */}
            <section>
              <SectionHead
                icon={<PlayCircle className="size-5" />}
                title={t("learnPage.freeVideos")}
                sub={`${freeVideos.length} ${t("learnPage.shortTutorials")}`}
              />

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {freeVideos.map((video) => {
                  const LevelIcon = LEVEL_ICON[video.level];
                  return (
                    <div
                      key={video.id}
                      className="learn-video group"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate("/auth/login");
                        }
                      }}
                    >
                      <div className="learn-video-media">
                        <img src={video.thumbnail} alt={video.title} loading="lazy" />
                        <span className="learn-video-play">
                          <Play className="size-4 fill-current" />
                        </span>
                        <span className={cn("learn-level", levelStyles[video.level])}>
                          <LevelIcon className="size-3" />
                          {levelLabels[video.level]}
                        </span>
                        <span className="learn-video-duration">
                          <Clock className="size-3" />
                          {video.duration} {t("learnPage.min")}
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="learn-video-title">{video.title}</h4>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {video.description}
                        </p>
                        <div className="learn-video-foot">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={video.creator.avatar} alt={video.creator.name} />
                              <AvatarFallback className="text-[10px]">
                                {video.creator.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs text-muted-foreground">
                              {video.creator.name}
                            </span>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                            <Eye className="size-3" />
                            {video.viewCount.toLocaleString()} {t("learnPage.views")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
        </div>
      </div>

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
