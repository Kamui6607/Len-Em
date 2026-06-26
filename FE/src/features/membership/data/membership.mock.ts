// ============================================================
// Membership Mock Data
// ============================================================

import type { MembershipData, MembershipHistoryEntry, CoinTransaction } from "../types/membership.types";

export const mockMembership: MembershipData = {
  userId: "demo-user-1",
  points: 650,
  rank: "silver",
  totalSpent: 12_000_000,
  coinBalance: 12_500,
  updatedAt: "2026-06-15T10:30:00Z",
};

export const mockMembershipHistory: MembershipHistoryEntry[] = [
  {
    id: "hist-001",
    date: "2026-06-15T10:30:00Z",
    points: 507,
    source: "purchase",
    description: "Mua hàng tại Len&em Shop",
    orderId: "ORD-2026-001",
    orderAmount: 507000,
    status: "completed",
  },
  {
    id: "hist-002",
    date: "2026-06-10T14:20:00Z",
    points: 850,
    source: "purchase",
    description: "Mua nguyên liệu khóa học Cardigan",
    orderId: "ORD-2026-002",
    orderAmount: 850000,
    newRank: "silver",
    status: "completed",
  },
  {
    id: "hist-003",
    date: "2026-06-01T09:15:00Z",
    points: 500,
    source: "diy_video",
    description: "Đăng bài DIY: Túi Tote Sage",
    orderId: "diy-sage-tote",
    status: "completed",
  },
  {
    id: "hist-004",
    date: "2026-05-28T16:45:00Z",
    points: 320,
    source: "purchase",
    description: "Mua len Merino Chunky",
    orderId: "ORD-2026-003",
    orderAmount: 320000,
    status: "completed",
  },
  {
    id: "hist-005",
    date: "2026-05-20T11:00:00Z",
    points: 1000,
    source: "registration",
    description: "Thưởng đăng ký tài khoản",
    status: "completed",
  },
];

export const mockCoinTransactions: CoinTransaction[] = [
  {
    id: "coin-001",
    date: "2026-06-15T10:30:00Z",
    amount: 15210,
    type: "earned",
    description: "3% từ đơn hàng ORD-2026-001",
    orderId: "ORD-2026-001",
    expiryDate: "2026-12-15T10:30:00Z",
  },
  {
    id: "coin-002",
    date: "2026-06-10T14:20:00Z",
    amount: 34000,
    type: "earned",
    description: "4% từ đơn hàng ORD-2026-002 (Silver bonus)",
    orderId: "ORD-2026-002",
    expiryDate: "2026-12-10T14:20:00Z",
  },
  {
    id: "coin-003",
    date: "2026-06-01T09:15:00Z",
    amount: 500,
    type: "earned",
    description: "Thưởng đăng video DIY",
    expiryDate: "2026-12-01T09:15:00Z",
  },
  {
    id: "coin-004",
    date: "2026-05-20T11:00:00Z",
    amount: 1000,
    type: "earned",
    description: "Thưởng đăng ký tài khoản mới",
    expiryDate: "2026-11-20T11:00:00Z",
  },
  {
    id: "coin-005",
    date: "2026-05-15T08:00:00Z",
    amount: 5000,
    type: "earned",
    description: "5% từ đơn hàng ORD-2026-004",
    orderId: "ORD-2026-004",
    expiryDate: "2026-11-15T08:00:00Z",
  },
];