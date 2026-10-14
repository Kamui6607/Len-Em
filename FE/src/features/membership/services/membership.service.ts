// ============================================================
// Membership Service — điểm, hạng, coin của user hiện tại
// ============================================================

import axiosClient from "../../../lib/axiosClient";
import type { ApiResponse } from "../../../shared/types/auth.types";
import type {
  CoinTransaction,
  COIN_RULES,
  MembershipData,
  MembershipHistoryEntry,
  RankType,
} from "../types/membership.types";

const MEMBERSHIP_BASE = "/membership";

export interface MembershipPagination {
  page: number;
  limit: number;
  total: number;
}

export interface MembershipMeResponse {
  membership: MembershipData;
  /** Mới nhất trước. */
  history: MembershipHistoryEntry[];
  /** Mới nhất trước. */
  coinTransactions: CoinTransaction[];
}

export interface MembershipHistoryResponse {
  history: MembershipHistoryEntry[];
  pagination: MembershipPagination;
}

export interface CoinTransactionsResponse {
  coinTransactions: CoinTransaction[];
  pagination: MembershipPagination;
}

export interface MembershipConfigResponse {
  ranks: { rank: RankType; displayName: string; minPoints: number; coinRewardPercent: number }[];
  coinRules: typeof COIN_RULES;
  pointRules: { vndPerPoint: number; registrationPoints?: number; [key: string]: unknown };
}

export const membershipService = {
  /** GET /membership/me — membership + history + coin gần nhất (limit tối đa 50) */
  getMe: (limit?: number) =>
    axiosClient.get<ApiResponse<MembershipMeResponse>>(`${MEMBERSHIP_BASE}/me`, {
      params: limit ? { limit } : undefined,
    }),

  /** GET /membership/me/history — lịch sử điểm, phân trang */
  getHistory: (page = 1, limit = 20) =>
    axiosClient.get<ApiResponse<MembershipHistoryResponse>>(`${MEMBERSHIP_BASE}/me/history`, {
      params: { page, limit },
    }),

  /** GET /membership/me/coins — giao dịch coin, phân trang */
  getCoinTransactions: (page = 1, limit = 20) =>
    axiosClient.get<ApiResponse<CoinTransactionsResponse>>(`${MEMBERSHIP_BASE}/me/coins`, {
      params: { page, limit },
    }),

  /** GET /membership/config — ngưỡng hạng, % coin, luật coin/điểm (public) */
  getConfig: () =>
    axiosClient.get<ApiResponse<MembershipConfigResponse>>(`${MEMBERSHIP_BASE}/config`),
};
