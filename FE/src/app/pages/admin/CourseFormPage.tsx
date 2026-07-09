import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { courseService } from "../../../api/courseService";
import type { CourseLevel, CourseFormData } from "../../../features/learn/types/learn.types";

const levelOptions: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function CourseFormPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CourseFormData>({
    title: "",
    description: "",
    thumbnail: "",
    level: "beginner",
    tags: [],
    linkedCombo: [],
    isPublished: false,
  });
  const [tagInput, setTagInput] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
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
          linkedCombo: form.linkedCombo,
          isPublished: form.isPublished,
        });
        toast.success("Course updated successfully");
      } else {
        await courseService.create({
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail,
          level: form.level,
          tags: form.tags,
          linkedCombo: form.linkedCombo,
          isPublished: form.isPublished,
        });
        toast.success("Course created successfully");
      }
      navigate("/admin/courses");
    } catch {
      toast.error(isEditing ? "Failed to update course" : "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading course...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/courses")}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? "Edit Course" : "New Course"}</h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update course details and settings" : "Create a new course for learners"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <main className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Complete Skincare Routine for Oily Skin"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description..."
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={form.thumbnail}
                  onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
                {form.thumbnail && (
                  <div className="mt-3 overflow-hidden rounded-xl border">
                    <img src={form.thumbnail} alt="Preview" className="aspect-video w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, level: value as CourseLevel }))}
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
                <Label>Tags</Label>
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
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
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
                <Label htmlFor="isPublished">Published</Label>
                <Switch
                  id="isPublished"
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving..." : isEditing ? "Update Course" : "Create Course"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}