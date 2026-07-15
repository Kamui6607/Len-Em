// ============================================================
// Order Service — clean API wrapper for order endpoints
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  CreateOrderRequest,
  CancelOrderRequest,
  UpdateOrderStatusRequest,
  AdminOrdersResponse,
  MyOrdersResponse,
  CreateOrderResponse,
  GetOrderResponse,
} from "../features/orders/types/order.types";

const ORDERS_BASE = "/orders";

export const orderApi = {
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
   * POST /orders/:id/cancel — customer cancels their own PENDING order
   * Backend returns: { message, order }
   */
  cancelOrder: (orderId: string, data: CancelOrderRequest) =>
    axiosClient.post<GetOrderResponse>(`${ORDERS_BASE}/${orderId}/cancel`, data),

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
