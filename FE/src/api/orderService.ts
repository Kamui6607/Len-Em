// ============================================================
// Order Service — clean API wrapper for order endpoints
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  Order,
  CreateOrderRequest,
  CancelOrderRequest,
  UpdateOrderStatusRequest,
  AdminOrdersResponse,
  MyOrdersResponse,
  CreateOrderResponse,
  OrderApiResponse,
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
   */
  getOrderById: (orderId: string) =>
    axiosClient.get<OrderApiResponse<Order>>(`${ORDERS_BASE}/${orderId}`),

  /**
   * POST /orders/:id/cancel — customer cancels their own PENDING order
   */
  cancelOrder: (orderId: string, data: CancelOrderRequest) =>
    axiosClient.post<OrderApiResponse<Order>>(`${ORDERS_BASE}/${orderId}/cancel`, data),

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
   */
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) =>
    axiosClient.patch<OrderApiResponse<Order>>(`${ORDERS_BASE}/${orderId}/status`, data),
};