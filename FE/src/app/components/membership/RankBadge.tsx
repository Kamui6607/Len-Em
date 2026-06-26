import { cn } from "../ui/utils";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";

interface RankBadgeProps {
  rank: RankType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-2xl",
};

const labelSizeClasses = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export function RankBadge({ rank, size = "md", showLabel = false, className }: RankBadgeProps) {
  const config = getRankConfig(rank);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold shadow-sm",
          "transition-all duration-300 hover:scale-110 hover:shadow-md",
          sizeClasses[size],
        )}
        style={{
          background: config.gradient,
          color: config.textColor,
        }}
        title={`${config.displayName} — Tích Coin ${config.coinRewardPercent}%`}
      >
        {config.icon}
      </div>
      {showLabel && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn("font-bold leading-none", labelSizeClasses[size])}
            style={{ color: config.textColor }}
          >
            {config.displayName}
          </span>
          {size !== "sm" && (
            <span className="text-[9px] text-muted-foreground mt-0.5">
              Coin {config.coinRewardPercent}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}