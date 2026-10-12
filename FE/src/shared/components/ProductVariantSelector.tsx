import { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "./ui/utils";
import { YarnBallIcon } from "../../features/shop/shopMeta";

export interface ProductVariantUI {
  id: string;
  color?: string;
  hexCode?: string;
  stock: number;
  price: number;
  images?: string[];
}

interface ProductVariantSelectorProps {
  variants: ProductVariantUI[];
  defaultVariantId?: string;
  onVariantChange: (variant: ProductVariantUI) => void;
  showLabel?: boolean;
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DEFAULT_COLOR_RE = /^(m[aặ]c [dđ][iị]nh|default)$/i;

/** hexCode hợp lệ (#rgb / #rrggbb) — ngược lại trả undefined để không tô màu sai (đen). */
export function getValidHex(hexCode?: string): string | undefined {
  const value = hexCode?.trim();
  return value && HEX_RE.test(value) ? value : undefined;
}

/** Biến thể "Mặc định": không có tên màu, hoặc tên màu là "Mặc định"/"Default". */
export function isDefaultVariant(variant: Pick<ProductVariantUI, "color">): boolean {
  const color = variant.color?.trim();
  return !color || DEFAULT_COLOR_RE.test(color);
}

/** Tên hiển thị dưới swatch. */
export function getVariantLabel(variant: Pick<ProductVariantUI, "color">): string {
  return isDefaultVariant(variant) ? "Mặc định" : (variant.color as string).trim();
}

/** Chỉ 1 biến thể và là "Mặc định" → không cần khối chọn màu. */
export function shouldHideVariantPicker(variants: ProductVariantUI[]): boolean {
  return variants.length === 1 && isDefaultVariant(variants[0]);
}

export function ProductVariantSelector({
  variants,
  defaultVariantId,
  onVariantChange,
  showLabel = true,
}: ProductVariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(
    defaultVariantId || variants[0]?.id || "",
  );

  // Re-sync when defaultVariantId changes externally (e.g., navigating to a new product)
  useEffect(() => {
    if (defaultVariantId && defaultVariantId !== selectedId) {
      setSelectedId(defaultVariantId);
    }
  }, [defaultVariantId, selectedId]);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedId) || variants[0],
    [selectedId, variants],
  );

  // Luôn báo biến thể đang chọn lên trên — kể cả khi khối chọn màu bị ẩn,
  // vì trang chi tiết dựa vào đây để biết giá/tồn kho.
  useEffect(() => {
    if (selectedVariant) {
      onVariantChange(selectedVariant);
    }
  }, [onVariantChange, selectedVariant]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  if (!variants || variants.length === 0) return null;
  if (shouldHideVariantPicker(variants)) return null;

  const hasColorVariants = variants.some((v) => !isDefaultVariant(v) || getValidHex(v.hexCode));

  // Color variants display as swatches
  if (hasColorVariants) {
    return (
      <div className="space-y-3">
        {showLabel && selectedVariant && (
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-foreground">Màu len</label>
            <span className="truncate text-sm font-medium text-primary">
              {getVariantLabel(selectedVariant)}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {variants.map((variant) => {
            const isSelected = selectedId === variant.id;
            const soldOut = variant.stock === 0;
            const label = getVariantLabel(variant);
            const hex = isDefaultVariant(variant) ? undefined : getValidHex(variant.hexCode);
            const stockNote = soldOut ? "hết hàng" : `còn ${variant.stock}`;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleSelect(variant.id)}
                disabled={soldOut}
                title={`${label} · ${stockNote}`}
                aria-label={`${label}, ${stockNote}`}
                aria-pressed={isSelected}
                className={cn(
                  "group flex w-16 flex-col items-center gap-1.5 transition-opacity",
                  soldOut && "opacity-40 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full transition-transform duration-200",
                    !soldOut && "group-hover:scale-110",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                      : "ring-1 ring-black/10 dark:ring-white/20",
                    !hex && "border-2 border-dashed border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] bg-[var(--muted)] text-primary",
                  )}
                  style={
                    hex
                      ? {
                          backgroundColor: hex,
                          boxShadow:
                            "inset 0 -3px 6px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.25)",
                        }
                      : undefined
                  }
                >
                  {!hex && !isSelected && <YarnBallIcon size={18} strokeWidth={1.8} />}
                  {isSelected && (
                    <Check
                      className={cn("size-4", hex ? "text-white drop-shadow-md" : "text-primary")}
                      strokeWidth={3}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center text-[11px] leading-tight transition-colors",
                    isSelected ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Non-color variants (e.g., different hook sizes) display as pills
  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="text-sm font-semibold text-foreground">Phân loại</label>
      )}
      <div className="flex flex-wrap gap-2">
        {variants.map((variant, idx) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => handleSelect(variant.id)}
            disabled={variant.stock === 0}
            className={cn(
              "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
              selectedId === variant.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-muted",
              variant.stock === 0 &&
                "opacity-40 cursor-not-allowed line-through",
            )}
          >
            {variant.color?.trim() || `Loại ${idx + 1}`}
            {variant.stock <= 5 && variant.stock > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (còn {variant.stock})
              </span>
            )}
            {variant.stock === 0 && (
              <span className="ml-2 text-xs text-destructive">Hết hàng</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
