import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { BookOpen, Clock, Play, ShoppingCart, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { learnCourses, materialCombos, getLessonsByCourse } from "../../features/learn/data/learn.mock";
import { formatPrice } from "../../lib/formatPrice";
import { useLearnStore } from "../../features/learn/store/learn.store";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
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

export function CourseDetailPage() {
  const { addToCart } = useCart();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const setCurrentCourse = useLearnStore((state) => state.setCurrentCourse);
  const course = learnCourses.find((item) => item.id === courseId);

  useEffect(() => {
    if (courseId) setCurrentCourse(courseId);
  }, [courseId, setCurrentCourse]);

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

  if (!course) return <Navigate to="/learn" replace />;

  const lessons = getLessonsByCourse(course.id);
  const firstLesson = lessons[0];
  const combos = materialCombos.filter((combo) => course.linkedComboIds.includes(combo.id));

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const addComboToCart = (productIds: string[], comboName: string) => {
    productIds.forEach((productId) => {
      addToCart({
        productId,
        variantId: "default",
        name: comboName,
        image: course.thumbnail,
        color: "",
        hexCode: "#ccc",
        price: 0,
        stock: 999,
      });
    });
    toast.success(`${comboName} added to cart`);
  };

  const handleStartLearning = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <main className="space-y-8">
            <section className="overflow-hidden rounded-3xl border bg-card">
              <div className="relative aspect-[16/9] md:h-96 bg-muted">
                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className={cn("mb-4 border", levelStyles[course.level])}>{levelLabels[course.level]}</Badge>
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">{course.title}</h1>
                </div>
              </div>
              <div className="space-y-6 p-6 md:p-8">
                <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11">
                      <AvatarImage src={course.creator.avatar} alt={course.creator.name} />
                      <AvatarFallback>{course.creator.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Creator</p>
                      <p className="font-medium">{course.creator.name}</p>
                    </div>
                  </div>
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
                  <Button asChild size="lg">
                    <Link to={`/learn/${course.id}/lesson/${firstLesson.id}`} onClick={handleStartLearning}>
                      <Play className="size-4" /> Start Learning
                    </Link>
                  </Button>
                )}
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 mb-20 md:mb-0">
              <h2 className="mb-4 text-2xl font-semibold">Lessons</h2>
              <Accordion type="single" collapsible defaultValue={lessons[0]?.id}>
                {lessons.map((lesson) => (
                  <AccordionItem key={lesson.id} value={lesson.id}>
                    <AccordionTrigger>
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <span>{lesson.order}. {lesson.title}</span>
                        <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
                        <span>{lesson.linkedProducts.length} tagged material suggestions in this lesson.</span>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/learn/${course.id}/lesson/${lesson.id}`} onClick={handleStartLearning}>Watch lesson</Link>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <h2 className="text-xl font-semibold">Suggested material combo</h2>
            {combos.map((combo) => (
              <Card key={combo.id} className="overflow-hidden">
                <img src={combo.thumbnail} alt={combo.name} className="h-44 w-full object-cover" />
                <CardContent className="space-y-4 p-5">
                  <Badge className={cn("border", levelStyles[combo.level])}>{levelLabels[combo.level]}</Badge>
                  <div>
                    <h3 className="font-semibold">{combo.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{combo.description}</p>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>{formatPrice(combo.price)}</span>
                  </div>
                  <Button className="w-full" onClick={() => requireAuth(() => addComboToCart(combo.productIds, combo.name))}>
                    <ShoppingCart className="size-4" /> Add to cart
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                to={`/learn/${course.id}/lesson/${firstLesson.id}`}
                onClick={handleStartLearning}
                className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-full font-semibold text-sm text-center"
              >
                Start Learning →
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
