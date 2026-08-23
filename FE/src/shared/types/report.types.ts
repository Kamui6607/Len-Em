export type ReportTargetType = "diy_post" | "purchased_order" | "support_diy";
export type ReportStatus = "pending" | "assigned" | "resolved" | "cannot_resolve";

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: string;
  description: string;
  reporterId: string;
  reporterName: string;
  assignedToId?: string;
  assignedToName?: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
}