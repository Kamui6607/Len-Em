import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Save, Check, Search, Package, Boxes } from "lucide-react";
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
import { kitService, type Kit } from "../../../shared/api/kitService";
import type {
  CourseLevel,
  CourseFormData,
  Lesson,
} from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import {
  AdminFormSkeleton,
  AdminPickerSkeleton,
} from "../../../shared/components/skeletons/AdminSkeleton";
import { AdminBackHeader } from "../../../shared/components/admin/AdminBackHeader";

const levelOptions: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "mid", label: "Intermediate" },
  { value: "pro", label: "Advanced" },
];

/**
 * GET /courses/{id} trả `linkedLessons` dạng populated objects (đầy đủ lesson)
 * trong khi POST/PUT yêu cầu mảng id string → chuẩn hóa về string cả lúc load
 * lẫn lúc submit để không vấp lỗi "linkedLessons[0]" must be a string.
 */
const toIdStrings = (
  items?: Array<string | { _id?: string; id?: string }>,
): string[] =>
  (items ?? [])
    .map((item) => (typeof item === "string" ? item : item?._id ?? item?.id ?? ""))
    .filter((id): id is string => Boolean(id));

interface DerivedMaterial {
  id: string;
  name: string;
  image?: string;
  /** Số bài học (đã chọn) dùng nguyên liệu này. */
  lessonCount: number;
}

