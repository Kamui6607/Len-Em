import { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ShoppingBag, PlayCircle, Star } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../../app/data/products";
import { getBasePrice } from "../../app/data/products";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../hooks/useAuth";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "../../lib/formatPrice";
import { ResponsiveImage } from "./ui/ResponsiveImage";
import { getCategoryMeta } from "../../features/shop/shopMeta";
import { getValidHex, isDefaultVariant } from "./ProductVariantSelector";
import "../../styles/product-card.css";
import { useAddToCart } from "../../features/cart/useAddToCart";
import {
  VariantPickerDialog,
  firstAvailableVariant,
  needsVariantChoice,
  toCartPayload,
} from "../../features/cart/VariantPickerDialog";

interface ProductCardProps {
  product: Product;
  relatedLessonId?: string;
  relatedCourseId?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  relatedLessonId,
  relatedCourseId,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { addProduct } = useAddToCart();
  // Nhiều màu / phân loại → hỏi khách chọn (trước đây luôn lấy variants[0]).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerVariantId, setPickerVariantId] = useState<string | undefined>();

  const prices = product.variants?.map((variant) => variant.price) ?? [
    getBasePrice(product),
  ];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = minPrice !== maxPrice;
  const category = getCategoryMeta(product.category);
  const CategoryIcon = category.Icon;
  const favorite = isFavorite(product.id);
  // Tối đa 5 chấm màu — gợi ý bảng màu len ngay trên thẻ
  // Bỏ biến thể "Mặc định" / hex không hợp lệ để không vẽ chấm màu đen sai.
  const swatches = (product.variants ?? [])
    .filter((variant) => !isDefaultVariant(variant) && getValidHex(variant.hexCode))
    .slice(0, 5);
  const colorVariantCount = (product.variants ?? []).filter(
    (variant) => !isDefaultVariant(variant) && getValidHex(variant.hexCode),
  ).length;
  const extraSwatches = colorVariantCount - swatches.length;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const openPicker = (variantId?: string) =>
    requireAuth(() => {
      setPickerVariantId(variantId);
      setPickerOpen(true);
    });

  const handleAddClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (needsVariantChoice(product)) {
      openPicker();
      return;
    }
    // Chỉ 1 biến thể → thêm luôn, không cần hỏi.
    requireAuth(() => {
      const variant = firstAvailableVariant(product.variants);
      if (variant) addProduct(toCartPayload(product, variant));
    });
  };

  const handleProductClick = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  return (
    // NOTE ON LAYOUT STABILITY (no gaps in sibling cards on hover):
    // Lift/scale on hover chạy bằng `transform` qua CSS thuần
    // (.product-card:hover trong globals.css — chỉ trên thiết bị có chuột),
    // không đụng width/height/margin → grid track không đổi kích thước.
    // Rating + "Thêm vào giỏ" hiển thị MỌI LÚC — mọi card cùng chiều cao.
    <article className="product-card pc">
      {/* ── Ảnh ── */}
      <Link
        to={`/shop/product/${product.id}`}
        className="pc-media"
        onClick={handleProductClick}
      >
        <div className="product-card__img pc-img">
          <ResponsiveImage src={product.image} alt={product.name} />
        </div>
        <div aria-hidden className="product-card__sweep pc-sweep" />

        <motion.button
          type="button"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={(event) => {
            event.preventDefault();
            toggleFavorite(product.id);
          }}
          className={`pc-fav ${favorite ? "is-active" : ""}`}
          aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={favorite}
        >
          <motion.span
            animate={favorite ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex"
          >
            <Heart size={15} strokeWidth={favorite ? 0 : 1.9} />
          </motion.span>
        </motion.button>

        <div className="pc-badges">
          <LevelBadge level={product.difficulty} />
        </div>

        {relatedLessonId && relatedCourseId && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              navigate(`/learn/${relatedCourseId}/lesson/${relatedLessonId}`);
            }}
            className="pc-lesson"
          >
            <PlayCircle size={12} />
            Bài học
          </button>
        )}
      </Link>

      {/* ── Thân thẻ ── */}
      <div className="pc-body">
        <div className="pc-row">
          <span className="pc-category">
            <CategoryIcon size={11} />
            {category.label}
          </span>
          <span className="pc-rating">
            <Star size={12} />
            {product.rating.toFixed(1)}
            <span className="pc-rating-count">({product.reviewCount})</span>
          </span>
        </div>

        <Link to={`/shop/product/${product.id}`} onClick={handleProductClick}>
          <h3 className="product-card__name pc-name">{product.name}</h3>
          <p className="pc-desc">{product.description}</p>
        </Link>

        {swatches.length > 1 && (
          <div className="pc-swatches" aria-label={`${product.variants?.length} màu`}>
            {swatches.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className="pc-swatch pc-swatch-btn"
                style={{ backgroundColor: getValidHex(variant.hexCode) }}
                title={`${variant.color}${variant.stock <= 0 ? " · hết hàng" : ""}`}
                aria-label={`Chọn màu ${variant.color} để thêm vào giỏ`}
                onClick={() => openPicker(variant.id)}
              />
            ))}
            {extraSwatches > 0 && <span className="pc-swatch-more">+{extraSwatches}</span>}
          </div>
        )}

        <div className="pc-foot">
          <div className="pc-price">
            {hasPriceRange && <span className="pc-price-from">từ</span>}
            {formatPrice(minPrice)}
          </div>

          <motion.button
            type="button"
            className="card-add-btn pc-add"
            onClick={handleAddClick}
            aria-label={`Thêm ${product.name} vào giỏ`}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
          >
            <span className="card-add-btn__icon" aria-hidden="true">
              <ShoppingBag size={15} strokeWidth={2.2} />
            </span>
            <span className="card-add-btn__label">Thêm vào giỏ</span>
            <span className="card-add-btn__shine" aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      {pickerOpen && (
        <VariantPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          product={product}
          mode="add"
          initialVariantId={pickerVariantId}
          onConfirm={(p, { variant, quantity }) => addProduct(toCartPayload(p, variant), quantity)}
        />
      )}
    </article>
  );
});
