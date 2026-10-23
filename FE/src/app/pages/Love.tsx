// ============================================================
// Love Page — route /love (danh sách yêu thích)
// Products use the shared ProductCard (same as /shop); combos get a
// matching card. Resolved items are cached so toggling a heart doesn't
// reload the whole page.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Heart, Package, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { useAddToCart } from "../../features/cart/useAddToCart";
import { kitToCartPayload } from "../../features/cart/kitPayload";
import { SHOP_LEVELS, type ShopLevel } from "../../features/shop/shopMeta";
import { products as mockProducts } from "../data/products";
import { fetchProductById } from "../../features/shop/services/product.service";
import { ProductCard } from "../../shared/components/ProductCard";
import { kitService } from "../../shared/api/kitService";
import { formatPrice } from "../../lib/formatPrice";
import type { Product } from "../data/products";
import type { Kit } from "../../shared/api/kitService";
import "../../styles/love.css";

type Filter = "all" | "products" | "combos";

async function resolveProduct(id: string): Promise<Product | null> {
  const mock = mockProducts.find((p) => p.id === id);
  if (mock) return mock;
  try {
    return await fetchProductById(id);
  } catch {
    return null;
  }
}

async function resolveKit(id: string): Promise<Kit | null> {
  try {
    const res = await kitService.getById(id);
    return res.data.data?.kit ?? null;
  } catch {
    return null;
  }
}

// ── Combo card (mirrors ProductCard's footprint) ──────────────────────

