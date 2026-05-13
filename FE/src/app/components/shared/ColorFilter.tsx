import { Check } from "lucide-react";
import { cn } from "../ui/utils";

export interface ColorFilterOption {
  name: string;
  hex: string;
  count?: number;
}

interface ColorFilterProps {
  colors: ColorFilterOption[];
  selectedColors: string[];
  onToggle: (colorName: string) => void;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

const swatchSizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function ColorFilter({
  colors,
  selectedColors,
  onToggle,
  showCount = false,
  size = "md",
}: ColorFilterProps) {
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5" role="group" aria-label="Color filter">
      {colors.map((color) => {
        const isSelected = selectedColors.includes(color.name);
        return (
          <button
            key={color.name}
            onClick={() => onToggle(color.name)}
            title={color.name}
            aria-label={`${color.name}${isSelected ? " (selected)" : ""}`}
            aria-pressed={isSelected}
            className={cn(
              "group relative rounded-full transition-all duration-200 flex-shrink-0",
              swatchSizes[size],
              "hover:scale-110 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-card",
              isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-card scale-110"
            )}
          >
            <span
              className="block w-full h-full rounded-full border border-border/50"
              style={{ backgroundColor: color.hex }}
            />
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-white drop-shadow-md" />
              </span>
            )}
            {/* Tooltip */}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {color.name}{showCount && color.count ? ` (${color.count})` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}