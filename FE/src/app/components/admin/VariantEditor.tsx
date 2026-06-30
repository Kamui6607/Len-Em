// ============================================================
// VariantEditor — reusable component for managing product variants
// Used in both Create and Edit product forms (Admin & Staff)
// ============================================================

import { X, Plus } from "lucide-react";

export interface VariantData {
  color: string;
  hexCode: string;
  price: number;
  stock: number;
  image: string;
  imageFile?: File | null;
}

interface VariantEditorProps {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  errors?: Record<string, string>[];
}

const emptyVariant = (): VariantData => ({
  color: "",
  hexCode: "#000000",
  price: 0,
  stock: 0,
  image: "",
  imageFile: null,
});

export function VariantEditor({
  variants,
  onChange,
  errors,
}: VariantEditorProps) {
  const addVariant = () => {
    onChange([...variants, emptyVariant()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof VariantData,
    value: string | number | File | null,
  ) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">
          Variants <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({variants.length} variant{variants.length !== 1 ? "s" : ""})
          </span>
        </label>
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          <Plus size={14} /> Add variant
        </button>
      </div>

      <div className="space-y-3">
        {variants.map((v, i) => {
          const err = errors?.[i] ?? {};

          return (
            <div
              key={i}
              className="p-4 bg-muted/30 rounded-xl border border-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Variant {i + 1}
                </span>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Color */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs mb-1">
                    Color <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={v.hexCode}
                      onChange={(e) =>
                        updateVariant(i, "hexCode", e.target.value)
                      }
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) =>
                        updateVariant(i, "color", e.target.value)
                      }
                      className={`w-full px-3 py-2 bg-input-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                        err.color ? "border-destructive" : "border-border"
                      }`}
                      placeholder="Color name"
                    />
                  </div>
                  {err.color && (
                    <p className="text-xs text-destructive mt-1">{err.color}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs mb-1">
                    Price <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={v.price || ""}
                    onChange={(e) =>
                      updateVariant(i, "price", Number(e.target.value))
                    }
                    className={`w-full px-3 py-2 bg-input-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      err.price ? "border-destructive" : "border-border"
                    }`}
                    placeholder="0"
                    min={0}
                  />
                  {err.price && (
                    <p className="text-xs text-destructive mt-1">{err.price}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs mb-1">Stock</label>
                  <input
                    type="number"
                    value={v.stock ?? ""}
                    onChange={(e) =>
                      updateVariant(i, "stock", Number(e.target.value))
                    }
                    className={`w-full px-3 py-2 bg-input-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      err.stock ? "border-destructive" : "border-border"
                    }`}
                    placeholder="0"
                    min={0}
                  />
                  {err.stock && (
                    <p className="text-xs text-destructive mt-1">{err.stock}</p>
                  )}
                </div>

                {/* Variant image */}
                <div className="col-span-2 lg:col-span-2">
                  <label className="block text-xs mb-1">Variant image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      updateVariant(i, "imageFile", e.target.files?.[0] ?? null)
                    }
                    className={`w-full px-3 py-2 bg-input-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      err.image ? "border-destructive" : "border-border"
                    }`}
                  />
                  {v.imageFile ? (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {v.imageFile.name}
                    </p>
                  ) : v.image ? (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Current: {v.image}
                    </p>
                  ) : null}
                  {err.image && (
                    <p className="text-xs text-destructive mt-1">{err.image}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Validate variant data and return per-index error objects.
 */
export function validateVariants(
  variants: VariantData[],
): Record<string, string>[] {
  return variants.map((v) => {
    const err: Record<string, string> = {};
    if (!v.color.trim()) err.color = "Required";
    if (v.price <= 0) err.price = "Must be > 0";
    if (v.stock < 0) err.stock = "Must be >= 0";
    return err;
  });
}

/**
 * Check if variants array has any validation errors.
 */
export function hasVariantErrors(errors: Record<string, string>[]): boolean {
  return errors.some((e) => Object.keys(e).length > 0);
}
