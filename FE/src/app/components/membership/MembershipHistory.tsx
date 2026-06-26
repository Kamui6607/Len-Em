import { cn } from "../ui/utils";
import { formatPrice } from "../../../lib/formatPrice";
import type { MembershipHistoryEntry } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";

interface MembershipHistoryProps {
  history: MembershipHistoryEntry[];
  compact?: boolean;
}

const sourceLabels: Record<string, string> = {
  purchase: "Purchase",
  diy_video: "DIY Video",
  registration: "Registration",
  rank_up: "Rank Up",
  course_complete: "Course Complete",
};

const sourceIcons: Record<string, string> = {
  purchase: "🛒",
  diy_video: "🎬",
  registration: "🎉",
  rank_up: "🏆",
  course_complete: "📚",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function MembershipHistory({ history, compact = false }: MembershipHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-muted-foreground">No transactions yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          When you shop or post a video, your point history will appear here.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {history.slice(0, 5).map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
              {sourceIcons[entry.source] ?? "📄"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium truncate">{entry.description}</span>
                <span className="text-[9px] text-muted-foreground shrink-0">{formatDate(entry.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <span>{sourceIcons[entry.source]} {sourceLabels[entry.source] ?? entry.source}</span>
                {entry.orderAmount && <span>• {formatPrice(entry.orderAmount)}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={cn("text-xs font-bold", entry.points > 0 ? "text-primary" : "text-destructive")}>
                {entry.points > 0 ? "+" : ""}{entry.points}
              </span>
              {entry.newRank && <div className="text-[8px] text-amber-600">🆕 {getRankConfig(entry.newRank).icon}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Date</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Points</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Source</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Order</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">New Rank</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4 text-xs">{formatDate(entry.date)}</td>
              <td className="py-3 px-4">
                <span className={cn("font-semibold", entry.points > 0 ? "text-primary" : "text-destructive")}>
                  {entry.points > 0 ? "+" : ""}{entry.points}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <span>{sourceIcons[entry.source]}</span>
                  <span className="text-xs">{sourceLabels[entry.source]}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">
                {entry.orderId ? (
                  <span className="font-mono text-[10px]">{entry.orderId}</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
                {entry.orderAmount && <div className="text-[10px]">{formatPrice(entry.orderAmount)}</div>}
              </td>
              <td className="py-3 px-4">
                {entry.newRank ? (
                  <span className="text-xs font-medium">{getRankConfig(entry.newRank).icon} {getRankConfig(entry.newRank).displayName}</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  entry.status === "completed" && "bg-green-100 text-green-700",
                  entry.status === "pending" && "bg-amber-100 text-amber-700",
                  entry.status === "cancelled" && "bg-red-100 text-red-700",
                )}>
                  {entry.status === "completed" ? "✅" : entry.status === "pending" ? "⏳" : "❌"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}