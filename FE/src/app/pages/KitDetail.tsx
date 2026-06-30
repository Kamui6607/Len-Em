// ============================================================
// Kit Detail Page — route /kits/:id
// Fetches kit data from GET /api/v1/kits/{id}
// ============================================================

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/formatPrice";
import { kitService, type Kit } from "../../api/kitService";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";

const levelBadgeColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export function KitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    kitService.getById(id)
      .then((res) => setKit(res.data.data?.kit ?? null))
      .catch(() => {
        toast.error("Không thể tải thông tin kit");
        setKit(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddAllToCart = () => {
    if (!kit || !isAuthenticated) {
      if (!isAuthenticated) navigate("/auth/login");
      return;
    }
    kit.productIds.forEach((productId) => {
      addToCart({
        productId,
        variantId: "default",
        name: kit.name,
        image: kit.thumbnail,
        color: "",
        hexCode: "#ccc",
        price: 0,
        stock: 999,
      });
    });
    toast.success(`Đã thêm "${kit.name}" vào giỏ hàng`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Không tìm thấy kit</h2>
          <p className="text-muted-foreground mb-6">Kit không tồn tại hoặc đã bị xoá.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            <img
              src={kit.thumbnail}
              alt={kit.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = "true";
                  target.src = `https://picsum.photos/seed/${kit._id}/600/450`;
                }
              }}
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{kit.name}</h1>
              <span
                className={`inline-flex items-center text-sm px-3 py-1 rounded-full font-medium capitalize ${levelBadgeColors[kit.level]}`}
              >
                {kit.level}
              </span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {kit.description}
            </p>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(kit.price)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({kit.productIds.length} sản phẩm)
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Sản phẩm trong kit
              </h3>
              {kit.productIds.length > 0 ? (
                <ul className="space-y-2">
                  {kit.productIds.map((pid, idx) => (
                    <li key={pid} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </span>
                      <Link
                        to={`/shop/product/${pid}`}
                        className="text-primary hover:underline truncate"
                      >
                        {pid}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
              )}
            </div>

            <button
              onClick={handleAddAllToCart}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg font-medium flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Thêm tất cả vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}