// ============================================================
// ProductBuyControls — bộ chọn số lượng + nút "Thêm vào giỏ"
// dùng chung cho trang chi tiết sản phẩm:
//   - variant="inline"   : khối trong nội dung (desktop ≥ md)
//   - variant="floating" : thanh nổi dạng pill trên mobile (< md),
//                          nằm cùng hàng, ngay bên trái nút FAB "+"
// State số lượng + hàm thêm giỏ do trang cha giữ, component chỉ hiển thị.
// ============================================================

import { motion } from "motion/react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import { cn } from "../../../shared/components/ui/utils";

interface ProductBuyControlsProps {
  quantity: number;
  onChange: (next: number) => void;
  onAdd: () => void;
  /** Đơn giá của biến thể đang chọn — nút hiển thị giá × số lượng. */
  price: number;
  /** Tồn kho của biến thể đang chọn (0 = hết hàng). */
  stock: number;
  /**
   * Trần số lượng có thể chọn. Mặc định = stock; trang chi tiết truyền
   * stock − số đã có trong giỏ (giữ nguyên ràng buộc hiện tại).
   */
  max?: number;
  disabled?: boolean;
  productName: string;
  variant: "inline" | "floating";
}

export function ProductBuyControls({
  quantity,
  onChange,
  onAdd,
  price,
  stock,
  max = stock,
  disabled = false,
  productName,
  variant,
}: ProductBuyControlsProps) {
  const soldOut = stock === 0;
  const canDec = quantity > 1;
  const canInc = quantity < max;
  const total = formatPrice(price * quantity);
  const floating = variant === "floating";

  const stepper = !soldOut && (
    <div className={cn("pd-qty", floating && "is-floating")}>
      <motion.button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={!canDec}
        whileTap={canDec ? { scale: 0.85 } : undefined}
        aria-label="Giảm số lượng"
      >
        <Minus className="w-3.5 h-3.5" />
      </motion.button>
      <span aria-live="polite" aria-label={`Số lượng: ${quantity}`}>
        {quantity}
      </span>
      <motion.button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={!canInc}
        whileTap={canInc ? { scale: 0.85 } : undefined}
        aria-label="Tăng số lượng"
      >
        <Plus className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );

  const addButton = (
    <motion.button
      type="button"
      onClick={onAdd}
      disabled={soldOut || disabled}
      className={cn("card-add-btn pd-add", floating && "pd-float-add")}
      aria-label={soldOut ? `${productName} đã hết hàng` : `Thêm ${productName} vào giỏ, ${total}`}
      whileTap={!soldOut && !disabled ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
    >
      <span className="card-add-btn__icon" aria-hidden="true">
        <ShoppingCart size={15} strokeWidth={2.2} />
      </span>
      {soldOut ? (
        <span className="card-add-btn__label">Hết hàng</span>
      ) : (
        // 3 bản nhãn — container query trên .pd-add chọn bản vừa bề ngang,
        // để giá không bao giờ bị cắt.
        <span className="card-add-btn__label pd-add-label" aria-hidden="true">
          <span className="pd-add-label-long">Thêm vào giỏ · {total}</span>
          <span className="pd-add-label-short">Thêm · {total}</span>
          <span className="pd-add-label-tiny">{total}</span>
        </span>
      )}
      <span className="card-add-btn__shine" aria-hidden="true" />
    </motion.button>
  );

  if (floating) {
    return (
      <motion.div
        className="pd-float md:hidden"
        role="region"
        aria-label="Mua hàng"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {stepper}
        {addButton}
      </motion.div>
    );
  }

  return (
    <div className="pd-buy">
      {stepper}
      {addButton}
    </div>
  );
}
