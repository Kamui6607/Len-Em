// ============================================================
// Refund Invoice Service — API calls for refund management
// ============================================================

import axiosClient from "../lib/axiosClient";

// ─── Types ───────────────────────────────────────────────

export interface RefundInvoiceOrderRef {
  _id: string;
  totalPrice: number;
  orderStatus: string;
}

export interface RefundInvoiceUserRef {
  _id: string;
  email: string;
  fullName: string;
}

export interface RefundInvoice {
  _id: string;
  orderId: string | RefundInvoiceOrderRef;
  userId: string | RefundInvoiceUserRef;
  amount: number;
  reason: string;
  status: "PENDING" | "PROCESSED" | "REJECTED";
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefundInvoicesListResponse {
  invoices: RefundInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RefundProcessResponse {
  status: string;
  data: {
    invoice: RefundInvoice;
  };
}

const REFUND_BASE = "/refund-invoices";

export const refundService = {
  /** GET /refund-invoices — Get all refund invoices (Admin only) */
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    axiosClient.get<{ status: string; data: RefundInvoicesListResponse }>(
      REFUND_BASE,
      { params },
    ),

  /** PATCH /refund-invoices/{id}/process — Process a refund invoice (Admin only) */
  process: (id: string, data: { status: "PROCESSED" | "REJECTED" }) =>
    axiosClient.patch<RefundProcessResponse>(
      `${REFUND_BASE}/${id}/process`,
      data,
    ),
};