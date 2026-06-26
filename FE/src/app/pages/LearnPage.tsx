import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, Clock, SlidersHorizontal, Star, Users, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { learnCourses, freeVideos } from "../../features/learn/data/learn.mock";
import { useAuth } from "../../hooks/useAuth";
import type { CourseLevel } from "../../features/learn/types/learn.types";
import { cn } from "../components/ui/utils";

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

export function LearnPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedLevels, setSelectedLevels] = useState<CourseLevel[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const tags = useMemo(
    () => Array.from(new Set(learnCourses.flatMap((course) => course.tags))).sort(),
    [],
  );
  const creators = useMemo(
    () => Array.from(new Set(learnCourses.map((course) => course.creator.name))).sort(),
    [],
  );

  const filteredCourses = learnCourses.filter((course) => {
    const matchesLevel =
      selectedLevels.length === 0 || selectedLevels.includes(course.level);
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((tag) => course.tags.includes(tag));
    const matchesCreator =
      selectedCreators.length === 0 || selectedCreators.includes(course.creator.name);

    return matchesLevel && matchesTags && matchesCreator;
  });

  const toggleValue = <T extends string>(
    value: T,
    values: T[],
    setter: (next: T[]) => void,
  ) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background p-8">
          <Badge variant="secondary" className="mb-4">LEARN</Badge>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Learn, buy materials, and start creating in one flow.
          </h1>
          <p className="max-w-3xl text-muted-foreground md:text-lg">
            Follow Gen Z-friendly crochet lessons by skill level. Each course tags the exact yarn,
            tools, and combo kits used inside the lesson so you can add them to cart instantly.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Mobile filter FAB */}
          <div className="mb-4 flex lg:hidden">
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {(selectedLevels.length + selectedTags.length + selectedCreators.length) > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {selectedLevels.length + selectedTags.length + selectedCreators.length}
                </span>
              )}
            </button>
          </div>

          <aside className="hidden lg:block h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLevels([]);
                  setSelectedTags([]);
                  setSelectedCreators([]);
                }}
              >
                Reset
              </Button>
            </div>

            <FilterGroup title="Level">
              {(Object.keys(levelLabels) as CourseLevel[]).map((level) => (
                <FilterCheckbox
                  key={level}
                  id={`level-${level}`}
                  label={levelLabels[level]}
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => toggleValue(level, selectedLevels, setSelectedLevels)}
                />
              ))}
            </FilterGroup>

            <Separator className="my-5" />

            <FilterGroup title="Tags">
              {tags.map((tag) => (
                <FilterCheckbox
                  key={tag}
                  id={`tag-${tag}`}
                  label={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => toggleValue(tag, selectedTags, setSelectedTags)}
                />
              ))}
            </FilterGroup>

            <Separator className="my-5" />

            <FilterGroup title="Creator">
              {creators.map((creator) => (
                <FilterCheckbox
                  key={creator}
                  id={`creator-${creator}`}
                  label={creator}
                  checked={selectedCreators.includes(creator)}
                  onCheckedChange={() => toggleValue(creator, selectedCreators, setSelectedCreators)}
                />
              ))}
            </FilterGroup>
          </aside>

          <main className="space-y-12">
            {/* ── Premium Courses ── */}
            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🔥</span>
                    <h2 className="text-2xl font-semibold">Premium Courses</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"} — structured lessons with PDF materials
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <Badge className={cn("absolute left-3 top-3 border", levelStyles[course.level])}>
                        {levelLabels[course.level]}
                      </Badge>
                      {course.price && course.price > 0 && (
                        <Badge className="absolute right-3 top-3 border-amber-200 bg-amber-100 text-amber-800">
                          {course.price.toLocaleString()}₫
                        </Badge>
                      )}
                      {course.price === 0 && (
                        <Badge className="absolute right-3 top-3 border-green-200 bg-green-100 text-green-700">
                          Free
                        </Badge>
                      )}
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={course.creator.avatar} alt={course.creator.name} />
                          <AvatarFallback>{course.creator.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{course.creator.name}</span>
                      </div>
                      <div>
                        <h3 className="line-clamp-2 min-h-12 text-lg font-semibold">{course.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {course.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><BookOpen className="size-4" />{course.totalLessons} lessons</span>
                        <span className="flex items-center gap-1.5"><Clock className="size-4" />{course.totalDuration} min</span>
                        <span className="flex items-center gap-1.5"><Star className="size-4 fill-yellow-400 text-yellow-400" />{course.rating}</span>
                        <span className="flex items-center gap-1.5"><Users className="size-4" />{course.enrolledCount.toLocaleString()}</span>
                      </div>
                      {course.pointReward && course.pointReward > 0 && (
                        <p className="text-[11px] text-primary">🏆 +{course.pointReward} Points khi hoàn thành</p>
                      )}
                      <Button asChild className="w-full">
                        <Link
                          to={`/learn/${course.id}`}
                          onClick={(e) => {
                            if (!isAuthenticated) {
                              e.preventDefault();
                              navigate("/auth/login");
                            }
                          }}
                        >
                          {course.price && course.price > 0 ? `Mua ngay ${course.price.toLocaleString()}₫` : "Bắt đầu học"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── Free Videos ── */}
            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🆓</span>
                    <h2 className="text-2xl font-semibold">Free Videos</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {freeVideos.length} short tutorials — no login required
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {freeVideos.map((video) => (
                  <div
                    key={video.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md cursor-pointer"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate("/auth/login");
                      }
                    }}
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                      <Badge className={cn("absolute left-3 top-3 border", levelStyles[video.level])}>
                        {levelLabels[video.level]}
                      </Badge>
                      <Badge className="absolute right-3 top-3 border-green-200 bg-green-100 text-green-700 text-[10px]">
                        {video.duration} phút
                      </Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="size-6">
                          <AvatarImage src={video.creator.avatar} alt={video.creator.name} />
                          <AvatarFallback className="text-[10px]">{video.creator.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{video.creator.name}</span>
                      </div>
                      <h4 className="text-sm font-semibold line-clamp-2">{video.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">👁️ {video.viewCount.toLocaleString()} lượt xem</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-5 max-h-[80dvh] overflow-y-auto lg:hidden safe-area-bottom"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                  onClick={() => {
                    setSelectedLevels([]);
                    setSelectedTags([]);
                    setSelectedCreators([]);
                  }}
                  className="text-sm text-primary underline"
                >
                  Reset all
                </button>
              </div>

              <FilterGroup title="Level">
                {(Object.keys(levelLabels) as CourseLevel[]).map((level) => (
                  <FilterCheckbox
                    key={level}
                    id={`mobile-level-${level}`}
                    label={levelLabels[level]}
                    checked={selectedLevels.includes(level)}
                    onCheckedChange={() => setSelectedLevels(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level])}
                  />
                ))}
              </FilterGroup>

              <Separator className="my-4" />

              <FilterGroup title="Tags">
                {tags.map((tag) => (
                  <FilterCheckbox
                    key={tag}
                    id={`mobile-tag-${tag}`}
                    label={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  />
                ))}
              </FilterGroup>

              <Separator className="my-4" />

              <FilterGroup title="Creator">
                {creators.map((creator) => (
                  <FilterCheckbox
                    key={creator}
                    id={`mobile-creator-${creator}`}
                    label={creator}
                    checked={selectedCreators.includes(creator)}
                    onCheckedChange={() => setSelectedCreators(prev => prev.includes(creator) ? prev.filter(c => c !== creator) : [...prev, creator])}
                  />
                ))}
              </FilterGroup>

              <Button
                className="w-full mt-6"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Show {filteredCourses.length} courses
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
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
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm capitalize">{label}</Label>
    </div>
  );
}
