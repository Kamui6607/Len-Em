import type { Product } from "../data/products";
import { cn } from "./ui/utils";

type Level = NonNullable<Product["difficulty"]>;

const levelConfig: Record<Level, { label: string; className: string }> = {
  beginner: {
    label: "🌱 Beginner",
    className: "bg-[#E8F5E9] text-[#2E7D32]",
  },
  intermediate: {
    label: "🧶 Intermediate",
    className: "bg-[#FFF8E1] text-[#F57F17]",
  },
  advanced: {
    label: "🔥 Advanced",
    className: "bg-[#FBE9E7] text-[#BF360C]",
  },
};

interface LevelBadgeProps {
  level?: Level;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  if (!level) return null;

  const config = levelConfig[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
