import { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "./ui/utils";
import { ColorSwatch } from "./ColorSwatch";

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

  useEffect(() => {
    if (selectedVariant) {
      onVariantChange(selectedVariant);
    }
  }, [onVariantChange, selectedVariant]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  if (!variants || variants.length === 0) return null;

  const hasColorVariants = variants.some((v) => v.color);

  // Color variants display as swatches
  if (hasColorVariants) {
    return (
      <div className="space-y-3">
        {showLabel && (
          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Color</label>
            <span className="text-sm font-medium text-primary">
              {selectedVariant?.color}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => handleSelect(variant.id)}
              disabled={variant.stock === 0}
              title={variant.color || variant.id}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 transition-all",
                variant.stock === 0 && "opacity-40 cursor-not-allowed",
              )}
            >
              <ColorSwatch
                color={variant.color || "Default"}
                hexCode={variant.hexCode || "#ccc"}
                isSelected={selectedId === variant.id}
                size="lg"
              />
              {selectedId === variant.id && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                </span>
              )}
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  selectedId === variant.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {variant.stock > 0 ? `${variant.stock}` : "Out"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Non-color variants (e.g., different hook sizes) display as pills
  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="text-sm text-foreground">Size / Option</label>
      )}
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
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
            {variant.color || variant.id}
            {variant.stock <= 5 && variant.stock > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (only {variant.stock} left)
              </span>
            )}
            {variant.stock === 0 && (
              <span className="ml-2 text-xs text-destructive">Sold out</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
