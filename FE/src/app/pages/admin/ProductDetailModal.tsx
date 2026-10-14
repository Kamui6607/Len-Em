// ============================================================
// ProductDetailModal — quick "read" popup for /admin/products
// ============================================================
// The list's view action used to navigate to /admin/products/:id. It now opens
// this popup instead (same interaction as /admin/kits), so an admin can glance
// at a product without losing their filters, page and scroll position.
// ============================================================

import { useState } from "react";
import { Layers, Package } from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import type { Product } from "../../../shared/api/productService";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { SkeletonBlock } from "../../../shared/components/skeletons/AdminSkeleton";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminDialogSection,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";

function priceRange(product: Product): string {
  const prices = product.variants.map((variant) => variant.price);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
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
    <AdminModal
      variant="view"
      size="xl"
      eyebrow="Sản phẩm"
      title={product.name}
      onClose={onClose}
      media={
        image && !brokenImage ? (
          <img src={image} alt={product.name} onError={() => setBrokenImage(true)} className="adm-dlg-thumb" />
        ) : undefined
      }
      icon={Package}
      badges={
        <>
          <span className="badge badge-gray capitalize">{product.category}</span>
          <span className={`badge ${product.isActive ? "badge-green" : "badge-red"}`}>
            {product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
          </span>
        </>
      }
      footer={
        <button type="button" onClick={onClose} className="btn-modal-cancel">
          {t("admin.products.closeButton")}
        </button>
      }
    >
        <div className="admin-dialog-body">
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
              <AdminDetailGrid className="cols-3">
                <AdminDetailItem label={t("admin.products.price")}>
                  <span className="text-primary font-semibold">{priceRange(product)}</span>
                </AdminDetailItem>
                <AdminDetailItem label={t("admin.products.totalStock")}>{totalStock}</AdminDetailItem>
                <AdminDetailItem label={t("admin.products.variantColor")}>{product.variants.length}</AdminDetailItem>
              </AdminDetailGrid>

              <AdminDetailItem label={t("admin.products.description")}>
                {product.description ? (
                  <span className="font-normal leading-relaxed">{product.description}</span>
                ) : null}
                {product.tags?.length > 0 && (
                  <div className="adm-chips mt-2.5">
                    {product.tags.map((tag) => (
                      <span key={tag} className="adm-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </AdminDetailItem>

              <AdminDialogSection icon={Layers}>
                {t("admin.products.variantColorStock")} ({product.variants.length})
              </AdminDialogSection>
              <div>
                <div className="adm-lines is-scroll">
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
                        className="adm-line adm-line-btn"
                        data-active={active}
                      >
                        {variantImage ? (
                          <img
                            src={variantImage}
                            alt={variant.color}
                            className="adm-line-img"
                          />
                        ) : (
                          <span
                            className="adm-line-img flex items-center justify-center text-muted-foreground"
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
    </AdminModal>
  );
}