export function CourseFormPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  // GET /lessons lỗi → không suy ra được nguyên liệu, khi lưu giữ nguyên giá trị cũ của course.
  const [lessonsFailed, setLessonsFailed] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  // Kits chỉ để tra tên combo — combo của course lấy từ các bài học liên kết.
  const [allCombos, setAllCombos] = useState<Kit[]>([]);
  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    thumbnail: "",
    level: "beginner",
    price: 0,
    tags: [],
    linkedLessons: [],
    isPublished: false,
  });
  const [tagInput, setTagInput] = useState("");
  // Ảnh bìa chọn từ máy — POST /courses nhận `thumbnail` dạng binary (multipart).
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Dọn object URL của file preview khi đổi file / unmount để không rò rỉ bộ nhớ.
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  // Fetch all lessons for linking
  useEffect(() => {
    const fetchLessons = async () => {
      setLessonsLoading(true);
      try {
        const res = await lessonService.getAll();
        setAllLessons(res.data.data.lessons ?? []);
      } catch {
        setLessonsFailed(true);
      } finally {
        setLessonsLoading(false);
      }
    };
    fetchLessons();
  }, []);

  // Kits — chỉ dùng tra tên combo hiển thị trong phần nguyên liệu.
  useEffect(() => {
    kitService
      .getAll({ limit: 100 })
      .then((res) => setAllCombos(res.data.data?.kits ?? []))
      .catch(() => {});
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
          price: course.price ?? 0,
          tags: course.tags || [],
          // GET /courses/{id} trả linkedLessons đã populate (object lesson) → chuẩn về id string
          linkedLessons: toIdStrings(course.linkedLessons),
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

  /**
   * Nguyên liệu của course = hợp (không trùng) product + combo của các bài học đã
   * chọn. Mỗi lesson đã gắn sẵn nguyên liệu riêng nên course không chọn lại.
   */
  const materials = useMemo(() => {
    const products = new Map<string, DerivedMaterial>();
    const combos = new Map<string, DerivedMaterial>();
    const selected = new Set(form.linkedLessons);
    for (const lesson of allLessons) {
      if (!selected.has(lesson._id)) continue;
      const seenProducts = new Set<string>();
      for (const lp of lesson.linkedProduct ?? []) {
        const ref = lp.productId;
        const id = typeof ref === "string" ? ref : ref?._id;
        if (!id || seenProducts.has(id)) continue;
        seenProducts.add(id);
        const existing = products.get(id);
        if (existing) existing.lessonCount += 1;
        else
          products.set(id, {
            id,
            name: typeof ref === "object" && ref ? ref.name : id,
            image: typeof ref === "object" && ref ? ref.image : undefined,
            lessonCount: 1,
          });
      }
      const seenCombos = new Set<string>();
      for (const lc of lesson.linkedCombo ?? []) {
        const id = lc.comboId;
        if (!id || seenCombos.has(id)) continue;
        seenCombos.add(id);
        const existing = combos.get(id);
        if (existing) existing.lessonCount += 1;
        else {
          const kit = allCombos.find((k) => k._id === id);
          combos.set(id, { id, name: kit?.name ?? id, image: kit?.thumbnail, lessonCount: 1 });
        }
      }
    }
    return { products: [...products.values()], combos: [...combos.values()] };
  }, [form.linkedLessons, allLessons, allCombos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("admin.courses.form.titleRequired"));
      return;
    }
    // Model Course ở BE bắt buộc description và thumbnail — thiếu thì Mongoose
    // ném ValidationError (500) dù Joi cho qua.
    if (!form.description.trim()) {
      toast.error(t("admin.courses.form.descriptionRequired"));
      return;
    }
    if (!thumbnailFile && !form.thumbnail) {
      toast.error(t("admin.courses.form.thumbnailRequired"));
      return;
    }

    try {
      setSaving(true);
      // `data` — JSON object chứa chi tiết khóa học (title, description, level,
      // linkedLessons, tags, linkedCombo, isPublished, price); `thumbnail` — file ảnh
      // đính kèm riêng trong multipart/form-data.
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        // Có file mới → BE tự gán thumbnail từ file upload.
        thumbnail: thumbnailFile ? undefined : form.thumbnail,
        level: form.level,
        price: form.price,
        tags: form.tags,
        linkedLessons: toIdStrings(form.linkedLessons),
        // Suy ra từ bài học; GET /lessons lỗi thì không gửi để khỏi xóa nhầm dữ liệu cũ.
        ...(lessonsFailed
          ? {}
          : {
              linkedProduct: materials.products.map((p) => p.id),
              linkedCombo: materials.combos.map((c) => c.id),
            }),
        isPublished: form.isPublished,
      };
      if (isEditing && courseId) {
        await courseService.update(courseId, data, thumbnailFile ?? undefined);
        toast.success(t("admin.courses.form.updatedSuccess"));
      } else {
        // createCourseSchema của BE đã nhận `price` → không cần PUT lại sau khi tạo.
        await courseService.create(data, thumbnailFile ?? undefined);
        toast.success(t("admin.courses.form.createdSuccess"));
      }
      navigate("/admin/courses");
    } catch (err) {
      // Lỗi có response đã được axiosClient toast bằng message của BE → tránh toast đôi.
      if (!(err as { response?: unknown })?.response) {
        toast.error(
          isEditing ? t("admin.courses.form.failedUpdate") : t("admin.courses.form.failedCreate"),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    // Skeleton dựng đúng layout form course (back + tiêu đề, panel field bên
    // trái, panel ảnh/giá/trạng thái bên phải) → khi data về không nhảy.
    return <AdminFormSkeleton />;
  }

  const filteredLessons = allLessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(lessonSearch.toLowerCase()),
  );


  return (
    <div className="space-y-6">
      <AdminBackHeader
        title={isEditing ? t("admin.courses.editCourse") : t("admin.courses.newCourse")}
        subtitle={
          isEditing
            ? t("admin.courses.form.updateCourseDetails")
            : t("admin.courses.form.createNewCourse")
        }
        onBack={() => navigate("/admin/courses")}
        backLabel={t("admin.courses.form.back")}
      />

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
                <Label htmlFor="thumbnail">{t("admin.courses.form.thumbnail")}</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.courses.form.thumbnailHint")}
                </p>
                {(thumbnailPreview || form.thumbnail) && (
                  <div className="mt-3 overflow-hidden rounded-xl border">
                    <img
                      src={thumbnailPreview ?? form.thumbnail}
                      alt="Preview"
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}
                {thumbnailFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setThumbnailFile(null)}
                  >
                    {t("admin.courses.form.removeThumbnail")}
                  </Button>
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
                <Label htmlFor="price">Price (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.price > 0 ? String(form.price) : ""}
                  placeholder="0 = Free course"
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      price: Number.isNaN(next) || next < 0 ? 0 : Math.round(next),
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set 0 for a free course. Enter an amount (e.g. 500000) to sell
                  this course as a premium course (Buy Now).
                </p>
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
                  <AdminPickerSkeleton rows={4} />
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

          {/* Nguyên liệu — tự tổng hợp từ các bài học liên kết (chỉ đọc) */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>{t("admin.courses.form.materialsFromLessons")}</Label>
                <Badge variant="outline">
                  {materials.products.length + materials.combos.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.courses.form.materialsHint")}
              </p>
              {lessonsLoading ? (
                <AdminPickerSkeleton rows={3} />
              ) : lessonsFailed ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("admin.courses.form.materialsUnavailable")}
                </p>
              ) : materials.products.length + materials.combos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {form.linkedLessons.length === 0
                    ? t("admin.courses.form.materialsSelectLessons")
                    : t("admin.courses.form.materialsEmpty")}
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {[
                    { key: "products", icon: Package, label: t("admin.courses.form.materialsProducts"), items: materials.products },
                    { key: "combos", icon: Boxes, label: t("admin.courses.form.materialsCombos"), items: materials.combos },
                  ]
                    .filter((group) => group.items.length > 0)
                    .map(({ key, icon: Icon, label, items }) => (
                      <div key={key} className="space-y-1">
                        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <Icon className="size-3.5" />
                          {label} ({items.length})
                        </p>
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                            {item.image ? (
                              <img src={item.image} alt="" className="size-8 flex-shrink-0 rounded-md object-cover" />
                            ) : (
                              <span className="size-8 flex-shrink-0 rounded-md bg-[var(--surface-secondary)]" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-xs">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {t("admin.courses.form.materialsUsedIn", { count: item.lessonCount })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
