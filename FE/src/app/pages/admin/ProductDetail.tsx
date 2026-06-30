import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";
import { productService, type Product } from "../../../api/productService";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatchList } from "../../components/ui/ColorSwatch";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const id = productId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await productService.getById(id);
        if (!cancelled) {
          setProduct(res.data.data?.product ?? null);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load product details");
          navigate("/admin/products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId, navigate]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Package size={40} className="mx-auto mb-3 opacity-40" />
        <p>Product not found</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="mt-4 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to products
        </button>
      </div>
    );
  }

  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );
  const prices = product.variants.map((variant) => variant.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="mb-1">{product.name}</h1>
          <p className="text-sm text-muted-foreground">Product detail</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-square object-cover bg-muted"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="capitalize text-sm bg-muted px-2.5 py-1 rounded-full">
              {product.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                product.isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
              />
              {product.isActive ? "Đang bán" : "Đã ẩn"}
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {product.description || "No description"}
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">Price range</p>
              <p className="font-semibold text-primary">
                {minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">Total stock</p>
              <p className="font-semibold">{totalStock}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">Variants</p>
              <p className="font-semibold">{product.variants.length}</p>
            </div>
          </div>

          {product.tags?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDate(product.createdAt)}</p>
            <p>Updated: {formatDate(product.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Variants</h2>
            <p className="text-sm text-muted-foreground">
              Colors, prices and stock
            </p>
          </div>
          <ColorSwatchList variants={product.variants} size="sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Image
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Color
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr
                  key={variant._idVariants}
                  className="border-t border-border"
                >
                  <td className="px-6 py-4">
                    <img
                      src={variant.image || product.image}
                      alt={variant.color}
                      className="w-12 h-12 rounded-lg object-cover bg-muted"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ background: variant.hexCode }}
                      />
                      <span className="font-medium">{variant.color}</span>
                      <span className="text-xs text-muted-foreground">
                        {variant.hexCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">
                    {formatPrice(variant.price)}
                  </td>
                  <td className="px-6 py-4 text-right">{variant.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
