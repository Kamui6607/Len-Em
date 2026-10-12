import type { Product } from "../../app/data/products";
import { SHOP_LEVELS } from "../../features/shop/shopMeta";
import { cn } from "./ui/utils";

type Level = NonNullable<Product["difficulty"]>;

// Nền đặc + chữ trắng để đọc rõ trên mọi ảnh sản phẩm (light & dark).
const levelColors: Record<Level, string> = {
  beginner: "bg-[#15803D] text-white",
  intermediate: "bg-[#C2410C] text-white",
  advanced: "bg-[#B91C1C] text-white",
};

interface LevelBadgeProps {
  level?: Level;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  if (!level) return null;

  const { label, Icon } = SHOP_LEVELS[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/50 px-2.5 py-1 text-[11px] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.28)]",
        levelColors[level],
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
