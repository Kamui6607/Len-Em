// ============================================================
// ColorSwatch — renders a color circle from hexCode
// Useable in Shop cards, Manage tables, Product detail
// ============================================================

import { cn } from "./utils";

interface ColorSwatchProps {
  hexCode: string;
  colorName?: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function ColorSwatch({
  hexCode,
  colorName,
  size = "md",
  selected,
  onClick,
}: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={colorName || hexCode}
      className={cn(
        "rounded-full border-2 transition-all flex-shrink-0",
        sizeMap[size],
        selected
          ? "border-foreground ring-2 ring-foreground/20 scale-110"
          : "border-border/50 hover:border-foreground/30",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
      style={{ backgroundColor: hexCode }}
    >
      <span className="sr-only">{colorName || hexCode}</span>
    </button>
  );
}

/**
 * ColorSwatchList — renders a row of color swatches
 */
interface ColorSwatchListProps {
  variants: { color?: string; hexCode?: string }[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  size?: "sm" | "md" | "lg";
}

export function ColorSwatchList({
  variants,
  selectedIndex,
  onSelect,
  size = "sm",
}: ColorSwatchListProps) {
  const unique = new Map<string, number>();
  variants.forEach((v, i) => {
    const key = v.hexCode || v.color || `color-${i}`;
    if (!unique.has(key)) unique.set(key, i);
  });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Array.from(unique.entries()).map(([key, idx]) => (
        <ColorSwatch
          key={key}
          hexCode={variants[idx].hexCode || "#ccc"}
          colorName={variants[idx].color}
          size={size}
          selected={selectedIndex === idx}
          onClick={onSelect ? () => onSelect(idx) : undefined}
        />
      ))}
    </div>
  );
}