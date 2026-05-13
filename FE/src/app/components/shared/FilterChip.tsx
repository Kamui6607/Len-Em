import { X } from "lucide-react";
import { cn } from "../ui/utils";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  colorSwatch?: string;
  variant?: "default" | "primary";
}

export function FilterChip({
  label,
  onRemove,
  colorSwatch,
  variant = "primary",
}: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
        variant === "primary"
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-card text-foreground border-border"
      )}
    >
      {colorSwatch && (
        <span
          className="w-3 h-3 rounded-full border border-primary/20 shrink-0"
          style={{ backgroundColor: colorSwatch }}
        />
      )}
      {label}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={`Remove ${label} filter`}
        title={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}