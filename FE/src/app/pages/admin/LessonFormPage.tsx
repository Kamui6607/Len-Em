import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Save, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Switch } from "../../../shared/components/ui/switch";
import { Badge } from "../../../shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { lessonService } from "../../../shared/api/lessonService";
import { productService, type Product } from "../../../shared/api/productService";
import { kitService, type Kit } from "../../../shared/api/kitService";
import type { LessonFormData, LessonLinkedProduct } from "../../../features/learn/types/learn.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { AdminBackHeader } from "../../../shared/components/admin/AdminBackHeader";
import {
  AdminFormSkeleton,
  AdminPickerSkeleton,
} from "../../../shared/components/skeletons/AdminSkeleton";

const NOTE_MAX_LENGTH = 500;

/** productId trong response lesson có thể là string hoặc object sản phẩm đã populate. */
function normalizeProductId(productId: LessonLinkedProduct["productId"]): string {
  return typeof productId === "string" ? productId : productId?._id ?? "";
}

/** Giá trị Select cho lựa chọn "Không chọn variant" (Radix Select không cho value rỗng). */
const NO_VARIANT = "__none__";

interface VariantOption {
  id: string;
  color: string;
  hexCode?: string;
  image?: string;
}

/**
 * Id variant khác tên trường tùy nguồn: GET /products trả `_idVariants`,
 * dữ liệu populate trong lesson/course trả `_id`.
 */
function toVariantOptions(
  variants: { _id?: string; _idVariants?: string; color: string; hexCode?: string; image?: string }[] | undefined,
): VariantOption[] {
  return (variants ?? [])
    .map((v) => ({ id: v._idVariants ?? v._id ?? "", color: v.color, hexCode: v.hexCode, image: v.image }))
    .filter((v) => v.id);
}

function VariantSwatch({ variant }: { variant: VariantOption }) {
  if (variant.image) {
    return <img src={variant.image} alt="" className="size-4 flex-shrink-0 rounded-sm object-cover" />;
  }
  return (
    <span
      className="size-4 flex-shrink-0 rounded-sm border"
      style={{ background: variant.hexCode || "transparent" }}
    />
  );
}

