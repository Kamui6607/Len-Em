// ============================================================
// MyOrders Page — route /orders/my
// Danh sách đơn hàng của customer hiện tại
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Package, Calendar } from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "../../../api/orderService";
import { formatPrice } from "../../../lib/formatPrice";
import {
  ORDER_STATUS_LABELS,
  getOrderStatusStyle,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../../constants/orderStatus";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";

export function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data } = await orderApi.getMyOrders();
        setOrders((data.orders ?? []).map(normalizeOrder));
      } catch {
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Chưa có đơn hàng nào</h2>
          <p className="text-muted-foreground mb-6">
            Bạn chưa đặt đơn hàng nào. Hãy khám phá shop ngay!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Đơn hàng của tôi</h1>

        <div className="space-y-4">
          {orders.map((order) => {
            const normalized = normalizeOrder(order);
            const createdAt = normalized.createdAt
              ? new Date(normalized.createdAt).toLocaleString("vi-VN")
              : "N/A";

            return (
              <Link
                key={normalized._id}
                to={`/orders/my/${normalized._id}`}
                className="block bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">
                        Đơn hàng #{normalized._id.slice(-8).toUpperCase()}
                      </p>
                      <span
                        className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={getOrderStatusStyle(normalized.orderStatus)}
                      >
                        {ORDER_STATUS_LABELS[normalized.orderStatus]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{createdAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {normalized.items.length} sản phẩm
                      {normalized.items[0]?.productName &&
                        ` — ${normalized.items[0].productName}${normalized.items.length > 1 ? ` +${normalized.items.length - 1}` : ""}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">
                      {formatPrice(normalized.totalPrice)}
                    </p>
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                        PAYMENT_STATUS_COLORS[normalized.payment?.status]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[normalized.payment?.status] || normalized.payment?.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}