import { useState, useEffect } from "react";
import { Package, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../hooks/useAuth";
import { useReviews } from "../context/ReviewContext";
import { useNotifications } from "../context/NotificationContext";
import { ReportButton } from "../components/ReportButton";
import { Link } from "react-router";
import { orderService } from "../../features/orders/services/order.service";
import type { Order } from "../../features/orders/types/order.types";
import { normalizeOrder } from "../../features/orders/types/order.types";

export function Purchased() {
  const { user } = useAuth();
  const { addReview, hasReviewed } = useReviews();
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: response } = await orderService.getMyOrders();
        setOrders(response.orders.map(normalizeOrder));
      } catch {
        // API unavailable — empty state (demo mode / offline)
      } finally {
        setLoading(false);
      }
    }
    if (user) loadOrders();
    else setLoading(false);
  }, [user]);

  const handleSubmitReview = () => {
    if (!reviewModal || !comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    addReview({
      orderId: reviewModal.orderId,
      productId: reviewModal.productId,
      productName: reviewModal.productName,
      userId: user?.email || "unknown",
      userName: user?.fullName || "User",
      rating,
      comment: comment.trim(),
    });
    toast.success("Review submitted! Thank you for your feedback.");
    setReviewModal(null);
    setComment("");
    setRating(5);
  };

  const markAsDone = async (orderId: string) => {
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: "DELIVERED" as const } : o,
        ),
      );
      const doneOrder = orders.find((o) => o._id === orderId);
      if (doneOrder) {
        doneOrder.items.forEach((item) => {
          addNotification({
            type: "review_request",
            title: "Review Request",
            message: `Please review "${item.productName}" from order ${orderId}`,
            targetId: orderId,
            targetPath: "/purchased",
          });
        });
      }
      toast.success("Order marked as done! You can now review your products.");
    } catch {
      toast.error("Failed to update order.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "CONFIRMED":
      case "PREPARING":
      case "SHIPPING":
        return "bg-secondary/20 text-secondary";
      case "PENDING":
        return "bg-accent/20 text-accent";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "✅";
      case "CONFIRMED":
      case "PREPARING":
      case "SHIPPING":
        return "✔️";
      case "PENDING":
        return "⏳";
      case "CANCELLED":
        return "❌";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2">Order History</h1>
          <p className="text-muted-foreground">
            Track your orders, leave reviews, and report issues
          </p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here!
              </p>
              <Link
                to="/shop"
                className="inline-flex bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {getStatusIcon(order.orderStatus)}
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-xl">
                      {formatPrice(order.totalPrice)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}
                    >
                      {order.orderStatus}
                    </span>
                    {order.payment.status === "PAID" && (
                      <p className="text-[10px] text-green-600 mt-1">Paid</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const reviewed = hasReviewed(order._id, item.productId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.productName || `Product ${item.productId}`}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>x{item.quantity}</span>
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            {order.orderStatus === "DELIVERED" && !reviewed && (
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    orderId: order._id,
                                    productId: item.productId,
                                    productName: item.productName || "Product",
                                  })
                                }
                                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                              >
                                <Star className="w-3 h-3 inline mr-1" /> Review
                              </button>
                            )}
                            {order.orderStatus === "DELIVERED" && reviewed && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{" "}
                                Reviewed
                              </span>
                            )}
                            <ReportButton
                              targetType="purchased_order"
                              targetId={order._id}
                              targetTitle={`Order ${order._id}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.orderStatus === "CONFIRMED" && (
                      <button
                        onClick={() => markAsDone(order._id)}
                        className="text-xs bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                      >
                        ✅ Mark as Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setReviewModal(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">Rate this Product</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {reviewModal.productName}
            </p>
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={3}
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!comment.trim()}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
