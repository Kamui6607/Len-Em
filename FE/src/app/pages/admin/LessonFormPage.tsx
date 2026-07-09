import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { lessonService } from "../../../api/lessonService";
import type { LessonFormData } from "../../../features/learn/types/learn.types";

export function LessonFormPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const isEditing = Boolean(lessonId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LessonFormData>({
    title: "",
    order: 1,
    videoUrl: "",
    duration: 0,
    isPreview: true,
  });

  useEffect(() => {
    if (!lessonId) return;
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const res = await lessonService.getById(lessonId);
        const lesson = res.data.data.lesson;
        setForm({
          title: lesson.title,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          isPreview: lesson.isPreview,
        });
      } catch {
        toast.error("Failed to load lesson");
        navigate("/admin/lessons");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.videoUrl.trim()) {
      toast.error("Video URL is required");
      return;
    }

    try {
      setSaving(true);
      if (isEditing && lessonId) {
        await lessonService.update(lessonId, {
          title: form.title,
          order: form.order,
          videoUrl: form.videoUrl,
          duration: form.duration,
          isPreview: form.isPreview,
        });
        toast.success("Lesson updated successfully");
      } else {
        await lessonService.create({
          title: form.title,
          order: form.order,
          videoUrl: form.videoUrl,
          duration: form.duration,
          isPreview: form.isPreview,
        });
        toast.success("Lesson created successfully");
      }
      navigate("/admin/lessons");
    } catch {
      toast.error(isEditing ? "Failed to update lesson" : "Failed to create lesson");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/lessons")}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? "Edit Lesson" : "New Lesson"}</h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update lesson details" : "Create a new standalone lesson"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Bài 1: Hướng dẫn tạo vòng tròn ma thuật"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-3">
                  <Label htmlFor="isPreview">Preview (free)</Label>
                  <Switch
                    id="isPreview"
                    checked={form.isPreview}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPreview: checked }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                value={form.videoUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                YouTube, Vimeo, or direct video URL. Videos will be embedded in the lesson player.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : isEditing ? "Update Lesson" : "Create Lesson"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}