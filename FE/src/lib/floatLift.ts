// ============================================================
// --float-row-lift — đẩy "hàng nổi" (nút "+", thanh mua…) lên trên các toast
// nằm ở đáy màn hình mobile. Nhiều nguồn (toast giỏ hàng, toast đơn hàng) có
// thể cùng hiện: mỗi nguồn báo chiều cao của mình, biến nhận giá trị lớn nhất,
// nên một nguồn tắt không kéo hàng nổi xuống đè lên nguồn còn lại.
// ============================================================

const lifts = new Map<string, number>();

export function setFloatRowLift(source: string, px: number): void {
  if (px > 0) lifts.set(source, px);
  else lifts.delete(source);
  const max = Math.max(0, ...lifts.values());
  document.documentElement.style.setProperty("--float-row-lift", `${max}px`);
}
