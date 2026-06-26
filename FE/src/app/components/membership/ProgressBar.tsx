import { cn } from "../ui/utils";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getNextRank, getRankConfig } from "../../../features/membership/types/membership.types";
import { formatPrice } from "../../../lib/formatPrice";

interface ProgressBarProps {
  points: number;
  currentRank: RankType;
  animate?: boolean;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

const heightClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export function ProgressBar({
  points,
  currentRank,
  animate = true,
  showTooltip = true,
  size = "md",
}: ProgressBarProps) {
  const nextRankInfo = getNextRank(currentRank, points);

  if (!nextRankInfo.nextRank) {
    const nextConfig = getRankConfig("diamond");
    return (
      <div className="space-y-1.5">
        <div className={cn("w-full rounded-full overflow-hidden", heightClasses[size])}
          style={{ background: "rgba(255,255,255,0.3)" }}
        >
          <div
            className={cn("h-full rounded-full", heightClasses[size])}
            style={{
              width: "100%",
              background: nextConfig.gradient,
            }}
          />
        </div>
        {showTooltip && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium flex items-center gap-1 text-primary/70">
              💎 Max rank
            </span>
            <span className="text-[10px] opacity-70">{points.toLocaleString()} pts</span>
          </div>
        )}
      </div>
    );
  }

  const nextConfig = getRankConfig(nextRankInfo.nextRank);
  const totalRange = nextRankInfo.nextRankPoints - nextRankInfo.currentRankPoints;
  const progress = Math.min(
    ((points - nextRankInfo.currentRankPoints) / totalRange) * 100,
    100,
  );

  return (
    <div className="space-y-1.5">
      <div
        className={cn("w-full rounded-full overflow-hidden", heightClasses[size])}
        style={{ background: "rgba(255,255,255,0.3)" }}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", heightClasses[size])}
          style={{
            width: `${Math.max(progress, 2)}%`,
            background: nextConfig.gradient,
            transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {showTooltip && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium opacity-80" style={{ color: nextConfig.textColor }}>
              {`${nextConfig.icon} ${nextConfig.displayName}`}
            </span>
            <span className="text-[10px] opacity-60">
              {points.toLocaleString()} / {nextRankInfo.nextRankPoints.toLocaleString()}
            </span>
          </div>
          <p className="text-[9px] opacity-60">
            Còn <span className="font-semibold">{formatPrice(nextRankInfo.pointsNeeded * 1000)}</span> để lên {nextConfig.icon}
          </p>
        </div>
      )}
    </div>
  );
}