function KitCard({ kit, onUnfavorite, onAdd }: { kit: Kit; onUnfavorite: () => void; onAdd: () => void }) {
  const { t } = useLanguage();
  const level = SHOP_LEVELS[kit.level as ShopLevel];
  const fallback = `https://picsum.photos/seed/${kit._id}/400/400`;

  return (
    <article className="wl-kit">
      <Link to={`/kits/${kit._id}`} className="wl-kit-media">
        <img
          src={kit.thumbnail || fallback}
          alt={kit.name}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "true";
              img.src = fallback;
            }
          }}
        />
        <span className="wl-kit-tag">
          <Package size={12} aria-hidden="true" />
          {t("love.combo")}
        </span>
      </Link>
      <button
        type="button"
        className="wl-heart"
        onClick={onUnfavorite}
        aria-label={t("love.unfavorite", { name: kit.name })}
        aria-pressed="true"
      >
        <Heart size={18} fill="currentColor" />
      </button>

      <div className="wl-kit-body">
        {level && <span className="wl-kit-level">{level.label}</span>}
        <Link to={`/kits/${kit._id}`} className="wl-kit-name">
          {kit.name}
        </Link>
        <p className="wl-kit-meta">{t("love.productsIncluded", { count: (kit.products || []).length })}</p>
        {/* Chân thẻ giống ProductCard: giá + nút "Thêm vào giỏ" */}
        <div className="pc-foot">
          <div className="pc-price">{formatPrice(kit.price)}</div>
          <motion.button
            type="button"
            className="card-add-btn pc-add"
            onClick={onAdd}
            aria-label={`${t("love.addToCart")}: ${kit.name}`}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
          >
            <span className="card-add-btn__icon" aria-hidden="true">
              <ShoppingBag size={15} strokeWidth={2.2} />
            </span>
            <span className="card-add-btn__label">{t("love.addToCart")}</span>
            <span className="card-add-btn__shine" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export function Love() {
  const { t } = useLanguage();
  const { favorites, favoriteKits, toggleFavorite, toggleFavoriteKit, clearAllFavorites } = useFavorites();
  const { addKit, addBundle } = useAddToCart();

  const productCache = useRef(new Map<string, Product | null>());
  const kitCache = useRef(new Map<string, Kit | null>());
  const [, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  // Resolve only ids we haven't seen yet.
  useEffect(() => {
    let cancelled = false;
    const newProducts = favorites.filter((id) => !productCache.current.has(id));
    const newKits = favoriteKits.filter((id) => !kitCache.current.has(id));
    if (!newProducts.length && !newKits.length) {
      setLoading(false);
      return;
    }
    Promise.all([
      Promise.all(newProducts.map(async (id) => [id, await resolveProduct(id)] as const)),
      Promise.all(newKits.map(async (id) => [id, await resolveKit(id)] as const)),
    ]).then(([products, kits]) => {
      if (cancelled) return;
      products.forEach(([id, p]) => productCache.current.set(id, p));
      kits.forEach(([id, k]) => kitCache.current.set(id, k));
      setVersion((v) => v + 1);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [favorites, favoriteKits]);

  const products = favorites
    .map((id) => productCache.current.get(id))
    .filter((p): p is Product => !!p);
  const kits = favoriteKits.map((id) => kitCache.current.get(id)).filter((k): k is Kit => !!k);
  const total = products.length + kits.length;

  // Products need a purchasable variant; combos always go in as a whole.
  const addableProducts = useMemo(
    () =>
      products.flatMap((product) => {
        const variant = product.variants?.find((v) => v.stock > 0) ?? product.variants?.[0];
        if (!variant) return [];
        return [
          {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            image: variant.images?.[0] || product.image,
            color: variant.color || "",
            hexCode: variant.hexCode || "",
            price: variant.price,
            stock: variant.stock,
          },
        ];
      }),
    [products],
  );
  const addableCount = addableProducts.length + kits.length;

  const handleAddAll = () =>
    addBundle({
      products: addableProducts.map((product) => ({ product, quantity: 1 })),
      kits: kits.map(kitToCartPayload),
    });

  const showProducts = filter !== "combos" && products.length > 0;
  const showKits = filter !== "products" && kits.length > 0;

  const handleClearAll = () => {
    const savedProducts = [...favorites];
    const savedKits = [...favoriteKits];
    clearAllFavorites();
    toast(t("love.removedAllFavorites"), {
      action: {
        label: t("cart.undo"),
        onClick: () => {
          savedProducts.forEach(toggleFavorite);
          savedKits.forEach(toggleFavoriteKit);
        },
      },
    });
  };

  const handleUnfavoriteKit = (kit: Kit) => {
    toggleFavoriteKit(kit._id);
    toast(t("love.removedFromFavorites"), {
      action: { label: t("cart.undo"), onClick: () => toggleFavoriteKit(kit._id) },
    });
  };

  if (loading) {
    return (
      <div className="wl-page">
        <div className="wl-wrap" aria-busy="true" aria-label={t("love.loading")}>
          <div className="wl-skel wl-skel-title" />
          <div className="wl-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="wl-skel wl-skel-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="wl-page">
        <div className="wl-wrap">
          <div className="wl-empty">
            <div className="wl-empty-art" aria-hidden="true">
              <Heart size={44} />
            </div>
            <h1 className="wl-empty-title">{t("love.emptyTitle")}</h1>
            <p className="wl-empty-desc">{t("love.emptyDesc")}</p>
            <div className="wl-empty-actions">
              <Link to="/shop" className="wl-btn is-primary">
                <ShoppingBag size={16} aria-hidden="true" />
                {t("love.browseProducts")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: t("love.all"), count: total },
    { id: "products", label: t("love.products"), count: products.length },
    { id: "combos", label: t("love.combos"), count: kits.length },
  ];

  return (
    <div className="wl-page">
      <div className="wl-wrap">
        <header className="wl-header">
          <div className="wl-header-text">
            <p className="wl-eyebrow">{t("love.eyebrow")}</p>
            <h1 className="wl-title">
              {t("love.title")}
              <span className="wl-count">{total}</span>
            </h1>
          </div>
          <div className="wl-actions">
            {addableCount > 0 && (
              <button type="button" className="wl-btn is-primary" onClick={handleAddAll}>
                <ShoppingCart size={16} aria-hidden="true" />
                {t("love.addAllToCart", { count: addableCount })}
              </button>
            )}
            <button type="button" className="wl-clear" onClick={handleClearAll}>
              <Trash2 size={14} aria-hidden="true" />
              {t("love.removeAll")}
            </button>
          </div>
        </header>

        {products.length > 0 && kits.length > 0 && (
          <div className="wl-tabs" role="tablist" aria-label={t("love.filter")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                className="wl-tab"
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
                <span className="wl-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        )}

        {showProducts && (
          <section aria-labelledby="wl-products" className="wl-section">
            <h2 id="wl-products" className="wl-section-title">
              {t("love.products")}
            </h2>
            <div className="wl-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {showKits && (
          <section aria-labelledby="wl-kits" className="wl-section">
            <h2 id="wl-kits" className="wl-section-title">
              {t("love.combos")}
            </h2>
            <div className="wl-grid">
              {kits.map((kit) => (
                <KitCard
                  key={kit._id}
                  kit={kit}
                  onUnfavorite={() => handleUnfavoriteKit(kit)}
                  onAdd={() => addKit(kitToCartPayload(kit))}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
