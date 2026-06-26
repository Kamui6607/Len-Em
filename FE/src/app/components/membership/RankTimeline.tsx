import { cn } from "../ui/utils";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";

interface RankTimelineProps {
  currentRank: RankType;
  points: number;
  compact?: boolean;
}

const RANK_ORDER: RankType[] = ["member", "silver", "gold", "diamond"];

export function RankTimeline({ currentRank, points, compact = false }: RankTimelineProps) {
  const currentIndex = RANK_ORDER.indexOf(currentRank);

  return (
    <div className={compact ? "space-y-1" : "space-y-3"}>
      {!compact && (
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          📈 Member Journey
        </h3>
      )}

      {RANK_ORDER.map((rank, index) => {
        const config = getRankConfig(rank);
        const isAchieved = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;

        return (
          <div key={rank} className="relative">
            {index < RANK_ORDER.length - 1 && (
              <div
                className={cn(
                  "absolute left-[18px] top-10 w-0.5 h-10",
                  index < currentIndex ? "bg-primary/30" : "bg-border",
                )}
              />
            )}

            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 transition-all duration-500 relative",
                  isAchieved && "shadow-sm",
                )}
                style={{
                  background: isAchieved ? config.gradient : "var(--muted)",
                  color: isAchieved ? config.textColor : "var(--muted-foreground)",
                }}
              >
                {config.icon}
                {isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-semibold text-sm",
                      isCurrent && "text-foreground",
                      isAchieved && !isCurrent && "text-muted-foreground",
                      !isAchieved && "text-muted-foreground/50",
                    )}
                  >
                    {config.displayName}
                  </span>
                  {isAchieved && !isCurrent && (
                    <span className="text-[9px] text-primary/60">✓</span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                  {isNext && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>

                <p className={cn("text-xs mt-0.5", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {config.minPoints.toLocaleString()} pts required
                </p>

                {isCurrent && config.minPoints > 0 && (
                  <div className="mt-2 w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((points / (config.minPoints || 8000)) * 100, 100)}%`,
                        background: config.gradient,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact horizontal timeline for desktop */
export function RankTimelineHorizontal({ currentRank }: RankTimelineProps) {
  const currentIndex = RANK_ORDER.indexOf(currentRank);

  return (
    <div className="w-full flex items-start">
      {RANK_ORDER.map((rank, index) => {
        const config = getRankConfig(rank);
        const isAchieved = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={rank} className="flex-1 relative flex flex-col items-center">
            {/* Connector line */}
            {index < RANK_ORDER.length - 1 && (
              <div
                className="absolute top-[18px] left-[60%] w-[80%] h-[2px]"
                style={{
                  background: index < currentIndex ? config.gradient : "var(--border)",
                  opacity: index < currentIndex ? 0.5 : 1,
                }}
              />
            )}

            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300",
                  isAchieved && "shadow-sm",
                  isCurrent && "ring-2 ring-primary ring-offset-2 scale-110",
                )}
                style={{
                  background: isAchieved ? config.gradient : "var(--muted)",
                  color: isAchieved ? config.textColor : "var(--muted-foreground)",
                }}
              >
                {config.icon}
              </div>
              <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {config.displayName}
              </span>
              {isCurrent && (
                <span className="text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                  Current
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}