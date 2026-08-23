// ============================================================
// Order Service — all API calls related to orders
// ============================================================

import axiosClient from "../../../lib/axiosClient";
import type {
  Order,
  CreateOrderRequest,
  CancelOrderRequest,
  CancelRequestDecision,
  UpdateOrderStatusRequest,
  AdminOrdersResponse,
  MyOrdersResponse,
  CreateOrderResponse,
  OrderApiResponse,
  GetOrderResponse,
  ShippingFeePreviewRequest,
  ShippingFeePreviewResponse,
} from "../types/order.types";

const ORDERS_BASE = "/orders";

export const orderService = {
  /**
   * 2a. Create a new order (customer).
   * POST /orders
   * Response: { message, order, payUrl }
   */
  createOrder: (data: CreateOrderRequest) =>
    axiosClient.post<CreateOrderResponse>(ORDERS_BASE, data),

  /**
   * 2c. Get my orders (customer).
   * GET /orders/my?page=1&limit=10
   */
  getMyOrders: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<MyOrdersResponse>(`${ORDERS_BASE}/my`, { params }),

  /**
   * 2d. Get order by ID (customer).
   * GET /orders/<orderId>
   * Response: { message, order }
   */
  getOrderById: (orderId: string) =>
    axiosClient.get<GetOrderResponse>(`${ORDERS_BASE}/${orderId}`),

  /**
   * 2e. Cancel an order (customer — only when PENDING).
   * POST /orders/<orderId>/cancel
   */
  cancelOrder: (orderId: string, data: CancelOrderRequest) =>
    axiosClient.post<OrderApiResponse<Order>>(
      `${ORDERS_BASE}/${orderId}/cancel`,
      data
    ),

  /**
   * 3a. Get all orders (admin/staff).
   * GET /orders?page=1&limit=20&status=PENDING&paymentStatus=PAID
   */
  getAllOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }) =>
    axiosClient.get<AdminOrdersResponse>(ORDERS_BASE, {
      params,
    }),

  /**
   * 3b. Update order status (admin).
   * PATCH /orders/<orderId>/status
   */
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) =>
    axiosClient.patch<OrderApiResponse<Order>>(
      `${ORDERS_BASE}/${orderId}/status`,
      data
    ),

  /**
   * Preview shipping fee & totals before checkout.
   * POST /orders/shipping-fee
   */
  previewShippingFee: (data: ShippingFeePreviewRequest) =>
    axiosClient.post<ShippingFeePreviewResponse>(
      `${ORDERS_BASE}/shipping-fee`,
      data
    ),

  /**
   * Admin approves or rejects a customer's cancel request.
   * PATCH /orders/:id/cancel-request
   */
  cancelRequest: (orderId: string, data: CancelRequestDecision) =>
    axiosClient.patch<GetOrderResponse>(
      `${ORDERS_BASE}/${orderId}/cancel-request`,
      data
    ),

  /**
   * Retry payment for a cancelled/unpaid order (returns payUrl for VNPAY).
   * POST /orders/:id/retry-payment
   */
  retryPayment: (orderId: string) =>
    axiosClient.post<{ message: string; order: Order; payUrl: string }>(
      `${ORDERS_BASE}/${orderId}/retry-payment`
    ),
};
