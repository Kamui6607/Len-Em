// ============================================================
// Shop metadata — nhãn tiếng Việt + icon cho danh mục và trình độ,
// dùng chung cho /shop, /shop/product/:id và ProductCard.
// Thay cho emoji (🧵🎁🪡🌱🌿🌳) để icon đồng bộ với phần còn lại.
// ============================================================

import {
  Anchor,
  Gift,
  LayoutGrid,
  Leaf,
  PenLine,
  Ribbon,
  Scissors,
  Sprout,
  TreeDeciduous,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Cuộn len vẽ tay — lucide không có icon len nên tự vẽ cùng phong cách nét. */
export function YarnBallIcon({ size = 24, strokeWidth = 2, className, ...rest }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...(rest as React.SVGProps<SVGSVGElement>)}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M5.5 5.5c3 1.5 5 5 5.5 13.4" />
      <path d="M3.2 12.5c4-1 8.6.2 11.8 4.6" />
      <path d="M9 3.3c3.3 2.6 6.6 3.3 9.6 2.6" />
      <path d="M17.5 16.5c1.5 1.8 3 2.6 4.5 2.5" />
    </svg>
  );
}

export interface CategoryMeta {
  label: string;
  desc: string;
  Icon: LucideIcon | typeof YarnBallIcon;
}

export const SHOP_CATEGORIES: Record<string, CategoryMeta> = {
  all: {
    label: "Tất cả",
    desc: "Mọi thứ bạn cần cho dự án len tiếp theo — từ cuộn len đầu tiên đến mũi khâu cuối cùng.",
    Icon: LayoutGrid,
  },
  yarn: {
    label: "Len",
    desc: "Những cuộn len mềm mại, đủ màu và đủ chất liệu cho mọi dự án.",
    Icon: YarnBallIcon,
  },
  hook: {
    label: "Kim móc",
    desc: "Kim móc đủ cỡ, cầm êm tay cho từng loại len.",
    Icon: Anchor,
  },
  needle: {
    label: "Kim đan",
    desc: "Kim đan và kim khâu len cho các dự án đan que.",
    Icon: PenLine,
  },
  accessory: {
    label: "Phụ kiện",
    desc: "Đánh dấu mũi, mắt thú, khoen… những chi tiết nhỏ làm nên thành phẩm.",
    Icon: Ribbon,
  },
  kit: {
    label: "Kit DIY",
    desc: "Bộ nguyên liệu chọn sẵn — mở hộp là bắt tay vào làm.",
    Icon: Gift,
  },
  tools: {
    label: "Dụng cụ",
    desc: "Dụng cụ cần có trong giỏ đồ nghề của mọi người làm len.",
    Icon: Scissors,
  },
};

export function getCategoryMeta(value: string, fallbackLabel?: string): CategoryMeta {
  return (
    SHOP_CATEGORIES[value] ?? {
      label: fallbackLabel ?? value,
      desc: `Sản phẩm thuộc danh mục ${fallbackLabel ?? value}.`,
      Icon: LayoutGrid,
    }
  );
}

export type ShopLevel = "beginner" | "intermediate" | "advanced";

/** Trình độ như một cái cây lớn dần: mầm → lá → cây (đồng bộ với /learn). */
export const SHOP_LEVELS: Record<ShopLevel, { label: string; Icon: LucideIcon; tone: string }> = {
  beginner: { label: "Cơ bản", Icon: Sprout, tone: "is-beginner" },
  intermediate: { label: "Trung bình", Icon: Leaf, tone: "is-intermediate" },
  advanced: { label: "Nâng cao", Icon: TreeDeciduous, tone: "is-advanced" },
};
