import { cn } from "../ui/utils";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface RankBadgeProps {
  rank: RankType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/** Huy hiệu hạng — miếng vá tròn nhuộm màu hạng, kèm tên hạng (tuỳ chọn). */
export function RankBadge({ rank, size = "md", showLabel = false, className }: RankBadgeProps) {
  const config = getRankConfig(rank);

  return (
    <span
      className={cn("mb-badge", className)}
      data-rank={rank}
      data-size={size}
      title={`${config.displayName} — hoàn ${config.coinRewardPercent}% Coin`}
    >
      <span className="mb-badge-patch" aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && (
        <span className="flex flex-col">
          <span className="mb-badge-name">{config.displayName}</span>
          {size !== "sm" && <span className="mb-badge-sub">Hoàn {config.coinRewardPercent}% Coin</span>}
        </span>
      )}
    </span>
  );
}
