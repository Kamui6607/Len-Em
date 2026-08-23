import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Textarea } from "../../../shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Switch } from "../../../shared/components/ui/switch";
import { courseService } from "../../../shared/api/courseService";
import { lessonService } from "../../../shared/api/lessonService";
import type {
  CourseLevel,
  CourseFormData,
  Lesson,
} from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";

const levelOptions: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function CourseFormPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    thumbnail: "",
    level: "beginner",
    tags: [],
    linkedLessons: [],
    linkedCombo: [],
    isPublished: false,
  });
  const [tagInput, setTagInput] = useState("");

  // Fetch all lessons for linking
  useEffect(() => {
    const fetchLessons = async () => {
      setLessonsLoading(true);
      try {
        const res = await lessonService.getAll();
        setAllLessons(res.data.data.lessons ?? []);
      } catch {
        // silently fail
      } finally {
        setLessonsLoading(false);
      }
    };
    fetchLessons();
  }, []);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await courseService.getById(courseId);
        const course = res.data.data.course;
        setForm({
          title: course.title,
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          level: course.level,
          tags: course.tags || [],
          linkedLessons: course.linkedLessons ?? [],
          linkedCombo: (course.linkedCombo || []).map((c) => c.comboId),
          isPublished: course.isPublished,
        });
      } catch {
        toast.error("Failed to load course");
        navigate("/admin/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!normalized || form.tags.includes(normalized)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, normalized] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const toggleLesson = (lessonId: string) => {
    setForm((prev) => ({
      ...prev,
      linkedLessons: prev.linkedLessons.includes(lessonId)
        ? prev.linkedLessons.filter((id) => id !== lessonId)
        : [...prev.linkedLessons, lessonId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("admin.courses.form.titleRequired"));
      return;
    }

    try {
      setSaving(true);
      if (isEditing && courseId) {
        await courseService.update(courseId, {
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail,
          level: form.level,
          tags: form.tags,
          linkedLessons: form.linkedLessons,
          linkedCombo: form.linkedCombo,
          isPublished: form.isPublished,
        });
        toast.success(t("admin.courses.form.updatedSuccess"));
      } else {
        await courseService.create({
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail,
          level: form.level,
          tags: form.tags,
          linkedLessons: form.linkedLessons,
          linkedCombo: form.linkedCombo,
          isPublished: form.isPublished,
        });
        toast.success(t("admin.courses.form.createdSuccess"));
      }
      navigate("/admin/courses");
    } catch {
      toast.error(
        isEditing ? t("admin.courses.form.failedUpdate") : t("admin.courses.form.failedCreate"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading course...
        </div>
      </div>
    );
  }

  const filteredLessons = allLessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(lessonSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/courses")}>
          <ArrowLeft className="size-4" /> {t("admin.courses.form.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditing ? t("admin.courses.editCourse") : t("admin.courses.newCourse")}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? t("admin.courses.form.updateCourseDetails")
              : t("admin.courses.form.createNewCourse")}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <main className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <Label htmlFor="title">{t("admin.courses.form.title")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={t("admin.courses.form.placeholder.title")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t("admin.courses.form.description")}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t("admin.courses.form.placeholder.description")}
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">{t("admin.courses.form.thumbnailUrl")}</Label>
                <Input
                  id="thumbnail"
                  value={form.thumbnail}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, thumbnail: e.target.value }))
                  }
                  placeholder={t("admin.courses.form.placeholder.thumbnail")}
                />
                {form.thumbnail && (
                  <div className="mt-3 overflow-hidden rounded-xl border">
                    <img
                      src={form.thumbnail}
                      alt="Preview"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="level">{t("admin.courses.form.level")}</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      level: value as CourseLevel,
                    }))
                  }
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("admin.courses.form.tags")}</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("admin.courses.form.placeholder.tag")}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    {t("common.add")}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">{t("admin.courses.form.published")}</Label>
                <Switch
                  id="isPublished"
                  checked={form.isPublished}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isPublished: checked }))
                  }
                />
              </div>

              <button
                type="submit"
                className="btn-modal-primary w-full"
                disabled={saving}
              >
                <Save className="size-4" />
                {saving
                  ? t("admin.courses.form.saving")
                  : isEditing
                    ? t("admin.courses.form.updateCourse")
                    : t("admin.courses.form.createCourse")}
              </button>
            </CardContent>
          </Card>

          {/* Linked Lessons */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>{t("admin.courses.form.linkedLessons")}</Label>
                <Badge variant="outline">{form.linkedLessons.length}</Badge>
              </div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  placeholder={t("admin.courses.form.searchLessonsPlaceholder")}
                  className="input w-full !rounded-xl !pl-10 !py-2.5 text-sm"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>
              <div
                className="max-h-[300px] overflow-y-auto space-y-1"
                style={{ minHeight: "100px" }}
              >
                {lessonsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t("admin.courses.form.loading")}
                  </p>
                ) : filteredLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {lessonSearch ? t("admin.courses.form.noLessonsMatch") : t("admin.courses.form.noLessonsAvailable")}
                  </p>
                ) : (
                  filteredLessons.map((lesson) => {
                    const selected = form.linkedLessons.includes(lesson._id);
                    return (
                      <button
                        key={lesson._id}
                        type="button"
                        onClick={() => toggleLesson(lesson._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-[var(--surface-secondary)] text-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        >
                          {selected && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">
                            {lesson.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Order {lesson.order} • {lesson.duration} min
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
