// ============================================================
// Order Service — clean API wrapper for order endpoints
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  CreateOrderRequest,
  CancelOrderRequest,
  CancelRequestDecision,
  UpdateOrderStatusRequest,
  AdminOrdersResponse,
  MyOrdersResponse,
  CreateOrderResponse,
  GetOrderResponse,
  ShippingFeePreviewRequest,
  ShippingFeePreviewResponse,
} from "../features/orders/types/order.types";

const ORDERS_BASE = "/orders";

export const orderApi = {
  /**
   * POST /orders/shipping-fee — preview shipping fee & totals
   * Frontend sends item IDs + address text names (NO prices, NO GHN IDs).
   * Backend looks up prices from DB, queries GHN, returns subtotal/shippingFee/total.
   */
  previewShippingFee: (data: ShippingFeePreviewRequest) =>
    axiosClient.post<ShippingFeePreviewResponse>(`${ORDERS_BASE}/shipping-fee`, data),

  /**
   * POST /orders — create a new order (customer)
   * Sends cart items + shipping address + payment method.
   * Returns payUrl if VNPAY, order data if COD.
   */
  createOrder: (data: CreateOrderRequest) =>
    axiosClient.post<CreateOrderResponse>(ORDERS_BASE, data),

  /**
   * GET /orders/my — get current customer's orders (paginated)
   */
  getMyOrders: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<MyOrdersResponse>(`${ORDERS_BASE}/my`, { params }),

  /**
   * GET /orders/:id — get order detail (customer or admin/staff)
   * Backend returns: { message, order }
   */
  getOrderById: (orderId: string) =>
    axiosClient.get<GetOrderResponse>(`${ORDERS_BASE}/${orderId}`),

  /**
   * POST /orders/:id/cancel — customer requests cancel on their PENDING order
   * Sets isCancelRequested = true, admin must approve via cancel-request
   */
  cancelOrder: (orderId: string, data: CancelOrderRequest) =>
    axiosClient.post<GetOrderResponse>(`${ORDERS_BASE}/${orderId}/cancel`, data),

  /**
   * PATCH /orders/:id/cancel-request — admin approves/rejects cancel request
   * Body: { decision: "APPROVED" | "REJECTED" }
   * APPROVED → order becomes CANCELLED + auto-creates RefundInvoice
   * REJECTED → order stays PENDING, removes isCancelRequested flag
   */
  cancelRequest: (orderId: string, data: CancelRequestDecision) =>
    axiosClient.patch<GetOrderResponse>(`${ORDERS_BASE}/${orderId}/cancel-request`, data),

  /**
   * POST /orders/:id/retry-payment — retry payment for cancelled/unpaid order
   * Returns payUrl for VNPAY
   */
  retryPayment: (orderId: string) =>
    axiosClient.post<{ message: string; order: import("../features/orders/types/order.types").Order; payUrl: string }>(
      `${ORDERS_BASE}/${orderId}/retry-payment`,
    ),

  /**
   * GET /orders — admin/staff get all orders with filters + pagination
   */
  getAllOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }) => axiosClient.get<AdminOrdersResponse>(ORDERS_BASE, { params }),

  /**
   * PATCH /orders/:id/status — admin/staff update order status
   * Backend returns: { message, order }
   */
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) =>
    axiosClient.patch<GetOrderResponse>(`${ORDERS_BASE}/${orderId}/status`, data),
};
