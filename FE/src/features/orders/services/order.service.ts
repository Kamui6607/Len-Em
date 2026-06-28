// ============================================================
// Order Service — all API calls related to orders
// ============================================================

import axiosClient from "../../../lib/axiosClient";
import type {
  Order,
  CreateOrderRequest,
  CancelOrderRequest,
  UpdateOrderStatusRequest,
  AdminOrdersResponse,
  MyOrdersResponse,
  CreateOrderResponse,
  OrderApiResponse,
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
  getMyOrders: () =>
    axiosClient.get<MyOrdersResponse>(`${ORDERS_BASE}/my`),

  /**
   * 2d. Get order by ID (customer).
   * GET /orders/<orderId>
   */
  getOrderById: (orderId: string) =>
    axiosClient.get<OrderApiResponse<Order>>(`${ORDERS_BASE}/${orderId}`),

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
};
