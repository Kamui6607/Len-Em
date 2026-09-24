import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Check, Save, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
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
import { Card, CardContent } from "../../../shared/components/ui/card";
import { AdminBackHeader } from "../../../shared/components/admin/AdminBackHeader";
import {
  AdminFormSkeleton,
  AdminPickerSkeleton,
} from "../../../shared/components/skeletons/AdminSkeleton";
import {
  videoService,
  type CreateVideoRequest,
  type VideoType,
} from "../../../shared/api/videoService";
import { productService, type Product } from "../../../shared/api/productService";
import { kitService, type Kit } from "../../../shared/api/kitService";
import { useLanguage } from "../../../shared/contexts/LanguageContext";

/** Client-side guard mirroring the BE's 500MB upload limit. */
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

const typeOptions: { value: VideoType; label: string }[] = [
  { value: "community", label: "Community" },
  { value: "premium", label: "Premium" },
];

/** GET may return attached ids as plain strings OR populated objects. */
const toIds = (items?: Array<string | { _id: string }>): string[] =>
  (items ?? []).map((item) => (typeof item === "string" ? item : item._id));

export function VideoFormPage() {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const isEditing = Boolean(videoId);
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allKits, setAllKits] = useState<Kit[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [kitSearch, setKitSearch] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "community" as VideoType,
    url: "",
    category: "",
    tags: [] as string[],
    attachedProducts: [] as string[],
    attachedKits: [] as string[],
  });

  // Picker sources: products + kits (giống LessonFormPage).
  useEffect(() => {
    Promise.all([
      productService
        .getAll({ limit: 100 })
        .then((res) => setAllProducts(res.data.data?.products ?? []))
        .catch(() => {})
        .finally(() => setProductsLoading(false)),
      kitService
        .getAll({ limit: 100 })
        .then((res) => setAllKits(res.data.data?.kits ?? []))
        .catch(() => {})
        .finally(() => setKitsLoading(false)),
    ]);
  }, []);

  // Edit mode: GET /videos/{id} (also refreshes the view count on the BE).
  useEffect(() => {
    if (!videoId) return;
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const res = await videoService.getById(videoId);
        const video = res.data.data?.video;
        if (!video) throw new Error("not found");
        setForm({
          title: video.title,
          description: video.description ?? "",
          type: (video.type as VideoType) || "community",
          url: video.url,
          category: video.category ?? "",
          tags: video.tags ?? [],
          attachedProducts: toIds(video.attachedProducts),
          attachedKits: toIds(video.attachedKits),
        });
      } catch {
        toast.error(t("admin.videos.loadError"));
        navigate("/admin/videos");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId, navigate, t]);

  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!normalized || form.tags.includes(normalized)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, normalized] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  };

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      attachedProducts: prev.attachedProducts.includes(productId)
        ? prev.attachedProducts.filter((id) => id !== productId)
        : [...prev.attachedProducts, productId],
    }));
  };

  const toggleKit = (kitId: string) => {
    setForm((prev) => ({
      ...prev,
      attachedKits: prev.attachedKits.includes(kitId)
        ? prev.attachedKits.filter((id) => id !== kitId)
        : [...prev.attachedKits, kitId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("admin.videos.form.titleRequired"));
      return;
    }

    try {
      setSaving(true);

      // Create: upload file trước (POST /videos/upload → Cloudinary url) rồi tạo entry.
      if (!isEditing) {
        let url = form.url.trim();
        if (videoFile) {
          if (videoFile.size > MAX_VIDEO_SIZE) {
            toast.error(t("admin.videos.form.fileTooLarge"));
            setSaving(false);
            return;
          }
          setUploading(true);
          try {
            const uploadRes = await videoService.uploadVideo(videoFile);
            url = uploadRes.data.data?.url ?? "";
          } finally {
            setUploading(false);
          }
        }
        if (!url) {
          toast.error(t("admin.videos.form.urlRequired"));
          setSaving(false);
          return;
        }

        const payload: CreateVideoRequest = {
          title: form.title,
          description: form.description,
          type: form.type,
          url,
          category: form.category,
          tags: form.tags,
          attachedProducts: form.attachedProducts,
          attachedKits: form.attachedKits,
        };
        await videoService.create(payload);
        toast.success(t("admin.videos.form.createdSuccess"));
      } else {
        // PATCH /videos/admin-update/{id} chỉ cho sửa title, description,
        // attachedProducts, attachedKits (url/type/category/tags bất biến).
        await videoService.adminUpdate(videoId!, {
          title: form.title,
          description: form.description,
          attachedProducts: form.attachedProducts,
          attachedKits: form.attachedKits,
        });
        toast.success(t("admin.videos.form.updatedSuccess"));
      }
      navigate("/admin/videos");
    } catch {
      toast.error(
        isEditing ? t("admin.videos.form.failedUpdate") : t("admin.videos.form.failedCreate"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminFormSkeleton />;
  }

  const filteredProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const filteredKits = allKits.filter((kit) =>
    kit.name.toLowerCase().includes(kitSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <AdminBackHeader
        title={isEditing ? t("admin.videos.editVideo") : t("admin.videos.newVideo")}
        subtitle={
          isEditing
            ? t("admin.videos.form.updateVideoDetails")
            : t("admin.videos.form.createNewVideo")
        }
        onBack={() => navigate("/admin/videos")}
        backLabel={t("admin.videos.form.back")}
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <main className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <Label htmlFor="title">{t("admin.videos.form.title")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t("admin.videos.form.placeholder.title")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t("admin.videos.form.description")}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={t("admin.videos.form.placeholder.description")}
                  rows={4}
                />
              </div>

              <div>
                <Label>{t("admin.videos.type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as VideoType }))
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditing && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("admin.videos.form.immutableHint")}
                  </p>
                )}
              </div>

              {/* Video file upload (POST /videos/upload → Cloudinary) hoặc dán URL */}
              <div className="space-y-3">
                <Label htmlFor="videoFile">{t("admin.videos.form.videoFile")}</Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/mp4,video/mov,video/avi,video/webm,video/x-matroska,.mp4,.mov,.avi,.webm,.mkv"
                  disabled={isEditing}
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.videos.form.videoFileHint")}
                </p>
                {videoFile && (
                  <div className="flex items-center justify-between rounded-xl border p-3">
                    <span className="text-sm truncate">{videoFile.name}</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setVideoFile(null)}
                    >
                      {t("admin.videos.form.removeFile")}
                    </button>
                  </div>
                )}

                <Label htmlFor="url">{t("admin.videos.form.orUrl")}</Label>
                <Input
                  id="url"
                  value={form.url}
                  disabled={isEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder={t("admin.videos.form.placeholder.url")}
                />
                {isEditing && form.url && (
                  <video
                    src={form.url}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-xl bg-black"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="category">{t("admin.videos.category")}</Label>
                <Input
                  id="category"
                  value={form.category}
                  disabled={isEditing}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder={t("admin.videos.form.placeholder.category")}
                />
              </div>

              <div>
                <Label>{t("admin.videos.form.tags")}</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={tagInput}
                    disabled={isEditing}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("admin.videos.form.placeholder.tag")}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      #{tag}
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Attached Products */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>{t("admin.videos.attachedProducts")}</Label>
                <Badge variant="outline">{form.attachedProducts.length}</Badge>
              </div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t("admin.lessons.searchProducts")}
                  className="input w-full !rounded-xl !pl-10 !py-2.5 text-sm"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1">
                {productsLoading ? (
                  <AdminPickerSkeleton rows={4} />
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {productSearch
                      ? t("admin.lessons.noProductsMatch")
                      : t("admin.lessons.noProductsAvailable")}
                  </p>
                ) : (
                  filteredProducts.map((product) => {
                    const selected = form.attachedProducts.includes(product._id);
                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => toggleProduct(product._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-[var(--surface-secondary)] text-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {product.category}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attached Kits / Combos */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>{t("admin.videos.attachedKits")}</Label>
                <Badge variant="outline">{form.attachedKits.length}</Badge>
              </div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  placeholder={t("admin.lessons.searchCombos")}
                  className="input w-full !rounded-xl !pl-10 !py-2.5 text-sm"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1">
                {kitsLoading ? (
                  <AdminPickerSkeleton rows={4} />
                ) : filteredKits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {kitSearch
                      ? t("admin.lessons.noCombosMatch")
                      : t("admin.lessons.noCombosAvailable")}
                  </p>
                ) : (
                  filteredKits.map((kit) => {
                    const selected = form.attachedKits.includes(kit._id);
                    return (
                      <button
                        key={kit._id}
                        type="button"
                        onClick={() => toggleKit(kit._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-[var(--surface-secondary)] text-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{kit.name}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <button type="submit" className="btn-modal-primary w-full" disabled={saving || uploading}>
            {uploading ? <Upload className="size-4" /> : <Save className="size-4" />}
            {saving || uploading
              ? t("admin.videos.form.saving")
              : isEditing
                ? t("admin.videos.form.updateVideo")
                : t("admin.videos.form.createVideo")}
          </button>
        </aside>

      </form>
    </div>
  );
}