function formatTimestamp(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LessonFormPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const isEditing = Boolean(lessonId);
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allKits, setAllKits] = useState<Kit[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [kitSearch, setKitSearch] = useState("");
  // Tên + variants lấy từ dữ liệu populate — dùng khi sản phẩm không nằm trong 100 sản phẩm đã tải
  const [linkedInfo, setLinkedInfo] = useState<Record<string, { name: string; variants: VariantOption[] }>>({});

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
        const info: Record<string, { name: string; variants: VariantOption[] }> = {};
        const linkedProduct = (lesson.linkedProduct ?? [])
          .map((lp) => {
            const productId = normalizeProductId(lp.productId);
            if (typeof lp.productId === "object" && lp.productId) {
              info[productId] = { name: lp.productId.name, variants: toVariantOptions(lp.productId.variants) };
            }
            return {
              productId,
              variantId: lp.variantId,
              timestamp: lp.timestamp ?? 0,
              note: lp.note ?? "",
            };
          })
          .filter((lp) => lp.productId);
        setLinkedInfo(info);
        setForm({
          title: lesson.title,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          linkedProduct,
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
      toast.error(t("admin.lessons.form.titleRequired"));
      return;
    }
    if (!form.videoUrl.trim()) {
      toast.error(t("admin.lessons.form.videoUrlRequired"));
      return;
    }
    // duration tính bằng phút, timestamp tính bằng giây
    const maxTimestamp = form.duration * 60;
    for (const lp of form.linkedProduct) {
      if (!Number.isFinite(lp.timestamp) || lp.timestamp < 0 || lp.timestamp > maxTimestamp) {
        toast.error(t("admin.lessons.form.timestampInvalid", { max: maxTimestamp }));
        return;
      }
      if (lp.note.length > NOTE_MAX_LENGTH) {
        toast.error(t("admin.lessons.form.noteTooLong", { max: NOTE_MAX_LENGTH }));
        return;
      }
    }
    const linkedProduct = form.linkedProduct.map((lp) => ({
      productId: lp.productId,
      ...(lp.variantId ? { variantId: lp.variantId } : {}),
      timestamp: lp.timestamp,
      note: lp.note.trim(),
    }));

    try {
      setSaving(true);
      if (isEditing && lessonId) {
        await lessonService.update(lessonId, {
          title: form.title,
          order: form.order,
          videoUrl: form.videoUrl,
          duration: form.duration,
          linkedProduct,
          linkedCombo: form.linkedCombo,
          isPreview: form.isPreview,
        });
        toast.success(t("admin.lessons.form.updatedSuccess"));
      } else {
        await lessonService.create({
          title: form.title,
          order: form.order,
          videoUrl: form.videoUrl,
          duration: form.duration,
          linkedProduct,
          linkedCombo: form.linkedCombo,
          isPreview: form.isPreview,
        });
        toast.success(t("admin.lessons.form.createdSuccess"));
      }
      navigate("/admin/lessons");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || (isEditing ? t("admin.lessons.form.failedUpdate") : t("admin.lessons.form.failedCreate")));
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      linkedProduct: prev.linkedProduct.some((p) => p.productId === productId)
        ? prev.linkedProduct.filter((p) => p.productId !== productId)
        : [...prev.linkedProduct, { productId, timestamp: 0, note: "" }],
    }));
  };

  const updateLinkedProduct = (
    productId: string,
    patch: { variantId?: string | undefined; timestamp?: number; note?: string },
  ) => {
    setForm((prev) => ({
      ...prev,
      linkedProduct: prev.linkedProduct.map((p) => (p.productId === productId ? { ...p, ...patch } : p)),
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
    // Skeleton form lesson: khớp layout 2 cột (field chính + sidebar) của trang.
    return <AdminFormSkeleton />;
  }

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredKits = allKits.filter((k) =>
    k.name.toLowerCase().includes(kitSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminBackHeader
        title={isEditing ? t("admin.lessons.editLesson") : t("admin.lessons.newLesson")}
        subtitle={isEditing ? t("admin.lessons.form.updateLessonDetails") : t("admin.lessons.form.createNewLesson")}
        onBack={() => navigate("/admin/lessons")}
        backLabel={t("admin.lessons.form.back")}
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <main className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <Label htmlFor="title">{t("admin.lessons.form.title")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t("admin.lessons.form.placeholder.title")}
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <Label htmlFor="order">{t("admin.lessons.form.order")}</Label>
                  <Input
                    id="order"
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">{t("admin.lessons.form.duration")}</Label>
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
                    <Label htmlFor="isPreview">{t("admin.lessons.form.preview")}</Label>
                    <Switch
                      id="isPreview"
                      checked={form.isPreview}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPreview: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="videoUrl">{t("admin.lessons.form.videoUrl")}</Label>
                <Input
                  id="videoUrl"
                  value={form.videoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder={t("admin.lessons.form.placeholder.videoUrl")}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.lessons.form.hint")}
                </p>
              </div>

              {form.linkedProduct.length > 0 && (
                <div className="space-y-3">
                  <Label>{t("admin.lessons.form.productTimestamps")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.lessons.form.timestampHint", { max: form.duration * 60 })}
                  </p>
                  {form.linkedProduct.map((lp) => {
                    const listed = allProducts.find((p) => p._id === lp.productId);
                    const name = listed?.name ?? linkedInfo[lp.productId]?.name ?? lp.productId;
                    const variants = listed ? toVariantOptions(listed.variants) : linkedInfo[lp.productId]?.variants ?? [];
                    // variantId cũ không còn trong danh sách vẫn phải hiện được trên dropdown
                    const options =
                      lp.variantId && !variants.some((v) => v.id === lp.variantId)
                        ? [...variants, { id: lp.variantId, color: lp.variantId }]
                        : variants;
                    const invalid = lp.timestamp < 0 || lp.timestamp > form.duration * 60;
                    return (
                      <div key={lp.productId} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[140px_1fr]">
                        <p className="truncate text-sm font-medium sm:col-span-2">{name}</p>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`variant-${lp.productId}`} className="text-xs">
                            {t("admin.lessons.form.variantLabel")}
                          </Label>
                          <Select
                            value={lp.variantId ?? NO_VARIANT}
                            onValueChange={(value) =>
                              updateLinkedProduct(lp.productId, { variantId: value === NO_VARIANT ? undefined : value })
                            }
                          >
                            <SelectTrigger id={`variant-${lp.productId}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_VARIANT}>{t("admin.lessons.form.noVariant")}</SelectItem>
                              {options.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  <span className="flex items-center gap-2">
                                    <VariantSwatch variant={v} />
                                    {v.color}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`ts-${lp.productId}`} className="text-xs">
                            {t("admin.lessons.form.timestampLabel")} ({formatTimestamp(lp.timestamp)})
                          </Label>
                          <Input
                            id={`ts-${lp.productId}`}
                            type="number"
                            min={0}
                            max={form.duration * 60}
                            value={lp.timestamp}
                            aria-invalid={invalid}
                            onChange={(e) => updateLinkedProduct(lp.productId, { timestamp: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`note-${lp.productId}`} className="text-xs">
                            {t("admin.lessons.form.noteLabel")}
                          </Label>
                          <Input
                            id={`note-${lp.productId}`}
                            value={lp.note}
                            maxLength={NOTE_MAX_LENGTH}
                            placeholder={t("admin.lessons.form.placeholder.note")}
                            onChange={(e) => updateLinkedProduct(lp.productId, { note: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="submit" className="btn-modal-primary" disabled={saving}>
                <Save className="size-4" />
                {saving ? t("admin.lessons.form.saving") : isEditing ? t("admin.lessons.form.updateLesson") : t("admin.lessons.form.createLesson")}
              </button>
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Linked Products */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Label>{t("admin.lessons.linkedProducts")}</Label>
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
                    {productSearch ? t("admin.lessons.noProductsMatch") : t("admin.lessons.noProductsAvailable")}
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
                <Label>{t("admin.lessons.linkedCombos")}</Label>
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
                    {kitSearch ? t("admin.lessons.noCombosMatch") : t("admin.lessons.noCombosAvailable")}
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