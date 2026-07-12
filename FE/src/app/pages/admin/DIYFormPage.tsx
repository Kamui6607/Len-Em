import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, ImagePlus, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { products } from "../../data/products";
import { formatPrice } from "../../../lib/formatPrice";
import { diyService } from "../../../features/diy/services/diy.service";
import type { CreateDIYPostDTO } from "../../../features/diy/types/diy.types";

interface ComboItem {
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

export function DIYFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
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

  const comboTotal = comboItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!normalized) return;
    if (tags.includes(normalized)) { toast.error("Tag already added"); return; }
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || selectedFiles.length === 0 || comboItems.length === 0) {
      toast.error("Please add a title, description, image, and at least one material");
      return;
    }
    setLoading(true);
    try {
      const data: CreateDIYPostDTO = {
        title: title.trim(),
        description: description.trim(),
        tags: tags.length > 0 ? tags : undefined,
        linkedProduct: comboItems.map((item) => ({ productId: item.productId })),
      };
      await diyService.createPost(data, selectedFiles);
      toast.success("DIY post created successfully");
      navigate("/admin/diy-posts");
    } catch {
      toast.error("Failed to create DIY post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/diy-posts")} className="btn-icon" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="mb-1">Create DIY Post</h1>
          <p className="text-sm text-muted-foreground">Fill in the details for your new DIY post</p>
        </div>
      </div>

      <div className="rounded-2xl border p-6 space-y-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Title <span className="text-destructive">*</span>
              </label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" placeholder="e.g. My Crochet Bag" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Description <span className="text-destructive">*</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input w-full resize-none" placeholder="Describe your DIY project..." />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Images <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-primary" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                  <ImagePlus className="w-6 h-6" style={{ color: "var(--foreground-muted)" }} />
                </label>
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Tags</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="chip-filter active !px-2 !py-0.5 !text-xs" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                    #{tag} <span className="ml-1 cursor-pointer opacity-60 hover:opacity-100">&times;</span>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="input flex-1" placeholder="Type tag and press Enter" />
                <button type="button" onClick={addTag} className="btn-secondary px-3">+</button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
              Materials <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
              <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="input w-full pl-9" placeholder="Search products to add..." />
            </div>
            {productSearch && (
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                {searchableProducts.length === 0 ? (
                  <p className="p-4 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>No products found</p>
                ) : (
                  searchableProducts.map((product) => {
                    const alreadyAdded = comboItems.some((item) => item.productId === product.productId);
                    return (
                      <button
                        key={product.productId}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => { if (alreadyAdded) return; setComboItems((prev) => [...prev, { ...product, quantity: 1 }]); setProductSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-40"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <img src={product.thumbnail} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{formatPrice(product.price)}</p>
                        </div>
                        {alreadyAdded ? <Check className="w-4 h-4" style={{ color: "var(--primary)" }} /> : <Plus className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
            {comboItems.length > 0 && (
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>Selected Materials ({comboItems.length})</p>
                {comboItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img src={item.thumbnail} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                    <span className="flex-1 text-sm truncate">{item.name}</span>
                    <button type="button" onClick={() => setComboItems((prev) => prev.filter((i) => i.productId !== item.productId))} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                ))}
                <p className="text-xs pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
                  Total: <strong style={{ color: "var(--primary)" }}>{formatPrice(comboTotal)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={() => navigate("/admin/diy-posts")} disabled={loading} className="btn-modal-cancel">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-modal-primary">
            {loading ? "Creating…" : <><Send className="w-4 h-4" /> Submit DIY Post</>}
          </button>
        </div>
      </div>
    </div>
  );
}