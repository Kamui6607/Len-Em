// ============================================================
// Order Types — matches backend API contracts
// ============================================================

import type { OrderStatus } from "../../../constants/orderStatus";

export type { OrderStatus };

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "VNPAY" | "MOMO" | "COD";

export interface OrderUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
}

/** Shipping address as stored in Order (backward-compatible with existing orders) */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
}

/** Shipping address input for CREATE order — uses text names, NOT GHN IDs */
export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  address: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
}

export interface OrderItem {
  _id?: string;
  product?: {
    _id: string;
    name: string;
    image?: string;
  };
  productId: string;
  /** Course ID when this line item is a digital course purchase ("itemType": "Course"). */
  course?: string;
  /** Line-item kind — "Course" for premium course purchases. */
  itemType?: string;
  quantity: number;
  color?: string;
  hexCode?: string;
  name?: string;
  productName?: string;
  price?: number;
  image?: string;
  /** If this item came from a kit, store the kitId so FE can group display */
  kitId?: string;
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
  isCancelRequested?: boolean;
  discount?: number;
  coinUsed?: number;
  cancelReason?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

/** One line item when creating an order. Physical products use
 *  productId+variantId; premium course purchases use `course` +
 *  itemType: "Course" (no variantId). */
export interface CreateOrderItem {
  productId?: string;
  variantId?: string;
  /** Course ID for digital course purchases. */
  course?: string;
  /** "Course" for premium course purchases (exact casing from backend guide). */
  itemType?: "Course" | "Product" | "Kit" | string;
  name?: string;
  image?: string;
  price?: number;
  quantity: number;
}

export interface CreateOrderRequest {
  user?: string;
  items: CreateOrderItem[];
  /** Kits to order — server will expand each kit into product items */
  kits?: {
    kitId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethod;
  note?: string;
  coinUsed?: number;
  /** Totals can be provided explicitly (e.g. digital course orders) or
   *  computed server-side from items. */
  itemsPrice?: number;
  shippingFee?: number;
  totalPrice?: number;
}

/** True when a line item represents a digital course purchase. */
export function isCourseItem(
  item: OrderItem | CreateOrderItem,
): boolean {
  return item.itemType === "Course" || Boolean(item.course);
}

export interface CancelOrderRequest {
  cancelReason: string;
}

export interface CancelRequestDecision {
  decision: "APPROVED" | "REJECTED";
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

// ── Shipping fee preview (Step 1) ──

export interface ShippingFeePreviewItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ShippingFeePreviewRequest {
  items: ShippingFeePreviewItem[];
  provinceName: string;
  districtName: string;
  wardName: string;
  /** Latitude from map pin */
  lat?: number;
  /** Longitude from map pin */
  lng?: number;
}

export interface ShippingFeePreviewResponse {
  subtotal: number;
  shippingFee: number;
  total: number;
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
    isCancelRequested: order.isCancelRequested ?? false,
    payment: {
      ...order.payment,
      status: order.payment.status,
    },
    items: order.items.map((item) => ({
      ...item,
      productId: item.productId || item.product?._id || item._id || "",
      course: item.course,
      itemType: item.itemType,
      productName: item.productName || item.name || item.product?.name || "Product",
      image: item.image || item.product?.image,
      kitId: item.kitId,
    })),
  };
}
