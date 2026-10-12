// ============================================================
// displayText — quy mọi giá trị từ API về chuỗi để render an toàn.
// BE đôi khi trả trường dạng object đã populate (vd. orderId →
// { _id, ... }, category → { _id, name }). Render thẳng object làm
// React ném "Objects are not valid as a React child" và ErrorBoundary
// hiện "We couldn't load this page".
// ============================================================

/** Chuỗi hiển thị: string/number giữ nguyên, object lấy name/title/label, mảng nối bằng ", ". */
export function toText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return toText(obj.name ?? obj.title ?? obj.label ?? obj.fullName ?? "");
  }
  return "";
}

/** ID dạng chuỗi: string giữ nguyên, object (đã populate) lấy _id / id. */
export function toId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return toId(obj._id ?? obj.id ?? "");
  }
  return "";
}

/** Mã ngắn dễ đọc từ ID MongoDB: 8 ký tự cuối, in hoa. */
export function shortId(value: unknown, length = 8): string {
  return toId(value).slice(-length).toUpperCase();
}
