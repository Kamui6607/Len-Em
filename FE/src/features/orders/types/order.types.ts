// ============================================================
// Order Types — matches backend API contracts
// ============================================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "VNPAY";

export interface OrderUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
}

export interface OrderItem {
  _id?: string;
  product?: {
    _id: string;
    name: string;
    image?: string;
  };
  productId: string;
  quantity: number;
  color?: string;
  hexCode?: string;
  name?: string;
  productName?: string;
  price?: number;
  image?: string;
}

export interface PaymentInfo {
  method?: PaymentMethod;
  status: PaymentStatus;
  transactionNo?: string;
  transactionId?: string;
  paidAt?: string;
  vnpayUrl?: string;
}

export interface Order {
  _id: string;
  user?: string | OrderUser;
  userId?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  itemsPrice: number;
  shippingFee: number;
  totalPrice: number;
  payment: PaymentInfo;
  orderStatus: OrderStatus;
  discount?: number;
  coinUsed?: number;
  cancelReason?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
    color?: string;
    hexCode?: string;
  }[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingFee: number;
  note?: string;
  coinUsed?: number;
}

export interface CancelOrderRequest {
  cancelReason: string;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}

export interface AdminOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyOrdersResponse {
  message: string;
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderResponse {
  message: string;
  order: Order;
  payUrl?: string;
}

export interface OrderApiResponse<T> {
  status?: "success" | "error";
  data?: T;
  message?: string;
}

/** Response from GET /orders/:id — backend returns { message, order } */
export interface GetOrderResponse {
  message: string;
  order: Order;
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    itemsPrice: order.itemsPrice ?? 0,
    shippingFee: order.shippingFee ?? 0,
    totalPrice: order.totalPrice ?? 0,
    payment: {
      ...order.payment,
      status: order.payment.status,
    },
    items: order.items.map((item) => ({
      ...item,
      productId: item.productId || item.product?._id || item._id || "",
      productName: item.productName || item.name || item.product?.name || "Product",
      image: item.image || item.product?.image,
    })),
  };
}
