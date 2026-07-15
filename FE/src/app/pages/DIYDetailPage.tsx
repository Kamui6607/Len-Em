import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { diyService } from "../../features/diy/services/diy.service";
import { kitService } from "../../api/kitService";
import { productService } from "../../api/productService";
import type { DIYPost } from "../../features/diy/types/diy.types";
import type { Kit } from "../../api/kitService";
import { formatPrice } from "../../lib/formatPrice";
import { useState, useEffect } from "react";

export function DIYDetailPage() {
  const { addToCart } = useCart();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<DIYPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Record<string, { name: string; image: string; price?: number }>>({});

  // Fetch kit and product details for linked items
  useEffect(() => {
    if (!post) return;
    
    const linkedCombo = post.linkedCombo;
    const linkedProduct = post.linkedProduct;
    
    async function fetchLinkedItems() {
      // Fetch kits
      if (linkedCombo && linkedCombo.length > 0) {
        const kitPromises = linkedCombo.map(async (item) => {
          try {
            const { data } = await kitService.getById(item.comboId);
            return data.data.kit;
          } catch {
            return null;
          }
        });
        const kitResults = await Promise.all(kitPromises);
        const validKits = kitResults.filter((kit): kit is Kit => kit !== null);
        setKits(validKits);
      }

      // Fetch products
      if (linkedProduct && linkedProduct.length > 0) {
        const productPromises = linkedProduct.map(async (item) => {
          try {
            const { data } = await productService.getById(item.productId);
            const productData = data.data.product;
            return { 
              id: item.productId, 
              name: productData.name, 
              image: productData.image,
              price: productData.variants?.[0]?.price 
            };
          } catch {
            return { 
              id: item.productId, 
              name: `Product ${item.productId.slice(-6)}`, 
              image: "",
              price: undefined 
            };
          }
        });
        const productResults = await Promise.all(productPromises);
        const productMap: Record<string, { name: string; image: string; price?: number }> = {};
        productResults.forEach((p) => {
          if (p) productMap[p.id] = { name: p.name, image: p.image, price: p.price };
        });
        setProducts(productMap);
      }
    }

    fetchLinkedItems();
  }, [post?.linkedCombo, post?.linkedProduct]);

  useEffect(() => {
    if (!postId) return;
    async function loadPost() {
      try {
        const response = await diyService.getPostById(postId!);
        setPost(response.data.data.post);
      } catch {
        toast.error("Failed to load DIY post");
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) return <Navigate to="/diy" replace />;

  // At this point, post is guaranteed to be non-null
  const postData = post;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const addAllToCart = () => {
    if (!postData.images || postData.images.length === 0) return;
    const comboPrice = postData.price ?? 0;
    addToCart({
      productId: postData._id,
      variantId: "combo",
      name: postData.title,
      image: postData.images[0],
      color: "",
      hexCode: "#ccc",
      price: comboPrice,
      stock: 999,
    });
    toast.success("All materials added to cart");
  };

  const addProductToCart = (productId: string, productName: string, productImage: string) => {
    addToCart({
      productId: productId,
      variantId: "default",
      name: productName,
      image: productImage,
      color: "",
      hexCode: "#ccc",
      price: 0,
      stock: 999,
    });
    toast.success(`${productName} added to cart`);
  };

  const addKitToCart = (kit: Kit) => {
    addToCart({
      productId: kit._id,
      variantId: "kit",
      name: kit.name,
      image: kit.thumbnail,
      color: "",
      hexCode: "#ccc",
      price: kit.price,
      stock: 999,
    });
    toast.success(`${kit.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-7xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{postData.title}</h1>
          <p className="mt-2 text-muted-foreground">{postData.description}</p>
        </div>

        {/* Materials Grid - Products | Combos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Products Used */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Products Used</h2>
            <div className="grid gap-3">
              {postData.linkedProduct?.map((item, idx) => {
                const product = products[item.productId];
                return (
                  <Link
                    key={idx}
                    to={`/shop/product/${item.productId}`}
                    className="group flex gap-3 rounded-xl border bg-card p-2.5 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="size-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {product?.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                        {product?.name || `Product ${item.productId.slice(-6)}`}
                      </h3>
                      {product?.price && (
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="add-to-cart-btn mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requireAuth(() => addProductToCart(item.productId, product?.name || `Product ${item.productId.slice(-6)}`, product?.image || ""));
                        }}
                      >
                        <div className="btn-text">
                          <ShoppingCart className="size-3" />
                          Add
                        </div>
                        <div className="btn-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Combos Used */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Combos Used</h2>
            <div className="grid gap-3">
              {postData.linkedCombo?.map((item, idx) => {
                const kit = kits.find((k) => k._id === item.comboId);
                return (
                  <Link
                    key={`kit-${idx}`}
                    to={`/kits/${item.comboId}`}
                    className="group flex gap-3 rounded-xl border bg-card p-2.5 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="size-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {kit?.thumbnail ? (
                        <img 
                          src={kit.thumbnail} 
                          alt={kit.name} 
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                        {kit?.name || `Combo ${item.comboId.slice(-6)}`}
                      </h3>
                      {kit?.price && (
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatPrice(kit.price)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="add-to-cart-btn mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requireAuth(() => kit && addKitToCart(kit));
                        }}
                      >
                        <div className="btn-text">
                          <ShoppingCart className="size-3" />
                          Add
                        </div>
                        <div className="btn-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add All Button */}
        <div className="mt-8">
          <button
            type="button"
            className="add-to-cart-btn w-full"
            onClick={() => requireAuth(addAllToCart)}
          >
            <div className="btn-text">
              <ShoppingCart className="size-4" />
              Add all
            </div>
            <div className="btn-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
