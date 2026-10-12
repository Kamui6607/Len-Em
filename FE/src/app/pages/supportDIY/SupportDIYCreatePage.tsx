import { useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  MessageCircleHeart,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supportDIYService } from "../../../features/supportDIY/services/supportDIY.service";
import type { CreateSupportDIYDTO } from "../../../features/supportDIY/types/supportDIY.types";
import { useProductsQuery } from "../../../shared/hooks/useProductsQuery";
import {
  ProductSelectDropdown,
  type ProductSelectOption,
} from "../../../shared/components/ProductSelectDropdown";
import { formatPrice } from "../../../lib/formatPrice";
import "../../../styles/craft.css";
import "../../../styles/supportDIY.css";

interface ComboItem {
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

/** Các bước đội ngũ hỗ trợ sau khi nhận yêu cầu — hiển thị ở cột phải */
const SUPPORT_FLOW = [
  { title: "Gửi yêu cầu", desc: "Kể vấn đề kèm ảnh nếu có" },
  { title: "Len&em phản hồi", desc: "Bạn nhận thông báo khi có trả lời" },
  { title: "Cùng hoàn thiện", desc: "Gợi ý cách làm và nguyên liệu phù hợp" },
];

export function SupportDIYCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sản phẩm liên quan lấy từ API thật (GET /products) rồi cho CHỌN TỪ DANH SÁCH
  // (select) thay vì gõ search. Trước đây dùng mock data → productId không phải
  // ObjectId nên linkedProduct gửi lên BE không dùng được.
  // BE cap limit=100 → 1 request là đủ cho danh sách chọn.
  const productsQuery = useProductsQuery({ limit: 100 });

