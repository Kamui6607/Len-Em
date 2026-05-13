import { cn } from "./ui/utils";

interface ColorSwatchProps {
  color: string;
  hexCode: string;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

const ringSizeMap = {
  sm: "ring-1",
  md: "ring-2",
  lg: "ring-2",
};

export function ColorSwatch({
  color,
  hexCode,
  isSelected = false,
  size = "md",
  showLabel = false,
  onClick,
}: ColorSwatchProps) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      {...(onClick ? { onClick, title: color } : {})}
      className={cn(
        "group relative rounded-full transition-all duration-200 flex-shrink-0",
        sizeMap[size],
        onClick && "cursor-pointer hover:scale-110 hover:shadow-md",
        isSelected && [
          ringSizeMap[size],
          "ring-primary ring-offset-2 dark:ring-offset-card scale-110",
        ],
        !isSelected && "ring-1 ring-black/10 dark:ring-white/20"
      )}
    >
      <span
        className="block w-full h-full rounded-full"
        style={{ backgroundColor: hexCode }}
      />
      {/* Tooltip */}
      {onClick && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {color}
        </span>
      )}
      {/* Label */}
      {showLabel && (
        <span className="ml-3 text-sm text-foreground align-middle leading-8">
          {color}
        </span>
      )}
    </Component>
  );
}