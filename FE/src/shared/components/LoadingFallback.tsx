import { cn } from "./ui/utils";

interface LoadingFallbackProps {
  fullPage?: boolean;
  message?: string;
}

/**
 * Route-level loading fallback.
 * - Fade-in nhanh (0.18s) để không nhấp nháy khi chunk tải cực nhanh.
 * - Spinner nhỏ gọn + không pulse text (bớt chuyển động = mượt hơn,
 *   đặc biệt trên mobile).
 * - fullPage dùng 100dvh để ổn định chiều cao trên mobile browser bars.
 */
export function LoadingFallback({
  fullPage = false,
  message,
}: LoadingFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 animate-fade-in",
        fullPage ? "min-h-[100dvh]" : "min-h-[60vh]"
      )}
      style={{ animationDuration: "0.3s" }}
    >
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin [animation-duration:1.4s]" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}