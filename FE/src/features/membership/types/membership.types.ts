// ============================================================
// Membership & Coin Types
// ============================================================

export type RankType = "member" | "silver" | "gold" | "diamond";

export interface RankConfig {
  rank: RankType;
  displayName: string;
  icon: string;
  minPoints: number;
  coinRewardPercent: number;
  benefits: Benefit[];
  gradient: string;
  textColor: string;
  bgColor: string;
}

export interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlockedAtRank: RankType;
  isLocked: boolean;
}

export interface MembershipData {
  userId: string;
  points: number;
  rank: RankType;
  totalSpent: number;
  coinBalance: number;
  updatedAt: string;
}

export interface MembershipHistoryEntry {
  id: string;
  date: string;
  points: number;
  source: "purchase" | "diy_video" | "registration" | "rank_up" | "course_complete";
  description: string;
  orderId?: string;
  orderAmount?: number;
  newRank?: RankType;
  status: "completed" | "pending" | "cancelled";
}

export interface CoinTransaction {
  id: string;
  date: string;
  amount: number;
  type: "earned" | "used" | "expired";
  description: string;
  orderId?: string;
  expiryDate?: string;
}

export const RANK_CONFIGS: RankConfig[] = [
  {
    rank: "member",
    displayName: "Member",
    icon: "⭐",
    minPoints: 0,
    coinRewardPercent: 3,
    gradient: "linear-gradient(135deg, var(--member-grad-start, #F5F0EB) 0%, var(--member-grad-end, #EDE5DA) 100%)",
    textColor: "var(--member-text, #8B7355)",
    bgColor: "var(--member-bg, #F5F0EB)",
    benefits: [
      { id: "benefit-coin-member", icon: "🪙", title: "Earn 3% Coin", description: "Get 3% of your order value back as Coin", unlockedAtRank: "member", isLocked: false },
      { id: "benefit-birthday-member", icon: "🎂", title: "Birthday Voucher", description: "Receive a 50,000₫ voucher on your birthday month", unlockedAtRank: "member", isLocked: false },
    ],
  },
  {
    rank: "silver",
    displayName: "Silver",
    icon: "🥈",
    minPoints: 1000,
    coinRewardPercent: 4,
    gradient: "linear-gradient(135deg, var(--silver-grad-start, #F0F0F0) 0%, var(--silver-grad-mid, #D0D0D0) 50%, var(--silver-grad-end, #A8A8A8) 100%)",
    textColor: "var(--silver-text, #4A4A4A)",
    bgColor: "var(--silver-bg, #F0F0F0)",
    benefits: [
      { id: "benefit-coin-silver", icon: "🪙", title: "Earn 4% Coin", description: "Get 4% of your order value back as Coin", unlockedAtRank: "silver", isLocked: false },
      { id: "benefit-birthday-silver", icon: "🎂", title: "Birthday Voucher", description: "Receive a 100,000₫ voucher on your birthday month", unlockedAtRank: "silver", isLocked: false },
      { id: "benefit-workshop", icon: "🎓", title: "Priority Workshops", description: "Register for workshops 24h before Members", unlockedAtRank: "silver", isLocked: false },
    ],
  },
  {
    rank: "gold",
    displayName: "Gold",
    icon: "🥇",
    minPoints: 3000,
    coinRewardPercent: 5,
    gradient: "linear-gradient(135deg, var(--gold-grad-start, #FFF8E1) 0%, var(--gold-grad-mid, #FFD700) 50%, var(--gold-grad-end, #FFB300) 100%)",
    textColor: "var(--gold-text, #7A5C00)",
    bgColor: "var(--gold-bg, #FFF8E1)",
    benefits: [
      { id: "benefit-coin-gold", icon: "🪙", title: "Earn 5% Coin", description: "Get 5% of your order value back as Coin", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-birthday-gold", icon: "🎂", title: "Birthday Voucher", description: "Receive a 200,000₫ voucher on your birthday month", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-workshop-gold", icon: "🎓", title: "Priority Workshops", description: "Register for workshops 48h before Members", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-flashsale", icon: "🏷️", title: "Early Flash Sale", description: "Access Flash Sales 2 hours early", unlockedAtRank: "gold", isLocked: false },
    ],
  },
  {
    rank: "diamond",
    displayName: "Diamond",
    icon: "💎",
    minPoints: 8000,
    coinRewardPercent: 6,
    gradient: "linear-gradient(135deg, var(--diamond-grad-start, #E3F2FD) 0%, var(--diamond-grad-mid, #90CAF9) 30%, var(--diamond-grad-end, #64B5F6) 100%)",
    textColor: "var(--diamond-text, #1565C0)",
    bgColor: "var(--diamond-bg, #E3F2FD)",
    benefits: [
      { id: "benefit-coin-diamond", icon: "🪙", title: "Earn 6% Coin", description: "Get 6% of your order value back - the highest rate!", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-birthday-diamond", icon: "🎂", title: "Birthday Voucher ×2", description: "Receive a 500,000₫ voucher on your birthday month", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-workshop-diamond", icon: "🎓", title: "Free Premium Workshop", description: "Join premium workshops for free", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-flashsale-diamond", icon: "🏷️", title: "Ultra Early Flash Sale", description: "Access Flash Sales 4 hours early + bonus gift", unlockedAtRank: "diamond", isLocked: false },
    ],
  },
];

export const COIN_RULES = {
  exchangeRate: 1,
  maxUsagePercent: 20,
  minOrderForCoin: 100000,
  expiryMonths: 6,
};

export function getRankFromPoints(points: number): RankType {
  if (points >= 8000) return "diamond";
  if (points >= 3000) return "gold";
  if (points >= 1000) return "silver";
  return "member";
}

export function getNextRank(currentRank: RankType, _points: number): {
  nextRank: RankType | null;
  pointsNeeded: number;
  currentRankPoints: number;
  nextRankPoints: number;
} {
  const rankOrder: RankType[] = ["member", "silver", "gold", "diamond"];
  const currentIndex = rankOrder.indexOf(currentRank);

  if (currentIndex >= rankOrder.length - 1) {
    return { nextRank: null, pointsNeeded: 0, currentRankPoints: _points, nextRankPoints: _points };
  }

  const nextRankType = rankOrder[currentIndex + 1];
  const nextRankConfig = RANK_CONFIGS.find((r) => r.rank === nextRankType)!;

  return {
    nextRank: nextRankType,
    pointsNeeded: nextRankConfig.minPoints - _points,
    currentRankPoints: RANK_CONFIGS.find((r) => r.rank === currentRank)!.minPoints,
    nextRankPoints: nextRankConfig.minPoints,
  };
}

export function getRankConfig(rank: RankType): RankConfig {
  return RANK_CONFIGS.find((r) => r.rank === rank) ?? RANK_CONFIGS[0];
}