import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { learnCourses } from "../../features/learn/data/learn.mock";
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
    <div className="min-h-screen bg-background px-4 py-10">
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
          <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
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

          <main>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Featured courses</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"} ready to start
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
                        Start Learning
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
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
