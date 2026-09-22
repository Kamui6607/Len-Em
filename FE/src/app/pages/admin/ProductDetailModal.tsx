// ============================================================
// ProductDetailModal — quick "read" popup for /admin/products
// ============================================================
// The list's view action used to navigate to /admin/products/:id. It now opens
// this popup instead (same interaction as /admin/kits), so an admin can glance
// at a product without losing their filters, page and scroll position.
// ============================================================

import { useState } from "react";
import { Package, X } from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import type { Product } from "../../../shared/api/productService";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { SkeletonBlock } from "../../../shared/components/skeletons/AdminSkeleton";

function priceRange(product: Product): string {
  const prices = product.variants.map((variant) => variant.price);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

/** Label + value tile (same look as the user detail dialog). */
function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

export function ProductDetailModal({
  product,
  loading,
  onClose,
}: {
  product: Product;
  loading: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [brokenImage, setBrokenImage] = useState(false);

  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const image = preview ?? product.image;

  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div
        className="admin-dialog-content max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-dialog-header flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {image && !brokenImage ? (
              <img
                src={image}
                alt={product.name}
                onError={() => setBrokenImage(true)}
                className="h-16 w-16 shrink-0 rounded-xl border object-cover"
                style={{ background: "var(--muted)", borderColor: "var(--border-light)" }}
              />
            ) : (
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}
              >
                <Package className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{product.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="badge badge-gray capitalize">{product.category}</span>
                <span className={`badge ${product.isActive ? "badge-green" : "badge-red"}`}>
                  {product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-action-btn shrink-0"
            style={{ color: "var(--foreground-muted)" }}
            aria-label={t("admin.products.closeButton")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="admin-dialog-body space-y-5">
          {loading ? (
            // Skeleton khớp nội dung thật của popup: mô tả → 3 tile (giá, tồn
            // kho, số màu) → danh sách variant có ảnh + giá + tồn.
            <>
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-3/4" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-xl border p-3"
                    style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
                  >
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-4 w-20 max-w-full" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-32" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border p-2.5"
                    style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
                  >
                    <SkeletonBlock className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonBlock className="h-3.5 w-28 max-w-full" />
                      <SkeletonBlock className="h-3 w-16" />
                    </div>
                    <div className="shrink-0 space-y-2">
                      <SkeletonBlock className="h-3.5 w-16" />
                      <SkeletonBlock className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("admin.products.description")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description || "—"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label={t("admin.products.price")} value={priceRange(product)} />
                <StatTile label={t("admin.products.totalStock")} value={totalStock} />
                <StatTile
                  label={t("admin.products.variantColor")}
                  value={product.variants.length}
                />
              </div>

              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="badge badge-gray">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("admin.products.variantColorStock")} ({product.variants.length})
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {product.variants.map((variant) => {
                    const variantImage = variant.image || product.image;
                    const active = image === variantImage;
                    return (
                      <button
                        key={variant._idVariants}
                        type="button"
                        onClick={() => {
                          setBrokenImage(false);
                          setPreview(variantImage);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors"
                        style={{
                          background: active ? "var(--surface-secondary)" : "var(--surface)",
                          borderColor: active ? "var(--primary)" : "var(--border-light)",
                        }}
                      >
                        {variantImage ? (
                          <img
                            src={variantImage}
                            alt={variant.color}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            style={{ background: "var(--muted)" }}
                          />
                        ) : (
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}
                          >
                            <Package className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">
                            <span
                              className="h-3.5 w-3.5 shrink-0 rounded-full border"
                              style={{
                                background: variant.hexCode || "transparent",
                                borderColor: "var(--border)",
                              }}
                            />
                            {variant.color}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{variant.hexCode}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                            {formatPrice(variant.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("admin.products.variantStock")}: {variant.stock}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  {product.variants.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="admin-dialog-footer">
          <button type="button" onClick={onClose} className="btn-modal-cancel">
            {t("admin.products.closeButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

