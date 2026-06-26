import { cn } from "../ui/utils";
import type { Benefit, RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";

interface BenefitCardProps {
  benefit: Benefit;
  currentRank: RankType;
  compact?: boolean;
}

export function BenefitCard({ benefit, currentRank, compact = false }: BenefitCardProps) {
  const rankOrder: RankType[] = ["member", "silver", "gold", "diamond"];
  const currentIndex = rankOrder.indexOf(currentRank);
  const unlockIndex = rankOrder.indexOf(benefit.unlockedAtRank);
  const isAvailable = currentIndex >= unlockIndex;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        isAvailable
          ? "border-primary/15 bg-card hover:shadow-sm hover:-translate-y-0.5"
          : "border-border bg-card/50 opacity-60",
        compact && "p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0",
            isAvailable ? "bg-primary/10" : "bg-muted",
          )}
        >
          {isAvailable ? benefit.icon : "🔒"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
              {benefit.title}
            </h4>
            {isAvailable && (
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Active</span>
            )}
          </div>
          <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
            {benefit.description}
          </p>
          {!isAvailable && !compact && (
            <p className="text-[9px] text-amber-600 mt-1.5 flex items-center gap-1">
              <span>🔒</span>
              <span>Unlocks at {getRankConfig(benefit.unlockedAtRank).icon} {getRankConfig(benefit.unlockedAtRank).displayName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BenefitListProps {
  benefits: Benefit[];
  currentRank: RankType;
  compact?: boolean;
}

export function BenefitList({ benefits, currentRank, compact = false }: BenefitListProps) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
      {benefits.map((benefit) => (
        <BenefitCard key={benefit.id} benefit={benefit} currentRank={currentRank} compact={compact} />
      ))}
    </div>
  );
}