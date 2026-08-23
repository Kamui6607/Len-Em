import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ImagePlus, Plus, Search, Check, Send, X, HelpCircle, Tag, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";
import { products } from "../../data/products";
import { formatPrice } from "../../../lib/formatPrice";
import { supportDIYService } from "../../../features/supportDIY/services/supportDIY.service";
import type { CreateSupportDIYDTO } from "../../../features/supportDIY/types/supportDIY.types";
import "../../../styles/supportDIY.css";

interface ComboItem {
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

export function SupportDIYCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const searchableProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return products
      .map((product) => ({
        productId: product.id,
        name: product.name,
        thumbnail: product.image,
        price: product.variants?.[0]?.price ?? 0,
        tags: product.tags,
      }))
      .filter((product) => {
        if (!search) return true;
        return (
          product.name.toLowerCase().includes(search) ||
          product.tags.some((tag) => tag.toLowerCase().includes(search))
        );
      })
      .slice(0, 8);
  }, [productSearch]);

  // Lightweight progress signal — encodes how much of the request is filled in.
  const stepsDone = useMemo(() => {
    let done = 0;
    if (title.trim()) done += 1;
    if (description.trim()) done += 1;
    if (imagePreviews.length > 0) done += 1;
    if (tags.length > 0) done += 1;
    return done;
  }, [title, description, imagePreviews, tags]);

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
      toast.success("Đã gửi yêu cầu hỗ trợ thành công");
      navigate("/diy");
    } catch {
      toast.error("Gửi yêu cầu thất bại, thử lại giúp mình nhé");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diy-create-page min-h-screen bg-background px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-10">
      <div className="mx-auto max-w-8xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <button onClick={() => navigate("/diy")} className="diy-btn-icon mt-1" aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="mb-1 text-lg font-semibold">Cần hỗ trợ DIY?</h1>
              <span className="diy-progress-pill" aria-label={`Đã hoàn thành ${stepsDone}/4 phần`}>
                {stepsDone}/4
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              Kể cho mình nghe bạn đang vướng ở đâu, đội ngũ Len&em sẽ đồng hành cùng bạn hoàn thành dự án.
            </p>
          </div>
        </div>

        <div className="diy-panel rounded-3xl border p-5 md:p-6 space-y-5">
          {/* Layout chính: trái = lưới 2x2 (4 field-card), phải = 1 card lớn
              (Sản phẩm liên quan) cao bằng đúng khối 2x2 bên trái */}
          <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
            {/* ── Trái: 2 hàng x 2 cột ── */}
            <div className="diy-fields-grid">
              {/* Ô 1: thông tin cơ bản */}
              <div className="diy-field-card diy-field-card--info">
                <div className="diy-field-card-head">
                  <span className="diy-card-icon">
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold">Bạn cần giúp gì?</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Tiêu đề <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="diy-input w-full"
                      placeholder="Ví dụ: Mình đang gặp khó với túi crochet"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
                        Mô tả chi tiết <span className="text-destructive">*</span>
                      </label>
                      <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                        {description.trim().length} ký tự
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="diy-input w-full resize-none"
                      placeholder="Bạn đang làm đến bước nào, gặp vướng mắc gì? Mô tả càng cụ thể, mình hỗ trợ càng chính xác."
                    />
                  </div>

                  <div className="diy-helper-note rounded-xl px-3.5 py-2.5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    Không cần viết hoàn hảo — cứ kể tự nhiên như đang nhắn tin cho một người bạn biết đan len.
                  </div>
                </div>
              </div>

              {/* Ô 2: hình ảnh */}
              <div className="diy-field-card">
                <div className="diy-field-card-head">
                  <span className="diy-card-icon">
                    <ImagePlus className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold">
                    Hình ảnh <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(không bắt buộc)</span>
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="diy-upload-tile flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl border-2 border-dashed cursor-pointer">
                    <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                    <ImagePlus className="w-5 h-5 diy-upload-icon" style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Thêm ảnh</span>
                  </label>
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="diy-image-thumb diy-fade-in w-20 h-20 rounded-xl overflow-hidden border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Xoá ảnh"
                        className="diy-image-remove absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ô 3: gắn thẻ */}
              <div className="diy-field-card">
                <div className="diy-field-card-head">
                  <span className="diy-card-icon">
                    <Tag className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold">
                    Gắn thẻ <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(không bắt buộc)</span>
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="chip-filter active diy-tag-chip diy-fade-in !px-2 !py-0.5 !text-xs cursor-pointer"
                          onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        >
                          #{tag} <span className="ml-1 opacity-60 hover:opacity-100">&times;</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="diy-input flex-1"
                      placeholder="Gõ thẻ rồi nhấn Enter, ví dụ: crochet, mũ len"
                    />
                    <button type="button" onClick={addTag} className="diy-btn-secondary px-3 rounded-xl border">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Ô 4: ngân sách */}
              <div className="diy-field-card">
                <div className="diy-field-card-head">
                  <span className="diy-card-icon">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold">
                    Ngân sách dự kiến <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(không bắt buộc)</span>
                  </h2>
                </div>
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="diy-input w-full"
                  placeholder="Chưa chắc? Cứ để trống, đội ngũ sẽ tư vấn giúp bạn"
                  min={0}
                />
              </div>
            </div>

            {/* ── Phải: 1 card lớn, cao bằng khối 2x2 bên trái ── */}
            <div className="diy-side-card">
              <div className="diy-side-card-head">
                <span className="diy-card-icon diy-static-icon">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">
                    Sản phẩm liên quan <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(không bắt buộc)</span>
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    Đính kèm sản phẩm để tụi mình hình dung đúng dự án của bạn
                  </p>
                </div>
              </div>

              <div className="diy-side-card-body">
                {/* Wrapper keeps the dropdown as a floating overlay instead of pushing layout down */}
                <div className="diy-search-wrapper">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="diy-input w-full pl-9"
                      placeholder="Tìm sản phẩm..."
                    />
                  </div>
                  {productSearch && (
                    <div className="diy-fade-in diy-results rounded-xl border overflow-hidden">
                      {searchableProducts.length === 0 ? (
                        <p className="p-4 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
                          Không tìm thấy sản phẩm phù hợp
                        </p>
                      ) : (
                        searchableProducts.map((product) => {
                          const alreadyAdded = comboItems.some((item) => item.productId === product.productId);
                          return (
                            <button
                              key={product.productId}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => {
                                if (alreadyAdded) return;
                                setComboItems((prev) => [...prev, { ...product, quantity: 1 }]);
                                setProductSearch("");
                              }}
                              className="diy-result-row w-full flex items-center gap-3 px-4 py-3 text-left disabled:opacity-40"
                            >
                              <img src={product.thumbnail} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                              {alreadyAdded ? (
                                <Check className="w-4 h-4" style={{ color: "var(--primary)" }} />
                              ) : (
                                <Plus className="w-4 h-4 diy-result-plus" style={{ color: "var(--foreground-muted)" }} />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {comboItems.length > 0 ? (
                  <div className="diy-combo-list rounded-xl border p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                      Đã chọn ({comboItems.length})
                    </p>
                    <div className="diy-combo-scroll space-y-2">
                      {comboItems.map((item) => (
                        <div key={item.productId} className="diy-fade-in diy-combo-row flex items-center gap-3">
                          <img src={item.thumbnail} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                          <span className="flex-1 text-sm truncate">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => setComboItems((prev) => prev.filter((i) => i.productId !== item.productId))}
                            className="diy-remove-link text-xs text-destructive"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !productSearch && (
                    <div className="diy-side-empty">
                      <p className="text-xs italic" style={{ color: "var(--foreground-muted)" }}>
                        Chưa chọn sản phẩm nào — bỏ qua cũng không sao.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={() => navigate("/diy")} disabled={loading} className="diy-btn-cancel">
              Để sau
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading} className="diy-btn-primary">
              {loading ? "Đang gửi…" : <><Send className="w-4 h-4" /> Gửi yêu cầu</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}