  const productOptions: ProductSelectOption[] = useMemo(
    () =>
      (productsQuery.data?.data ?? [])
        .map((product) => ({
          productId: product.id,
          name: product.name,
          thumbnail: product.image,
          price: product.variants?.[0]?.price ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [productsQuery.data],
  );

  // Tiến độ điền form — mỗi phần là một "mũi khâu" trên thanh tiến trình.
  const steps = [
    { label: "Vấn đề", done: Boolean(title.trim() && description.trim()) },
    { label: "Hình ảnh", done: imagePreviews.length > 0 },
    { label: "Thẻ", done: tags.length > 0 },
    { label: "Ngân sách", done: price > 0 },
  ];
  const stepsDone = steps.filter((s) => s.done).length;
  const canSubmit = Boolean(title.trim() && description.trim());

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setSelectedFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!normalized) return;
    if (tags.includes(normalized)) { toast.error("Tag đã được thêm rồi"); return; }
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Bạn cần thêm tiêu đề và mô tả nhé");
      return;
    }
    setLoading(true);
    try {
      const data: CreateSupportDIYDTO = {
        title: title.trim(),
        description: description.trim(),
        tags: tags.length > 0 ? tags : undefined,
        linkedProduct: comboItems.length > 0
          ? comboItems.map((item) => ({ productId: item.productId }))
          : undefined,
        price: price > 0 ? price : undefined,
      };
      await supportDIYService.createPost(data, selectedFiles);
      // Success feedback comes from the real-time SUPPORT notification via
      // useNotificationSocket ("🛠️ Đã gửi yêu cầu hỗ trợ DIY" + description).
      // Toasting here as well made the same event pop up twice.
      navigate("/diy");
    } catch (error) {
      // API errors (4xx/5xx) are already toasted ONCE by the axios
      // interceptor with the backend's own message — only surface transport
      // failures (timeout / network) here, so every failure shows exactly
      // one toast instead of two.
      const axiosError = error as { response?: unknown };
      if (!axiosError.response) {
        toast.error("Gửi yêu cầu thất bại, thử lại giúp mình nhé");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/diy" className="support-back">
          <ArrowLeft className="w-4 h-4" />
          Quay lại Góc sáng tạo
        </Link>

        {/* ── Hero + tiến trình ── */}
        <section className="craft-hero craft-rise support-hero">
          <div className="support-hero-row">
            <div className="min-w-0">
              <span className="craft-eyebrow">Hỗ trợ DIY</span>
              <h1 className="craft-title">
                Đang vướng ở mũi nào? <em>Kể mình nghe.</em>
              </h1>
              <div className="craft-stitch" aria-hidden />
              <p className="craft-subtitle">
                Kể cho mình nghe bạn đang vướng ở đâu, đội ngũ Len&em sẽ đồng hành cùng bạn
                hoàn thành dự án.
              </p>
            </div>

            <div className="support-progress" aria-label={`Đã hoàn thành ${stepsDone}/4 phần`}>
              <p className="support-progress-label">
                <strong>{stepsDone}</strong>/4 phần đã điền
              </p>
              <ol className="support-progress-thread">
                {steps.map((step, i) => (
                  <li key={step.label} className={step.done ? "is-done" : ""}>
                    {i > 0 && <span className="support-progress-line" aria-hidden />}
                    <span className="support-progress-knot">
                      {step.done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="support-progress-name">{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="support-layout">
          {/* ── Cột trái: các bước điền form ── */}
          <div className="support-steps">
            <SupportStep
              n={1}
              title="Bạn cần giúp gì?"
              hint="Bắt buộc"
              done={steps[0].done}
            >
              <div className="space-y-4">
                <div>
                  <label className="support-label" htmlFor="support-title">
                    Tiêu đề <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="support-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="diy-input w-full"
                    placeholder="Ví dụ: Mình đang gặp khó với túi crochet"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="support-label" htmlFor="support-desc">
                      Mô tả chi tiết <span className="text-destructive">*</span>
                    </label>
                    <span className="support-counter">{description.trim().length} ký tự</span>
                  </div>
                  <textarea
                    id="support-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="diy-input w-full resize-y"
                    placeholder="Bạn đang làm đến bước nào, gặp vướng mắc gì? Mô tả càng cụ thể, mình hỗ trợ càng chính xác."
                  />
                </div>
                <p className="support-note">
                  <MessageCircleHeart className="w-4 h-4 flex-shrink-0" />
                  Không cần viết hoàn hảo — cứ kể tự nhiên như đang nhắn tin cho một người bạn biết đan len.
                </p>
              </div>
            </SupportStep>

            <SupportStep
              n={2}
              title="Hình ảnh"
              hint="Không bắt buộc · ảnh giúp tụi mình thấy rõ mũi đan"
              done={steps[1].done}
            >
              <div className="support-images">
                <label className="support-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                  <span className="support-dropzone-icon">
                    <ImagePlus className="w-5 h-5" />
                  </span>
                  <span className="support-dropzone-text">
                    {imagePreviews.length > 0 ? "Thêm ảnh" : "Chọn ảnh từ máy"}
                  </span>
                </label>
                {imagePreviews.map((preview, i) => (
                  <div key={preview} className="diy-image-thumb diy-fade-in">
                    <img src={preview} alt="" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Xoá ảnh"
                      className="diy-image-remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </SupportStep>

            <SupportStep
              n={3}
              title="Gắn thẻ"
              hint="Không bắt buộc · ví dụ: crochet, mũ len, móc hoa"
              done={steps[2].done}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="diy-input flex-1"
                    placeholder="Gõ thẻ rồi nhấn Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="support-add-btn"
                    aria-label="Thêm thẻ"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className="support-tag diy-fade-in"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        aria-label={`Xoá thẻ ${tag}`}
                      >
                        #{tag}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SupportStep>

            <SupportStep
              n={4}
              title="Ngân sách dự kiến"
              hint="Không bắt buộc · chưa chắc thì cứ để trống"
              done={steps[3].done}
            >
              <div className="support-price">
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="diy-input w-full"
                  placeholder="Ví dụ: 200000"
                  min={0}
                />
                <span className="support-price-unit">VNĐ</span>
              </div>
              {price > 0 && (
                <p className="support-price-preview">≈ {formatPrice(price)}</p>
              )}
            </SupportStep>
          </div>

          {/* ── Cột phải: sản phẩm liên quan + quy trình + gửi ── */}
          <aside className="support-aside">
            <section className="support-card">
              <div className="support-card-head">
                <span className="craft-section-icon">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="support-card-title">Sản phẩm liên quan</h2>
                  <p className="support-card-sub">
                    Đính kèm sản phẩm để tụi mình hình dung đúng dự án của bạn
                  </p>
                </div>
              </div>

              {/* Wrapper keeps the dropdown as a floating overlay instead of pushing layout down */}
              <div className="diy-search-wrapper">
                <ProductSelectDropdown
                  triggerClassName="diy-input w-full"
                  options={productOptions}
                  selectedIds={comboItems.map((item) => item.productId)}
                  isLoading={productsQuery.isLoading}
                  placeholder="Chọn sản phẩm liên quan..."
                  onSelect={(option) =>
                    setComboItems((prev) => [
                      ...prev,
                      {
                        productId: option.productId,
                        name: option.name,
                        thumbnail: option.thumbnail,
                        price: option.price,
                        quantity: 1,
                      },
                    ])
                  }
                />
              </div>

              {comboItems.length > 0 ? (
                <div className="support-combo">
                  {comboItems.map((item) => (
                    <div key={item.productId} className="support-combo-row diy-fade-in">
                      <img src={item.thumbnail} alt={item.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        {item.price > 0 && (
                          <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setComboItems((prev) => prev.filter((i) => i.productId !== item.productId))
                        }
                        className="diy-remove-btn"
                        title="Bỏ chọn"
                        aria-label={`Bỏ chọn ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="support-combo-empty">
                  Chưa chọn sản phẩm nào — bỏ qua cũng không sao.
                </p>
              )}
            </section>

            <section className="support-card support-flow">
              <h2 className="support-card-title mb-3">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                Sau khi gửi
              </h2>
              <ol>
                {SUPPORT_FLOW.map((item, i) => (
                  <li key={item.title}>
                    <span className="support-flow-knot">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="support-actions">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="craft-btn w-full"
              >
                {loading ? "Đang gửi…" : <><Send className="w-4 h-4" /> Gửi yêu cầu</>}
              </button>
              <button
                type="button"
                onClick={() => navigate("/diy")}
                disabled={loading}
                className="support-later"
              >
                Để sau
              </button>
              {!canSubmit && (
                <p className="support-actions-hint">Điền tiêu đề và mô tả để gửi nhé</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SupportStep({
  n,
  title,
  hint,
  done,
  children,
}: {
  n: number;
  title: string;
  hint: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`support-step ${done ? "is-done" : ""}`}>
      <div className="support-step-head">
        <span className="support-step-knot">
          {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0">
          <h2 className="support-step-title">{title}</h2>
          <p className="support-step-hint">{hint}</p>
        </div>
      </div>
      <div className="support-step-body">{children}</div>
    </section>
  );
}
