import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { lessonService } from "../../../api/lessonService";
import { productService, type Product } from "../../../api/productService";
import { kitService, type Kit } from "../../../api/kitService";
import type { LessonFormData } from "../../../features/learn/types/learn.types";

export function LessonFormPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const isEditing = Boolean(lessonId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allKits, setAllKits] = useState<Kit[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [kitSearch, setKitSearch] = useState("");

  const [form, setForm] = useState<LessonFormData>({
    title: "",
    order: 1,
    videoUrl: "",
    duration: 0,
    linkedProduct: [],
    linkedCombo: [],
    isPreview: true,
  });

  useEffect(() => {
    Promise.all([
      productService.getAll({ limit: 100 }).then((res) => {
        setAllProducts(res.data.data?.products ?? []);
      }).catch(() => {}).finally(() => setProductsLoading(false)),
      kitService.getAll({ limit: 100 }).then((res) => {
        setAllKits(res.data.data?.kits ?? []);
      }).catch(() => {}).finally(() => setKitsLoading(false)),
    ]);
  }, []);

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
          linkedProduct: lesson.linkedProduct ?? [],
          linkedCombo: lesson.linkedCombo ?? [],
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
          linkedProduct: form.linkedProduct,
          linkedCombo: form.linkedCombo,
          isPreview: form.isPreview,
        });
        toast.success("Lesson updated successfully");
      } else {
        await lessonService.create({
          title: form.title,
          order: form.order,
          videoUrl: form.videoUrl,
          duration: form.duration,
          linkedProduct: form.linkedProduct,
          linkedCombo: form.linkedCombo,
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

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      linkedProduct: prev.linkedProduct.some((p) => p.productId === productId)
        ? prev.linkedProduct.filter((p) => p.productId !== productId)
        : [...prev.linkedProduct, { productId }],
    }));
  };

  const toggleCombo = (comboId: string) => {
    setForm((prev) => ({
      ...prev,
      linkedCombo: prev.linkedCombo.some((c) => c.comboId === comboId)
        ? prev.linkedCombo.filter((c) => c.comboId !== comboId)
        : [...prev.linkedCombo, { comboId }],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredKits = allKits.filter((k) =>
    k.name.toLowerCase().includes(kitSearch.toLowerCase())
  );

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

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <main className="space-y-6">
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

              <button type="submit" className="btn-modal-primary" disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving..." : isEditing ? "Update Lesson" : "Create Lesson"}
              </button>
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Linked Products */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>Linked Products</Label>
                <Badge variant="outline">{form.linkedProduct.length}</Badge>
              </div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="input w-full !rounded-xl !pl-10 !py-2.5 text-sm"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1">
                {productsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading products...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {productSearch ? "No products match" : "No products available"}
                  </p>
                ) : (
                  filteredProducts.map((product) => {
                    const selected = form.linkedProduct.some((p) => p.productId === product._id);
                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => toggleProduct(product._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selected ? "bg-primary/10 text-primary" : "hover:bg-[var(--surface-secondary)] text-foreground"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{product.category}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Combos */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>Linked Combos</Label>
                <Badge variant="outline">{form.linkedCombo.length}</Badge>
              </div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  placeholder="Search combos..."
                  className="input w-full !rounded-xl !pl-10 !py-2.5 text-sm"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1">
                {kitsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading combos...</p>
                ) : filteredKits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {kitSearch ? "No combos match" : "No combos available"}
                  </p>
                ) : (
                  filteredKits.map((kit) => {
                    const selected = form.linkedCombo.some((c) => c.comboId === kit._id);
                    return (
                      <button
                        key={kit._id}
                        type="button"
                        onClick={() => toggleCombo(kit._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selected ? "bg-primary/10 text-primary" : "hover:bg-[var(--surface-secondary)] text-foreground"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{kit.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{kit.level}</p>
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